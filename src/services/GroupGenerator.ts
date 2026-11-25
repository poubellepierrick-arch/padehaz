
// --- CONSTANTS ---
export const ALGO_CRITERIA_OPTIONS = [
    { value: 'exerciseParticipation', label: 'Nb. Passages Exercice' },
    { value: 'sessionParticipation', label: 'Nb. Passages Session' },
    { value: 'totalParticipation', label: 'Nb. Passages Total' },
    { value: 'improTime', label: 'Temps Impro Session' },
    { value: 'totalImproTime', label: 'Temps Impro Total' },
    { value: 'avgPlayTimePerSession', label: 'Temps Impro Moy./Session' },
    { value: 'timeSinceLastImpro', label: 'Temps depuis dernière impro' },
    { value: 'timeSinceLastMainImpro', label: 'Temps depuis dernière impro (Main)' },
    { value: 'cooccurrence', label: 'Cooccurrence avec Groupe (Brut)' },
    { value: 'ratioCooccurrence', label: '% Cooccurrence avec Groupe' },
    { value: 'minimizeGlobalCoocStdDev', label: 'Lissage %cooc (Greedy)' },
    { value: 'optimizeGlobalCooc', label: '🎯 Groupe Optimal (Global)' },
    { value: 'optimizeSessionCooc', label: '🎯 Groupe Optimal (Session)' },
    { value: 'random', label: 'Hasard' }
];

// --- HELPERS INTERNES ---
const formatDuration = (ms: number) => {
    if (isNaN(ms) || ms < 0) return "00:00:00";
    const sT = Math.round(ms / 1000);
    const h = Math.floor(sT / 3600);
    const m = Math.floor((sT % 3600) / 60);
    const s = sT % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatTimeAgoForLog = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "Jamais";
    const diffMs = Date.now() - timestamp;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "< 1m";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

// Helper pour générer toutes les combinaisons de k éléments parmi un tableau
// Exemple: getCombinations(['A','B','C'], 2) => [['A','B'], ['A','C'], ['B','C']]
const getCombinationsCount = (n: number, k: number): number => {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    let c = 1;
    for (let i = 1; i <= k; i++) {
        c = c * (n - i + 1) / i;
    }
    return c;
};

const getCombinations = (arr: string[], k: number): string[][] => {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];
    
    const [first, ...rest] = arr;
    
    // Combinaisons AVEC le premier élément
    const combsWithFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
    
    // Combinaisons SANS le premier élément
    const combsWithoutFirst = getCombinations(rest, k);
    
    return [...combsWithFirst, ...combsWithoutFirst];
};

/**
 * CALCULE L'ECART-TYPE GLOBAL SIMULÉ
 * Cette fonction simule l'impact d'un groupe candidat sur l'ensemble de la population.
 * Elle retourne l'écart-type (Standard Deviation) de tous les pourcentages de cooccurrence
 * de la population active SI ce groupe venait à jouer.
 * 
 * Objectif : Minimiser cette valeur pour équilibrer la grille de cooccurrence.
 */
