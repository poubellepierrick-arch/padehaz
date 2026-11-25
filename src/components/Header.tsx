import React from 'react';
import { GroupManager } from './GroupManager';
import { FirebaseStatusIndicator } from './FirebaseStatusIndicator';
import { useGlobal } from '../contexts/GlobalContext';
import { useTheme } from '../contexts/ThemeContext';

export interface HeaderProps {
    localAllStates: any;
    currentGroupName: string;
    updateGlobalState: (newAllStates: any, newGroupName: string, newGlobalTemplates?: any[]) => void;
    confirmAction: (message: string, options?: any) => Promise<any>;
    showMessage: (text: string, type?: 'info' | 'error' | 'success') => void;
    activeMainTab: 'prog' | 'atelier' | 'algo' | 'outils_config' | 'stats_history';
    setActiveMainTab: (tab: 'prog' | 'atelier' | 'algo' | 'outils_config' | 'stats_history') => void;
    modifyState: (updater: (state: any) => void) => void;
    updateProposedGroups: (s: any) => void;
    toggleFullScreen: () => void;
    menuOpen: boolean;
    setMenuOpen: (open: boolean) => void;
    saveStateToFile: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    setIsStyleEditorOpen: (open: boolean) => void;
    setPromptInputVal: (val: string) => void;
    getInitialState: () => any;
}

