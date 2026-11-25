import { useState, useEffect, useCallback, useRef } from 'react';
import { getInitialState, DEFAULT_ALGO_TEMPLATES } from '../services/StateFactory';
import { DEFAULT_PROG_EMBED, MAX_PROG_EMBED_LENGTH } from '../config/constants';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  FirebaseUser
} from '../services/firebase';
import {
  attemptSilentGoogleSignIn,
  configureGoogleProvider,
  isManualLogout,
  markManualLogout,
  saveAuthEmail
} from '../services/firebaseAutoAuth';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface FirebaseActionResult {
  success: boolean;
  error?: string;
  user?: User;
}

function formatAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  if (code === 'auth/popup-blocked') {
    return "La fenêtre de connexion Google a été bloquée par le navigateur. Autorisez les popups pour ce site puis réessayez.";
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return "Connexion annulée avant la fin de l'authentification.";
  }
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    return `Domaine non autorisé pour Firebase Auth (${host}). Ajoutez ce domaine dans Firebase Console > Authentication > Settings.`;
  }
  if (code === 'auth/operation-not-allowed') {
    return "La connexion Google n'est pas activée dans le projet Firebase.";
  }
  if (code === 'auth/network-request-failed') {
    return "Erreur réseau lors de la connexion à Firebase.";
  }
  return error?.message || 'Erreur de connexion Firebase';
}

// Fonction de nettoyage pour éliminer les valeurs `undefined` et non sérialisables pour Firestore
function sanitizeForFirestore<T>(data: T): T {
  try {
    return JSON.parse(JSON.stringify(data, (_key, value) => (value === undefined ? null : value)));
  } catch {
    return data;
  }
}

