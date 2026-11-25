import React, { useState, useEffect, useMemo } from 'react';
import { WorkshopConfigView } from './WorkshopConfigView';
import { CollapsibleSection } from './CollapsibleSection';
import { InlineStyleEditor } from './inline/InlineStyleEditor';
import { DEFAULT_PROG_EMBED, MAX_PROG_EMBED_LENGTH } from '../config/constants';
import { parseProgEmbedInput } from '../utils/progEmbed';
import { useGlobal } from '../contexts/GlobalContext';

function normalizeSafeHttpUrl(rawUrl: string): string | null {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) return null;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
    } catch {
        return null;
    }
}

export interface OutilsConfigTabProps {
    currentGroupName: string;
    allStates: any;
    onUpdateGlobalState: (newAllStates: any, newGroupName: string, newGlobalTemplates?: any[]) => void;
    confirmAction: (message: string, options?: any) => Promise<any>;
    showMessage: (text: string, type?: 'info' | 'error' | 'success') => void;
    currentState: any;
    modifyState: (updater: (state: any) => void) => void;
    updateProposedGroups: (s: any) => void;
    getParticipantColor: (name: string) => string;
    timeWindowProgress: {
        early: { pct: number; color: string; text: string; textColor: string };
        late: { pct: number; color: string; text: string; textColor: string };
    };
    customStyles?: any;
    setCustomStyles?: (styles: any) => void;
    isStyleEditorOpen?: boolean;
    setIsStyleEditorOpen?: (open: boolean) => void;
    globalProgEmbed: string;
    onUpdateGlobalProgEmbed: (value: string) => void;
    onOpenProgTab: () => void;
}

