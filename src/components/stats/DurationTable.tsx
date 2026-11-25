
import React from 'react';
import { SortConfig, sortData, hexToRgba, createEmptyParticipantStats } from '../../utils/helpers';
import { getDurationStatDisplay } from './StatHelpers';

interface DurationTableProps {
    type: 'session' | 'total';
    activeParticipants: string[];
    stats: any;
    sortConfig: SortConfig;
    onSort: (key: string) => void;
    getParticipantColor: (name: string) => string;
}

export const DurationTable: React.FC<DurationTableProps> = ({ type, activeParticipants, stats, sortConfig, onSort, getParticipantColor }) => {
    const data = activeParticipants.map((name: string) => {
        const pStats = stats.participations[name] || createEmptyParticipantStats();
        const improMain = type === 'session' ? pStats.sessionMainImproSeconds : pStats.totalMainImproSeconds;
        const improBonus = type === 'session' ? pStats.sessionBonusImproSeconds : pStats.totalBonusImproSeconds;
        const debrief = type === 'session' ? pStats.sessionDebriefSeconds : pStats.totalDebriefSeconds;
        const totalImpro = improMain + improBonus;
        const count = type === 'session' ? (pStats.sessionMain + pStats.sessionBonus) : (pStats.totalMain + pStats.totalBonus);
        const sessionCount = type === 'session' ? (count > 0 ? 1 : 0) : (pStats.activeSessionCount || 0);
        const avgSessionPlay = sessionCount > 0 ? (totalImpro * 1000) / sessionCount : 0;
        
        return {
            name,
            improMain: improMain * 1000,
            improBonus: improBonus * 1000,
            totalImpro: totalImpro * 1000,
            avgImpro: count > 0 ? (totalImpro * 1000) / count : 0,
            avgSessionPlay,
            debrief: debrief * 1000
        };
    });

    const mins: any = {}; const maxs: any = {};
    ['improMain', 'improBonus', 'totalImpro', 'avgImpro', 'avgSessionPlay', 'debrief'].forEach(key => {
        const vals = data.map((d: any) => d[key]);
        mins[key] = Math.min(...vals);
        maxs[key] = Math.max(...vals);
    });

    const sortedData = sortData(data, sortConfig);

    return (
        <div className="stats-table-wrapper">
            <table id={`duration-${type}-stats-table`}>
                <thead>
                    <tr>
                        <th className="sortable" onClick={() => onSort('name')}>Participant {sortConfig.key === 'name' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('improMain')}>{type === 'session' ? 'Session' : 'Total'} Impro Main 🎭 {sortConfig.key === 'improMain' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('improBonus')}>{type === 'session' ? 'Session' : 'Total'} Impro Bonus 🎭 {sortConfig.key === 'improBonus' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('totalImpro')}>{type === 'session' ? 'Session' : 'Total'} Impro 🎭 {sortConfig.key === 'totalImpro' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('avgImpro')}>{type === 'session' ? 'Session' : 'Total'} Moy. Impro ⏱️ {sortConfig.key === 'avgImpro' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('avgSessionPlay')}>{type === 'session' ? 'Session' : 'Total'} Moy. Jeu/Sess. ⏱️ {sortConfig.key === 'avgSessionPlay' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                        <th className="sortable" onClick={() => onSort('debrief')}>{type === 'session' ? 'Session' : 'Total'} Debrief 💬 {sortConfig.key === 'debrief' && <span className="sort-indicator">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row: any) => (
                        <tr key={row.name} style={{'--row-bg-color': hexToRgba(getParticipantColor(row.name), 0.05)} as any}>
                            <td style={{borderRight: `2px solid ${getParticipantColor(row.name)}`}}><span className="prenom-couleur" style={{color: getParticipantColor(row.name)}}>{row.name}</span></td>
                            <td>{getDurationStatDisplay(row.improMain, mins.improMain, maxs.improMain)}</td>
                            <td>{getDurationStatDisplay(row.improBonus, mins.improBonus, maxs.improBonus)}</td>
                            <td>{getDurationStatDisplay(row.totalImpro, mins.totalImpro, maxs.totalImpro)}</td>
                            <td>{getDurationStatDisplay(row.avgImpro, mins.avgImpro, maxs.avgImpro)}</td>
                            <td>{getDurationStatDisplay(row.avgSessionPlay, mins.avgSessionPlay, maxs.avgSessionPlay)}</td>
                            <td>{getDurationStatDisplay(row.debrief, mins.debrief, maxs.debrief)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
