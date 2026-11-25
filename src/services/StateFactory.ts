
import { 
    INITIAL_PARTICIPANTS, 
    INITIAL_PARTICIPANT_COLORS, 
    DEFAULT_MAIN_SIZE, 
    DEFAULT_BONUS_SIZE,
    DEFAULT_TIME_WINDOW_SETTINGS
} from '../config/constants';
import { createEmptyParticipantStats } from '../utils/helpers';

export const DEFAULT_ALGO_TEMPLATES = [
    {
        id: 'tpl_balanced',
        name: '⚖️ Équilibré (Défaut)',
        algoPipeline: [
            { id: 'step-1', type: 'sort', criterion: 'sessionParticipation', order: 'asc', label: 'Trier par Participations Session' },
            { id: 'step-2', type: 'sort', criterion: 'cooccurrence', order: 'asc', label: 'Trier par Cooccurrence' },
            { id: 'step-3', type: 'shuffle', label: 'Mélanger' }
        ],
        tieBreakerPipeline: [
            { id: 'tb-step-1', type: 'sort', criterion: 'cooccurrence', order: 'asc', label: 'Départage Cooc' },
            { id: 'tb-step-2', type: 'shuffle', label: 'Mélange final' }
        ]
    },
    {
        id: 'tpl_exercise_priority',
        name: '🎯 Priorité Exercice',
        algoPipeline: [
            { id: 'step-1', type: 'sort', criterion: 'exerciseParticipation', order: 'asc', label: 'Trier par Passages Exercice' },
            { id: 'step-2', type: 'sort', criterion: 'sessionParticipation', order: 'asc', label: 'Trier par Passages Session' },
            { id: 'step-3', type: 'sort', criterion: 'cooccurrence', order: 'asc', label: 'Trier par Cooccurrence' },
            { id: 'step-4', type: 'shuffle', label: 'Mélanger' }
        ],
        tieBreakerPipeline: [
            { id: 'tb-step-1', type: 'sort', criterion: 'cooccurrence', order: 'asc', label: 'Départage Cooc' },
            { id: 'tb-step-2', type: 'shuffle', label: 'Mélange final' }
        ]
    },
    {
        id: 'tpl_random',
        name: '🎲 Hasard Total',
        algoPipeline: [
            { id: 'step-rnd', type: 'shuffle', label: 'Mélanger tout' }
        ],
        tieBreakerPipeline: []
    },
    {
        id: 'tpl_strict_rotation',
        name: '🔄 Rotation Stricte',
        algoPipeline: [
            { id: 'step-1', type: 'sort', criterion: 'timeSinceLastImpro', order: 'desc', label: 'Temps depuis dernière impro' },
            { id: 'step-2', type: 'sort', criterion: 'sessionParticipation', order: 'asc', label: 'Participations Session' }
        ],
        tieBreakerPipeline: [
                { id: 'tb-step-1', type: 'shuffle', label: 'Mélange final' }
        ]
    },
    {
        id: 'tpl_cooc_only',
        name: '🔗 Maximiser Nouveaux Duos',
        algoPipeline: [
            { id: 'step-1', type: 'sort', criterion: 'cooccurrence', order: 'asc', label: 'Cooccurrence' },
            { id: 'step-2', type: 'sort', criterion: 'sessionParticipation', order: 'asc', label: 'Participations Session' },
            { id: 'step-3', type: 'shuffle', label: 'Mélanger' }
        ],
        tieBreakerPipeline: [
            { id: 'tb-step-1', type: 'sort', criterion: 'totalParticipation', order: 'asc' },
            { id: 'tb-step-2', type: 'shuffle' }
        ]
    }
];

