
import React, { useState } from 'react';

interface ParticipantManagerProps {
    currentState: any;
    modifyState: (updater: (state: any) => void) => void;
    updateProposedGroups: (state: any) => void;
    getParticipantColor: (name: string) => string;
    confirmAction: (message: string, options?: any) => Promise<unknown>;
    showMessage: (msg: string, type: 'info' | 'error' | 'success') => void;
}

export const ParticipantManager: React.FC<ParticipantManagerProps> = ({
    currentState,
    modifyState,
    updateProposedGroups,
    getParticipantColor,
    confirmAction,
    showMessage
}) => {
    const [newParticipantName, setNewParticipantName] = useState('');
    const [newParticipantColor, setNewParticipantColor] = useState('#cccccc');
    const [deletingParticipant, setDeletingParticipant] = useState<string | null>(null);

    const executeDelete = (p: string) => {
        modifyState(s => { 
            s.participantsList = s.participantsList.filter((x: string) => x !== p); 
            delete s.participantColors[p]; 
            // Clean up stats
            delete s.stats.participations[p];
            delete s.stats.cooccurrencesMain[p];
            delete s.stats.cooccurrencesBonus[p];
            delete s.stats.sessionCooccurrencesMain[p];
            delete s.stats.sessionCooccurrencesBonus[p];
            // Clean from arrays
            s.lockedParticipants.main = s.lockedParticipants.main.filter((x:string) => x !== p);
            s.lockedParticipants.bonus = s.lockedParticipants.bonus.filter((x:string) => x !== p);
            
            updateProposedGroups(s); 
        });
        setDeletingParticipant(null);
        showMessage(`Participant "${p}" supprimé`, "success");
    };

    const handleAddParticipant = () => {
        const name = newParticipantName.trim();
        if (!name) return;
        if (currentState.participantsList.includes(name)) {
            showMessage("Ce participant existe déjà !", "error");
            return;
        }
        modifyState(s => {
            s.participantsList.push(name);
            s.participantsList.sort((a: string, b: string) => a.localeCompare(b));
            s.participantColors[name] = newParticipantColor;
            s.presence[name] = true;
            s.participantStatus[name] = true;
            updateProposedGroups(s);
        });
        setNewParticipantName('');
        setNewParticipantColor('#cccccc');
        showMessage(`Participant "${name}" ajouté`, "success");
    };

    return (
        <div className="participant-manager-container">
            <div className="participant-management-list-container" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', border: '1px solid var(--border-color)', padding: '10px', borderRadius: 'var(--border-radius)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <h5 style={{marginTop: 0, marginBottom: '10px', color: 'var(--text-color)', opacity: 0.8}}>Participants ({currentState.participantsList.length})</h5>
                <ul className="participant-management-list" style={{ listStyle: 'none', padding: 0 }}>
                    {currentState.participantsList.sort((a: string, b: string) => a.localeCompare(b)).map((p: string) => (
                        <li key={p} className={!currentState.participantStatus[p] ? 'inactive-participant' : ''} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                            <div className="participant-name-color" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <input 
                                    type="color" 
                                    className="participant-color-input" 
                                    title={`Modifier la couleur de ${p}`} 
                                    value={getParticipantColor(p)} 
                                    onChange={(e) => modifyState(s => s.participantColors[p] = e.target.value)} 
                                    style={{width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                                />
                                <span style={{fontWeight: 'bold', color: !currentState.participantStatus[p] ? 'var(--text-color)' : 'var(--text-color)', opacity: !currentState.participantStatus[p] ? 0.5 : 1}}>{p}</span>
                            </div>
                            <div className="participant-actions" style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                                {deletingParticipant === p ? (
                                    <div style={{display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(224, 108, 117, 0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--error-color)'}}>
                                        <span style={{fontSize: '0.8em', color: 'var(--error-color)', fontWeight: 'bold'}}>Supprimer ?</span>
                                        <button
                                            onClick={() => executeDelete(p)}
                                            style={{backgroundColor: 'var(--error-color)', color: '#ffffff', border: 'none', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75em', fontWeight: 'bold', cursor: 'pointer'}}
                                            title="Confirmer la suppression"
                                        >
                                            Oui
                                        </button>
                                        <button
                                            onClick={() => setDeletingParticipant(null)}
                                            style={{backgroundColor: 'var(--button-bg)', color: 'var(--text-color)', border: 'none', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75em', cursor: 'pointer'}}
                                            title="Annuler"
                                        >
                                            Non
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button 
                                            className="visibility-toggle-btn" 
                                            title={currentState.participantStatus[p] ? `Rendre ${p} invisible (exclu des algos)` : `Rendre ${p} visible`} 
                                            onClick={() => modifyState(s => { 
                                                s.participantStatus[p] = !s.participantStatus[p]; 
                                                if (!s.participantStatus[p]) s.presence[p] = false; 
                                                updateProposedGroups(s); 
                                            })}
                                            style={{background: 'none', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', opacity: 0.8}}
                                        >
                                            {currentState.participantStatus[p] ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                        <button 
                                            className="participant-delete-btn" 
                                            title={`Supprimer ${p} définitivement`} 
                                            aria-label={`Supprimer ${p}`} 
                                            onClick={() => setDeletingParticipant(p)}
                                            style={{background: 'rgba(224, 108, 117, 0.1)', border: '1px solid var(--error-color)', color: 'var(--error-color)', padding: '2px 6px', borderRadius: '4px'}}
                                        >
                                            &#x1F5D1;
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="add-participant-form-container" style={{backgroundColor: 'var(--section-bg)', padding: '15px', borderRadius: 'var(--border-radius)', border: '1px solid var(--section-border-color)'}}>
                <h5 style={{marginTop: 0, marginBottom: '10px', color: 'var(--text-color)'}}>Nouveau participant</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{flexGrow: 1}}>
                        <label htmlFor="new-participant-name" style={{display: 'block', fontSize: '0.8em', marginBottom: '4px'}}>Nom :</label>
                        <input 
                            type="text" 
                            id="new-participant-name" 
                            value={newParticipantName} 
                            onChange={e => setNewParticipantName(e.target.value)} 
                            placeholder="Prénom" 
                            style={{ width: '100%', padding: '8px' }} 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
                        />
                    </div>
                    <div>
                        <label htmlFor="new-participant-color" style={{display: 'block', fontSize: '0.8em', marginBottom: '4px'}}>Couleur :</label>
                        <input 
                            type="color" 
                            id="new-participant-color" 
                            className="participant-color-input" 
                            title="Choisir une couleur" 
                            value={newParticipantColor} 
                            onChange={e => setNewParticipantColor(e.target.value)} 
                            style={{height: '35px', width: '50px', padding: 0}}
                        />
                    </div>
                    <button 
                        id="add-participant-btn" 
                        className="add-participant-btn" 
                        onClick={handleAddParticipant}
                        disabled={!newParticipantName.trim()}
                        style={{ padding: '8px 20px', backgroundColor: 'var(--highlight-color)', fontWeight: 'bold', height: '35px' }}
                    >
                        Ajouter
                    </button>
                </div>
            </div>
        </div>
    );
};