export const OutilsConfigTab: React.FC<OutilsConfigTabProps> = ({
    currentGroupName,
    allStates,
    onUpdateGlobalState,
    confirmAction,
    showMessage,
    currentState,
    modifyState,
    updateProposedGroups,
    getParticipantColor,
    timeWindowProgress,
    customStyles = {},
    setCustomStyles = () => {},
    isStyleEditorOpen = false,
    setIsStyleEditorOpen = (_open: boolean) => {},
    globalProgEmbed,
    onUpdateGlobalProgEmbed,
    onOpenProgTab
}) => {
    const {
        firebaseUser,
        isAuthenticating,
        isFirebaseBackingUp,
        lastFirebaseBackup,
        firebaseBackupError,
        loginWithGoogle,
        logout,
        manualFirebaseBackup,
        loadFromFirebaseBackup
    } = useGlobal();

    const [newShortcutName, setNewShortcutName] = useState('');
    const [newShortcutUrl, setNewShortcutUrl] = useState('');
    const [progInput, setProgInput] = useState(globalProgEmbed);

    useEffect(() => {
        setProgInput(globalProgEmbed);
    }, [globalProgEmbed]);

    const parsedPreview = useMemo(() => parseProgEmbedInput(progInput), [progInput]);
    const hasProgChanged = progInput.trim() !== (globalProgEmbed || '').trim();
    const canSaveProg = parsedPreview.isEmpty || parsedPreview.isValid;

    const handleSaveProgEmbed = () => {
        if (!canSaveProg) {
            showMessage(parsedPreview.errorMessage || 'Lien invalide', 'error');
            return;
        }
        onUpdateGlobalProgEmbed(progInput.trim());
        showMessage('Prog enregistré', 'success');
    };

    const handleOpenInProg = () => {
        if (hasProgChanged) {
            if (!canSaveProg) {
                showMessage(parsedPreview.errorMessage || 'Lien invalide', 'error');
                return;
            }
            onUpdateGlobalProgEmbed(progInput.trim());
        }
        onOpenProgTab();
    };

    const handleResetDefaultProg = () => {
        setProgInput(DEFAULT_PROG_EMBED);
        onUpdateGlobalProgEmbed(DEFAULT_PROG_EMBED);
        showMessage('Prog réinitialisé', 'info');
    };

    return (
        <div id="tools-view-container">
            {/* Personnalisation du style inline */}
            {isStyleEditorOpen && (
                <InlineStyleEditor
                    isOpen={isStyleEditorOpen}
                    customStyles={customStyles}
                    setCustomStyles={setCustomStyles}
                    onClose={() => setIsStyleEditorOpen(false)}
                />
            )}

            {/* Connexion & Sauvegarde Firebase */}
            <div className="config-card">
                <CollapsibleSection id="config-firebase-cloud" title="☁️ Sauvegarde Cloud">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {firebaseUser ? (
                            <>
                                <div style={{ fontSize: '0.92em', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>Connecté</span>{' '}
                                        · <strong>{firebaseUser.displayName || firebaseUser.email || 'Google'}</strong>
                                        {firebaseUser.displayName && firebaseUser.email ? ` (${firebaseUser.email})` : ''}
                                    </div>
                                    <span style={{ fontSize: '0.85em', opacity: 0.75 }}>
                                        {lastFirebaseBackup
                                            ? `Dernière synchro : ${new Date(lastFirebaseBackup).toLocaleString('fr-FR')}`
                                            : 'Aucune sauvegarde'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    <button
                                        type="button"
                                        className="save-btn whitespace-nowrap shrink-0"
                                        disabled={isFirebaseBackingUp}
                                        onClick={async () => {
                                            const res = await manualFirebaseBackup();
                                            if (res.success) {
                                                showMessage('Sauvegarde effectuée', 'success');
                                            } else if (res.error) {
                                                showMessage(res.error, 'error');
                                            }
                                        }}
                                    >
                                        {isFirebaseBackingUp ? 'Sauvegarde...' : 'Sauvegarder'}
                                    </button>
                                    <button
                                        type="button"
                                        className="whitespace-nowrap shrink-0"
                                        onClick={async () => {
                                            const res = await loadFromFirebaseBackup();
                                            if (res.success) {
                                                showMessage('Données chargées', 'success');
                                            } else if (res.error) {
                                                showMessage(res.error, 'error');
                                            }
                                        }}
                                        style={{ padding: '8px 14px', border: '1px solid var(--border-color)' }}
                                    >
                                        Recharger
                                    </button>
                                    <button
                                        type="button"
                                        className="whitespace-nowrap shrink-0"
                                        onClick={async () => {
                                            await logout();
                                            showMessage('Déconnecté', 'info');
                                        }}
                                        style={{ padding: '8px 14px', border: '1px solid var(--border-color)', marginLeft: 'auto' }}
                                    >
                                        Déconnexion
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                                <p style={{ margin: 0, fontSize: '0.9em', opacity: 0.85, flex: '1 1 260px' }}>
                                    Connectez un compte Google pour synchroniser vos ateliers.
                                </p>
                                <button
                                    type="button"
                                    className="save-btn whitespace-nowrap shrink-0"
                                    disabled={isAuthenticating}
                                    onClick={async () => {
                                        const res = await loginWithGoogle();
                                        if (res.success) {
                                            showMessage(`Connecté (${res.user?.email || res.user?.displayName || 'Google'})`, 'success');
                                        } else if (res.error) {
                                            showMessage(res.error, 'error');
                                        }
                                    }}
                                >
                                    {isAuthenticating ? 'Connexion...' : 'Connexion Google'}
                                </button>
                            </div>
                        )}
                        {firebaseBackupError && (
                            <div style={{ color: 'var(--error-color)', fontSize: '0.88em', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--error-color)', backgroundColor: 'rgba(224, 108, 117, 0.1)' }}>
                                {firebaseBackupError}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            </div>

            {/* Configuration globale de l'onglet Prog */}
            <div className="config-card">
                <CollapsibleSection id="config-global-prog" title="Prog (lien global)">
                    <p style={{ marginBottom: '10px', fontSize: '0.9em', opacity: 0.8 }}>
                        URL (https://...) ou balise <code>&lt;iframe&gt;</code> partagée entre tous les ateliers.
                    </p>
                    <textarea
                        id="global-prog-embed-input"
                        rows={3}
                        maxLength={MAX_PROG_EMBED_LENGTH}
                        placeholder='https://... ou <iframe src="https://..."></iframe>'
                        value={progInput}
                        onChange={(e) => setProgInput(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 10px',
                            fontFamily: 'monospace',
                            fontSize: '0.88em',
                            backgroundColor: 'var(--input-bg)',
                            color: 'var(--text-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ marginTop: '8px', fontSize: '0.85em', minHeight: '20px' }}>
                        {parsedPreview.errorMessage ? (
                            <span style={{ color: 'var(--error-color)' }}>{parsedPreview.errorMessage}</span>
                        ) : parsedPreview.isValid ? (
                            <span style={{ opacity: 0.85, wordBreak: 'break-all' }}>
                                URL : <strong>{parsedPreview.srcUrl}</strong>
                            </span>
                        ) : (
                            <span style={{ opacity: 0.65 }}>Aucun lien configuré.</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                        <button
                            type="button"
                            className="save-btn whitespace-nowrap shrink-0"
                            onClick={handleSaveProgEmbed}
                            disabled={!hasProgChanged || !canSaveProg}
                        >
                            Enregistrer
                        </button>
                        <button
                            type="button"
                            className="whitespace-nowrap shrink-0"
                            onClick={handleOpenInProg}
                            disabled={!parsedPreview.isValid}
                            style={{ padding: '8px 14px', border: '1px solid var(--border-color)' }}
                        >
                            Voir dans Prog
                        </button>
                        <button
                            type="button"
                            className="whitespace-nowrap shrink-0"
                            onClick={handleResetDefaultProg}
                            disabled={progInput.trim() === DEFAULT_PROG_EMBED}
                            style={{ padding: '8px 14px', border: '1px solid var(--border-color)' }}
                        >
                            Réinitialiser
                        </button>
                        {parsedPreview.isValid && (
                            <a
                                href={parsedPreview.srcUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="whitespace-nowrap shrink-0"
                                style={{
                                    marginLeft: 'auto',
                                    color: 'var(--highlight-color)',
                                    fontSize: '0.88em',
                                    textDecoration: 'underline'
                                }}
                            >
                                Ouvrir dans un nouvel onglet
                            </a>
                        )}
                    </div>
                </CollapsibleSection>
            </div>

            <WorkshopConfigView
                currentGroupName={currentGroupName}
                allStates={allStates}
                onUpdateGlobalState={onUpdateGlobalState}
                confirmAction={confirmAction}
                showMessage={showMessage}
                currentState={currentState}
                modifyState={modifyState}
                updateProposedGroups={updateProposedGroups}
                getParticipantColor={getParticipantColor}
            />
            <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0' }} />

            {/* Fenêtre Temporelle Début (Early) */}
            <div className="time-window-container" id="early-time-window-container">
                <div className="time-window-settings">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <label>Début:</label>
                        <input
                            type="time"
                            value={currentState.timeWindowSettings.early.start}
                            onChange={(e) =>
                                modifyState((s) => (s.timeWindowSettings.early.start = e.target.value))
                            }
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <label>Milieu:</label>
                        <input
                            type="time"
                            value={currentState.timeWindowSettings.early.transition}
                            onChange={(e) =>
                                modifyState((s) => (s.timeWindowSettings.early.transition = e.target.value))
                            }
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <label>Fin:</label>
                        <input
                            type="time"
                            value={currentState.timeWindowSettings.early.end}
                            onChange={(e) =>
                                modifyState((s) => (s.timeWindowSettings.early.end = e.target.value))
                            }
                        />
                    </div>
                </div>
                <div className="time-window-display-area">
                    <div className="time-window-progress-outer">
                        <div
                            className="time-window-progress-bar"
                            style={{
                                width: `${timeWindowProgress.early.pct}%`,
                                backgroundColor: timeWindowProgress.early.color
                            }}
                        ></div>
                    </div>
                    <span className="time-window-remaining" style={{ color: timeWindowProgress.early.textColor }}>
                        {timeWindowProgress.early.text}
                    </span>
                </div>
            </div>

            {/* Fenêtre Temporelle Fin (Late) */}
            <div className="time-window-container" id="late-time-window-container">
                <div className="time-window-settings">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <label>Début:</label>
                        <input
                            type="time"
                            value={currentState.timeWindowSettings.late.start}
                            onChange={(e) =>
                                modifyState((s) => (s.timeWindowSettings.late.start = e.target.value))
                            }
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <label>Milieu:</label>
                        <input
                            type="time"
                            value={currentState.timeWindowSettings.late.transition}
                            onChange={(e) =>
                                modifyState((s) => (s.timeWindowSettings.late.transition = e.target.value))
                            }
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <label>Fin:</label>
                        <input
                            type="time"
                            value={currentState.timeWindowSettings.late.end}
                            onChange={(e) =>
                                modifyState((s) => (s.timeWindowSettings.late.end = e.target.value))
                            }
                        />
                    </div>
                </div>
                <div className="time-window-display-area">
                    <div className="time-window-progress-outer">
                        <div
                            className="time-window-progress-bar"
                            style={{
                                width: `${timeWindowProgress.late.pct}%`,
                                backgroundColor: timeWindowProgress.late.color
                            }}
                        ></div>
                    </div>
                    <span className="time-window-remaining" style={{ color: timeWindowProgress.late.textColor }}>
                        {timeWindowProgress.late.text}
                    </span>
                </div>
            </div>

            {/* Shortcuts */}
            <CollapsibleSection id="shortcuts-section" title="Raccourcis Web">
                <ul id="shortcuts-list">
                    {(currentState.shortcuts || []).map((sc: any, idx: number) => {
                        const safeUrl = normalizeSafeHttpUrl(sc.url);
                        return (
                            <li key={idx}>
                                {safeUrl ? (
                                    <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                                        {sc.name}
                                    </a>
                                ) : (
                                    <span className="opacity-70">{sc.name}</span>
                                )}
                                <button
                                    className="delete-shortcut-btn"
                                    onClick={() => modifyState((s) => s.shortcuts.splice(idx, 1))}
                                >
                                    &times;
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <form
                    id="add-shortcut-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const cleanName = newShortcutName.trim();
                        const safeUrl = normalizeSafeHttpUrl(newShortcutUrl);
                        if (!cleanName) return;
                        if (!safeUrl) {
                            showMessage('URL invalide (http:// ou https://)', 'error');
                            return;
                        }
                        modifyState((s) => {
                            if (!s.shortcuts) s.shortcuts = [];
                            s.shortcuts.push({ name: cleanName, url: safeUrl });
                        });
                        setNewShortcutName('');
                        setNewShortcutUrl('');
                    }}
                >
                    <input
                        type="text"
                        id="shortcut-name-input"
                        placeholder="Nom du raccourci"
                        value={newShortcutName}
                        onChange={(e) => setNewShortcutName(e.target.value)}
                        required
                    />
                    <input
                        type="url"
                        id="shortcut-url-input"
                        placeholder="https://example.com"
                        value={newShortcutUrl}
                        onChange={(e) => setNewShortcutUrl(e.target.value)}
                        required
                    />
                    <button id="add-shortcut-btn" type="submit">
                        Ajouter
                    </button>
                </form>
            </CollapsibleSection>

            {/* Image Paste */}
            <CollapsibleSection id="image-paste-section" title="Image">
                <div id="image-paste-container" title="Coller une image depuis le presse-papiers (Ctrl+V)">
                    {currentState.pastedImage ? (
                        <>
                            <img id="pasted-image" src={currentState.pastedImage} className="visible" alt="Image collée" />
                            <button
                                id="delete-image-btn"
                                className="visible"
                                onClick={() => modifyState((s) => (s.pastedImage = null))}
                            >
                                &times;
                            </button>
                        </>
                    ) : (
                        <span id="image-placeholder">Collez une image ici</span>
                    )}
                </div>
            </CollapsibleSection>
        </div>
    );
};
