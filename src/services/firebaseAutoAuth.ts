import {
  Auth,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const AUTH_EMAIL_STORAGE_KEY = 'pasdehasard_auth_email';
const AUTH_MANUAL_LOGOUT_KEY = 'pasdehasard_manual_logout';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          disableAutoSelect?: () => void;
        };
      };
    };
  }
}

export function getSavedAuthEmail(): string | null {
  try {
    return window.localStorage.getItem(AUTH_EMAIL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveAuthEmail(email: string | null | undefined): void {
  try {
    if (email) {
      window.localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, email);
    }
    window.localStorage.removeItem(AUTH_MANUAL_LOGOUT_KEY);
  } catch {
    // Stockage local indisponible
  }
}

export function markManualLogout(): void {
  try {
    window.localStorage.setItem(AUTH_MANUAL_LOGOUT_KEY, '1');
    window.google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    // Stockage local indisponible
  }
}

export function isManualLogout(): boolean {
  try {
    return window.localStorage.getItem(AUTH_MANUAL_LOGOUT_KEY) === '1';
  } catch {
    return false;
  }
}

export function configureGoogleProvider(provider: GoogleAuthProvider): GoogleAuthProvider {
  const savedEmail = getSavedAuthEmail();
  if (isManualLogout()) {
    provider.setCustomParameters({ prompt: 'select_account' });
  } else if (savedEmail) {
    provider.setCustomParameters({ login_hint: savedEmail });
  } else {
    provider.setCustomParameters({});
  }
  return provider;
}

let gsiLoadPromise: Promise<boolean> | null = null;

function loadGoogleIdentityScript(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve(true);
  }
  if (gsiLoadPromise) {
    return gsiLoadPromise;
  }

  gsiLoadPromise = new Promise<boolean>((resolve) => {
    const existingScript = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(Boolean(window.google?.accounts?.id)), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      setTimeout(() => resolve(Boolean(window.google?.accounts?.id)), 2500);
      return;
    }

    const script = document.createElement('script');
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    const timeout = window.setTimeout(() => resolve(Boolean(window.google?.accounts?.id)), 4000);
    script.onload = () => {
      window.clearTimeout(timeout);
      resolve(Boolean(window.google?.accounts?.id));
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return gsiLoadPromise;
}

export async function attemptSilentGoogleSignIn(auth: Auth): Promise<boolean> {
  if (isManualLogout()) return false;
  if (auth.currentUser) return true;

  const clientId = (firebaseConfig as { oAuthClientId?: string }).oAuthClientId;
  if (!clientId) return false;

  const loaded = await loadGoogleIdentityScript();
  const gsiId = window.google?.accounts?.id;
  if (!loaded || !gsiId) return false;

  const savedEmail = getSavedAuthEmail();

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(safetyTimer);
      resolve(ok);
    };

    const safetyTimer = window.setTimeout(() => finish(false), 5000);

    try {
      gsiId.initialize({
        client_id: clientId,
        auto_select: true,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: true,
        itp_support: true,
        ...(savedEmail ? { login_hint: savedEmail } : {}),
        callback: async (response: { credential?: string }) => {
          if (!response?.credential) {
            finish(false);
            return;
          }
          try {
            const credential = GoogleAuthProvider.credential(response.credential);
            const result = await signInWithCredential(auth, credential);
            saveAuthEmail(result.user.email);
            finish(true);
          } catch {
            finish(false);
          }
        }
      });

      gsiId.prompt((notification: any) => {
        if (
          notification?.isNotDisplayed?.() ||
          notification?.isSkippedMoment?.() ||
          notification?.isDismissedMoment?.()
        ) {
          finish(false);
        }
      });
    } catch {
      finish(false);
    }
  });
}