export const getInitialState = () => {
    const defaultPipeline = [
        { id: 'step-1', type: 'sort', criterion: 'sessionParticipation', order: 'asc', label: 'Trier par Participations Session' },
        { id: 'step-2', type: 'sort', criterion: 'cooccurrence', order: 'asc', label: 'Trier par Cooccurrence avec Verrouillés' },
        { id: 'step-3', type: 'shuffle', label: 'Mélanger les égalités' }
    ];

    const defaultTieBreaker = [
        { id: 'tb-step-1', type: 'sort', criterion: 'cooccurrence', order: 'asc', label: 'Départage par Cooccurrence', limit: undefined, limitType: 'count', minLimit: undefined, minLimitType: 'count' },
        { id: 'tb-step-2', type: 'shuffle', label: 'Mélange final', limit: undefined, limitType: 'count', minLimit: undefined, minLimitType: 'count' }
    ];

    const iS: any = { 
        participantsList: [...INITIAL_PARTICIPANTS], 
        participantColors: { ...INITIAL_PARTICIPANT_COLORS }, 
        participantStatus: {}, 
        presence: {}, 
        history: [], 
        stats: { 
            participations: {}, 
            cooccurrencesMain: {}, 
            cooccurrencesBonus: {},
            sessionCooccurrencesMain: {},
            sessionCooccurrencesBonus: {} 
        }, 
        lastResetDate: new Date().toString(), 
        proposedGroups: { main: null, bonus: null }, 
        activeGroups: { main: null, bonus: null, timestamp: 0 }, 
        currentActiveHistoryEntryIndex: -1, 
        currentExercise: 1,
        lockedParticipants: { main: [], bonus: [] }, 
        excludedParticipants: { main: [], bonus: [] },
        selectedMainSize: DEFAULT_MAIN_SIZE, 
        selectedBonusSize: DEFAULT_BONUS_SIZE, 
        warmupHistory: [], 
        plateauHistory: [], 
        timeWindowSettings: JSON.parse(JSON.stringify(DEFAULT_TIME_WINDOW_SETTINGS)), 
        
        // DEPRECATED BUT KEPT FOR COMPATIBILITY
        algoPipeline: [...defaultPipeline],
        tieBreakerPipeline: [...defaultTieBreaker],
        
        // NEW STRUCTURE
        algoPipelineMain: JSON.parse(JSON.stringify(defaultPipeline)),
        algoPipelineBonus: JSON.parse(JSON.stringify(defaultPipeline)),
        tieBreakerPipelineMain: JSON.parse(JSON.stringify(defaultTieBreaker)),
        tieBreakerPipelineBonus: JSON.parse(JSON.stringify(defaultTieBreaker)),

        activeAlgoTemplateIds: { main: 'tpl_balanced', bonus: 'tpl_balanced' },

        // Kept for backward compatibility but UI will prefer global templates
        algoTemplates: [...DEFAULT_ALGO_TEMPLATES],
        favoriteTemplateIds: ['tpl_balanced', 'tpl_random', 'tpl_strict_rotation'],
        algoLogs: { main: [], bonus: [] },
        tableSortStates: {}, 
        shortcuts: [], 
        pastedImage: null,
        progUrl: 'https://pierricksauzon.notion.site/embed/2e2ddc608f9980438568f6cda4766a95?v=2e2ddc608f99816a8dc9000cad88e2a6',
        progEmbedCode: '<iframe src="https://pierricksauzon.notion.site/embed/2e2ddc608f9980438568f6cda4766a95?v=2e2ddc608f99816a8dc9000cad88e2a6" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>'
    };
    iS.participantsList.forEach((n: string) => { iS.presence[n] = true; iS.participantStatus[n] = true; iS.stats.participations[n] = createEmptyParticipantStats(); iS.stats.cooccurrencesMain[n] = {}; iS.stats.cooccurrencesBonus[n] = {}; iS.stats.sessionCooccurrencesMain[n] = {}; iS.stats.sessionCooccurrencesBonus[n] = {}; iS.participantsList.forEach((o: string) => { if (n !== o) { iS.stats.cooccurrencesMain[n][o] = 0; iS.stats.cooccurrencesBonus[n][o] = 0; iS.stats.sessionCooccurrencesMain[n][o] = 0; iS.stats.sessionCooccurrencesBonus[n][o] = 0; } }); });
    return iS;
}
