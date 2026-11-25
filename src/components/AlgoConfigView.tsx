
import React, { useState, useEffect } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { ALGO_CRITERIA_OPTIONS } from '../services/GroupGenerator';

interface AlgoConfigViewProps {
    currentState: any;
    modifyState: (updater: (state: any) => void) => void;
    updateProposedGroups: (state: any) => void;
    getParticipantColor: (name: string) => string;
    globalTemplates?: any[]; // New prop for global templates
    onUpdateGlobalTemplates?: (newTemplates: any[]) => void; // Callback to update them
}

const AlgoPipelineEditor: React.FC<{
    pipeline: any[];
    pipelineKey: string;
    stepNumberOffset?: number;
    modifyState: (updater: (state: any) => void) => void;
    updateProposedGroups: (state: any) => void;
    logs: any[];
    getParticipantColor: (name: string) => string;
}> = ({ pipeline, pipelineKey, stepNumberOffset = 0, modifyState, updateProposedGroups, logs, getParticipantColor }) => {
    
    const renderCandidateRow = (c: any) => {
        let rowStyle: React.CSSProperties = {};
        let statusIcon = '';
        let statusText = '';
        
        if (c.status === 'picked') {
            if(c.forced) {
                rowStyle = { backgroundColor: 'rgba(97, 175, 239, 0.25)', borderLeft: '3px solid var(--highlight-color)' };
                statusIcon = '🛡️';
                statusText = 'Garanti (Min)';
            } else {
                rowStyle = { backgroundColor: 'rgba(152, 195, 121, 0.2)' }; // Greenish
                statusIcon = '✅';
                statusText = 'Sélectionné';
            }
        } else if (c.status === 'tied') {
            rowStyle = { backgroundColor: 'rgba(229, 192, 123, 0.2)' }; // Yellowish
            statusIcon = '⚖️';
            statusText = 'En balance (Suit)';
        } else if (c.status === 'waiting') {
            rowStyle = { backgroundColor: 'rgba(97, 175, 239, 0.1)' }; // Blueish
            statusIcon = '🔄';
            statusText = 'Recalcul...';
        } else if (c.status === 'passed') {
            rowStyle = { backgroundColor: 'rgba(97, 175, 239, 0.1)' }; // Blueish
            statusIcon = '⏭️';
            statusText = 'Passe au suivant';
        } else {
            rowStyle = { opacity: 0.5 };
            statusIcon = '❌';
            statusText = 'Éliminé';
        }

        return (
            <tr key={c.name} className="algo-log-row" style={rowStyle}>
                <td>
                    <span className="candidate-badge" style={{backgroundColor: getParticipantColor(c.name)}}>{c.name}</span>
                </td>
                <td>
                    <span className="score-val">{c.value}</span>
                </td>
                <td style={{fontSize:'0.8em'}}>
                    {statusIcon} {statusText}
                </td>
            </tr>
        );
    };

    return (
        <>
            {(pipeline || []).map((step: any, idx: number) => {
                const stepLog = logs.find((l:any) => l.stepId === step.id);
                
                const limitType = step.limitType || 'count';
                const minLimitType = step.minLimitType || 'count';

                return (
                <React.Fragment key={step.id}>
                    <div className="algo-pipeline-step editable-step" style={{flexDirection:'column', alignItems:'stretch'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', flexWrap: 'wrap'}}>
                            <div className="step-number">{idx + 1 + stepNumberOffset}</div>
                            <div className="step-content" style={{flexBasis: '100%', minWidth: '250px'}}>
                                {step.type === 'sort' ? (
                                    <div style={{display:'flex', flexDirection: 'column', gap:'10px'}}>
                                        <div style={{display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap'}}>
                                            <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                                                <span style={{fontWeight:'bold'}}>Trier par :</span>
                                                <select value={step.criterion} onChange={(e) => modifyState((s:any) => { s[pipelineKey][idx].criterion = e.target.value; updateProposedGroups(s); })}>
                                                    {ALGO_CRITERIA_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                </select>
                                            </div>
                                            <select value={step.order} onChange={(e) => modifyState((s:any) => { s[pipelineKey][idx].order = e.target.value; updateProposedGroups(s); })}>
                                                <option value="asc">Croissant (Petit → Grand)</option>
                                                <option value="desc">Décroissant (Grand → Petit)</option>
                                            </select>
                                        </div>
                                        
                                        <div style={{display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap'}}>
                                            {/* MIN LIMIT */}
                                            <div style={{display:'flex', alignItems:'center', gap:'4px', flexGrow:1, minWidth:'200px'}}>
                                                <label style={{fontSize:'0.8em', whiteSpace:'nowrap', color:'var(--highlight-color)'}}>Min:</label>
                                                <div className="limit-input-group">
                                                    {minLimitType === 'count' ? (
                                                        <input type="number" min="0" placeholder="0" value={step.minLimit || ''} onChange={(e) => modifyState((s:any) => { s[pipelineKey][idx].minLimit = e.target.value ? parseInt(e.target.value, 10) : undefined; updateProposedGroups(s); })} title="Sélection minimum garantie à cette étape"/>
                                                    ) : (
                                                        <div className="slider-container">
                                                            <input type="range" min="0" max="100" value={step.minLimit || 0} onChange={(e) => modifyState((s:any) => {s[pipelineKey][idx].minLimit = parseInt(e.target.value, 10); updateProposedGroups(s); })} />
                                                            <span className="slider-value">{step.minLimit || 0}%</span>
                                                        </div>
                                                    )}
                                                    <button className={`limit-type-btn ${minLimitType === 'count' ? 'active' : ''}`} onClick={() => modifyState((s:any) => { s[pipelineKey][idx].minLimitType = 'count'; updateProposedGroups(s);})} title="Valeur absolue">#</button>
                                                    <button className={`limit-type-btn ${minLimitType === 'percent' ? 'active' : ''}`} onClick={() => modifyState((s:any) => { s[pipelineKey][idx].minLimitType = 'percent'; if (s[pipelineKey][idx].minLimit > 100) s[pipelineKey][idx].minLimit = 100; updateProposedGroups(s); })} title="Pourcentage de la taille finale du groupe">%</button>
                                                </div>
                                            </div>

                                            {/* MAX LIMIT */}
                                            <div style={{display:'flex', alignItems:'center', gap:'4px', flexGrow:1, minWidth:'200px'}}>
                                                <label style={{fontSize:'0.8em', whiteSpace:'nowrap', color:'var(--highlight-color)'}}>Max:</label>
                                                <div className="limit-input-group">
                                                    {limitType === 'count' ? (
                                                        <input type="number" min="0" placeholder="∞" value={step.limit || ''} onChange={(e) => modifyState((s:any) => { s[pipelineKey][idx].limit = e.target.value ? parseInt(e.target.value, 10) : undefined; updateProposedGroups(s); })} title="Nombre max de participants à sélectionner"/>
                                                    ) : (
                                                        <div className="slider-container">
                                                            <input type="range" min="0" max="100" value={step.limit || 0} onChange={(e) => modifyState((s:any) => {s[pipelineKey][idx].limit = parseInt(e.target.value, 10); updateProposedGroups(s); })} />
                                                            <span className="slider-value">{step.limit || 0}%</span>
                                                        </div>
                                                    )}
                                                    <button className={`limit-type-btn ${limitType === 'count' ? 'active' : ''}`} onClick={() => modifyState((s:any) => {s[pipelineKey][idx].limitType = 'count'; updateProposedGroups(s);})} title="Valeur absolue">#</button>
                                                    <button className={`limit-type-btn ${limitType === 'percent' ? 'active' : ''}`} onClick={() => modifyState((s:any) => { s[pipelineKey][idx].limitType = 'percent'; if (s[pipelineKey][idx].limit > 100) s[pipelineKey][idx].limit = 100; updateProposedGroups(s); })} title="Pourcentage de la taille finale du groupe">%</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="step-title">Mélanger (Aléatoire)</div>
                                )}
                            </div>
                            <div className="step-controls">
                                <button onClick={() => modifyState((s:any) => {
                                    if (idx > 0) {
                                        const temp = s[pipelineKey][idx];
                                        s[pipelineKey][idx] = s[pipelineKey][idx-1];
                                        s[pipelineKey][idx-1] = temp;
                                        updateProposedGroups(s);
                                    }
                                })} disabled={idx === 0}>▲</button>
                                <button onClick={() => modifyState((s:any) => {
                                    if (idx < s[pipelineKey].length - 1) {
                                        const temp = s[pipelineKey][idx];
                                        s[pipelineKey][idx] = s[pipelineKey][idx+1];
                                        s[pipelineKey][idx+1] = temp;
                                        updateProposedGroups(s);
                                    }
                                })} disabled={idx === (pipeline?.length || 0) - 1}>▼</button>
                                <button onClick={() => modifyState((s:any) => { s[pipelineKey].splice(idx, 1); updateProposedGroups(s); })} style={{color:'var(--error-color)'}}>✖</button>
                            </div>
                        </div>
                        
                        {pipelineKey.startsWith('algo') && stepLog && (
                            <div className="algo-step-details">
                                <table className="algo-log-table">
                                    <thead><tr><th>Candidat</th><th>Valeur</th><th>Statut</th></tr></thead>
                                    <tbody>{stepLog.candidates.map((c:any) => renderCandidateRow(c))}</tbody>
                                </table>
                                {stepLog.tieBreakerLogs && (
                                     <div className="tie-breaker-branch-container">
                                        <h5 className="tie-breaker-title">Branche de Départage</h5>
                                        {stepLog.tieBreakerLogs.map((tbLog: any, tbIndex: number) => {
                                            const tbStepInfo = ALGO_CRITERIA_OPTIONS.find(o => o.value === tbLog.criterion);
                                            
                                            let stepLabel = '';
                                            if (tbLog.type === 'shuffle') {
                                                stepLabel = '🎲 Mélange';
                                            } else if (tbLog.criterion === 'random') {
                                                stepLabel = '🎲 Hasard';
                                            } else {
                                                stepLabel = tbStepInfo ? tbStepInfo.label : (tbLog.criterion || 'Inconnu');
                                                if (tbLog.type === 'sort' && tbLog.order) {
                                                    stepLabel += tbLog.order === 'asc' ? ' ▲' : ' ▼';
                                                }
                                            }

                                            return (
                                                <React.Fragment key={tbIndex}>
                                                    <div className="tie-breaker-step">
                                                        <div className="step-number">D-{tbIndex + 1}</div>
                                                        <div className="step-content">
                                                            <div className="step-title" style={{fontSize: '0.9em'}}>{stepLabel}</div>
                                                            <table className="algo-log-table" style={{marginTop: '5px'}}>
                                                                <tbody>{tbLog.candidates.map((c: any) => renderCandidateRow(c))}</tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                    {tbIndex < stepLog.tieBreakerLogs.length -1 && <div className="pipeline-connector" style={{height:'15px'}}>⬇</div>}
                                                </React.Fragment>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {(pipeline?.length > 0 && idx < pipeline.length -1) || pipelineKey.startsWith('algo') ? <div className="pipeline-connector">⬇</div> : null}
                </React.Fragment>
            );})}
        </>
    );
};


export const AlgoConfigView: React.FC<AlgoConfigViewProps> = ({ 
    currentState, 
    modifyState, 
    updateProposedGroups, 
    getParticipantColor,
    globalTemplates,
    onUpdateGlobalTemplates
}) => {
    const [viewMode, setViewMode] = useState<'main' | 'bonus'>('main');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [templateNameInput, setTemplateNameInput] = useState('');
    const [isEditingFavorites, setIsEditingFavorites] = useState(false);
    
    // UI states for buttons
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [loadSuccessId, setLoadSuccessId] = useState<string | null>(null);

    const logs = currentState.algoLogs?.[viewMode] || [];
    const finalSelection = (currentState.proposedGroups?.[viewMode] || []).filter((p:string) => !(currentState.excludedParticipants?.[viewMode]||[]).includes(p));
    
    const targetSize = viewMode === 'main' ? currentState.selectedMainSize : currentState.selectedBonusSize;
    const lockedCount = (currentState.lockedParticipants?.[viewMode] || []).length;
    const slotsToFill = Math.max(0, targetSize - lockedCount);
    
    // USE GLOBAL TEMPLATES IF AVAILABLE, FALLBACK TO LOCAL (Backward compatibility)
    const templates = globalTemplates || currentState.algoTemplates || [];

    // FAVORITE TEMPLATES IDs (from state, or default)
    const favoriteTemplates = currentState.favoriteTemplateIds || ['tpl_balanced', 'tpl_random', 'tpl_strict_rotation'];

    // Determine paths based on viewMode
    const algoPipelineKey = viewMode === 'main' ? 'algoPipelineMain' : 'algoPipelineBonus';
    const tieBreakerPipelineKey = viewMode === 'main' ? 'tieBreakerPipelineMain' : 'tieBreakerPipelineBonus';

    // Ensure state paths exist (migration safety)
    const currentAlgoPipeline = currentState[algoPipelineKey] || currentState.algoPipeline || [];
    const currentTieBreakerPipeline = currentState[tieBreakerPipelineKey] || currentState.tieBreakerPipeline || [];

    useEffect(() => {
        let t: any;
        if (loadSuccessId) {
            t = setTimeout(() => setLoadSuccessId(null), 1000);
        }
        return () => clearTimeout(t);
    }, [loadSuccessId]);

    const loadTemplate = (id: string) => {
        const tpl = templates.find((t: any) => t.id === id);
        if (tpl) {
            modifyState((s: any) => {
                // Apply ONLY to the current viewMode
                s[algoPipelineKey] = JSON.parse(JSON.stringify(tpl.algoPipeline));
                s[tieBreakerPipelineKey] = JSON.parse(JSON.stringify(tpl.tieBreakerPipeline));
                
                // NEW: Update active ID
                if (!s.activeAlgoTemplateIds) s.activeAlgoTemplateIds = {};
                s.activeAlgoTemplateIds[viewMode] = id;

                updateProposedGroups(s);
            });
            setLoadSuccessId(id);
        }
    };

    const saveTemplate = () => {
        if (!templateNameInput.trim()) return;
        
        const newTemplate = {
            id: `tpl_${Date.now()}`,
            name: templateNameInput,
            algoPipeline: JSON.parse(JSON.stringify(currentAlgoPipeline)),
            tieBreakerPipeline: JSON.parse(JSON.stringify(currentTieBreakerPipeline))
        };

        if (onUpdateGlobalTemplates && globalTemplates) {
             // Save to global storage
             const newTemplates = [...globalTemplates, newTemplate];
             onUpdateGlobalTemplates(newTemplates);
        } else {
             // Fallback local save (should not happen with new setup)
             modifyState((s: any) => {
                if (!s.algoTemplates) s.algoTemplates = [];
                s.algoTemplates.push(newTemplate);
            });
        }
        setTemplateNameInput('');
    };

    const handleDeleteClick = (id: string) => {
        if (confirmDeleteId === id) {
            // Confirmed
            if (onUpdateGlobalTemplates && globalTemplates) {
                 const newTemplates = globalTemplates.filter((t: any) => t.id !== id);
                 onUpdateGlobalTemplates(newTemplates);
            } else {
                 modifyState((s: any) => {
                    s.algoTemplates = s.algoTemplates.filter((t: any) => t.id !== id);
                 });
            }
             if (selectedTemplateId === id) setSelectedTemplateId('');
             setConfirmDeleteId(null);
        } else {
            // First click
            setConfirmDeleteId(id);
        }
    };

    return (
    <CollapsibleSection id="algo-config-section" title="Algorithme">
        
        {/* VIEW MODE TOGGLE */}
        <div style={{display:'flex', justifyContent:'center', marginBottom:'15px'}}>
            <div style={{display:'flex', backgroundColor:'var(--input-bg)', borderRadius:'20px', padding:'4px', border:'1px solid var(--border-color)'}}>
                <button 
                    onClick={() => setViewMode('main')}
                    style={{
                        backgroundColor: viewMode === 'main' ? 'var(--highlight-color)' : 'transparent',
                        color: viewMode === 'main' ? '#fff' : 'var(--text-color)',
                        border: 'none',
                        borderRadius: '16px',
                        padding: '6px 20px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                >
                    Groupe Main
                </button>
                <button 
                    onClick={() => setViewMode('bonus')}
                    style={{
                        backgroundColor: viewMode === 'bonus' ? 'var(--highlight-color)' : 'transparent',
                        color: viewMode === 'bonus' ? '#fff' : 'var(--text-color)',
                        border: 'none',
                        borderRadius: '16px',
                        padding: '6px 20px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                >
                    Groupe Bonus
                </button>
            </div>
        </div>

        {/* --- FAVORITE TEMPLATES (QUICK BUTTONS) --- */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'10px', marginBottom:'5px', padding:'0 5px'}}>
            <span style={{fontSize:'0.9em', opacity:0.7, fontWeight:'bold', textTransform:'uppercase'}}>Favoris</span>
            <button 
                onClick={() => setIsEditingFavorites(!isEditingFavorites)}
                title={isEditingFavorites ? "Terminer l'édition" : "Modifier les favoris"}
                style={{background:'none', border:'none', cursor:'pointer', opacity:0.8, fontSize:'1.1em', padding:'2px 6px'}}
            >
                {isEditingFavorites ? '✅' : '⚙️'}
            </button>
        </div>

        <div style={{marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'space-between'}}>
            {favoriteTemplates.map((favId: string, idx: number) => {
                if (isEditingFavorites) {
                     return (
                         <div key={idx} style={{flex: '1 0 30%', minWidth: '120px'}}>
                            <select 
                                value={favId}
                                onChange={(e) => {
                                    const newFavs = [...favoriteTemplates];
                                    newFavs[idx] = e.target.value;
                                    modifyState((s:any) => s.favoriteTemplateIds = newFavs);
                                }}
                                style={{width:'100%', padding:'8px', borderRadius:'8px', border:'1px solid var(--highlight-color)', background:'var(--input-bg)', color:'var(--text-color)'}}
                            >
                                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                         </div>
                     );
                } else {
                    const tpl = templates.find((t: any) => t.id === favId);
                    if (!tpl) return null;
                    const isSuccess = loadSuccessId === favId;
                    return (
                        <button 
                            key={favId}
                            onClick={() => loadTemplate(favId)}
                            style={{
                                flex: '1 0 30%',
                                minWidth: '120px',
                                padding: '12px 10px',
                                backgroundColor: isSuccess ? 'var(--success-color)' : 'rgba(255,255,255,0.08)',
                                border: isSuccess ? '1px solid var(--success-color)' : '1px solid var(--border-color)',
                                color: isSuccess ? '#ffffff' : 'var(--text-color)',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                fontSize: '0.95em',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                gap: '5px',
                                boxShadow: isSuccess ? '0 0 10px rgba(152,195,121,0.5)' : 'none'
                            }}
                        >
                            {tpl.name}
                            {isSuccess && <span style={{fontSize:'0.7em', fontWeight:'normal'}}>Chargé !</span>}
                        </button>
                    );
                }
            })}
        </div>

        {/* TEMPLATE MANAGER SECTION */}
        <div style={{marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
            <h4 style={{marginTop: 0, marginBottom: '10px', fontSize: '1em', color: 'var(--text-color)', opacity: 0.8, display:'flex', justifyContent:'space-between'}}>
                <span>Modèles</span>
            </h4>
            
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '15px'}}>
                <select 
                    value={selectedTemplateId} 
                    onChange={(e) => { setSelectedTemplateId(e.target.value); setConfirmDeleteId(null); }}
                    style={{flexGrow: 1, minWidth: '150px'}}
                >
                    <option value="">-- Choisir un modèle --</option>
                    {templates.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                
                <button 
                    onClick={() => loadTemplate(selectedTemplateId)} 
                    disabled={!selectedTemplateId}
                    style={{
                        backgroundColor: loadSuccessId === selectedTemplateId ? 'var(--success-color)' : 'var(--button-bg)',
                        color: loadSuccessId === selectedTemplateId ? '#ffffff' : 'var(--text-color)',
                        transition: 'background-color 0.3s'
                    }}
                >
                    {loadSuccessId === selectedTemplateId ? 'Chargé !' : 'Charger'}
                </button>

                <button 
                    onClick={() => handleDeleteClick(selectedTemplateId)} 
                    disabled={!selectedTemplateId}
                    style={{
                        backgroundColor: confirmDeleteId === selectedTemplateId ? 'var(--error-color)' : 'rgba(224, 108, 117, 0.2)', 
                        color: confirmDeleteId === selectedTemplateId ? '#fff' : 'var(--error-color)', 
                        border: '1px solid var(--error-color)',
                        minWidth: '100px'
                    }}
                >
                    {confirmDeleteId === selectedTemplateId ? 'Sûr ?' : 'Supprimer'}
                </button>
            </div>

            <div style={{display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '15px'}}>
                <input 
                    type="text" 
                    placeholder={`Sauvegarder config actuelle (${viewMode})...`} 
                    value={templateNameInput} 
                    onChange={e => setTemplateNameInput(e.target.value)}
                    style={{flexGrow: 1}}
                />
                <button onClick={saveTemplate} disabled={!templateNameInput.trim()}>Enregistrer</button>
            </div>
        </div>
        
        <div className="algo-target-size">
            Objectif ({viewMode === 'main' ? 'Main' : 'Bonus'}) : <strong>{slotsToFill}</strong> / {targetSize}
        </div>

        <div className="algo-toolbar">
            <button onClick={() => modifyState((s:any) => {
                if(!s[algoPipelineKey]) s[algoPipelineKey] = [];
                s[algoPipelineKey].push({ id: `step-${Date.now()}`, type: 'sort', criterion: 'sessionParticipation', order: 'asc', label: 'Trier par Critère', limit: undefined, limitType: 'count', minLimit: undefined, minLimitType: 'count' });
                updateProposedGroups(s);
            })}>+ Ajouter Tri (Principal)</button>
            <button onClick={() => modifyState((s:any) => {
                if(!s[algoPipelineKey]) s[algoPipelineKey] = [];
                s[algoPipelineKey].push({ id: `step-${Date.now()}`, type: 'shuffle', label: 'Mélanger', limit: undefined, limitType: 'count', minLimit: undefined, minLimitType: 'count' });
                updateProposedGroups(s);
            })}>+ Ajouter Mélange (Principal)</button>
        </div>

        <div id="algo-builder-container">
            <div className="algo-pipeline-step fixed-step">
                <div className="step-number">1</div>
                <div className="step-content">
                    <div className="step-title">Filtrage Initial</div>
                    <div className="step-desc">
                        {viewMode === 'main' ? "Retire absents & exclus." : "Retire absents, exclus & déjà pris dans Main."}
                    </div>
                </div>
            </div>
            <div className="pipeline-connector">⬇</div>

            <div className="algo-pipeline-step fixed-step">
                <div className="step-number">2</div>
                <div className="step-content">
                    <div className="step-title">Intégrer Verrouillés</div>
                    <div className="step-desc">Les participants verrouillés sont validés d'office.</div>
                </div>
            </div>

            <AlgoPipelineEditor 
                pipeline={currentAlgoPipeline}
                pipelineKey={algoPipelineKey}
                stepNumberOffset={2}
                modifyState={modifyState}
                updateProposedGroups={updateProposedGroups}
                logs={logs}
                getParticipantColor={getParticipantColor}
            />

            <div className="algo-pipeline-step fixed-step">
                <div className="step-number">{(currentAlgoPipeline?.length || 0) + 3}</div>
                <div className="step-content">
                    <div className="step-title">Résultat Final ({viewMode})</div>
                    <div className="step-desc">Participants sélectionnés affichés.</div>
                    <div className="algo-step-details">
                        <div style={{display:'flex', flexWrap:'wrap', gap:'4px', marginTop:'4px'}}>
                            {finalSelection.map((p: string) => (
                                <span key={p} className="candidate-badge" style={{backgroundColor: getParticipantColor(p)}}>{p}</span>
                            ))}
                            {finalSelection.length === 0 && <span style={{opacity:0.6}}>Aucun sélectionné</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '2px solid var(--border-color)'}}>
            <h4 style={{textAlign: 'center', marginBottom: '10px', fontSize: '1.2em'}}>
                Départage <span style={{fontSize: '0.8em', opacity: 0.7}}>(Min. garanti)</span>
            </h4>
            <p style={{fontSize: '0.9em', opacity: 0.8, marginBottom: '15px', textAlign: 'center'}}>
                Utilisé en cas d'égalité sur un quota minimum.
            </p>
            <div className="algo-toolbar">
                 <button onClick={() => modifyState((s:any) => {
                    const pipelineCopy = JSON.parse(JSON.stringify(s[algoPipelineKey] || []));
                    pipelineCopy.forEach((step: any) => {
                        step.id = `tb-copy-${step.id}-${Math.random().toString(36).substr(2, 9)}`;
                    });
                    s[tieBreakerPipelineKey] = pipelineCopy;
                    updateProposedGroups(s);
                })}>Copier le Pipeline Principal</button>
                <button onClick={() => modifyState((s:any) => {
                    if(!s[tieBreakerPipelineKey]) s[tieBreakerPipelineKey] = [];
                    s[tieBreakerPipelineKey].push({ id: `tb-step-${Date.now()}`, type: 'sort', criterion: 'cooccurrence', order: 'asc', label: 'Trier par Critère', limit: undefined, limitType: 'count', minLimit: undefined, minLimitType: 'count' });
                    updateProposedGroups(s);
                })}>+ Ajouter Tri (Départage)</button>
                <button onClick={() => modifyState((s:any) => {
                    if(!s[tieBreakerPipelineKey]) s[tieBreakerPipelineKey] = [];
                    s[tieBreakerPipelineKey].push({ id: `tb-step-${Date.now()}`, type: 'shuffle', label: 'Mélanger', limit: undefined, limitType: 'count', minLimit: undefined, minLimitType: 'count' });
                    updateProposedGroups(s);
                })}>+ Ajouter Mélange (Départage)</button>
            </div>
             <div id="tiebreaker-algo-builder-container">
                <AlgoPipelineEditor 
                    pipeline={currentTieBreakerPipeline}
                    pipelineKey={tieBreakerPipelineKey}
                    modifyState={modifyState}
                    updateProposedGroups={updateProposedGroups}
                    logs={[]}
                    getParticipantColor={getParticipantColor}
                />
             </div>
        </div>
    </CollapsibleSection>
    );
};
