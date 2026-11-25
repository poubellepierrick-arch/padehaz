import React, { useState } from 'react';
import { ParticipationTable } from './stats/ParticipationTable';
import { DurationTable } from './stats/DurationTable';
import { CoocTable } from './stats/CoocTable';
import { StatsCharts } from './stats/StatsCharts';
import { formatDuration, parseTimeToSeconds, sortData, parseDurationStringToMs } from '../utils/helpers';
import { CollapsibleSection } from './CollapsibleSection';

interface StatsViewProps {
    currentState: any;
    activeParticipants: string[];
    sortConfigs: any;
    handleSort: (tableKey: string, key: string) => void;
    getParticipantColor: (name: string) => string;
    modifyState: (updater: (state: any) => void) => void;
    confirmAction: (message: string, options?: any) => Promise<any>;
    showMessage: (text: string, type?: 'info' | 'error' | 'success') => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
    currentState,
    activeParticipants,
    sortConfigs,
    handleSort,
    getParticipantColor,
    modifyState,
    confirmAction,
    showMessage
}) => {
    const [activeTab, setActiveTab] = useState('participation-content');

    // Global KPIs calculation
    const totalImproSeconds = currentState.history.reduce((acc: number, e: any) => acc + parseTimeToSeconds(e.improTime), 0);
    const totalDebriefSeconds = currentState.history.reduce((acc: number, e: any) => acc + parseTimeToSeconds(e.debriefTime), 0);
    const totalWarmupMs = currentState.warmupHistory.reduce((acc: number, e: any) => acc + (e.durationMs || 0), 0);
    const totalPlateauMs = currentState.plateauHistory.reduce((acc: number, e: any) => acc + (e.durationMs || 0), 0);

    const handleEditGlobalTime = async (date: string, type: 'warmup' | 'plateau') => {
        const targetHistory = type === 'warmup' ? 'warmupHistory' : 'plateauHistory';
        const typeLabel = type === 'warmup' ? 'de chauffe' : 'de plateau';
        const displayDate = new Date(date + 'T00:00:00Z').toLocaleDateString('fr-FR');
        
        const newValueStr = await confirmAction(`Modifier total ${typeLabel} du ${displayDate} (HH:MM:SS)`, {
            prompt: { freeInput: true, placeholder: '00:00:00' }
        });

        if (newValueStr && typeof newValueStr === 'string') {
            try {
                const newDurationMs = parseDurationStringToMs(newValueStr);
                modifyState(s => {
                    const getDateKey = (ts: number) => new Date(ts).toLocaleDateString('fr-CA');
                    s[targetHistory] = s[targetHistory].filter((e: any) => getDateKey(e.timestamp) !== date);
                    if (newDurationMs > 0) {
                        const [year, month, day] = date.split('-').map(Number);
                        const entryTimestamp = Date.UTC(year, month - 1, day, 12, 0, 0);
                        s[targetHistory].push({ timestamp: entryTimestamp, durationMs: newDurationMs });
                    }
                });
                showMessage("Temps mis à jour.", "success");
            } catch (e) {
                showMessage("Format invalide", "error");
            }
        }
    };

    const renderGlobalTable = () => {
        const dailyTotals: any = {};
        const getDateKey = (ts: number) => new Date(ts).toLocaleDateString('fr-CA');
        
        currentState.warmupHistory.forEach((e: any) => {
            const k = getDateKey(e.timestamp);
            if (!dailyTotals[k]) dailyTotals[k] = { date: k, warmup: 0, plateau: 0, impro: 0, debrief: 0 };
            dailyTotals[k].warmup += e.durationMs || 0;
        });
        currentState.plateauHistory.forEach((e: any) => {
            const k = getDateKey(e.timestamp);
            if (!dailyTotals[k]) dailyTotals[k] = { date: k, warmup: 0, plateau: 0, impro: 0, debrief: 0 };
            dailyTotals[k].plateau += e.durationMs || 0;
        });
        currentState.history.forEach((e: any) => {
            const k = getDateKey(e.timestamp);
            if (!dailyTotals[k]) dailyTotals[k] = { date: k, warmup: 0, plateau: 0, impro: 0, debrief: 0 };
            dailyTotals[k].impro += parseTimeToSeconds(e.improTime) * 1000;
            dailyTotals[k].debrief += parseTimeToSeconds(e.debriefTime) * 1000;
        });

        const data = Object.values(dailyTotals);
        const config = sortConfigs['global'] || { key: '', order: 'none' };
        
        const sortedData = sortData(data, config);
        if (config.order === 'none') {
            sortedData.sort((a: any, b: any) => b.date.localeCompare(a.date)); 
        }

        return (
            <div className="stats-table-wrapper">
                <table id="global-log-table">
                    <thead>
                        <tr>
                            <th className="sortable" onClick={() => handleSort('global', 'date')}>Date {config.key === 'date' && <span className="sort-indicator">{config.order === 'asc' ? '▲' : '▼'}</span>}</th>
                            <th className="sortable" onClick={() => handleSort('global', 'warmup')}>Total Chauffe 🔥 {config.key === 'warmup' && <span className="sort-indicator">{config.order === 'asc' ? '▲' : '▼'}</span>}</th>
                            <th className="sortable" onClick={() => handleSort('global', 'plateau')}>Total Plateau 🟫 {config.key === 'plateau' && <span className="sort-indicator">{config.order === 'asc' ? '▲' : '▼'}</span>}</th>
                            <th className="sortable" onClick={() => handleSort('global', 'impro')}>Total Impro 🎭 {config.key === 'impro' && <span className="sort-indicator">{config.order === 'asc' ? '▲' : '▼'}</span>}</th>
                            <th className="sortable" onClick={() => handleSort('global', 'debrief')}>Total Debrief 💬 {config.key === 'debrief' && <span className="sort-indicator">{config.order === 'asc' ? '▲' : '▼'}</span>}</th>
                            <th>Suppr.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row: any) => (
                            <tr key={row.date}>
                                <td style={{borderRight: '1px solid var(--border-color)'}}>{new Date(row.date).toLocaleDateString('fr-FR', {year: 'numeric', month: 'short', day: 'numeric'})}</td>
                                <td style={{fontFamily:'monospace', cursor:'pointer'}} title="Double-clic pour modifier" onDoubleClick={() => handleEditGlobalTime(row.date, 'warmup')} className="editable-global-time">{formatDuration(row.warmup)}</td>
                                <td style={{fontFamily:'monospace', cursor:'pointer'}} title="Double-clic pour modifier" onDoubleClick={() => handleEditGlobalTime(row.date, 'plateau')} className="editable-global-time">{formatDuration(row.plateau)}</td>
                                <td style={{fontFamily:'monospace'}}>{formatDuration(row.impro)}</td>
                                <td style={{fontFamily:'monospace'}}>{formatDuration(row.debrief)}</td>
                                <td>
                                    <button className="delete-session-btn" onClick={async () => {
                                        if (await confirmAction(`Supprimer les stats du ${new Date(row.date).toLocaleDateString('fr-FR')} ?`, {isDanger:true})) {
                                            modifyState(s => {
                                                const k = row.date;
                                                const getDateKey = (ts: number) => new Date(ts).toLocaleDateString('fr-CA');
                                                s.history = s.history.filter((e:any) => getDateKey(e.timestamp) !== k);
                                                s.warmupHistory = s.warmupHistory.filter((e:any) => getDateKey(e.timestamp) !== k);
                                                s.plateauHistory = s.plateauHistory.filter((e:any) => getDateKey(e.timestamp) !== k);
                                            });
                                        }
                                    }}>X</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <CollapsibleSection id="history-section" title="Statistiques & Historique">
            {/* KPI Cards */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--input-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9em', opacity: 0.8, marginBottom: '5px' }}>Total Impro</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--highlight-color)' }}>{formatDuration(totalImproSeconds * 1000)}</div>
                </div>
                <div style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--input-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9em', opacity: 0.8, marginBottom: '5px' }}>Total Debrief</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--highlight-color)' }}>{formatDuration(totalDebriefSeconds * 1000)}</div>
                </div>
                <div style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--input-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9em', opacity: 0.8, marginBottom: '5px' }}>Total Chauffe</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--highlight-color)' }}>{formatDuration(totalWarmupMs)}</div>
                </div>
                <div style={{ flex: 1, minWidth: '150px', backgroundColor: 'var(--input-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9em', opacity: 0.8, marginBottom: '5px' }}>Total Plateau</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--highlight-color)' }}>{formatDuration(totalPlateauMs)}</div>
                </div>
            </div>

            <nav id="stats-tab-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                <button className={`stats-tab-button ${activeTab === 'participation-content' ? 'active' : ''}`} onClick={() => setActiveTab('participation-content')}>🧑‍🤝‍🧑 Part.</button>
                <button className={`stats-tab-button ${activeTab === 'duration-session-content' ? 'active' : ''}`} onClick={() => setActiveTab('duration-session-content')}>⏱️ Sess.</button>
                <button className={`stats-tab-button ${activeTab === 'duration-total-content' ? 'active' : ''}`} onClick={() => setActiveTab('duration-total-content')}>📈 Tot.</button>
                
                <button className={`stats-tab-button ${activeTab === 'cooc-main-content' ? 'active' : ''}`} onClick={() => setActiveTab('cooc-main-content')}>🔗 Main (Tot)</button>
                <button className={`stats-tab-button ${activeTab === 'cooc-bonus-content' ? 'active' : ''}`} onClick={() => setActiveTab('cooc-bonus-content')}>🔗 Bonus (Tot)</button>
                
                <button className={`stats-tab-button ${activeTab === 'cooc-session-main-content' ? 'active' : ''}`} onClick={() => setActiveTab('cooc-session-main-content')}>🔗 Main (Sess)</button>
                <button className={`stats-tab-button ${activeTab === 'cooc-session-bonus-content' ? 'active' : ''}`} onClick={() => setActiveTab('cooc-session-bonus-content')}>🔗 Bonus (Sess)</button>

                <button className={`stats-tab-button ${activeTab === 'global-content' ? 'active' : ''}`} onClick={() => setActiveTab('global-content')}>🌍 Glob.</button>
                <button className={`stats-tab-button ${activeTab === 'charts-content' ? 'active' : ''}`} onClick={() => setActiveTab('charts-content')}>📊 Graphiques</button>
            </nav>

            <div id="stats-content">
                {activeTab === 'participation-content' && (
                    <ParticipationTable 
                        activeParticipants={activeParticipants}
                        stats={currentState.stats}
                        sortConfig={sortConfigs['participation'] || { key: '', order: 'none' }}
                        onSort={(key) => handleSort('participation', key)}
                        getParticipantColor={getParticipantColor}
                    />
                )}
                {activeTab === 'duration-session-content' && (
                    <DurationTable 
                        type="session"
                        activeParticipants={activeParticipants}
                        stats={currentState.stats}
                        sortConfig={sortConfigs['duration-session'] || { key: '', order: 'none' }}
                        onSort={(key) => handleSort('duration-session', key)}
                        getParticipantColor={getParticipantColor}
                    />
                )}
                {activeTab === 'duration-total-content' && (
                    <DurationTable 
                        type="total"
                        activeParticipants={activeParticipants}
                        stats={currentState.stats}
                        sortConfig={sortConfigs['duration-total'] || { key: '', order: 'none' }}
                        onSort={(key) => handleSort('duration-total', key)}
                        getParticipantColor={getParticipantColor}
                    />
                )}
                {activeTab === 'cooc-main-content' && (
                    <CoocTable 
                        type="main"
                        scope="total"
                        activeParticipants={activeParticipants}
                        stats={currentState.stats}
                        sortConfig={sortConfigs['cooc-main'] || { key: '', order: 'none' }}
                        onSort={(key) => handleSort('cooc-main', key)}
                        getParticipantColor={getParticipantColor}
                    />
                )}
                {activeTab === 'cooc-bonus-content' && (
                    <CoocTable 
                        type="bonus"
                        scope="total"
                        activeParticipants={activeParticipants}
                        stats={currentState.stats}
                        sortConfig={sortConfigs['cooc-bonus'] || { key: '', order: 'none' }}
                        onSort={(key) => handleSort('cooc-bonus', key)}
                        getParticipantColor={getParticipantColor}
                    />
                )}
                {activeTab === 'cooc-session-main-content' && (
                    <CoocTable 
                        type="main"
                        scope="session"
                        activeParticipants={activeParticipants}
                        stats={currentState.stats}
                        sortConfig={sortConfigs['cooc-session-main'] || { key: '', order: 'none' }}
                        onSort={(key) => handleSort('cooc-session-main', key)}
                        getParticipantColor={getParticipantColor}
                    />
                )}
                {activeTab === 'cooc-session-bonus-content' && (
                    <CoocTable 
                        type="bonus"
                        scope="session"
                        activeParticipants={activeParticipants}
                        stats={currentState.stats}
                        sortConfig={sortConfigs['cooc-session-bonus'] || { key: '', order: 'none' }}
                        onSort={(key) => handleSort('cooc-session-bonus', key)}
                        getParticipantColor={getParticipantColor}
                    />
                )}
                {activeTab === 'global-content' && renderGlobalTable()}
                {activeTab === 'charts-content' && (
                    <StatsCharts 
                        currentState={currentState}
                        activeParticipants={activeParticipants}
                        getParticipantColor={getParticipantColor}
                    />
                )}
            </div>
        </CollapsibleSection>
    );
};