const calculateSimulatedGlobalStdDev = (candidateGroup: string[], currentState: any, groupType: string, scope: 'total'|'session') => {
    // 1. Identifier la population active (ceux qui sont là ce soir)
    // On ne calcule l'écart-type que sur les présents pour que l'algo soit pertinent pour la session en cours.
    const activeParticipants = currentState.participantsList.filter((p: string) => currentState.presence[p]);

    if (activeParticipants.length < 2) return 0;

    // 2. Sélection des sources de données (sans les modifier directement)
    const coocDb = (scope === 'session')
        ? ((groupType === 'main') ? currentState.stats.sessionCooccurrencesMain : currentState.stats.sessionCooccurrencesBonus)
        : ((groupType === 'main') ? currentState.stats.cooccurrencesMain : currentState.stats.cooccurrencesBonus);
    
    const partStats = currentState.stats.participations;

    // 3. Collecter les pourcentages SIMULÉS pour chaque paire possible parmi les présents
    const values: number[] = [];
    
    for (let i = 0; i < activeParticipants.length; i++) {
        for (let j = i + 1; j < activeParticipants.length; j++) {
            const p1 = activeParticipants[i];
            const p2 = activeParticipants[j];

            // Données actuelles
            let rawCooc = coocDb[p1]?.[p2] || 0;
            
            let total1 = (scope === 'session') 
                ? (groupType === 'main' ? partStats[p1]?.sessionMain : partStats[p1]?.sessionBonus)
                : (groupType === 'main' ? partStats[p1]?.totalMain : partStats[p1]?.totalBonus);
            
            let total2 = (scope === 'session') 
                ? (groupType === 'main' ? partStats[p2]?.sessionMain : partStats[p2]?.sessionBonus)
                : (groupType === 'main' ? partStats[p2]?.totalMain : partStats[p2]?.totalBonus);

            // SIMULATION : Si p1 et p2 sont dans le groupe candidat, leurs stats changent
            const p1InGroup = candidateGroup.includes(p1);
            const p2InGroup = candidateGroup.includes(p2);

            if (p1InGroup) total1 = (total1 || 0) + 1;
            if (p2InGroup) total2 = (total2 || 0) + 1;
            if (p1InGroup && p2InGroup) rawCooc = (rawCooc || 0) + 1;

            // Calcul du pourcentage simulé
            const pct1 = (total1 > 0) ? (rawCooc / total1) * 100 : 0;
            const pct2 = (total2 > 0) ? (rawCooc / total2) * 100 : 0;
            
            // On prend la moyenne des deux sens pour avoir une métrique unique par paire
            values.push((pct1 + pct2) / 2);
        }
    }

    if (values.length === 0) return 0;

    // 4. Calcul de l'écart-type des valeurs simulées
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sumSqDiff = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    const variance = sumSqDiff / values.length;
    
    return Math.sqrt(variance);
};

// Internal Cohesion Score (Fallback logic for greedy algo)
const calculateGroupInternalCohesionScore = (groupMembers: string[], currentState: any, groupType: string, scope: 'total'|'session' = 'total') => {
    if (groupMembers.length < 2) return 0;
    const coocDb = (scope === 'session')
        ? ((groupType === 'main') ? currentState.stats.sessionCooccurrencesMain : currentState.stats.sessionCooccurrencesBonus)
        : ((groupType === 'main') ? currentState.stats.cooccurrencesMain : currentState.stats.cooccurrencesBonus);
    const partStats = currentState.stats.participations;
    const values: number[] = [];

    for (let i = 0; i < groupMembers.length; i++) {
        for (let j = i + 1; j < groupMembers.length; j++) {
            const p1 = groupMembers[i];
            const p2 = groupMembers[j];
            const rawCooc = coocDb[p1]?.[p2] || 0;
            const total1 = (scope === 'session') 
                ? (groupType === 'main' ? partStats[p1]?.sessionMain : partStats[p1]?.sessionBonus)
                : (groupType === 'main' ? partStats[p1]?.totalMain : partStats[p1]?.totalBonus);
            const total2 = (scope === 'session') 
                ? (groupType === 'main' ? partStats[p2]?.sessionMain : partStats[p2]?.sessionBonus)
                : (groupType === 'main' ? partStats[p2]?.totalMain : partStats[p2]?.totalBonus);
            const pct1 = (total1 && total1 > 0) ? (rawCooc / total1) * 100 : 0;
            const pct2 = (total2 && total2 > 0) ? (rawCooc / total2) * 100 : 0;
            values.push((pct1 + pct2) / 2);
        }
    }
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    return mean; // Only mean needed for greedy cohesion check
};


// Updated to include runningSelection (participants selected in previous algo steps)
export const calculateCumulativeCoocWithLocked = (participantName: string, groupType: 'main' | 'bonus', currentState: any, runningSelection: string[] = []) => {
    const lockedParticipants = currentState.lockedParticipants?.[groupType] || [];
    // The reference group includes manually locked participants AND those selected/validated in previous steps
    const referenceGroup = Array.from(new Set([...lockedParticipants, ...runningSelection]));
    
    const coocDb = (groupType === 'main') ? currentState.stats.cooccurrencesMain : currentState.stats.cooccurrencesBonus;
    let cumulativeScore = 0;
    
    if (referenceGroup.length === 0 || !coocDb[participantName]) return 0;
    
    referenceGroup.forEach((refP: string) => {
        if (participantName !== refP) {
            cumulativeScore += coocDb[participantName][refP] || 0;
        }
    });
    return cumulativeScore;
};