export function useTaskManager() {
  const [textContent, setTextContentState] = useState<any>(() => ({
    allStates: {
      "Atelier1": getInitialState()
    },
    currentGroupName: "Atelier1",
    globalAlgoTemplates: DEFAULT_ALGO_TEMPLATES,
    globalProgEmbed: DEFAULT_PROG_EMBED
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lastLocalChange, setLastLocalChange] = useState<number>(0);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isFirebaseBackingUp, setIsFirebaseBackingUp] = useState(false);
  const [lastFirebaseBackup, setLastFirebaseBackup] = useState<string | null>(null);
  const [firebaseBackupError, setFirebaseBackupError] = useState<string | null>(null);

  const isSavingRef = useRef(false);
  const isInitialSnapshotRef = useRef(true);
  const hasAttemptedAutoLoginRef = useRef(false);

  // Écoute de l'état d'authentification Firebase + connexion automatique silencieuse
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (!isMounted) return;
      if (user) {
        saveAuthEmail(user.email);
        setFirebaseUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
        setIsFirebaseConnected(true);
        setFirebaseBackupError(null);
        setIsAuthReady(true);
      } else {
        setFirebaseUser(null);
        setIsFirebaseConnected(false);
        setLastFirebaseBackup(null);
        setIsAuthReady(true);

        if (!hasAttemptedAutoLoginRef.current && !isManualLogout()) {
          hasAttemptedAutoLoginRef.current = true;
          setIsAuthenticating(true);
          attemptSilentGoogleSignIn(auth)
            .catch(() => false)
            .finally(() => {
              if (isMounted) {
                setIsAuthenticating(false);
              }
            });
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Écoute en temps réel des données Firestore si connecté
  useEffect(() => {
    if (!firebaseUser) return;

    isInitialSnapshotRef.current = true;
    const workshopDocRef = doc(db, 'workshops', firebaseUser.uid);
    const unsubscribe = onSnapshot(
      workshopDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data();
          if (remoteData) {
            let states = remoteData.allStates;
            let groupName = remoteData.currentGroupName;
            let templates = remoteData.globalAlgoTemplates;
            let progEmbed = remoteData.globalProgEmbed;

            if (remoteData.dataJson) {
              try {
                const parsed = JSON.parse(remoteData.dataJson);
                if (!states && parsed.allStates) states = parsed.allStates;
                if (!groupName && parsed.currentGroupName) groupName = parsed.currentGroupName;
                if (!templates && parsed.globalAlgoTemplates) templates = parsed.globalAlgoTemplates;
                if (typeof progEmbed !== 'string' && typeof parsed.globalProgEmbed === 'string') {
                  progEmbed = parsed.globalProgEmbed;
                }
              } catch (e) {
                console.warn('Erreur lecture dataJson Firestore:', e);
              }
            }

            if (states) {
              setTextContentState((prev: any) => ({
                ...prev,
                allStates: states,
                currentGroupName: groupName || prev.currentGroupName,
                globalAlgoTemplates: templates || prev.globalAlgoTemplates,
                globalProgEmbed: typeof progEmbed === 'string' ? progEmbed : prev.globalProgEmbed
              }));
              if (remoteData.updatedAt) {
                const timeMs = new Date(remoteData.updatedAt).getTime();
                setLastFirebaseBackup(remoteData.updatedAt);
                setLastLocalChange(timeMs);
              }
            }
          }
        }
        setFirebaseBackupError(null);
        isInitialSnapshotRef.current = false;
      },
      (error) => {
        const errInfo = handleFirestoreError(error, OperationType.GET, `workshops/${firebaseUser.uid}`);
        setFirebaseBackupError(errInfo.error);
        isInitialSnapshotRef.current = false;
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  const setTextContent = useCallback((data: any) => {
    setTextContentState(data);
    setLastLocalChange(Date.now());
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<FirebaseActionResult> => {
    if (isAuthenticating) {
      return { success: false, error: 'Connexion déjà en cours...' };
    }
    setIsAuthenticating(true);
    setFirebaseBackupError(null);
    try {
      configureGoogleProvider(googleProvider);
      const credential = await signInWithPopup(auth, googleProvider);
      saveAuthEmail(credential.user.email);
      const userObj: User = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName,
        photoURL: credential.user.photoURL
      };
      setFirebaseUser(userObj);
      setIsFirebaseConnected(true);
      return { success: true, user: userObj };
    } catch (error: any) {
      console.error('Erreur de connexion Google Firebase:', error);
      const message = formatAuthErrorMessage(error);
      setFirebaseBackupError(message);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating]);

  const logout = useCallback(async () => {
    try {
      markManualLogout();
      await signOut(auth);
      setFirebaseUser(null);
      setIsFirebaseConnected(false);
      setLastFirebaseBackup(null);
      setFirebaseBackupError(null);
    } catch (error: any) {
      console.error('Erreur déconnexion Firebase:', error);
      setFirebaseBackupError(error?.message || 'Erreur lors de la déconnexion');
    }
  }, []);

  const manualFirebaseBackup = useCallback(async (): Promise<FirebaseActionResult> => {
    if (!firebaseUser) {
      const msg = 'Non connecté à Firebase';
      setFirebaseBackupError(msg);
      return { success: false, error: msg };
    }
    if (isSavingRef.current) {
      return { success: false, error: 'Sauvegarde déjà en cours' };
    }
    isSavingRef.current = true;
    setIsFirebaseBackingUp(true);
    setFirebaseBackupError(null);

    const path = `workshops/${firebaseUser.uid}`;
    try {
      const nowIso = new Date().toISOString();
      const sanitizedStates = sanitizeForFirestore(textContent.allStates || {});
      const sanitizedTemplates = sanitizeForFirestore(textContent.globalAlgoTemplates || DEFAULT_ALGO_TEMPLATES);
      const sanitizedProgEmbed =
        typeof textContent.globalProgEmbed === 'string'
          ? textContent.globalProgEmbed.slice(0, MAX_PROG_EMBED_LENGTH)
          : DEFAULT_PROG_EMBED;
      const safeGroupName = String(textContent.currentGroupName || 'Atelier1').slice(0, 120);

      const payload = {
        ownerId: firebaseUser.uid,
        name: safeGroupName,
        allStates: sanitizedStates,
        currentGroupName: safeGroupName,
        globalAlgoTemplates: Array.isArray(sanitizedTemplates) ? sanitizedTemplates.slice(0, 100) : [],
        globalProgEmbed: sanitizedProgEmbed,
        updatedAt: nowIso
      };

      await setDoc(doc(db, 'workshops', firebaseUser.uid), payload);
      const nowMs = new Date(nowIso).getTime();
      setLastFirebaseBackup(nowIso);
      setLastLocalChange(nowMs);
      return { success: true };
    } catch (error: any) {
      const errInfo = handleFirestoreError(error, OperationType.WRITE, path);
      setFirebaseBackupError(errInfo.error);
      return { success: false, error: errInfo.error };
    } finally {
      setIsFirebaseBackingUp(false);
      isSavingRef.current = false;
    }
  }, [firebaseUser, textContent]);

  // Synchronisation automatique après un changement local
  useEffect(() => {
    if (!firebaseUser || isLoading || isInitialSnapshotRef.current) return;

    if (lastLocalChange > 0) {
      const backupTime = lastFirebaseBackup ? new Date(lastFirebaseBackup).getTime() : 0;
      if (lastLocalChange > backupTime + 1000) {
        const timer = setTimeout(() => {
          manualFirebaseBackup();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastLocalChange, firebaseUser, lastFirebaseBackup, manualFirebaseBackup, isLoading]);

  const loadFromFirebaseBackup = useCallback(async (): Promise<FirebaseActionResult> => {
    if (!firebaseUser) {
      return { success: false, error: 'Non connecté à Firebase' };
    }
    setIsLoading(true);
    setFirebaseBackupError(null);
    const path = `workshops/${firebaseUser.uid}`;
    try {
      const snap = await getDoc(doc(db, 'workshops', firebaseUser.uid));
      if (snap.exists()) {
        const remoteData = snap.data();
        if (remoteData) {
          let states = remoteData.allStates;
          let groupName = remoteData.currentGroupName;
          let templates = remoteData.globalAlgoTemplates;
          let progEmbed = remoteData.globalProgEmbed;

          if (remoteData.dataJson) {
            try {
              const parsed = JSON.parse(remoteData.dataJson);
              if (!states && parsed.allStates) states = parsed.allStates;
              if (!groupName && parsed.currentGroupName) groupName = parsed.currentGroupName;
              if (!templates && parsed.globalAlgoTemplates) templates = parsed.globalAlgoTemplates;
              if (typeof progEmbed !== 'string' && typeof parsed.globalProgEmbed === 'string') {
                progEmbed = parsed.globalProgEmbed;
              }
            } catch (e) {
              console.warn('Erreur parsing dataJson:', e);
            }
          }

          if (states) {
            setTextContentState({
              allStates: states,
              currentGroupName: groupName || 'Atelier1',
              globalAlgoTemplates: templates || DEFAULT_ALGO_TEMPLATES,
              globalProgEmbed: typeof progEmbed === 'string' ? progEmbed : DEFAULT_PROG_EMBED
            });
            if (remoteData.updatedAt) {
              const timeMs = new Date(remoteData.updatedAt).getTime();
              setLastFirebaseBackup(remoteData.updatedAt);
              setLastLocalChange(timeMs);
            }
          }
        }
        return { success: true };
      }
      return { success: false, error: 'Aucune sauvegarde trouvée dans le Cloud pour ce compte.' };
    } catch (error: any) {
      const errInfo = handleFirestoreError(error, OperationType.GET, path);
      setFirebaseBackupError(errInfo.error);
      return { success: false, error: errInfo.error };
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  return {
    textContent,
    setTextContent,
    isLoading,
    isAuthReady,
    isAuthenticating,
    lastLocalChange,
    isFirebaseConnected,
    isFirebaseBackingUp,
    lastFirebaseBackup,
    firebaseBackupError,
    firebaseUser,
    loginWithGoogle,
    logout,
    manualFirebaseBackup,
    loadFromFirebaseBackup
  };
}
