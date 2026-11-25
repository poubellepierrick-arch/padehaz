import { createEmptyParticipantStats, parseTimeToSeconds } from './helpers';

export function recalculateStats(state: any): void {
    if (!state || !state.participantsList) return;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const newStats: any = {
        participations: {},
        cooccurrencesMain: {},
        cooccurrencesBonus: {},
        sessionCooccurrencesMain: {},
        sessionCooccurrencesBonus: {}
    };

    const participantSessions: Record<string, Set<string>> = {};
    state.participantsList.forEach((n: string) => {
        newStats.participations[n] = createEmptyParticipantStats();
        newStats.cooccurrencesMain[n] = {};
        newStats.cooccurrencesBonus[n] = {};
        newStats.sessionCooccurrencesMain[n] = {};
        newStats.sessionCooccurrencesBonus[n] = {};
        participantSessions[n] = new Set();
        state.participantsList.forEach((o: string) => {
            if (n !== o) {
                newStats.cooccurrencesMain[n][o] = 0;
                newStats.cooccurrencesBonus[n][o] = 0;
                newStats.sessionCooccurrencesMain[n][o] = 0;
                newStats.sessionCooccurrencesBonus[n][o] = 0;
            }
        });
    });

    (state.history || []).forEach((entry: any) => {
        const entryTime = entry.timestamp;
        const improSeconds = parseTimeToSeconds(entry.improTime);
        const debriefSeconds = parseTimeToSeconds(entry.debriefTime);
        const dateKey = new Date(entryTime).toLocaleDateString('fr-CA');
        const entryDate = new Date(entryTime);
        const entryStartOfDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate()).getTime();
        const isInCurrentSession = entryStartOfDay === startOfToday;
        const currentExerciseNumber = state.currentExercise || 1;
        const isCurrentExercise = isInCurrentSession && (entry.exerciseNumber ? entry.exerciseNumber === currentExerciseNumber : currentExerciseNumber === 1);
        const allParticipantsInEntry = [...(entry.main || []), ...(entry.bonus || [])];

        allParticipantsInEntry.forEach((pName) => {
            if (participantSessions[pName]) {
                participantSessions[pName].add(dateKey);
            }
            if (newStats.participations[pName]) {
                newStats.participations[pName].lastImproTimestamp = Math.max(
                    newStats.participations[pName].lastImproTimestamp,
                    entryTime
                );
            }
        });

        (entry.main || []).forEach((pName: string) => {
            if (newStats.participations[pName]) {
                newStats.participations[pName].totalMain++;
                newStats.participations[pName].totalMainImproSeconds += improSeconds;
                newStats.participations[pName].totalDebriefSeconds += debriefSeconds;
                newStats.participations[pName].lastMainImproTimestamp = Math.max(
                    newStats.participations[pName].lastMainImproTimestamp || 0,
                    entryTime
                );
                if (isInCurrentSession) {
                    newStats.participations[pName].sessionMain++;
                    newStats.participations[pName].sessionMainImproSeconds += improSeconds;
                    newStats.participations[pName].sessionDebriefSeconds += debriefSeconds;
                }
                if (isCurrentExercise) {
                    newStats.participations[pName].exerciseMain = (newStats.participations[pName].exerciseMain || 0) + 1;
                }
                (entry.main || []).forEach((p2Name: string) => {
                    if (pName !== p2Name) {
                        if (newStats.cooccurrencesMain[pName]?.[p2Name] !== undefined)
                            newStats.cooccurrencesMain[pName][p2Name]++;
                        if (isInCurrentSession && newStats.sessionCooccurrencesMain[pName]?.[p2Name] !== undefined)
                            newStats.sessionCooccurrencesMain[pName][p2Name]++;
                    }
                });
            }
        });

        (entry.bonus || []).forEach((pName: string) => {
            if (newStats.participations[pName]) {
                newStats.participations[pName].totalBonus++;
                newStats.participations[pName].totalBonusImproSeconds += improSeconds;
                if (!(entry.main || []).includes(pName)) {
                    newStats.participations[pName].totalDebriefSeconds += debriefSeconds;
                    if (isInCurrentSession) newStats.participations[pName].sessionDebriefSeconds += debriefSeconds;
                }
                if (isInCurrentSession) {
                    newStats.participations[pName].sessionBonus++;
                    newStats.participations[pName].sessionBonusImproSeconds += improSeconds;
                }
                if (isCurrentExercise) {
                    newStats.participations[pName].exerciseBonus = (newStats.participations[pName].exerciseBonus || 0) + 1;
                }
                (entry.bonus || []).forEach((p2Name: string) => {
                    if (pName !== p2Name) {
                        if (newStats.cooccurrencesBonus[pName]?.[p2Name] !== undefined)
                            newStats.cooccurrencesBonus[pName][p2Name]++;
                        if (isInCurrentSession && newStats.sessionCooccurrencesBonus[pName]?.[p2Name] !== undefined)
                            newStats.sessionCooccurrencesBonus[pName][p2Name]++;
                    }
                });
            }
        });
    });

    state.participantsList.forEach((pName: string) => {
        if (newStats.participations[pName]) {
            const count = participantSessions[pName].size;
            newStats.participations[pName].activeSessionCount = count;
            const totalParticipations =
                newStats.participations[pName].totalMain + newStats.participations[pName].totalBonus;
            newStats.participations[pName].avgPerSession = count > 0 ? totalParticipations / count : 0;
            const totalPlaySeconds =
                newStats.participations[pName].totalMainImproSeconds +
                newStats.participations[pName].totalBonusImproSeconds;
            newStats.participations[pName].avgPlayTimePerSession = count > 0 ? totalPlaySeconds / count : 0;
        }
    });
    state.stats = newStats;
}