// Returns the raw value for a specific criterion
const getCriterionValue = (participantName: string, criterionKey: string, groupType: string, currentState: any, runningSelection: string[] = [], currentContenders: string[] = []) => {
    const participantStats = currentState.stats.participations[participantName];
    if (!participantStats) return 0;
    
    let totalTotal = 0;

    switch (criterionKey) {
        case 'exerciseParticipation': return groupType === 'main' ? (participantStats.exerciseMain || 0) : (participantStats.exerciseBonus || 0);
        case 'sessionParticipation': return groupType === 'main' ? participantStats.sessionMain : participantStats.sessionBonus;
        case 'totalParticipation': return groupType === 'main' ? participantStats.totalMain : participantStats.totalBonus;
        case 'improTime': return groupType === 'main' ? participantStats.sessionMainImproSeconds : participantStats.sessionBonusImproSeconds;
        case 'totalImproTime': return (groupType === 'main') ? participantStats.totalMainImproSeconds : participantStats.totalBonusImproSeconds;
        case 'avgPlayTimePerSession': return participantStats.avgPlayTimePerSession || 0;
        
        case 'timeSinceLastImpro': 
            // Return duration since last impro. 
            // If never played (0), return extremely high number to ensure they are picked first in descending sort (longest wait).
            return (participantStats.lastImproTimestamp && participantStats.lastImproTimestamp > 0) 
                ? (Date.now() - participantStats.lastImproTimestamp) 
                : Number.MAX_SAFE_INTEGER;
        case 'timeSinceLastMainImpro': 
            return (participantStats.lastMainImproTimestamp && participantStats.lastMainImproTimestamp > 0) 
                ? (Date.now() - participantStats.lastMainImproTimestamp) 
                : Number.MAX_SAFE_INTEGER;
        case 'cooccurrence': return calculateCumulativeCoocWithLocked(participantName, groupType as 'main'|'bonus', currentState, runningSelection);
        case 'ratioCooccurrence':
            const rawCooc = calculateCumulativeCoocWithLocked(participantName, groupType as 'main'|'bonus', currentState, runningSelection);
            totalTotal = participantStats.totalMain + participantStats.totalBonus;
            return totalTotal === 0 ? 0 : (rawCooc / totalTotal) * 100;
        
        case 'minimizeGlobalCoocStdDev':
            // "Lissage %cooc (Greedy)" - Approche Gloutonne
            // On regarde juste la cohésion interne si on ajoutait ce candidat maintenant
            const simulatedGroup = Array.from(new Set([...(currentState.lockedParticipants?.[groupType] || []), ...runningSelection, participantName]));
            return calculateGroupInternalCohesionScore(simulatedGroup, currentState, groupType, 'total');

        case 'optimizeGlobalCooc':
        case 'optimizeSessionCooc':
            // "Groupe Optimal" - Approche Combinatoire & Simulation Globale
            // On simule TOUTES les combinaisons possibles pour remplir les places restantes.
            // On choisit celle qui minimise l'ÉCART-TYPE GLOBAL des pourcentages de cooccurrence.
            const scope = criterionKey === 'optimizeSessionCooc' ? 'session' : 'total';
            
            const locked = currentState.lockedParticipants?.[groupType] || [];
            const excluded = currentState.excludedParticipants?.[groupType] || [];
            
            const targetSize = groupType === 'main' ? currentState.selectedMainSize : currentState.selectedBonusSize;
            const currentFilledCount = locked.length + runningSelection.length;
            const slotsNeeded = targetSize - currentFilledCount;

            // Si plus de place ou taille atteinte, valeur neutre
            if (slotsNeeded <= 0) return 0;

            // Pool = Tous les actifs - (Locked + RunningSelection + Excluded)
            // On utilise currentContenders pour respecter les filtres précédents du pipeline
            const basePool = currentContenders && currentContenders.length > 0 ? currentContenders : currentState.participantsList;
            const pool = basePool.filter((p: string) => 
                currentState.participantStatus[p] && 
                !locked.includes(p) && 
                !runningSelection.includes(p) &&
                !excluded.includes(p)
            );

            // CACHING pour ne pas recalculer à chaque appel (car appelé N fois par le sort)
            // On inclut les locked et runningSelection dans la clé pour invalider si l'état change
            const cacheKey = `opt_stddev_${scope}_${groupType}_need${slotsNeeded}_L${locked.length}_R${runningSelection.length}_${pool.sort().join('')}`;
            
            if (!currentState._tempOptimizationCache) currentState._tempOptimizationCache = {};
            
            // On stocke désormais un Set de noms (les "Optimaux") et non plus un seul groupe
            let optimalCandidatesSet = currentState._tempOptimizationCache[cacheKey];

            if (!optimalCandidatesSet) {
                // Combinatoire : Trouver les subsets qui minimisent l'écart-type global ou les cooccurrences brutes
                let combinations: string[][] = [];
                const totalCombs = getCombinationsCount(pool.length, slotsNeeded);
                
                if (totalCombs > 50000) {
                    const seen = new Set<string>();
                    let attempts = 0;
                    while (combinations.length < 50000 && attempts < 100000) {
                        attempts++;
                        const shuffled = [...pool].sort(() => Math.random() - 0.5);
                        const combo = shuffled.slice(0, slotsNeeded).sort();
                        const key = combo.join('|');
                        if (!seen.has(key)) {
                            seen.add(key);
                            combinations.push(combo);
                        }
                    }
                } else {
                    combinations = getCombinations(pool, slotsNeeded);
                }
                
                // On calcule le score pour chaque combinaison
                const scoredCombos = combinations.map(combo => {
                    const fullTestGroup = [...locked, ...runningSelection, ...combo];
                    
                    // Score Session (cooccurrences brutes)
                    const coocDb = (groupType === 'main') ? currentState.stats.sessionCooccurrencesMain : currentState.stats.sessionCooccurrencesBonus;
                    let sum = 0;
                    let max = 0;
                    for (let i = 0; i < fullTestGroup.length; i++) {
                        for (let j = i + 1; j < fullTestGroup.length; j++) {
                            const val = coocDb[fullTestGroup[i]]?.[fullTestGroup[j]] || 0;
                            sum += val;
                            if (val > max) max = val;
                        }
                    }
                    const sessionScore = max * 1000 + sum;

                    // Score Global (écart-type)
                    const globalScore = calculateSimulatedGlobalStdDev(fullTestGroup, currentState, groupType, 'total');
                    
                    let primaryScore = 0;
                    let secondaryScore = 0;

                    if (scope === 'session') {
                        primaryScore = sessionScore;
                        secondaryScore = globalScore;
                    } else {
                        primaryScore = globalScore;
                        secondaryScore = sessionScore;
                    }
                    
                    return {
                        combo,
                        primaryScore,
                        secondaryScore
                    };
                });

                // On trie pour trouver le meilleur score primaire
                scoredCombos.sort((a, b) => a.primaryScore - b.primaryScore);

                optimalCandidatesSet = new Set<string>();

                if (scoredCombos.length > 0) {
                    const minPrimaryScore = scoredCombos[0].primaryScore;
                    const epsilon = 0.000001;
                    
                    // On prend toutes les combinaisons qui sont "égales" au meilleur score primaire
                    let bestCombos = scoredCombos.filter(c => c.primaryScore <= minPrimaryScore + epsilon);

                    // S'il y a des égalités, on départage avec le score secondaire
                    if (bestCombos.length > 1) {
                        bestCombos.sort((a, b) => a.secondaryScore - b.secondaryScore);
                        const minSecondaryScore = bestCombos[0].secondaryScore;
                        bestCombos = bestCombos.filter(c => c.secondaryScore <= minSecondaryScore + epsilon);
                    }

                    // On choisit EXACTEMENT UNE combinaison optimale au hasard parmi les meilleures restantes
                    // Cela permet de casser l'égalité massive et de forcer l'algorithme à choisir ce groupe optimal
                    const chosenCombo = bestCombos[Math.floor(Math.random() * bestCombos.length)].combo;
                    chosenCombo.forEach((name: string) => optimalCandidatesSet.add(name));
                }
                
                currentState._tempOptimizationCache[cacheKey] = optimalCandidatesSet;
            }

            // SCORE : Si le candidat fait partie de LA combinaison optimale choisie, score = 0 (Top). Sinon score = 1.
            return optimalCandidatesSet.has(participantName) ? 0 : 1;

        default: return 0;
    }
};

