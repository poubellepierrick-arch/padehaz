


import React from 'react';
import { SortConfig, sortData, hexToRgba, createEmptyParticipantStats, formatTimeAgo } from '../../utils/helpers';
import { getStatDisplay } from './StatHelpers';

interface ParticipationTableProps {
    activeParticipants: string[];
    stats: any;
    sortConfig: SortConfig;
    onSort: (key: string) => void;
    getParticipantColor: (name: string) => string;
}

export const ParticipationTable: React.FC<ParticipationTableProps> = ({ activeParticipants, stats, sortConfig, onSort, getParticipantColor }) => {
    const data = activeParticipants.map((name: string) => {
        const pStats = stats.participations[name] || createEmptyParticipantStats();
        return {
            name,
            totalMain: pStats.totalMain,
            totalBonus: pStats.totalBonus,
            total: pStats.totalMain + pStats.totalBonus,
            sessionMain: pStats.sessionMain,
            sessionBonus: pStats.sessionBonus,
            sessionTotal: pStats.sessionMain + pStats.sessionBonus,
            lastImproTimestamp: pStats.lastImproTimestamp || 0,
            avgPerSession: pStats.avgPerSession || 0
        };
    });
    
    const mins: any = {}; const maxs: any = {};
    ['totalMain', 'totalBonus', 'total', 'sessionMain', 'sessionBonus', 'sessionTotal', 'avgPerSession'].forEach(key => {
        const vals = data.map((d: any) => d[key]);
        mins[key] = Math.min(...vals);
        maxs[key] = Math.max(...vals);
    });

    const sortedData = sortData(data, sortConfig);

    return (
        <div className="stats-table-wrapper">
            <table id="participation-table">
                <thead>
                    <tr>
                        <th className="sortable" onClick={() => onSort('name')}>Participant {sortConfig.key === 'name' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('totalMain')}>Total Main {sortConfig.key === 'totalMain' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('totalBonus')}>Total Bonus {sortConfig.key === 'totalBonus' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('total')}>Total {sortConfig.key === 'total' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('sessionMain')}>Session Main {sortConfig.key === 'sessionMain' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('sessionBonus')}>Session Bonus {sortConfig.key === 'sessionBonus' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('sessionTotal')}>Session Total {sortConfig.key === 'sessionTotal' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('avgPerSession')}>Moy/Sess. {sortConfig.key === 'avgPerSession' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('lastImproTimestamp')}>Dernière {sortConfig.key === 'lastImproTimestamp' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row: any) => (
                        <tr key={row.name} style={{'--row-bg-color': hexToRgba(getParticipantColor(row.name), 0.05)} as any}>
                            <td style={{borderRight: `2px solid ${getParticipantColor(row.name)}`}}><span className="prenom-couleur" style={{color: getParticipantColor(row.name)}}>{row.name}</span></td>
                            <td>{getStatDisplay(row.totalMain, mins.totalMain, maxs.totalMain)}</td>
                            <td>{getStatDisplay(row.totalBonus, mins.totalBonus, maxs.totalBonus)}</td>
                            <td>{getStatDisplay(row.total, mins.total, maxs.total)}</td>
                            <td>{getStatDisplay(row.sessionMain, mins.sessionMain, maxs.sessionMain)}</td>
                            <td>{getStatDisplay(row.sessionBonus, mins.sessionBonus, maxs.sessionBonus)}</td>
                            <td>{getStatDisplay(row.sessionTotal, mins.sessionTotal, maxs.sessionTotal)}</td>
                            <td>
                                <span style={{
                                    fontWeight:'bold', 
                                    textDecoration: row.avgPerSession === maxs.avgPerSession ? 'underline' : 'none',
                                    textDecorationColor: 'var(--highlight-color)'
                                }}>
                                    {row.avgPerSession.toFixed(2)}
                                </span>
                            </td>
                            <td style={{fontSize:'0.9em', color:'var(--text-color)', opacity:0.9}}>{formatTimeAgo(row.lastImproTimestamp)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};