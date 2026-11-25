import React, { useState } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { HistoryEntry } from './HistoryEntry';
import {
    MAIN_GROUP_SIZE_OPTIONS,
    BONUS_GROUP_SIZE_OPTIONS
} from '../config/constants';
import {
    STOPWATCH_PROGRESS_DURATION,
    LONG_STOPWATCH_PROGRESS_DURATION,
    formatTime,
    getProgressColor,
    getLongProgressColor
} from '../utils/helpers';
import { calculateCumulativeCoocWithLocked } from '../services/GroupGenerator';

export interface AtelierViewProps {
    currentState: any;
    activeParticipants: string[];
    isEditingParticipantNamesMode: boolean;
    setIsEditingParticipantNamesMode: (mode: boolean) => void;
    setEditSingleParticipantState: (state: any) => void;
    modifyState: (updater: (state: any) => void) => void;
    updateProposedGroups: (s: any) => void;
    getParticipantColor: (name: string) => string;
    setDraggedItem: (item: any) => void;
    draggedItem: any;
    setActiveMainTab: (tab: any) => void;
    isGeneratingGroups: boolean;
    globalAlgoTemplates: any[];
    showMessage: (text: string, type?: 'info' | 'error' | 'success') => void;
    timers: any;
    toggleTimer: (key: string) => void;
    resetTimer: (key: string) => void;
    getTimerValue: (key: string) => number;
    handleConfirmGroup: () => void;
    sessionMarkerColorMap: Map<string, string>;
    uniqueMarkerCountRef: React.MutableRefObject<number>;
    setEditHistoryState: (state: any) => void;
    confirmAction: (message: string, options?: any) => Promise<any>;
}