// --- CORE ALGORITHM ---

// Updated runAlgoPipeline to use an Iterative Filtering logic
// ADDED lockedParticipants param to initialize finalSelected
export const runAlgoPipeline = (participantsToConsider: string[], slotsToFill: number, groupType: 'main'|'bonus', currentState: any, lockedParticipants: string[] = []) => {
    if (participantsToConsider.length === 0 && slotsToFill > 0) return { result: [...lockedParticipants], logs: [] };

    // SELECTION DU PIPELINE SPECIFIQUE OU FALLBACK
    // On cherche d'abord le pipeline spécifique (ex: algoPipelineMain), sinon on prend le générique (algoPipeline) pour rétrocompatibilité
    let pipeline = [];
    if (groupType === 'main') {
        pipeline = currentState.algoPipelineMain || currentState.algoPipeline || [];
    } else {
        pipeline = currentState.algoPipelineBonus || currentState.algoPipeline || [];
    }
    
    // IDEM POUR TIE BREAKER
    let tieBreakerPipeline = [];
    if (groupType === 'main') {
        tieBreakerPipeline = currentState.tieBreakerPipelineMain || currentState.tieBreakerPipeline || [];
    } else {
        tieBreakerPipeline = currentState.tieBreakerPipelineBonus || currentState.tieBreakerPipeline || [];
    }

    const logs: any[] = [];
    
    // 1. PRE-CALCULATION of Randoms (to ensure stability if 'shuffle' is used multiple times or observed)
    const randomValues: Record<string, number> = {};
    participantsToConsider.forEach(p => randomValues[p] = Math.random());

    // 2. STATE TRACKING
    let currentContenders = [...participantsToConsider]; // Those fighting for a spot
    
    // INITIALIZE WITH LOCKED PARTICIPANTS
    const finalSelected: string[] = [...lockedParticipants]; 
    
    let slotsRemaining = slotsToFill;

    // Initial Log
    logs.push({
        stepId: 'initial',
        type: 'initial',
        candidates: currentContenders.map(name => ({ name, value: '-', status: 'contender' })),
        runningSelection: [...finalSelected].sort((a,b) => a.localeCompare(b)) // Show locked ones here
    });

    // 3. PIPELINE LOOP
    for (let i = 0; i < pipeline.length; i++) {
        // If we have no slots left or no contenders, stop
        if (slotsRemaining <= 0 || currentContenders.length === 0) break;

        const currentStep = pipeline[i];
        const stepLogObject: any = { stepId: currentStep.id, type: currentStep.type };
        
        // --- STANDARD LOGIC (NON-ITERATIVE) ---
        const stepLogCandidates: any[] = [];
        
        // A. Calculate values
        let contenderData = currentContenders.map(name => {
            let rawValue: any;
            // Correction: Handle 'shuffle' type OR 'random' criterion using the stable randomValues map
            if (currentStep.type === 'shuffle' || currentStep.criterion === 'random') {
                rawValue = randomValues[name]; 
            } else {
                rawValue = getCriterionValue(name, currentStep.criterion, groupType, currentState, finalSelected, currentContenders);
            }
            return { name, rawValue };
        });

        // B. Sort
        contenderData.sort((a, b) => {
            if (a.rawValue === b.rawValue) return 0;
            const isAsc = currentStep.order === 'asc' || currentStep.type === 'shuffle' || currentStep.criterion === 'random';
            return isAsc ? (a.rawValue - b.rawValue) : (b.rawValue - a.rawValue);
        });
        const originalContenderDataForLog = [...contenderData];

        // C. Calculate Quotas
        let stepMaxQuota = Infinity;
        if (typeof currentStep.limit === 'number' && currentStep.limit >= 0) {
            const limitValue = currentStep.limit;
            const limitType = currentStep.limitType || 'count';
            const finalGroupSize = groupType === 'main' ? currentState.selectedMainSize : currentState.selectedBonusSize;
            stepMaxQuota = limitType === 'percent' ? Math.floor((limitValue / 100) * finalGroupSize) : limitValue;
        }
        
        let stepMinQuota = 0;
        if (typeof currentStep.minLimit === 'number' && currentStep.minLimit > 0) {
                const limitValue = currentStep.minLimit;
                const limitType = currentStep.minLimitType || 'count';
                const finalGroupSize = groupType === 'main' ? currentState.selectedMainSize : currentState.selectedBonusSize;
                stepMinQuota = limitType === 'percent' ? Math.ceil((limitValue / 100) * finalGroupSize) : limitValue;
        }

        const guaranteedNames: string[] = [];

        // D. Phase 1: Guaranteed Selection (MIN)
        if (stepMinQuota > 0 && contenderData.length > 0 && slotsRemaining > 0) {
            const numToGuarantee = Math.min(stepMinQuota, slotsRemaining, contenderData.length);
            const isAsc = currentStep.order === 'asc' || currentStep.type === 'shuffle' || currentStep.criterion === 'random';
            
            const boundaryValue = contenderData[numToGuarantee - 1].rawValue;
            const strictlyBetter = contenderData.filter(c => isAsc ? c.rawValue < boundaryValue : c.rawValue > boundaryValue);
            const tiedAtBoundary = contenderData.filter(c => c.rawValue === boundaryValue);
            
            const guaranteedPicks = strictlyBetter.map(p => p.name);
            const spotsToFillFromTies = numToGuarantee - guaranteedPicks.length;
            let tieWinners = [];

            if (spotsToFillFromTies > 0) {
                 if (tiedAtBoundary.length <= spotsToFillFromTies) {
                    tieWinners = tiedAtBoundary.map(p => p.name);
                } else {
                    // Execute the dedicated tie-breaker pipeline & LOG IT
                    let candidatesInTie = [...tiedAtBoundary];
                    // USE THE SPECIFIC TIE BREAKER PIPELINE
                    const tbPipeline = tieBreakerPipeline;
                    const tieBreakerLogs: any[] = [];
                    stepLogObject.tieBreakerLogs = tieBreakerLogs;

                    for (const tiebreakerStep of tbPipeline) {
                        if (candidatesInTie.length <= spotsToFillFromTies) break;
                        
                        const currentSelectionContext = [...finalSelected, ...guaranteedPicks];
                        
                        let evaluatedCandidates = candidatesInTie.map(p => {
                            let value;
                            // Correction: Handle 'shuffle' or 'random' in tie-breaker too
                            if (tiebreakerStep.type === 'shuffle' || tiebreakerStep.criterion === 'random') {
                                value = randomValues[p.name];
                            } else {
                                value = getCriterionValue(p.name, tiebreakerStep.criterion, groupType, currentState, currentSelectionContext, candidatesInTie.map(c => c.name));
                            }
                            return { ...p, tiebreakerValue: value };
                        });

                        evaluatedCandidates.sort((a, b) => {
                            if (a.tiebreakerValue === b.tiebreakerValue) return 0;
                            const isTieAsc = tiebreakerStep.order === 'asc' || tiebreakerStep.type === 'shuffle' || tiebreakerStep.criterion === 'random';
                            return isTieAsc ? (a.tiebreakerValue - b.tiebreakerValue) : (b.tiebreakerValue - a.tiebreakerValue);
                        });

                        const boundaryIdx = spotsToFillFromTies - 1;
                        const tbBoundaryValue = evaluatedCandidates[boundaryIdx].tiebreakerValue;
                        const isClearCut = spotsToFillFromTies < evaluatedCandidates.length && evaluatedCandidates[spotsToFillFromTies].tiebreakerValue !== tbBoundaryValue;
                        
                        // LOGGING FOR THIS TIEBREAKER STEP
                        const tbStepLogCandidates = evaluatedCandidates.map(c => {
                             let status = 'eliminated';
                             const isTieAsc = tiebreakerStep.order === 'asc' || tiebreakerStep.type === 'shuffle' || tiebreakerStep.criterion === 'random';
                             const isBetter = isTieAsc ? c.tiebreakerValue < tbBoundaryValue : c.tiebreakerValue > tbBoundaryValue;
                             const isEqual = c.tiebreakerValue === tbBoundaryValue;

                             if(isClearCut) {
                                 if(isBetter || isEqual) status = 'picked';
                             } else {
                                 if(isBetter) status = 'picked';
                                 else if(isEqual) status = 'tied';
                             }
                             return {name: c.name, value: formatValueForLog(c.tiebreakerValue, tiebreakerStep), status};
                        });
                        
                        // INCLUDE CRITERION AND ORDER IN LOG FOR UI DISPLAY
                        tieBreakerLogs.push({
                            stepId: tiebreakerStep.id, 
                            type: tiebreakerStep.type, 
                            criterion: tiebreakerStep.criterion,
                            order: tiebreakerStep.order,
                            candidates: tbStepLogCandidates
                        });


                        if (isClearCut) {
                            candidatesInTie = evaluatedCandidates.slice(0, spotsToFillFromTies);
                            break; 
                        } else {
                            const isTieAsc = tiebreakerStep.order === 'asc' || tiebreakerStep.type === 'shuffle' || tiebreakerStep.criterion === 'random';
                            candidatesInTie = evaluatedCandidates.filter(p => isTieAsc ? p.tiebreakerValue <= tbBoundaryValue : p.tiebreakerValue >= tbBoundaryValue);
                        }
                    }

                    if (candidatesInTie.length > spotsToFillFromTies) {
                        const shuffled = [...candidatesInTie].sort(() => Math.random() - 0.5);
                        tieWinners = shuffled.slice(0, spotsToFillFromTies).map(p => p.name);
                        
                        // Log the final random tie break
                         const finalTieBreakLogCandidates = candidatesInTie.map(c => ({
                             name: c.name,
                             value: "Hasard",
                             status: tieWinners.includes(c.name) ? 'picked' : 'eliminated'
                         }));
                         tieBreakerLogs.push({ stepId: 'final-random', type: 'shuffle', candidates: finalTieBreakLogCandidates });

                    } else {
                        tieWinners = candidatesInTie.map(p => p.name);
                    }
                }
            }
            
            guaranteedPicks.push(...tieWinners);
            guaranteedPicks.forEach(p => guaranteedNames.push(p));
            finalSelected.push(...guaranteedPicks);
            slotsRemaining -= guaranteedPicks.length;
            contenderData = contenderData.filter(c => !guaranteedPicks.includes(c.name));
            stepMaxQuota = (stepMaxQuota === Infinity) ? Infinity : Math.max(0, stepMaxQuota - guaranteedPicks.length);
        }

        // E. Phase 2: Standard Selection (MAX) on remaining contenders
        const effectiveSlots = Math.min(slotsRemaining, stepMaxQuota);
        const isLimitedByQuota = stepMaxQuota < slotsRemaining;

        if (contenderData.length > 0 && effectiveSlots > 0) {
            if (contenderData.length <= effectiveSlots) {
                const names = contenderData.map(c => c.name);
                finalSelected.push(...names);
                slotsRemaining -= names.length;
                currentContenders = []; 
            } else {
                const thresholdIndex = effectiveSlots - 1;
                const thresholdValue = contenderData[thresholdIndex].rawValue;
                const isAsc = currentStep.order === 'asc' || currentStep.type === 'shuffle' || currentStep.criterion === 'random';
                const winners: string[] = []; const tied: string[] = []; const losers: string[] = [];
                contenderData.forEach(c => {
                    let isBetter = false; let isEqual = (c.rawValue === thresholdValue);
                    if (isAsc) isBetter = c.rawValue < thresholdValue; else isBetter = c.rawValue > thresholdValue;
                    if (isBetter) winners.push(c.name); else if (isEqual) tied.push(c.name); else losers.push(c.name);
                });
                finalSelected.push(...winners);
                slotsRemaining -= winners.length;
                const remainingEffectiveSlots = effectiveSlots - winners.length;
                if (remainingEffectiveSlots >= tied.length && slotsRemaining >= tied.length) {
                    finalSelected.push(...tied);
                    slotsRemaining -= tied.length;
                    currentContenders = isLimitedByQuota ? losers : [];
                } else {
                    currentContenders = isLimitedByQuota ? [...tied, ...losers] : tied;
                }
            }
        } else {
            currentContenders = contenderData.map(c => c.name);
        }

        // F. Logging Loop
        originalContenderDataForLog.forEach(c => {
            let status: 'picked' | 'tied' | 'eliminated' | 'passed' = 'eliminated';
            const forced = guaranteedNames.includes(c.name);

            if (finalSelected.includes(c.name) && !lockedParticipants.includes(c.name)) {
                status = 'picked';
            } else if (currentContenders.includes(c.name)) {
                if (contenderData.length > 0 && effectiveSlots > 0 && contenderData.length > effectiveSlots) {
                    const thresholdValue = contenderData[effectiveSlots - 1].rawValue;
                    if (c.rawValue === thresholdValue) status = 'tied';
                    else status = 'passed';
                } else {
                    status = 'passed';
                }
            }
            
            stepLogCandidates.push({
                name: c.name,
                value: formatValueForLog(c.rawValue, currentStep),
                status: status,
                forced: forced
            });
        });

        stepLogObject.candidates = stepLogCandidates;
        stepLogObject.runningSelection = [...finalSelected].sort((a, b) => a.localeCompare(b));
        stepLogObject.limitHit = isLimitedByQuota && stepMaxQuota <= (originalContenderDataForLog.length);
        logs.push(stepLogObject);
    }

    // 4. FINAL RESOLUTION (Arbitrary cut if ties remain)
    if (slotsRemaining > 0 && currentContenders.length > 0) {
        const luckyWinners = currentContenders.slice(0, slotsRemaining);
        finalSelected.push(...luckyWinners);
    }

    // 5. Final Result Sort
    const sortedResult = [...finalSelected].sort((a, b) => currentState.participantsList.indexOf(a) - currentState.participantsList.indexOf(b));

    return { result: sortedResult, logs };
};

