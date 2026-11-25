
import React, { useState } from 'react';
import { SortConfig, hexToRgba } from '../../utils/helpers';
import { getStatDisplay } from './StatHelpers';

interface CoocTableProps {
    type: 'main' | 'bonus';
    scope: 'total' | 'session'; // Scope added
    activeParticipants: string[];
    stats: any;
    sortConfig: SortConfig;
    onSort: (key: string) => void;
    getParticipantColor: (name: string) => string;
}

export const CoocTable: React.FC<CoocTableProps> = ({ type, scope, activeParticipants, stats, sortConfig, onSort, getParticipantColor }) => {
    const [isPercentMode, setIsPercentMode] = useState(false);
    
    // Select correct database based on type and scope
    let coocDb: any = {};
    if (scope === 'session') {
        coocDb = type === 'main' ? stats.sessionCooccurrencesMain : stats.sessionCooccurrencesBonus;
    } else {
        coocDb = type === 'main' ? stats.cooccurrencesMain : stats.cooccurrencesBonus;
    }

    // Fallback if db undefined (during migration or init)
    coocDb = coocDb || {};

    // Fonction utilitaire pour récupérer la valeur (Brute ou %)
    const getValue = (rowP: string, colP: string) => {
        const rawVal = coocDb[rowP]?.[colP] || 0;
        if (!isPercentMode) return rawVal;

        const pStats = stats.participations[rowP];
        
        // Denominator selection based on scope
        let total = 0;
        if (scope === 'session') {
            total = type === 'main' ? pStats?.sessionMain : pStats?.sessionBonus;
        } else {
            total = type === 'main' ? pStats?.totalMain : pStats?.totalBonus;
        }
        
        if (!total || total === 0) return 0;
        return Math.round((rawVal / total) * 100);
    };
    
    // Sort rows based on sortState if the key matches a participant name, otherwise alphabetic
    let rows = [...activeParticipants];
    if (sortConfig && sortConfig.order !== 'none' && activeParticipants.includes(sortConfig.key)) {
            rows.sort((a, b) => {
                const valA = getValue(a, sortConfig.key);
                const valB = getValue(b, sortConfig.key);
                return sortConfig.order === 'asc' ? valA - valB : valB - valA;
            });
    } else {
        rows.sort();
    }

    // Determine global min/max for coloring logic (simple heatmap)
    let minC = Infinity; let maxC = 0;
    activeParticipants.forEach((p1: string) => {
        activeParticipants.forEach((p2: string) => {
            if (p1 !== p2) {
                const val = getValue(p1, p2);
                minC = Math.min(minC, val);
                maxC = Math.max(maxC, val);
            }
        });
    });
    if (minC === Infinity) minC = 0;

    return (
        <div className="stats-table-wrapper">
            <h4 style={{marginBottom: '10px', marginTop: '0', fontSize: '0.9em', opacity: 0.7, textAlign: 'center'}}>
                {scope === 'session' ? 'SESSION EN COURS' : 'HISTORIQUE TOTAL'} - {type === 'main' ? 'MAIN' : 'BONUS'}
            </h4>
            <table id={`cooc-${type}-${scope}-table`}>
                <thead>
                    <tr>
                        <th style={{zIndex: 30, left: 0, top: 0, padding: '4px'}}>
                            <button 
                                onClick={() => setIsPercentMode(!isPercentMode)}
                                style={{
                                    fontSize: '0.75em',
                                    padding: '2px 6px',
                                    cursor: 'pointer',
                                    backgroundColor: isPercentMode ? 'var(--highlight-color)' : 'var(--button-bg)',
                                    color: isPercentMode ? '#fff' : 'var(--text-color)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    width: '100%'
                                }}
                                title="Basculer entre valeurs brutes et pourcentages"
                            >
                                {isPercentMode ? 'cooc %' : 'Brut'}
                            </button>
                        </th>
                        {activeParticipants.map((p: string) => (
                            <th key={p} className="sortable" onClick={() => onSort(p)} style={{backgroundColor: hexToRgba(getParticipantColor(p), 0.1)}}>
                                <div style={{display:'flex', alignItems:'center', justifyContent: 'center', height: '100%'}}>
                                    <span className="prenom-couleur" style={{color: getParticipantColor(p)}}>{p}</span>
                                    {sortConfig.key === p && <span className="sort-indicator" style={{marginLeft:'4px', fontSize:'0.8em', transform: 'rotate(90deg)'}}>{sortConfig.order === 'asc' ? '▲' : '▼'}</span>}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((rowP: string) => (
                        <tr key={rowP}>
                            <th style={{borderRight: `2px solid ${getParticipantColor(rowP)}`, borderBottom: `2px solid ${getParticipantColor(rowP)}`}}><span className="prenom-couleur" style={{color: getParticipantColor(rowP)}}>{rowP}</span></th>
                            {activeParticipants.map((colP: string) => {
                                if (rowP === colP) return <td key={colP} style={{backgroundColor:'#222'}}>-</td>;
                                const val = getValue(rowP, colP);
                                return (
                                    <td key={colP} style={{borderBottom: `2px solid ${getParticipantColor(rowP)}`, backgroundColor: hexToRgba(getParticipantColor(colP), 0.05)}} title={`${rowP} > ${colP}: ${val}${isPercentMode ? '%' : ''}`}>
                                        {getStatDisplay(val, minC, maxC)}{isPercentMode ? <span style={{fontSize:'0.7em', opacity:0.7}}>%</span> : ''}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