export const AtelierView: React.FC<AtelierViewProps> = ({
    currentState,
    activeParticipants,
    isEditingParticipantNamesMode,
    setIsEditingParticipantNamesMode,
    setEditSingleParticipantState,
    modifyState,
    updateProposedGroups,
    getParticipantColor,
    setDraggedItem,
    draggedItem,
    setActiveMainTab,
    isGeneratingGroups,
    globalAlgoTemplates,
    showMessage,
    timers,
    toggleTimer,
    resetTimer,
    getTimerValue,
    handleConfirmGroup,
    sessionMarkerColorMap,
    uniqueMarkerCountRef,
    setEditHistoryState,
    confirmAction
}) => {
    const [dragOverArea, setDragOverArea] = useState<string | null>(null);

    const handleDrop = (e: React.DragEvent, targetType: string) => {
        e.preventDefault();
        const data = draggedItem;
        if (!data) return;
        if (data.type === 'participant') {
            const name = data.payload;
            modifyState((s) => {
                if (!s.lockedParticipants) s.lockedParticipants = { main: [], bonus: [] };
                if (!s.excludedParticipants) s.excludedParticipants = { main: [], bonus: [] };

                const lM = s.lockedParticipants.main;
                const lB = s.lockedParticipants.bonus;

                if (targetType === 'absents') {
                    // Glisser vers la zone Absents
                    s.presence[name] = false;

                    const wasInMain = (s.proposedGroups?.main || []).includes(name);
                    const wasInBonus = (s.proposedGroups?.bonus || []).includes(name);

                    s.lockedParticipants.main = lM.filter((p: string) => p !== name);
                    s.lockedParticipants.bonus = lB.filter((p: string) => p !== name);
                    s.excludedParticipants.main = (s.excludedParticipants.main || []).filter((p: string) => p !== name);
                    s.excludedParticipants.bonus = (s.excludedParticipants.bonus || []).filter((p: string) => p !== name);

                    if (wasInMain && s.selectedMainSize > 0) {
                        s.selectedMainSize = Math.max(0, s.selectedMainSize - 1);
                    }
                    if (wasInBonus && s.selectedBonusSize > 0) {
                        s.selectedBonusSize = Math.max(0, s.selectedBonusSize - 1);
                    }
                } else if (targetType === 'main') {
                    // Si on glisse vers Main, le participant redevient présent
                    s.presence[name] = true;

                    // 1. On le retire de Bonus s'il y était (lock ou proposé)
                    s.lockedParticipants.bonus = lB.filter((p: string) => p !== name);
                    s.excludedParticipants.bonus = (s.excludedParticipants.bonus || []).filter((p: string) => p !== name);
                    // 2. On le retire des exclus de Main
                    s.excludedParticipants.main = (s.excludedParticipants.main || []).filter((p: string) => p !== name);
                    // 3. S'il n'était pas déjà verrouillé dans Main, on le verrouille et incrémente la taille voulue
                    if (!lM.includes(name)) {
                        s.lockedParticipants.main.push(name);
                        const wasInMain = (s.proposedGroups?.main || []).includes(name);
                        if (!wasInMain || s.selectedMainSize < s.lockedParticipants.main.length) {
                            s.selectedMainSize = Math.max(s.selectedMainSize + 1, s.lockedParticipants.main.length);
                        }
                    }
                } else if (targetType === 'bonus') {
                    // Si on glisse vers Bonus, le participant redevient présent
                    s.presence[name] = true;

                    // 1. On le retire de Main s'il y était (lock ou proposé)
                    s.lockedParticipants.main = lM.filter((p: string) => p !== name);
                    s.excludedParticipants.main = (s.excludedParticipants.main || []).filter((p: string) => p !== name);
                    // 2. On le retire des exclus de Bonus
                    s.excludedParticipants.bonus = (s.excludedParticipants.bonus || []).filter((p: string) => p !== name);
                    // 3. S'il n'était pas déjà verrouillé dans Bonus, on le verrouille et incrémente la taille voulue
                    if (!lB.includes(name)) {
                        s.lockedParticipants.bonus.push(name);
                        const wasInBonus = (s.proposedGroups?.bonus || []).includes(name);
                        if (!wasInBonus || s.selectedBonusSize < s.lockedParticipants.bonus.length) {
                            s.selectedBonusSize = Math.max(s.selectedBonusSize + 1, s.lockedParticipants.bonus.length);
                        }
                    }
                } else if (targetType === 'unselected') {
                    // Si on glisse vers la zone Non Sélectionnés, il redevient présent
                    s.presence[name] = true;

                    const wasInMain = (s.proposedGroups?.main || []).includes(name);
                    const wasInBonus = (s.proposedGroups?.bonus || []).includes(name);

                    // Si le participant venait de Main, on le retire de Main et on l'exclut uniquement de Main
                    if (wasInMain) {
                        s.lockedParticipants.main = lM.filter((p: string) => p !== name);
                        if (!s.excludedParticipants.main.includes(name)) {
                            s.excludedParticipants.main.push(name);
                        }
                        if (s.selectedMainSize > 0) {
                            s.selectedMainSize = Math.max(0, s.selectedMainSize - 1);
                        }
                    }

                    // Si le participant venait de Bonus, on le retire de Bonus et on l'exclut uniquement de Bonus
                    if (wasInBonus) {
                        s.lockedParticipants.bonus = lB.filter((p: string) => p !== name);
                        if (!s.excludedParticipants.bonus.includes(name)) {
                            s.excludedParticipants.bonus.push(name);
                        }
                        if (s.selectedBonusSize > 0) {
                            s.selectedBonusSize = Math.max(0, s.selectedBonusSize - 1);
                        }
                    }
                }

                updateProposedGroups(s);
            });
        }
        setDraggedItem(null);
        setDragOverArea(null);
    };

    const handleLockToggle = (p: string, type: 'main' | 'bonus') => {
        modifyState((s) => {
            if (!s.excludedParticipants) s.excludedParticipants = { main: [], bonus: [] };

            const lockedList = s.lockedParticipants[type];
            const excludedList = s.excludedParticipants[type] || [];
            const isLocked = lockedList.includes(p);
            const isExcluded = excludedList.includes(p);

            if (!isLocked && !isExcluded) {
                const maxSize = type === 'main' ? s.selectedMainSize : s.selectedBonusSize;
                const otherType = type === 'main' ? 'bonus' : 'main';

                if (lockedList.length < maxSize) {
                    s.lockedParticipants[type].push(p);
                    s.lockedParticipants[otherType] = s.lockedParticipants[otherType].filter((x: string) => x !== p);
                } else {
                    showMessage(`Taille max atteinte pour ${type}`, 'error');
                }
            } else if (isLocked && !isExcluded) {
                s.lockedParticipants[type] = lockedList.filter((x: string) => x !== p);
                s.excludedParticipants[type].push(p);
            } else if (isExcluded) {
                s.excludedParticipants[type] = excludedList.filter((x: string) => x !== p);
            }

            updateProposedGroups(s);
        });
    };

    const getStatDisplay = (val: number, min: number, max: number) => {
        let style: React.CSSProperties = { fontWeight: 'bold' };
        if (val === min && min !== max)
            style = {
                ...style,
                textDecoration: 'underline',
                textDecorationColor: 'var(--highlight-color)',
                textDecorationThickness: '2px'
            };
        else if (val === max && min !== max)
            style = {
                ...style,
                textDecoration: 'underline',
                textDecorationColor: 'var(--error-color)',
                textDecorationThickness: '2px'
            };
        return <span style={style}>{val}</span>;
    };

    // Global stats for badge highlights
    const presentList = activeParticipants.filter((p) => currentState.presence[p]);
    const absentParticipants = activeParticipants.filter((p) => !currentState.presence[p]);
    const countPresent = presentList.length;
    const countExcludedMain = (currentState.excludedParticipants?.main || []).filter((p: string) =>
        currentState.presence[p]
    ).length;
    const maxMain = Math.max(0, countPresent - countExcludedMain);
    const countExcludedBonus = (currentState.excludedParticipants?.bonus || []).filter((p: string) =>
        currentState.presence[p]
    ).length;
    const maxBonus = Math.max(0, countPresent - countExcludedBonus - currentState.selectedMainSize);

    let globalMinSM = Infinity,
        globalMaxSM = 0,
        globalMinSB = Infinity,
        globalMaxSB = 0;
    activeParticipants.forEach((p: string) => {
        const stats = currentState.stats.participations[p];
        if (stats) {
            globalMinSM = Math.min(globalMinSM, stats.sessionMain);
            globalMaxSM = Math.max(globalMaxSM, stats.sessionMain);
            globalMinSB = Math.min(globalMinSB, stats.sessionBonus);
            globalMaxSB = Math.max(globalMaxSB, stats.sessionBonus);
        }
    });
    if (globalMinSM === Infinity) globalMinSM = 0;
    if (globalMinSB === Infinity) globalMinSB = 0;
    globalMaxSM = Math.max(globalMinSM + 1, globalMaxSM);
    globalMaxSB = Math.max(globalMinSB + 1, globalMaxSB);

    const templates = globalAlgoTemplates || [];

    const progTargetUrl = (currentState.progUrl || '').trim() || (currentState.progEmbedCode?.match(/src=["'](.*?)["']/)?.[1] || '').trim();

    const handleOpenProg = () => {
        let url = progTargetUrl;
        if (!url) {
            showMessage('Lien Prog non défini', 'info');
            return;
        }
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            {/* CHRONOS WARMUP & PLATEAU & BOUTON PROG */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', width: '100%', alignItems: 'center' }}>
                {/* Warmup */}
                <div className="stopwatch-container" style={{ flex: 1, margin: 0, padding: '2px 8px', minHeight: '24px' }}>
                    <div
                        className="stopwatch-progress"
                        id="stopwatch-progress-warmup"
                        style={{
                            width: `${Math.min(100, (getTimerValue('warmup') / STOPWATCH_PROGRESS_DURATION) * 100)}%`,
                            backgroundColor: getProgressColor(getTimerValue('warmup'))
                        }}
                    ></div>
                    <span className="stopwatch-title" style={{ fontSize: '0.75em', minWidth: 'auto' }}>
                        Warmup 🟨
                    </span>
                    <div
                        className={`stopwatch-display ${
                            getTimerValue('warmup') >= STOPWATCH_PROGRESS_DURATION ? 'blinking' : ''
                        }`}
                        id="stopwatch-display-warmup"
                        style={{ fontSize: '1em', padding: '1px 4px', minWidth: 'auto' }}
                    >
                        {formatTime(getTimerValue('warmup'))}
                    </div>
                    <div className="stopwatch-controls" style={{ gap: '2px' }}>
                        <button
                            id="stopwatch-toggle-warmup"
                            onClick={() => toggleTimer('warmup')}
                            className={timers.warmup.running ? 'running' : ''}
                            style={{ height: '22px', minWidth: '24px', fontSize: '0.9em', padding: '0 4px' }}
                        >
                            {timers.warmup.running ? '❚❚' : '▶'}
                        </button>
                        <button
                            id="stopwatch-reset-warmup"
                            onClick={() => resetTimer('warmup')}
                            style={{ height: '22px', minWidth: '24px', fontSize: '0.9em', padding: '0 4px' }}
                        >
                            ↺
                        </button>
                        <button
                            id="stopwatch-validate-warmup"
                            disabled={!timers.warmup.running && getTimerValue('warmup') === 0}
                            onClick={() => {
                                const d = getTimerValue('warmup');
                                if (d > 0)
                                    modifyState((s) =>
                                        s.warmupHistory.push({ timestamp: Date.now(), durationMs: d })
                                    );
                                resetTimer('warmup');
                            }}
                            style={{ height: '22px', minWidth: '24px', fontSize: '0.9em', padding: '0 4px' }}
                        >
                            ✓
                        </button>
                    </div>
                </div>

                {/* Plateau */}
                <div className="stopwatch-container" style={{ flex: 1, margin: 0, padding: '2px 8px', minHeight: '24px' }}>
                    <div
                        className="stopwatch-progress"
                        id="stopwatch-progress-plateau"
                        style={{
                            width: `${Math.min(100, (getTimerValue('plateau') / LONG_STOPWATCH_PROGRESS_DURATION) * 100)}%`,
                            backgroundColor: getLongProgressColor(getTimerValue('plateau'))
                        }}
                    ></div>
                    <span className="stopwatch-title" style={{ fontSize: '0.75em', minWidth: 'auto' }}>
                        Plateau 🟫
                    </span>
                    <div
                        className={`stopwatch-display ${
                            getTimerValue('plateau') >= LONG_STOPWATCH_PROGRESS_DURATION ? 'blinking' : ''
                        }`}
                        id="stopwatch-display-plateau"
                        style={{ fontSize: '1em', padding: '1px 4px', minWidth: 'auto' }}
                    >
                        {formatTime(getTimerValue('plateau'))}
                    </div>
                    <div className="stopwatch-controls" style={{ gap: '2px' }}>
                        <button
                            id="stopwatch-toggle-plateau"
                            onClick={() => toggleTimer('plateau')}
                            className={timers.plateau.running ? 'running' : ''}
                            style={{ height: '22px', minWidth: '24px', fontSize: '0.9em', padding: '0 4px' }}
                        >
                            {timers.plateau.running ? '❚❚' : '▶'}
                        </button>
                        <button
                            id="stopwatch-reset-plateau"
                            onClick={() => resetTimer('plateau')}
                            style={{ height: '22px', minWidth: '24px', fontSize: '0.9em', padding: '0 4px' }}
                        >
                            ↺
                        </button>
                        <button
                            id="stopwatch-validate-plateau"
                            disabled={!timers.plateau.running && getTimerValue('plateau') === 0}
                            onClick={() => {
                                const d = getTimerValue('plateau');
                                if (d > 0)
                                    modifyState((s) =>
                                        s.plateauHistory.push({ timestamp: Date.now(), durationMs: d })
                                    );
                                resetTimer('plateau');
                            }}
                            style={{ height: '22px', minWidth: '24px', fontSize: '0.9em', padding: '0 4px' }}
                        >
                            ✓
                        </button>
                    </div>
                </div>

                {/* Bouton Prog */}
                <button
                    id="atelier-prog-btn"
                    type="button"
                    onClick={handleOpenProg}
                    title={progTargetUrl ? `Ouvrir : ${progTargetUrl}` : 'Lien Prog (configurer dans Outils & Config)'}
                    style={{
                        backgroundColor: 'var(--button-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-color)',
                        borderRadius: '4px',
                        padding: '2px 12px',
                        minHeight: '26px',
                        fontSize: '0.85em',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--button-hover-bg)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                        e.currentTarget.style.color = 'var(--text-color)';
                    }}
                >
                    Prog
                </button>
            </div>

            {/* GESTION & GÉNÉRATION DES GROUPES */}
            <CollapsibleSection id="generation-controls-section" title="Génération des Groupes">
                <div id="generation-controls">
                    {isGeneratingGroups && <div id="generation-loader" style={{ display: 'flex' }}></div>}

                    {/* Header compact: Compteurs Présents/Absents + Navigation Exercice */}
                    <div className="flex items-center justify-between gap-3 mb-2 px-1 text-xs">
                        <div className="flex items-center gap-3 font-semibold">
                            <span style={{ color: '#98c379' }}>Présents: {presentList.length}</span>
                            <span style={{ color: '#e06c75' }}>Absents: {absentParticipants.length}</span>
                        </div>

                        {/* Navigation Exercice */}
                        <div className="flex items-center gap-1.5 ml-auto text-sm font-semibold bg-black/20 px-2 py-0.5 rounded border border-white/10">
                            <button
                                type="button"
                                title="Exercice précédent"
                                disabled={(currentState.currentExercise || 1) <= 1}
                                onClick={() => {
                                    modifyState((s) => {
                                        s.currentExercise = Math.max(1, (s.currentExercise || 1) - 1);
                                        updateProposedGroups(s);
                                    });
                                }}
                                className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded cursor-pointer transition text-xs"
                            >
                                ◀
                            </button>
                            <span className="text-white whitespace-nowrap px-1">
                                Exo : {currentState.currentExercise || 1}
                            </span>
                            <button
                                type="button"
                                title="Exercice suivant"
                                onClick={() => {
                                    modifyState((s) => {
                                        s.currentExercise = (s.currentExercise || 1) + 1;
                                        updateProposedGroups(s);
                                    });
                                }}
                                className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded cursor-pointer transition text-xs"
                            >
                                ▶
                            </button>
                        </div>
                    </div>

                    {/* Boîtes centralisées : Non sélectionnés et Absents */}
                    {(() => {
                        const proposedMain = currentState.proposedGroups.main || [];
                        const proposedBonus = currentState.proposedGroups.bonus || [];
                        const unselectedParticipants = presentList.filter(
                            (p: string) => !proposedMain.includes(p) && !proposedBonus.includes(p)
                        );

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                {/* Boîte Non sélectionnés */}
                                <div
                                    id="unselected-participants-box"
                                    className={`bg-black/20 border ${dragOverArea === 'unselected' ? 'border-[var(--highlight-color)] bg-blue-500/10' : 'border-dashed border-white/20'} rounded p-2 transition-colors flex flex-col min-h-[75px]`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                    }}
                                    onDragEnter={(e) => {
                                        e.preventDefault();
                                        setDragOverArea('unselected');
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                            setDragOverArea(null);
                                        }
                                    }}
                                    onDrop={(e) => {
                                        setDragOverArea(null);
                                        handleDrop(e, 'unselected');
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                                            Non sélectionnés ({unselectedParticipants.length})
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            Glisser vers Main/Bonus ou Absents
                                        </span>
                                    </div>
                                    <div className="participants-drop-zone flex-grow">
                                        {unselectedParticipants.length === 0 ? (
                                            <span className="text-xs text-gray-500 italic py-2 px-1">
                                                Aucun participant disponible
                                            </span>
                                        ) : (
                                            unselectedParticipants.map((p: string) => {
                                                const isExcludedMain = (currentState.excludedParticipants?.main || []).includes(p);
                                                const isExcludedBonus = (currentState.excludedParticipants?.bonus || []).includes(p);
                                                const isExcludedAny = isExcludedMain || isExcludedBonus;
                                                const pStats = currentState.stats?.participations?.[p];
                                                const em = pStats?.exerciseMain || 0;
                                                const sm = pStats?.sessionMain || 0;
                                                const sb = pStats?.sessionBonus || 0;
                                                const hasNotDoneExercise = em === 0;

                                                return (
                                                    <div
                                                        key={p}
                                                        draggable={true}
                                                        onDragStart={(e) => {
                                                            e.stopPropagation();
                                                            setDraggedItem({ type: 'participant', payload: p });
                                                        }}
                                                        onDoubleClick={() => {
                                                            setEditSingleParticipantState({
                                                                isOpen: true,
                                                                originalName: p,
                                                                newName: p,
                                                                newColor: getParticipantColor(p)
                                                            });
                                                        }}
                                                        className={`participant-gen-badge ${isExcludedAny ? 'excluded' : ''}`}
                                                        style={{
                                                            backgroundColor: getParticipantColor(p),
                                                            border: hasNotDoneExercise ? '2px solid #ffffff' : '2px solid transparent'
                                                        }}
                                                        title={`${p} (Glisser vers Main, Bonus ou Absents)`}
                                                    >
                                                        <div className="badge-top-row">
                                                            <span className={`badge-name ${isExcludedAny ? 'line-through opacity-70' : ''}`}>{p}</span>
                                                            {isExcludedAny && <span style={{ fontSize: '9px' }}>🚫</span>}
                                                        </div>
                                                        <div className="badge-stats-row">
                                                            <span className="badge-stat-item"><span className="badge-stat-label">E:</span><strong className="badge-stat-num">{em}</strong></span>
                                                            <span className="badge-stat-item"><span className="badge-stat-label">S:</span><strong className="badge-stat-num">{sm}</strong></span>
                                                            <span className="badge-stat-item"><span className="badge-stat-label">B:</span><strong className="badge-stat-num">{sb}</strong></span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Boîte Absents */}
                                <div
                                    id="absent-participants-box"
                                    className={`bg-black/20 border ${dragOverArea === 'absents' ? 'border-red-400 bg-red-500/10' : 'border-dashed border-white/20'} rounded p-2 transition-colors flex flex-col min-h-[75px]`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                    }}
                                    onDragEnter={(e) => {
                                        e.preventDefault();
                                        setDragOverArea('absents');
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                            setDragOverArea(null);
                                        }
                                    }}
                                    onDrop={(e) => {
                                        setDragOverArea(null);
                                        handleDrop(e, 'absents');
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                                        <span className="text-xs font-bold text-red-300 uppercase tracking-wider">
                                            Absents ({absentParticipants.length})
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            Glisser ici pour marquer absent
                                        </span>
                                    </div>
                                    <div className="participants-drop-zone flex-grow">
                                        {absentParticipants.length === 0 ? (
                                            <span className="text-xs text-gray-500 italic py-2 px-1">
                                                Aucun absent
                                            </span>
                                        ) : (
                                            absentParticipants.map((p: string) => {
                                                const pStats = currentState.stats?.participations?.[p];
                                                const em = pStats?.exerciseMain || 0;
                                                const sm = pStats?.sessionMain || 0;
                                                const sb = pStats?.sessionBonus || 0;

                                                return (
                                                    <div
                                                        key={p}
                                                        draggable={true}
                                                        onDragStart={(e) => {
                                                            e.stopPropagation();
                                                            setDraggedItem({ type: 'participant', payload: p });
                                                        }}
                                                        onClick={() => {
                                                            modifyState((s) => {
                                                                s.presence[p] = true;
                                                                updateProposedGroups(s);
                                                            });
                                                        }}
                                                        onDoubleClick={() => {
                                                            setEditSingleParticipantState({
                                                                isOpen: true,
                                                                originalName: p,
                                                                newName: p,
                                                                newColor: getParticipantColor(p)
                                                            });
                                                        }}
                                                        className="participant-gen-badge absent"
                                                        style={{
                                                            borderBottomColor: getParticipantColor(p)
                                                        }}
                                                        title={`${p} (Absent - Cliquer pour rendre présent ou glisser)`}
                                                    >
                                                        <div className="badge-top-row">
                                                            <span className="badge-name">{p}</span>
                                                        </div>
                                                        <div className="badge-stats-row">
                                                            <span className="badge-stat-item"><span className="badge-stat-label">E:</span><strong className="badge-stat-num">{em}</strong></span>
                                                            <span className="badge-stat-item"><span className="badge-stat-label">S:</span><strong className="badge-stat-num">{sm}</strong></span>
                                                            <span className="badge-stat-item"><span className="badge-stat-label">B:</span><strong className="badge-stat-num">{sb}</strong></span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div id="proposed-groups">
                        {(['main', 'bonus'] as const).map((type) => {
                            const isMain = type === 'main';
                            const currentSize = isMain ? currentState.selectedMainSize : currentState.selectedBonusSize;
                            const sizeOptions = isMain ? MAIN_GROUP_SIZE_OPTIONS : BONUS_GROUP_SIZE_OPTIONS;
                            const maxVal = isMain ? maxMain : maxBonus;
                            const currentLocked = isMain ? currentState.lockedParticipants.main : currentState.lockedParticipants.bonus;
                            const label = isMain ? 'Main :' : 'Bonus :';
                            const favoriteIds = currentState.favoriteTemplateIds || [];

                            return (
                                <div key={type} className="generation-group-column">
                                    <div className="size-selector-container">
                                        <label>{label}</label>
                                        <div
                                            className="quick-fav-buttons"
                                            style={{
                                                display: 'flex',
                                                gap: '2px',
                                                marginLeft: '2px',
                                                flexShrink: 1,
                                                minWidth: 0
                                            }}
                                        >
                                            {favoriteIds.map((favId: string) => {
                                                const tpl = templates.find((t: any) => t.id === favId);
                                                if (!tpl) return null;
                                                const isActive = currentState.activeAlgoTemplateIds?.[type] === favId;
                                                return (
                                                    <button
                                                        key={favId}
                                                        className={`quick-algo-btn ${isActive ? 'active' : ''}`}
                                                        title={tpl.name}
                                                        onClick={() => {
                                                            modifyState((s: any) => {
                                                                const algoKey = isMain ? 'algoPipelineMain' : 'algoPipelineBonus';
                                                                const tbKey = isMain ? 'tieBreakerPipelineMain' : 'tieBreakerPipelineBonus';
                                                                s[algoKey] = JSON.parse(JSON.stringify(tpl.algoPipeline));
                                                                s[tbKey] = JSON.parse(JSON.stringify(tpl.tieBreakerPipeline));
                                                                if (!s.activeAlgoTemplateIds) s.activeAlgoTemplateIds = {};
                                                                s.activeAlgoTemplateIds[type] = favId;
                                                                updateProposedGroups(s);
                                                            });
                                                            showMessage(`Algo ${isMain ? 'Main' : 'Bonus'} : "${tpl.name}" appliqué`, 'success');
                                                        }}
                                                    >
                                                        {tpl.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <select
                                            className="compact-algo-selector"
                                            value={currentState.activeAlgoTemplateIds?.[type] || ''}
                                            onChange={(e) => {
                                                const tplId = e.target.value;
                                                const tpl = templates.find((t: any) => t.id === tplId);
                                                if (tpl) {
                                                    modifyState((s: any) => {
                                                        const algoKey = isMain ? 'algoPipelineMain' : 'algoPipelineBonus';
                                                        const tbKey = isMain ? 'tieBreakerPipelineMain' : 'tieBreakerPipelineBonus';
                                                        s[algoKey] = JSON.parse(JSON.stringify(tpl.algoPipeline));
                                                        s[tbKey] = JSON.parse(JSON.stringify(tpl.tieBreakerPipeline));
                                                        if (!s.activeAlgoTemplateIds) s.activeAlgoTemplateIds = {};
                                                        s.activeAlgoTemplateIds[type] = tplId;
                                                        updateProposedGroups(s);
                                                    });
                                                    showMessage(`Algo ${isMain ? 'Main' : 'Bonus'} : "${tpl.name}" appliqué`, 'success');
                                                }
                                            }}
                                            title={`Changer l'algorithme pour ${isMain ? 'Main' : 'Bonus'}`}
                                        >
                                            <option value="" disabled>
                                                ⚡ Algo...
                                            </option>
                                            {(templates || []).map((t: any) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="size-selector-buttons">
                                            {sizeOptions.map((i: number) => (
                                                <button
                                                    key={i}
                                                    className={currentSize === i ? (isMain ? 'selected-main' : 'selected-bonus') : ''}
                                                    onClick={() =>
                                                        modifyState((s) => {
                                                            if (isMain) {
                                                                s.selectedMainSize = i;
                                                                const currPresent = s.participantsList.filter((p: any) => s.presence[p]).length;
                                                                const currExclBonus = (s.excludedParticipants?.bonus || []).filter(
                                                                    (p: string) => s.presence[p]
                                                                ).length;
                                                                const newMaxBonus = Math.max(0, currPresent - currExclBonus - i);
                                                                if (s.selectedBonusSize > newMaxBonus) s.selectedBonusSize = newMaxBonus;
                                                            } else {
                                                                s.selectedBonusSize = i;
                                                            }
                                                            updateProposedGroups(s);
                                                        })
                                                    }
                                                    disabled={i < currentLocked.length || i > maxVal}
                                                >
                                                    {i}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <fieldset
                                        id={`proposed-${type}-container`}
                                        className={dragOverArea === type ? 'drag-over' : ''}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                        }}
                                        onDragEnter={(e) => {
                                            e.preventDefault();
                                            setDragOverArea(type);
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                setDragOverArea(null);
                                            }
                                        }}
                                        onDrop={(e) => {
                                            setDragOverArea(null);
                                            handleDrop(e, type);
                                        }}
                                    >
                                        <legend>{type === 'main' ? 'Main' : 'Bonus'}</legend>
                                        <ul id={`proposed-${type}-list`} className="drop-target" data-group-type={type}>
                                            {(currentState.proposedGroups[type] || []).map((p: string) => {
                                                const isLocked = currentState.lockedParticipants[type].includes(p);
                                                const isExcluded = (currentState.excludedParticipants?.[type] || []).includes(p);
                                                const stats = currentState.stats.participations[p];
                                                const sm = stats ? stats.sessionMain : 0;
                                                const sb = stats ? stats.sessionBonus : 0;
                                                const em = stats ? stats.exerciseMain || 0 : 0;
                                                const hasNotDoneExercise = em === 0;

                                                return (
                                                    <div
                                                        key={p}
                                                        className={`participant-gen-badge ${isLocked ? 'locked' : ''} ${isExcluded ? 'excluded' : ''}`}
                                                        style={{
                                                            backgroundColor: getParticipantColor(p),
                                                            border: hasNotDoneExercise ? '2px solid #ffffff' : '2px solid transparent'
                                                        }}
                                                        draggable={true}
                                                        onDragStart={(e) => {
                                                            e.stopPropagation();
                                                            setDraggedItem({ type: 'participant', payload: p });
                                                        }}
                                                        onClick={() => handleLockToggle(p, type)}
                                                        title={
                                                            isExcluded
                                                                ? 'Participant Exclu (Cliquer pour rétablir)'
                                                                : isLocked
                                                                ? 'Participant Verrouillé (Cliquer pour exclure)'
                                                                : 'Cliquer pour verrouiller (ou glisser)'
                                                        }
                                                    >
                                                        <div className="badge-top-row">
                                                            <span className={`badge-name ${isExcluded ? 'line-through opacity-70' : ''}`}>{p}</span>
                                                            {isLocked && <span style={{ fontSize: '9px' }} aria-hidden="true">🔒</span>}
                                                            {isExcluded && <span style={{ fontSize: '9px' }} aria-hidden="true">🚫</span>}
                                                        </div>
                                                        <div className="badge-stats-row">
                                                            <span className="badge-stat-item"><span className="badge-stat-label">E:</span><strong className="badge-stat-num">{em}</strong></span>
                                                            <span className="badge-stat-item"><span className="badge-stat-label">S:</span><strong className="badge-stat-num">{sm}</strong></span>
                                                            <span className="badge-stat-item"><span className="badge-stat-label">B:</span><strong className="badge-stat-num">{sb}</strong></span>
                                                        </div>
                                                        {isLocked && (
                                                            <button
                                                                className="badge-unlock-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    modifyState((s) => {
                                                                        s.lockedParticipants[type] = s.lockedParticipants[type].filter(
                                                                            (x: string) => x !== p
                                                                        );
                                                                        updateProposedGroups(s);
                                                                    });
                                                                }}
                                                            >
                                                                &times;
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {(!currentState.proposedGroups[type] || currentState.proposedGroups[type].length === 0) && (
                                                <li className="empty-group-placeholder">(Glissez des participants ici ou changez la taille)</li>
                                            )}
                                        </ul>
                                    </fieldset>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            id="regenerate-btn"
                            onClick={() => modifyState((s) => updateProposedGroups(s))}
                            style={{ flexGrow: 1, backgroundColor: 'var(--button-bg)' }}
                        >
                            Recalculer
                        </button>
                        <button
                            id="confirm-btn"
                            onClick={handleConfirmGroup}
                            disabled={!currentState.proposedGroups.main?.length && !currentState.proposedGroups.bonus?.length}
                            style={{ flexGrow: 2 }}
                        >
                            Valider la Sélection
                        </button>
                    </div>
                    {(() => {
                        const hasActiveTeam =
                            currentState.currentActiveHistoryEntryIndex !== -1 &&
                            ((currentState.activeGroups?.main?.length || 0) > 0 ||
                                (currentState.activeGroups?.bonus?.length || 0) > 0);
                        return (
                            <div id="active-group-timer-block" style={{ marginTop: '15px' }}>
                                <h3 className="collapsible-title" style={{ cursor: 'default' }}>
                                    En jeu:{' '}
                                    {currentState.activeGroups.timestamp > 0
                                        ? `(à ${new Date(currentState.activeGroups.timestamp).toLocaleTimeString('fr-FR', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                          })})`
                                        : ''}{' '}
                                    <span className="toggle-icon">▼</span>
                                </h3>
                                <div className="section-content-wrapper">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                                        <div id="confirmed-groups-display" className={currentState.activeGroups.timestamp ? 'visible' : ''} style={{ flex: '1 1 33.3%', minWidth: '160px' }}>
                                            {currentState.activeGroups.main?.length > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <div className="group-type-title" style={{ minWidth: '45px', marginBottom: 0 }}>Main :</div>
                                                    <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', listStyle: 'none', margin: 0, padding: 0 }}>
                                                        {currentState.activeGroups.main.map((p: string) => (
                                                            <li key={p} style={{ backgroundColor: getParticipantColor(p) }}>
                                                                {p}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {currentState.activeGroups.bonus?.length > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: currentState.activeGroups.main?.length > 0 ? '6px' : 0 }}>
                                                    <div className="group-type-title" style={{ minWidth: '45px', marginBottom: 0 }}>Bonus :</div>
                                                    <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', listStyle: 'none', margin: 0, padding: 0 }}>
                                                        {currentState.activeGroups.bonus.map((p: string) => (
                                                            <li key={p} style={{ backgroundColor: getParticipantColor(p) }}>
                                                                {p}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '2 1 66.7%', minWidth: '220px' }}>
                                            <div className="stopwatch-container" style={{ margin: 0, padding: '3px 8px', minHeight: '26px' }}>
                                                <div
                                                    className="stopwatch-progress"
                                                    id="stopwatch-progress-impro"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            (getTimerValue('impro') / STOPWATCH_PROGRESS_DURATION) * 100
                                                        )}%`,
                                                        backgroundColor: getProgressColor(getTimerValue('impro'))
                                                    }}
                                                ></div>
                                                <span className="stopwatch-title" style={{ fontSize: '0.85em', minWidth: 'auto' }}>Impro 🎭</span>
                                                <div
                                                    className={`stopwatch-display ${
                                                        getTimerValue('impro') >= STOPWATCH_PROGRESS_DURATION ? 'blinking' : ''
                                                    }`}
                                                    id="stopwatch-display-impro"
                                                    style={{ fontSize: '1.2em', padding: '1px 6px', minWidth: 'auto' }}
                                                >
                                                    {formatTime(getTimerValue('impro'))}
                                                </div>
                                                <div className="stopwatch-controls" style={{ gap: '4px' }}>
                                                    <button
                                                        id="stopwatch-toggle-impro"
                                                        disabled={!hasActiveTeam && !timers.impro.running}
                                                        title={!hasActiveTeam ? 'Aucune équipe sélectionnée' : undefined}
                                                        onClick={() => {
                                                            if (!hasActiveTeam && !timers.impro.running) return;
                                                            toggleTimer('impro');
                                                        }}
                                                        className={timers.impro.running ? 'running' : ''}
                                                        style={{ height: '26px', width: '168px', minWidth: '168px', fontSize: '1em', padding: '0 6px' }}
                                                    >
                                                        {timers.impro.running ? '❚❚' : '▶'}
                                                    </button>
                                                    <button
                                                        id="stopwatch-reset-impro"
                                                        onClick={() => resetTimer('impro')}
                                                        style={{ height: '26px', minWidth: '26px', fontSize: '0.9em', padding: '0 4px' }}
                                                    >
                                                        ↺
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="stopwatch-container" style={{ margin: 0, padding: '3px 8px', minHeight: '26px' }}>
                                                <div
                                                    className="stopwatch-progress"
                                                    id="stopwatch-progress-debrief"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            (getTimerValue('debrief') / STOPWATCH_PROGRESS_DURATION) * 100
                                                        )}%`,
                                                        backgroundColor: getProgressColor(getTimerValue('debrief'))
                                                    }}
                                                ></div>
                                                <span className="stopwatch-title" style={{ fontSize: '0.85em', minWidth: 'auto' }}>Debrief 💬</span>
                                                <div
                                                    className={`stopwatch-display ${
                                                        getTimerValue('debrief') >= STOPWATCH_PROGRESS_DURATION ? 'blinking' : ''
                                                    }`}
                                                    id="stopwatch-display-debrief"
                                                    style={{ fontSize: '1.2em', padding: '1px 6px', minWidth: 'auto' }}
                                                >
                                                    {formatTime(getTimerValue('debrief'))}
                                                </div>
                                                <div className="stopwatch-controls" style={{ gap: '4px' }}>
                                                    <button
                                                        id="stopwatch-toggle-debrief"
                                                        disabled={!hasActiveTeam && !timers.debrief.running}
                                                        title={!hasActiveTeam ? 'Aucune équipe sélectionnée' : undefined}
                                                        onClick={() => {
                                                            if (!hasActiveTeam && !timers.debrief.running) return;
                                                            toggleTimer('debrief');
                                                        }}
                                                        className={timers.debrief.running ? 'running' : ''}
                                                        style={{ height: '26px', width: '168px', minWidth: '168px', fontSize: '1em', padding: '0 6px' }}
                                                    >
                                                        {timers.debrief.running ? '❚❚' : '▶'}
                                                    </button>
                                                    <button
                                                        id="stopwatch-reset-debrief"
                                                        onClick={() => resetTimer('debrief')}
                                                        style={{ height: '26px', minWidth: '26px', fontSize: '0.9em', padding: '0 4px' }}
                                                    >
                                                        ↺
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        id="validate-times-btn"
                                        onClick={() => {
                                            modifyState((s) => {
                                                if (s.currentActiveHistoryEntryIndex !== -1 && s.history[s.currentActiveHistoryEntryIndex]) {
                                                    s.history[s.currentActiveHistoryEntryIndex].improTime = formatTime(getTimerValue('impro'));
                                                    s.history[s.currentActiveHistoryEntryIndex].debriefTime = formatTime(
                                                        getTimerValue('debrief')
                                                    );
                                                }
                                                s.activeGroups = { main: null, bonus: null, timestamp: 0 };
                                                s.currentActiveHistoryEntryIndex = -1;
                                                updateProposedGroups(s);
                                            });
                                            resetTimer('impro');
                                            resetTimer('debrief');
                                        }}
                                        disabled={currentState.currentActiveHistoryEntryIndex === -1}
                                    >
                                        Valider
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </CollapsibleSection>

            {/* HISTORIQUE DE LA SESSION EN COURS */}
            <div className="app-column" style={{ width: '100%', marginBottom: '15px' }}>
                <CollapsibleSection id="history-log-section-current" title="Historique de la session">
                    <div id="history-list-wrapper" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <div id="history-list">
                            {currentState.history.length === 0 && <p>L'historique des tours est vide.</p>}
                            {currentState.history
                                .slice()
                                .reverse()
                                .filter((entry: any) => {
                                    const now = new Date();
                                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                                    const entryDate = new Date(entry.timestamp);
                                    const entryStartOfDay = new Date(
                                        entryDate.getFullYear(),
                                        entryDate.getMonth(),
                                        entryDate.getDate()
                                    ).getTime();
                                    return entryStartOfDay === startOfToday;
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
        </>
    );
};