const formatValueForLog = (val: any, step: any) => {
    if (step.type === 'shuffle' || step.criterion === 'random') return 'Hasard';
    
    // Formatting % for Ratios
    if (step.criterion && (step.criterion.includes('ratio') || step.criterion.includes('CoocStdDev'))) {
        return typeof val === 'number' ? `${val.toFixed(2)}` : val;
    }
    
    if (step.criterion === 'optimizeGlobalCooc' || step.criterion === 'optimizeSessionCooc') {
        return val === 0 ? 'Optimal' : 'Autre';
    }

    if (step.criterion === 'timeSinceLastImpro' || step.criterion === 'timeSinceLastMainImpro') {
         if (val === Number.MAX_SAFE_INTEGER) return "Jamais";
         return formatTimeAgoForLog(Date.now() - val);
    }
    if (step.criterion && step.criterion.includes('Time') && typeof val === 'number') return formatDuration(val * 1000);
    return val;
};

// Main Entry Point called by App.tsx
export const updateStateWithGroupProposals = (s: any) => {
    const mS = s.selectedMainSize; const bS = s.selectedBonusSize;
    if (!s.excludedParticipants) s.excludedParticipants = { main: [], bonus: [] };
    if (!s.lockedParticipants) s.lockedParticipants = { main: [], bonus: [] };
    const lM = s.lockedParticipants.main; const lB = s.lockedParticipants.bonus;
    const eM = s.excludedParticipants.main; const eB = s.excludedParticipants.bonus;
    
    // Clean cache before new run
    s._tempOptimizationCache = {};

    const pP = s.participantsList.filter((n: string) => s.presence[n] && s.participantStatus[n]);
    const available = pP.filter((n: string) => !lM.includes(n) && !lB.includes(n));
    
    const mainSlots = Math.max(0, mS - lM.length);
    const bonusSlots = Math.max(0, bS - lB.length);
    
    // Reset previous logs
    s.algoLogs = { main: [], bonus: [] };

    // Execute Algo Pipeline for Main
    // We pass 'lM' (locked Main) so they are in finalSelected from the start
    let remainingAfterMain = available.filter((n: string) => !eM.includes(n));
    let finalGroupMain: string[] = [...lM];

    if (mainSlots > 0 && remainingAfterMain.length > 0) {
        const resultObj = runAlgoPipeline([...remainingAfterMain], mainSlots, 'main', s, lM);
        finalGroupMain = resultObj.result;
        s.algoLogs.main = resultObj.logs; 
        
        remainingAfterMain = remainingAfterMain.filter((n: string) => !finalGroupMain.includes(n));
    } else {
        s.algoLogs.main = [{stepId:'initial', type:'initial', candidates: remainingAfterMain.map(name => ({name, value:'-', status:'contender'})), runningSelection: [...finalGroupMain].sort((a,b)=>a.localeCompare(b)) }];
    }

    // Clean cache between main and bonus
    s._tempOptimizationCache = {};

    // Execute Algo Pipeline for Bonus
    // We pass 'lB' (locked Bonus)
    let availableForBonus = available.filter((n: string) => !finalGroupMain.includes(n) && !eB.includes(n));
    let finalGroupBonus: string[] = [...lB];
    
    if (bonusSlots > 0 && availableForBonus.length > 0) {
        const resultObj = runAlgoPipeline([...availableForBonus], bonusSlots, 'bonus', s, lB);
        finalGroupBonus = resultObj.result;
        s.algoLogs.bonus = resultObj.logs;
    } else {
         s.algoLogs.bonus = [{stepId:'initial', type:'initial', candidates: availableForBonus.map(name => ({name, value:'-', status:'contender'})), runningSelection: [...finalGroupBonus].sort((a,b)=>a.localeCompare(b)) }];
    }
    
    // Final Clean
    delete s._tempOptimizationCache;

    s.proposedGroups = {
        main: finalGroupMain.sort((a: string, b: string) => s.participantsList.indexOf(a) - s.participantsList.indexOf(b)).concat(eM),
        bonus: finalGroupBonus.sort((a: string, b: string) => s.participantsList.indexOf(a) - s.participantsList.indexOf(b)).concat(eB)
    };

    return s;
};