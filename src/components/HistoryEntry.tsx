
import React, { useState } from 'react';
import { SESSION_MARKER_COLORS } from '../config/constants';

interface HistoryEntryProps {
    entry: any;
    index: number;
    lastResetDate: string;
    getParticipantColor: (name: string) => string;
    onEdit: () => void;
    onDelete: () => void;
    sessionMarkerMap: Map<string, number>;
    uniqueMarkerCount: React.MutableRefObject<number>;
}

export const HistoryEntry: React.FC<HistoryEntryProps> = ({ 
    entry, 
    index, 
    lastResetDate, 
    getParticipantColor, 
    onEdit, 
    onDelete,
    sessionMarkerMap,
    uniqueMarkerCount
}) => {
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // Calcul de la couleur du marqueur de session
    const marker = entry.sessionMarker || lastResetDate;
    if (!sessionMarkerMap.has(marker)) {
        sessionMarkerMap.set(marker, uniqueMarkerCount.current % SESSION_MARKER_COLORS.length);
        uniqueMarkerCount.current++;
    }
    const colorIndex = sessionMarkerMap.get(marker) || 0;
    const markerColor = SESSION_MARKER_COLORS[colorIndex];

    const mainList = entry.main || [];
    const bonusList = entry.bonus || [];

    return (
        <div className="history-entry compact" style={{ borderLeftColor: markerColor, position: 'relative' }}>
            {/* Header modifié pour aligner timestamp et temps à gauche */}
            <div className="history-entry-header" style={{ justifyContent: 'flex-start', gap: '15px' }}>
                <span className="timestamp">
                    {new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="time-badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)', fontWeight: 'bold' }}>
                    Exo {entry.exerciseNumber || 1}
                </span>
                <div className="history-times" style={{ display: 'flex', gap: '10px' }}>
                    {entry.improTime !== "00:00" && (
                        <span className="time-badge" title="Temps d'improvisation">🎭 {entry.improTime}</span>
                    )}
                    {entry.debriefTime !== "00:00" && (
                        <span className="time-badge" title="Temps de débrief">💬 {entry.debriefTime}</span>
                    )}
                </div>
            </div>

            <div className="history-groups-inline">
                {mainList.length > 0 && (
                    <span className="group-inline-block">
                        <span className="group-label">MAIN:</span>
                        {mainList.map((p: string, i: number) => (
                            <span key={p} className="participant-inline">
                                <span style={{ color: getParticipantColor(p) }}>{p}</span>
                                {i < mainList.length - 1 && <span className="separator">, </span>}
                            </span>
                        ))}
                    </span>
                )}
                
                {mainList.length > 0 && bonusList.length > 0 && <span className="group-separator">|</span>}

                {bonusList.length > 0 && (
                    <span className="group-inline-block">
                        <span className="group-label">BONUS:</span>
                        {bonusList.map((p: string, i: number) => (
                            <span key={p} className="participant-inline">
                                <span style={{ color: getParticipantColor(p) }}>{p}</span>
                                {i < bonusList.length - 1 && <span className="separator">, </span>}
                            </span>
                        ))}
                    </span>
                )}
            </div>

            {/* Actions ou confirmation de suppression en ligne */}
            {isConfirmingDelete ? (
                <div 
                    style={{ 
                        position: 'absolute', 
                        top: '4px', 
                        right: '4px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        backgroundColor: 'rgba(224, 108, 117, 0.15)', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        border: '1px solid var(--error-color)',
                        zIndex: 20 
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <span style={{ fontSize: '0.75em', color: 'var(--error-color)', fontWeight: 'bold' }}>Supprimer ?</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsConfirmingDelete(false);
                            onDelete();
                        }}
                        style={{
                            backgroundColor: 'var(--error-color)',
                            color: '#fff',
                            border: 'none',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '0.75em',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            lineHeight: 1
                        }}
                        title="Confirmer la suppression"
                    >
                        Oui
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsConfirmingDelete(false);
                        }}
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--text-color)',
                            border: 'none',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '0.75em',
                            cursor: 'pointer',
                            lineHeight: 1
                        }}
                        title="Annuler"
                    >
                        Non
                    </button>
                </div>
            ) : (
                <div className="history-actions" style={{ zIndex: 10 }}>
                    <button 
                        className="history-action-btn edit" 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                        title="Modifier"
                    >✎</button>
                    <button 
                        className="history-action-btn delete" 
                        onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }} 
                        title="Supprimer"
                    >×</button>
                </div>
            )}
        </div>
    );
};
