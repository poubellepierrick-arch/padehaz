import React from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { HistoryEntry } from './HistoryEntry';
import { StatsView } from './StatsView';
import { SortConfig } from '../utils/helpers';

export interface StatsHistoryTabProps {
    currentState: any;
    historyFilter: string;
    setHistoryFilter: (filter: string) => void;
    getParticipantColor: (name: string) => string;
    sessionMarkerColorMap: Map<string, string>;
    uniqueMarkerCountRef: React.MutableRefObject<number>;
    setEditHistoryState: (state: any) => void;
    confirmAction: (message: string, options?: any) => Promise<any>;
    modifyState: (updater: (state: any) => void) => void;
    updateProposedGroups: (s: any) => void;
    activeParticipants: string[];
    sortConfigs: Record<string, SortConfig>;
    handleSort: (tableKey: string, key: string) => void;
    showMessage: (text: string, type?: 'info' | 'error' | 'success') => void;
}

export const StatsHistoryTab: React.FC<StatsHistoryTabProps> = ({
    currentState,
    historyFilter,
    setHistoryFilter,
    getParticipantColor,
    sessionMarkerColorMap,
    uniqueMarkerCountRef,
    setEditHistoryState,
    confirmAction,
    modifyState,
    updateProposedGroups,
    activeParticipants,
    sortConfigs,
    handleSort,
    showMessage
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
            {/* Historique Complet */}
            <div className="app-column" style={{ width: '100%' }}>
                <CollapsibleSection id="history-log-section" title="Historique Complet">
                    <div id="history-filter-container">
                        <input
                            type="text"
                            id="history-filter-input"
                            placeholder="Filtrer l'historique par nom..."
                            value={historyFilter}
                            onChange={(e) => setHistoryFilter(e.target.value)}
                        />
                    </div>
                    <div id="history-list-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <div id="history-list">
                            {currentState.history.length === 0 && <p>L'historique des tours est vide.</p>}
                            {currentState.history
                                .slice()
                                .reverse()
                                .filter((entry: any) => {
                                    if (!historyFilter) return true;
                                    const participants = [...(entry.main || []), ...(entry.bonus || [])].join(' ').toLowerCase();
                                    return participants.includes(historyFilter.toLowerCase());
                                })
                                .map((entry: any, index: number, arr: any[]) => {
                                    const realIdx = currentState.history.indexOf(entry);
                                    const currentDate = new Date(entry.timestamp).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    });
                                    const prevEntry = index > 0 ? arr[index - 1] : null;
                                    const prevDate = prevEntry
                                        ? new Date(prevEntry.timestamp).toLocaleDateString('fr-FR', {
                                              weekday: 'long',
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric'
                                          })
                                        : null;
                                    const showDateHeader = !prevEntry || prevDate !== currentDate;

                                    return (
                                        <React.Fragment key={entry.timestamp}>
                                            {showDateHeader && <div className="history-date-divider">{currentDate}</div>}
                                            <HistoryEntry
                                                entry={entry}
                                                index={realIdx}
                                                lastResetDate={currentState.lastResetDate}
                                                getParticipantColor={getParticipantColor}
                                                sessionMarkerMap={sessionMarkerColorMap}
                                                uniqueMarkerCount={uniqueMarkerCountRef}
                                                onEdit={() => {
                                                    const currentIdx = currentState.history.findIndex(
                                                        (e: any) => e.timestamp === entry.timestamp
                                                    );
                                                    if (currentIdx !== -1) {
                                                        setEditHistoryState({
                                                            isOpen: true,
                                                            index: currentIdx,
                                                            data: {
                                                                ...entry,
                                                                main: entry.main || [],
                                                                bonus: entry.bonus || []
                                                            }
                                                        });
                                                    }
                                                }}
                                                onDelete={() => {
                                                    modifyState((s) => {
                                                        const idxToDelete = s.history.findIndex(
                                                            (e: any) => e.timestamp === entry.timestamp
                                                        );
                                                        if (idxToDelete !== -1) {
                                                            s.history.splice(idxToDelete, 1);
                                                            if (s.currentActiveHistoryEntryIndex === idxToDelete) {
                                                                s.currentActiveHistoryEntryIndex = -1;
                                                            } else if (s.currentActiveHistoryEntryIndex > idxToDelete) {
                                                                s.currentActiveHistoryEntryIndex -= 1;
                                                            }
                                                            updateProposedGroups(s);
                                                        }
                                                    });
                                                }}
                                            />
                                        </React.Fragment>
                                    );
                                })}
                        </div>
                    </div>
                </CollapsibleSection>
            </div>

            {/* Stats */}
            <div className="app-column" style={{ width: '100%' }}>
                <StatsView
                    currentState={currentState}
                    activeParticipants={activeParticipants}
                    sortConfigs={sortConfigs}
                    handleSort={handleSort}
                    getParticipantColor={getParticipantColor}
                    modifyState={modifyState}
                    confirmAction={confirmAction}
                    showMessage={showMessage}
                />
            </div>
        </div>
    );
};
