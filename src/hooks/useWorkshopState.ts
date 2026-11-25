import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { getInitialState, DEFAULT_ALGO_TEMPLATES } from '../services/StateFactory';
import { DEFAULT_TIME_WINDOW_SETTINGS, DEFAULT_PROG_EMBED, MAX_PROG_EMBED_LENGTH } from '../config/constants';
import { updateStateWithGroupProposals } from '../services/GroupGenerator';
import { recalculateStats } from '../utils/statsCalculator';

export function useWorkshopState() {
    const { textContent, setTextContent, isLoading } = useGlobal();

    const [localAllStates, setLocalAllStates] = useState<any>({ Atelier1: getInitialState() });
    const [currentGroupName, setCurrentGroupName] = useState<string>('Atelier1');
    const [globalAlgoTemplates, setGlobalAlgoTemplates] = useState<any[]>(DEFAULT_ALGO_TEMPLATES);
    const [globalProgEmbed, setGlobalProgEmbed] = useState<string>(DEFAULT_PROG_EMBED);

    // Synchronisation depuis le stockage global
    useEffect(() => {
        if (textContent && !isLoading) {
            let loadedAllStates: Record<string, any> = { Atelier1: getInitialState() };
            let targetGroupName = 'Atelier1';
            let mergedTemplates = [...DEFAULT_ALGO_TEMPLATES];

            if (textContent.globalAlgoTemplates && Array.isArray(textContent.globalAlgoTemplates)) {
                mergedTemplates = [...textContent.globalAlgoTemplates];
                DEFAULT_ALGO_TEMPLATES.forEach((def) => {
                    if (!mergedTemplates.find((t) => t.id === def.id)) mergedTemplates.push(def);
                });
            }

            if (textContent.allStates && typeof textContent.allStates === 'object') {
                loadedAllStates = textContent.allStates;
                targetGroupName = textContent.currentGroupName || Object.keys(loadedAllStates)[0] || 'Atelier1';
                Object.keys(loadedAllStates).forEach((key) => recalculateStats(loadedAllStates[key]));
            } else if (textContent.participantsList) {
                loadedAllStates = { [targetGroupName]: textContent };
                recalculateStats(loadedAllStates[targetGroupName]);
            }

            const existingIds = new Set(mergedTemplates.map((t) => t.id));
            Object.values(loadedAllStates).forEach((s: any) => {
                if (s.algoTemplates && Array.isArray(s.algoTemplates)) {
                    s.algoTemplates.forEach((t: any) => {
                        if (!existingIds.has(t.id)) {
                            mergedTemplates.push(t);
                            existingIds.add(t.id);
                        }
                    });
                }
            });

            let resolvedProgEmbed = DEFAULT_PROG_EMBED;
            if (typeof textContent.globalProgEmbed === 'string') {
                resolvedProgEmbed = textContent.globalProgEmbed;
            } else {
                const legacySource = Object.values(loadedAllStates).find(
                    (s: any) =>
                        (typeof s?.progUrl === 'string' && s.progUrl.trim()) ||
                        (typeof s?.progEmbedCode === 'string' && s.progEmbedCode.trim())
                ) as any;
                if (legacySource) {
                    resolvedProgEmbed = (legacySource.progUrl || legacySource.progEmbedCode || DEFAULT_PROG_EMBED).slice(
                        0,
                        MAX_PROG_EMBED_LENGTH
                    );
                }
            }

            setLocalAllStates(loadedAllStates);
            setCurrentGroupName(targetGroupName);
            setGlobalAlgoTemplates(mergedTemplates);
            setGlobalProgEmbed(resolvedProgEmbed);
        }
    }, [textContent, isLoading]);

    const updateGlobalState = useCallback(
        (newAllStates: any, newGroupName: string, newGlobalTemplates?: any[], newGlobalProgEmbed?: string) => {
            const nextProgEmbed =
                newGlobalProgEmbed !== undefined ? newGlobalProgEmbed.slice(0, MAX_PROG_EMBED_LENGTH) : globalProgEmbed;
            setLocalAllStates(newAllStates);
            setCurrentGroupName(newGroupName);
            if (newGlobalTemplates) setGlobalAlgoTemplates(newGlobalTemplates);
            if (newGlobalProgEmbed !== undefined) setGlobalProgEmbed(nextProgEmbed);

            setTextContent({
                allStates: newAllStates,
                currentGroupName: newGroupName,
                globalAlgoTemplates: newGlobalTemplates || globalAlgoTemplates,
                globalProgEmbed: nextProgEmbed
            });
        },
        [setTextContent, globalAlgoTemplates, globalProgEmbed]
    );

    const handleUpdateGlobalTemplates = useCallback(
        (newTemplates: any[]) => {
            setGlobalAlgoTemplates(newTemplates);
            setTextContent({
                allStates: localAllStates,
                currentGroupName: currentGroupName,
                globalAlgoTemplates: newTemplates,
                globalProgEmbed
            });
        },
        [localAllStates, currentGroupName, globalProgEmbed, setTextContent]
    );

    const handleUpdateGlobalProgEmbed = useCallback(
        (newProgEmbed: string) => {
            const sanitized = newProgEmbed.slice(0, MAX_PROG_EMBED_LENGTH);
            setGlobalProgEmbed(sanitized);
            setTextContent({
                allStates: localAllStates,
                currentGroupName: currentGroupName,
                globalAlgoTemplates,
                globalProgEmbed: sanitized
            });
        },
        [localAllStates, currentGroupName, globalAlgoTemplates, setTextContent]
    );

    const modifyState = useCallback(
        (updater: (state: any) => void) => {
            const nextAllStates = JSON.parse(JSON.stringify(localAllStates));
            if (!nextAllStates[currentGroupName]) nextAllStates[currentGroupName] = getInitialState();

            const s = nextAllStates[currentGroupName];
            if (!s.lockedParticipants) s.lockedParticipants = { main: [], bonus: [] };
            if (!s.lockedParticipants.main) s.lockedParticipants.main = [];
            if (!s.lockedParticipants.bonus) s.lockedParticipants.bonus = [];

            if (!s.excludedParticipants) s.excludedParticipants = { main: [], bonus: [] };
            if (!s.excludedParticipants.main) s.excludedParticipants.main = [];
            if (!s.excludedParticipants.bonus) s.excludedParticipants.bonus = [];
            if (!s.proposedGroups) s.proposedGroups = { main: [], bonus: [] };

            if (!s.history) s.history = [];
            if (!s.warmupHistory) s.warmupHistory = [];
            if (!s.plateauHistory) s.plateauHistory = [];
            if (!s.shortcuts) s.shortcuts = [];

            if (!s.algoPipelineMain && s.algoPipeline) s.algoPipelineMain = JSON.parse(JSON.stringify(s.algoPipeline));
            if (!s.algoPipelineBonus && s.algoPipeline) s.algoPipelineBonus = JSON.parse(JSON.stringify(s.algoPipeline));
            if (!s.tieBreakerPipelineMain && s.tieBreakerPipeline) s.tieBreakerPipelineMain = JSON.parse(JSON.stringify(s.tieBreakerPipeline));
            if (!s.tieBreakerPipelineBonus && s.tieBreakerPipeline) s.tieBreakerPipelineBonus = JSON.parse(JSON.stringify(s.tieBreakerPipeline));

            if (!s.algoTemplates) s.algoTemplates = [];
            if (!s.favoriteTemplateIds) s.favoriteTemplateIds = ['tpl_balanced', 'tpl_random', 'tpl_strict_rotation'];

            updater(s);
            recalculateStats(s);
            updateGlobalState(nextAllStates, currentGroupName);
        },
        [localAllStates, currentGroupName, updateGlobalState]
    );

    const currentState = useMemo(() => {
        if (!localAllStates[currentGroupName]) return getInitialState();
        const raw = localAllStates[currentGroupName];
        const migratedState = {
            ...raw,
            lockedParticipants: {
                main: raw.lockedParticipants?.main || [],
                bonus: raw.lockedParticipants?.bonus || []
            },
            excludedParticipants: {
                main: raw.excludedParticipants?.main || [],
                bonus: raw.excludedParticipants?.bonus || []
            },
            proposedGroups: {
                main: raw.proposedGroups?.main || null,
                bonus: raw.proposedGroups?.bonus || null
            },
            stats: {
                participations: raw.stats?.participations || {},
                cooccurrencesMain: raw.stats?.cooccurrencesMain || {},
                cooccurrencesBonus: raw.stats?.cooccurrencesBonus || {},
                sessionCooccurrencesMain: raw.stats?.sessionCooccurrencesMain || {},
                sessionCooccurrencesBonus: raw.stats?.sessionCooccurrencesBonus || {}
            },
            algoTemplates: raw.algoTemplates || [],
            favoriteTemplateIds: raw.favoriteTemplateIds || ['tpl_balanced', 'tpl_random', 'tpl_strict_rotation'],
            algoLogs: raw.algoLogs || { main: [], bonus: [] },
            history: raw.history || [],
            warmupHistory: raw.warmupHistory || [],
            plateauHistory: raw.plateauHistory || [],
            shortcuts: raw.shortcuts || [],
            timeWindowSettings: raw.timeWindowSettings || JSON.parse(JSON.stringify(DEFAULT_TIME_WINDOW_SETTINGS)),
            activeAlgoTemplateIds: raw.activeAlgoTemplateIds || { main: 'tpl_balanced', bonus: 'tpl_balanced' },
            currentExercise: raw.currentExercise || 1
        };

        if (!migratedState.algoPipelineMain && migratedState.algoPipeline) migratedState.algoPipelineMain = migratedState.algoPipeline;
        if (!migratedState.algoPipelineBonus && migratedState.algoPipeline) migratedState.algoPipelineBonus = migratedState.algoPipeline;
        if (!migratedState.tieBreakerPipelineMain && migratedState.tieBreakerPipeline) migratedState.tieBreakerPipelineMain = migratedState.tieBreakerPipeline;
        if (!migratedState.tieBreakerPipelineBonus && migratedState.tieBreakerPipeline) migratedState.tieBreakerPipelineBonus = migratedState.tieBreakerPipeline;
        return migratedState;
    }, [localAllStates, currentGroupName]);

    const activeParticipants = useMemo(
        () => (currentState.participantsList || []).filter((p: string) => currentState.participantStatus?.[p]),
        [currentState]
    );

    const getParticipantColor = useCallback(
        (name: string) => currentState.participantColors?.[name] || '#ccc',
        [currentState.participantColors]
    );

    const updateProposedGroups = useCallback((s: any) => {
        updateStateWithGroupProposals(s);
    }, []);

    return {
        isLoading,
        localAllStates,
        setLocalAllStates,
        currentGroupName,
        setCurrentGroupName,
        globalAlgoTemplates,
        globalProgEmbed,
        currentState,
        activeParticipants,
        getParticipantColor,
        modifyState,
        updateGlobalState,
        handleUpdateGlobalTemplates,
        handleUpdateGlobalProgEmbed,
        updateProposedGroups
    };
}