export const Header: React.FC<HeaderProps> = ({
    localAllStates,
    currentGroupName,
    updateGlobalState,
    confirmAction,
    showMessage,
    activeMainTab,
    setActiveMainTab,
    modifyState,
    updateProposedGroups,
    toggleFullScreen,
    menuOpen,
    setMenuOpen,
    saveStateToFile,
    fileInputRef,
    setIsStyleEditorOpen,
    setPromptInputVal,
    getInitialState
}) => {
    const {
        isFirebaseConnected,
        isFirebaseBackingUp,
        isAuthReady,
        isAuthenticating,
        lastFirebaseBackup,
        firebaseBackupError,
        firebaseUser,
        lastLocalChange,
        manualFirebaseBackup,
        loadFromFirebaseBackup,
        loginWithGoogle,
        logout
    } = useGlobal();
    const { theme, toggleTheme } = useTheme();

    const handleConnectFirebase = async () => {
        const res = await loginWithGoogle();
        if (res.success) {
            showMessage(`Connecté à Firebase (${res.user?.email || res.user?.displayName || 'Google'})`, 'success');
        } else if (res.error) {
            showMessage(res.error, 'error');
        }
    };

    const handleBackupCloud = async () => {
        const res = await manualFirebaseBackup();
        if (res.success) {
            showMessage('Sauvegarde Cloud effectuée', 'success');
        } else if (res.error) {
            showMessage(res.error, 'error');
        }
    };

    const handleLoadCloud = async () => {
        const res = await loadFromFirebaseBackup();
        if (res.success) {
            showMessage('Données chargées depuis Firebase', 'success');
        } else if (res.error) {
            showMessage(res.error, 'error');
        }
    };

    return (
        <div id="app-header">
            {/* GROUP MANAGER */}
            <GroupManager
                allStates={localAllStates}
                currentGroupName={currentGroupName}
                onUpdateGlobalState={updateGlobalState}
                confirmAction={confirmAction}
                showMessage={showMessage}
                onOpenConfig={() => setActiveMainTab('outils_config')}
            />

            <div id="main-nav">
                <button
                    className={`main-tab-btn whitespace-nowrap shrink-0 ${activeMainTab === 'prog' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('prog')}
                >
                    Prog
                </button>
                <button
                    className={`main-tab-btn whitespace-nowrap shrink-0 ${activeMainTab === 'atelier' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('atelier')}
                >
                    Atelier
                </button>
                <button
                    className={`main-tab-btn whitespace-nowrap shrink-0 ${activeMainTab === 'algo' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('algo')}
                >
                    Algorithme
                </button>
                <button
                    className={`main-tab-btn whitespace-nowrap shrink-0 ${activeMainTab === 'outils_config' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('outils_config')}
                >
                    Outils & Config
                </button>
                <button
                    className={`main-tab-btn whitespace-nowrap shrink-0 ${activeMainTab === 'stats_history' ? 'active' : ''}`}
                    onClick={() => setActiveMainTab('stats_history')}
                >
                    Stats & Historique
                </button>
            </div>

            <div id="header-right-controls" className="flex items-center gap-2">
                {/* Indicateur + Bouton direct Connexion Firebase */}
                <FirebaseStatusIndicator
                    instanceNumber={1}
                    isConnected={isFirebaseConnected}
                    isBackingUp={isFirebaseBackingUp}
                    isAuthenticating={isAuthenticating}
                    lastBackup={lastFirebaseBackup}
                    error={firebaseBackupError}
                    isLoggedIn={!!firebaseUser}
                    lastLocalChange={lastLocalChange}
                    onBackup={async () => {
                        if (!firebaseUser) {
                            await handleConnectFirebase();
                        } else {
                            await handleBackupCloud();
                        }
                    }}
                />
                {isAuthReady && !firebaseUser && (
                    <button
                        type="button"
                        id="firebase-connect-header-btn"
                        disabled={isAuthenticating}
                        onClick={handleConnectFirebase}
                        title="Se connecter directement à Firebase avec votre compte Google"
                        className="whitespace-nowrap shrink-0 h-7 px-2.5 text-xs font-semibold rounded border border-[var(--highlight-color)] bg-[var(--highlight-color)] text-white hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                        {isAuthenticating ? 'Connexion...' : 'Connexion Firebase'}
                    </button>
                )}

                <button
                    id="new-session-header-btn"
                    title="Nouvelle Session"
                    onClick={async () => {
                        if (
                            await confirmAction(
                                "Démarrer une nouvelle session d'atelier ?<br>Les compteurs de session seront réinitialisés.",
                                { isDanger: false }
                            )
                        ) {
                            modifyState((s) => {
                                s.lastResetDate = new Date().toISOString();
                                updateProposedGroups(s);
                            });
                            showMessage('Nouvelle session démarrée', 'success');
                        }
                    }}
                >
                    🔄 Session
                </button>

                <button
                    id="theme-toggle-btn"
                    className="header-menu-btn"
                    title={theme === 'light' ? 'Thème sombre' : 'Thème clair'}
                    onClick={toggleTheme}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <button className="header-menu-btn" title="Plein Écran" onClick={toggleFullScreen}>
                    ⛶
                </button>

                <div className="header-menu-container">
                    <button className="header-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        ☰
                    </button>
                    {menuOpen && (
                        <div className="header-dropdown-menu">
                            <button
                                onClick={() => {
                                    toggleTheme();
                                    setMenuOpen(false);
                                }}
                            >
                                {theme === 'light' ? '🌙 Thème sombre' : '☀️ Thème clair'}
                            </button>
                            <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
                            {firebaseUser ? (
                                <>
                                    <button onClick={async () => {
                                        await handleBackupCloud();
                                        setMenuOpen(false);
                                    }}>
                                        ☁️ Sauvegarder dans le Cloud
                                    </button>
                                    <button onClick={async () => {
                                        await handleLoadCloud();
                                        setMenuOpen(false);
                                    }}>
                                        📥 Recharger depuis Firebase
                                    </button>
                                    <button onClick={async () => {
                                        await logout();
                                        showMessage('Déconnecté de Firebase', 'info');
                                        setMenuOpen(false);
                                    }}>
                                        🚪 Déconnexion ({firebaseUser.displayName || firebaseUser.email || 'Google'})
                                    </button>
                                </>
                            ) : (
                                <button onClick={async () => {
                                    setMenuOpen(false);
                                    await handleConnectFirebase();
                                }}>
                                    🔑 Connexion Google (Firebase Cloud)
                                </button>
                            )}
                            <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
                            <button onClick={saveStateToFile}>Télécharger (JSON)</button>
                            <button onClick={() => fileInputRef.current?.click()}>Charger (JSON)</button>
                            <button
                                onClick={() => {
                                    setIsStyleEditorOpen(true);
                                    setActiveMainTab('outils_config');
                                    setMenuOpen(false);
                                }}
                            >
                                Personnaliser Style
                            </button>
                            <button
                                onClick={() => {
                                    modifyState((s) => {
                                        s.lockedParticipants = { main: [], bonus: [] };
                                        updateProposedGroups(s);
                                    });
                                    setMenuOpen(false);
                                }}
                            >
                                Déverrouiller Tous
                            </button>
                            <button
                                onClick={async () => {
                                    const expected = `RESET ${currentGroupName}`;
                                    setPromptInputVal('');
                                    const confirmed = await confirmAction(
                                        `ATTENTION : Réinitialiser TOUTES les données ?<br>Irréversible.`,
                                        { isDanger: true, prompt: { expected, placeholder: `Tapez '${expected}'` } }
                                    );
                                    if (confirmed) {
                                        modifyState((s) => {
                                            Object.assign(s, getInitialState());
                                            updateProposedGroups(s);
                                        });
                                    }
                                    setMenuOpen(false);
                                }}
                            >
                                Réinitialiser TOUT (Attention !)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
