
import React, { useState, useEffect } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { ParticipantManager } from './ParticipantManager';
import { getInitialState } from '../services/StateFactory';

interface WorkshopConfigViewProps {
    currentGroupName: string;
    allStates: any;
    onUpdateGlobalState: (newAllStates: any, newGroupName: string) => void;
    confirmAction: (message: string, options?: any) => Promise<unknown>;
    showMessage: (msg: string, type: 'info' | 'error' | 'success') => void;
    currentState: any;
    modifyState: (updater: (state: any) => void) => void;
    updateProposedGroups: (state: any) => void;
    getParticipantColor: (name: string) => string;
}

export const WorkshopConfigView: React.FC<WorkshopConfigViewProps> = ({
    currentGroupName,
    allStates,
    onUpdateGlobalState,
    confirmAction,
    showMessage,
    currentState,
    modifyState,
    updateProposedGroups,
    getParticipantColor
}) => {
    const [renameInput, setRenameInput] = useState(currentGroupName);
    const [newWorkshopName, setNewWorkshopName] = useState('');

    // Sync input when global group name changes
    useEffect(() => {
        setRenameInput(currentGroupName);
    }, [currentGroupName]);

    const handleCreateWorkshop = () => {
        const cleanName = newWorkshopName.trim();
        if (!cleanName) return;

        if (allStates[cleanName]) {
            showMessage(`L'atelier "${cleanName}" existe déjà.`, 'error');
            return;
        }

        const newAllStates = JSON.parse(JSON.stringify(allStates));
        newAllStates[cleanName] = getInitialState();
        onUpdateGlobalState(newAllStates, cleanName);
        setNewWorkshopName('');
        showMessage(`Atelier "${cleanName}" créé et activé.`, 'success');
    };

    const handleRename = () => {
        const newName = renameInput.trim();
        if (!newName || newName === currentGroupName) return;

        if (allStates[newName]) {
            showMessage(`L'atelier "${newName}" existe déjà.`, 'error');
            return;
        }

        const newState = JSON.parse(JSON.stringify(allStates));
        newState[newName] = newState[currentGroupName];
        delete newState[currentGroupName];
        onUpdateGlobalState(newState, newName);
        showMessage(`Atelier renommé en "${newName}".`, 'success');
    };

    const handleDelete = async () => {
        const remainingGroups = Object.keys(allStates);
        if (remainingGroups.length <= 1) {
            showMessage("Impossible de supprimer le dernier atelier.", "error");
            return;
        }

        if (await confirmAction(`Voulez-vous vraiment supprimer l'atelier "<strong>${currentGroupName}</strong>" ?<br><br>⚠️ Cette action est irréversible et effacera tout l'historique de cet atelier.`, { isDanger: true })) {
            const newState = JSON.parse(JSON.stringify(allStates));
            delete newState[currentGroupName];
            
            // Switch to another group
            const nextGroup = Object.keys(newState)[0];
            onUpdateGlobalState(newState, nextGroup);
            showMessage(`Atelier "${currentGroupName}" supprimé.`, 'success');
        }
    };

    return (
        <div id="workshop-config-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 1. CRÉER UN NOUVEL ATELIER */}
            <div className="config-card">
                <CollapsibleSection id="config-create-workshop" title="➕ Créer un Nouvel Atelier">
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '10px' }}>
                        <div style={{ flexGrow: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', opacity: 0.8 }}>Nom du nouvel atelier :</label>
                            <input 
                                type="text" 
                                placeholder="ex: Atelier Mardi Soir"
                                value={newWorkshopName} 
                                onChange={(e) => setNewWorkshopName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkshop(); }}
                                style={{ width: '100%', padding: '8px', fontSize: '1em' }}
                            />
                        </div>
                        <button 
                            onClick={handleCreateWorkshop}
                            disabled={!newWorkshopName.trim()}
                            style={{ 
                                padding: '8px 16px', 
                                backgroundColor: 'var(--success-color)', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '4px',
                                fontWeight: 'bold'
                            }}
                        >
                            Créer l'atelier
                        </button>
                    </div>
                </CollapsibleSection>
            </div>

            {/* 2. SÉLECTION ET GESTION DES ATELIERS */}
            <div className="config-card">
                <CollapsibleSection id="config-all-workshops" title={`📋 Tous les Ateliers (${Object.keys(allStates).length})`}>
                    <p style={{marginBottom: '10px', fontSize: '0.9em', opacity: 0.7}}>
                        Sélectionnez un atelier actif ou gérez les ateliers existants.
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.keys(allStates).sort().map(g => {
                            const isCurrent = g === currentGroupName;
                            const countP = allStates[g]?.participantsList?.length || 0;
                            return (
                                <li 
                                    key={g} 
                                    style={{
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        padding: '8px 12px', 
                                        backgroundColor: isCurrent ? 'rgba(97, 175, 239, 0.15)' : 'rgba(0,0,0,0.15)',
                                        border: isCurrent ? '1px solid var(--highlight-color)' : '1px solid var(--border-color)',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: 'bold', color: isCurrent ? 'var(--highlight-color)' : 'var(--text-color)' }}>
                                            {g}
                                        </span>
                                        {isCurrent && (
                                            <span style={{ fontSize: '0.75em', padding: '2px 6px', backgroundColor: 'var(--highlight-color)', color: '#fff', borderRadius: '10px' }}>
                                                Actif
                                            </span>
                                        )}
                                        <span style={{ fontSize: '0.85em', opacity: 0.6 }}>
                                            ({countP} participant{countP > 1 ? 's' : ''})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {!isCurrent && (
                                            <button 
                                                onClick={() => {
                                                    onUpdateGlobalState(allStates, g);
                                                    showMessage(`Atelier basculé sur "${g}".`, 'info');
                                                }}
                                                style={{ padding: '4px 10px', fontSize: '0.85em', backgroundColor: 'var(--button-bg)' }}
                                            >
                                                Ouvrir
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </CollapsibleSection>
            </div>

            {/* 3. RENOMMER & LIEN PROG */}
            <div className="config-card">
                <CollapsibleSection id="config-general" title={`⚙️ Paramètres Généraux : ${currentGroupName}`}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '10px' }}>
                        <div style={{ flexGrow: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', opacity: 0.8 }}>Renommer l'atelier :</label>
                            <input 
                                type="text" 
                                value={renameInput} 
                                onChange={(e) => setRenameInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
                                style={{ width: '100%', padding: '8px', fontSize: '1em' }}
                            />
                        </div>
                        <button 
                            onClick={handleRename}
                            disabled={renameInput === currentGroupName || !renameInput.trim()}
                            style={{ padding: '8px 16px', backgroundColor: 'var(--button-bg)', border: '1px solid var(--border-color)' }}
                        >
                            Enregistrer
                        </button>
                    </div>
                </CollapsibleSection>
            </div>

            {/* 4. GESTION PARTICIPANTS */}
            <div className="config-card">
                <CollapsibleSection id="config-participants" title="👥 Gestion des Participants">
                    <p style={{marginBottom: '15px', fontSize: '0.9em', opacity: 0.7}}>
                        Ajoutez, supprimez ou masquez des participants pour cet atelier.
                    </p>
                    <ParticipantManager 
                        currentState={currentState}
                        modifyState={modifyState}
                        updateProposedGroups={updateProposedGroups}
                        getParticipantColor={getParticipantColor}
                        confirmAction={confirmAction}
                        showMessage={showMessage}
                    />
                </CollapsibleSection>
            </div>

            {/* 5. ZONE DE DANGER */}
            <div className="config-card danger-zone" style={{ border: '1px solid var(--error-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: 'rgba(224, 108, 117, 0.1)', padding: '10px 15px', borderBottom: '1px solid var(--error-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2em' }}>⚠️</span>
                    <h3 style={{ margin: 0, fontSize: '1em', color: 'var(--error-color)' }}>Zone de Danger</h3>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-color)' }}>Supprimer cet atelier</h4>
                            <p style={{ margin: 0, fontSize: '0.85em', opacity: 0.6 }}>
                                Cette action supprimera définitivement "{currentGroupName}" et toutes ses données associées.
                            </p>
                        </div>
                        <button 
                            onClick={handleDelete}
                            style={{ 
                                backgroundColor: 'rgba(224, 108, 117, 0.2)', 
                                color: 'var(--error-color)', 
                                border: '1px solid var(--error-color)',
                                padding: '8px 16px',
                                fontWeight: 'bold'
                            }}
                        >
                            Supprimer l'atelier
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};
