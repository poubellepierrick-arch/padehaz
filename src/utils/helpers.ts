


// Constants needed for progress colors
export const PROGRESS_COLOR_START_RGB = [152, 195, 121];
export const PROGRESS_COLOR_END_RGB = [224, 108, 117];
export const TRANSITION_START_TIME_MS = 2.5 * 60 * 1000;
export const STOPWATCH_PROGRESS_DURATION = 6 * 60 * 1000;
export const TRANSITION_DURATION_MS = STOPWATCH_PROGRESS_DURATION - TRANSITION_START_TIME_MS;
export const LONG_STOPWATCH_PROGRESS_DURATION = 40 * 60 * 1000;
export const LONG_STOPWATCH_TRANSITION_START_TIME_MS = 20 * 60 * 1000;
export const LONG_STOPWATCH_TRANSITION_DURATION_MS = LONG_STOPWATCH_PROGRESS_DURATION - LONG_STOPWATCH_TRANSITION_START_TIME_MS;

// Color Helpers
export const hexToRgb = (h: string) => { if (!h) return null; h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16); if (isNaN(r) || isNaN(g) || isNaN(b)) return null; return { r, g, b }; }

export const hexToRgba = (h: string, a = 1) => { const rgb = hexToRgb(h); if (!rgb) return `rgba(200,200,200,${a})`; return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`; }

// Time Helpers
export const formatTime = (ms: number) => { const sT = Math.floor(ms / 1000); const m = Math.floor(sT / 60); const s = sT % 60; return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }

export const formatDuration = (ms: number) => { if (isNaN(ms) || ms < 0) return "00:00:00"; const sT = Math.round(ms / 1000); const h = Math.floor(sT / 3600); const m = Math.floor((sT % 3600) / 60); const s = sT % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }

export const formatTimeAgo = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "Jamais";
    const diffMs = Date.now() - timestamp;
    const minutes = Math.floor(diffMs / 60000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

export const parseTimeToSeconds = (tS: string) => { if (!tS || typeof tS !== 'string' || !tS.includes(':')) return 0; try { const [m, s] = tS.split(':').map(Number); if (isNaN(m) || isNaN(s)) return 0; return (m * 60) + s; } catch (e) { return 0; } }

export const parseDurationStringToMs = (durationString: string) => { if(!durationString) throw new Error("Durée invalide"); const parts = durationString.split(':').map(Number); let totalSeconds = 0; if (parts.some(isNaN)) throw new Error("Format invalide"); if (parts.length === 3) totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; else if (parts.length === 2) totalSeconds = parts[0] * 60 + parts[1]; else if (parts.length === 1) totalSeconds = parts[0]; else throw new Error("Format inconnu"); return totalSeconds * 1000; }

export const timeStringToMs = (tS: string) => { if (!tS || typeof tS !== 'string' || !tS.includes(':')) return 0; try { const [h, m] = tS.split(':').map(Number); if (isNaN(h) || isNaN(m)) return 0; return (h * 3600 + m * 60) * 1000; } catch (e) { return 0; } }

// Progress Color Logic
export const getProgressColor = (t: number) => {
    if (t < TRANSITION_START_TIME_MS) return `rgb(${PROGRESS_COLOR_START_RGB.join(',')})`;
    if (t >= STOPWATCH_PROGRESS_DURATION) return `rgb(${PROGRESS_COLOR_END_RGB.join(',')})`;
    const iT = t - TRANSITION_START_TIME_MS;
    const r = Math.min(1, Math.max(0, (iT / TRANSITION_DURATION_MS)));
    const R = Math.round(PROGRESS_COLOR_START_RGB[0] + (PROGRESS_COLOR_END_RGB[0] - PROGRESS_COLOR_START_RGB[0]) * r);
    const G = Math.round(PROGRESS_COLOR_START_RGB[1] + (PROGRESS_COLOR_END_RGB[1] - PROGRESS_COLOR_START_RGB[1]) * r);
    const B = Math.round(PROGRESS_COLOR_START_RGB[2] + (PROGRESS_COLOR_END_RGB[2] - PROGRESS_COLOR_START_RGB[2]) * r);
    return `rgb(${R},${G},${B})`;
}

export const getLongProgressColor = (t: number) => {
    if (t < LONG_STOPWATCH_TRANSITION_START_TIME_MS) return `rgb(${PROGRESS_COLOR_START_RGB.join(',')})`;
    if (t >= LONG_STOPWATCH_PROGRESS_DURATION) return `rgb(${PROGRESS_COLOR_END_RGB.join(',')})`;
    const iT = t - LONG_STOPWATCH_TRANSITION_START_TIME_MS;
    const r = Math.min(1, Math.max(0, (iT / LONG_STOPWATCH_TRANSITION_DURATION_MS)));
    const R = Math.round(PROGRESS_COLOR_START_RGB[0] + (PROGRESS_COLOR_END_RGB[0] - PROGRESS_COLOR_START_RGB[0]) * r);
    const G = Math.round(PROGRESS_COLOR_START_RGB[1] + (PROGRESS_COLOR_END_RGB[1] - PROGRESS_COLOR_START_RGB[1]) * r);
    const B = Math.round(PROGRESS_COLOR_START_RGB[2] + (PROGRESS_COLOR_END_RGB[2] - PROGRESS_COLOR_START_RGB[2]) * r);
    return `rgb(${R},${G},${B})`;
}

export const getTimeWindowColor = (cT: number, sT: number, tST: number, eT: number) => {
    const tD = eT - tST;
    if (cT < sT) return `rgb(${PROGRESS_COLOR_START_RGB.join(',')})`;
    if (cT < tST) return `rgb(${PROGRESS_COLOR_START_RGB.join(',')})`;
    if (cT >= eT) return `rgb(${PROGRESS_COLOR_END_RGB.join(',')})`;
    const iT = cT - tST;
    const r = tD > 0 ? Math.min(1, Math.max(0, iT / tD)) : (cT >= tST ? 1 : 0);
    const R = Math.round(PROGRESS_COLOR_START_RGB[0] + (PROGRESS_COLOR_END_RGB[0] - PROGRESS_COLOR_START_RGB[0]) * r);
    const G = Math.round(PROGRESS_COLOR_START_RGB[1] + (PROGRESS_COLOR_END_RGB[1] - PROGRESS_COLOR_START_RGB[1]) * r);
    const B = Math.round(PROGRESS_COLOR_START_RGB[2] + (PROGRESS_COLOR_END_RGB[2] - PROGRESS_COLOR_START_RGB[2]) * r);
    return `rgb(${R},${G},${B})`;
}

// Data Helpers
export const createEmptyParticipantStats = () => ({ 
    totalMain: 0, 
    totalBonus: 0, 
    sessionMain: 0, 
    sessionBonus: 0, 
    exerciseMain: 0,
    exerciseBonus: 0,
    totalMainImproSeconds: 0, 
    sessionMainImproSeconds: 0, 
    totalBonusImproSeconds: 0, 
    sessionBonusImproSeconds: 0, 
    totalDebriefSeconds: 0, 
    sessionDebriefSeconds: 0,
    lastImproTimestamp: 0,
    lastMainImproTimestamp: 0,
    activeSessionCount: 0, // Nombre de sessions où le participant a joué au moins une fois
    avgPerSession: 0, // (TotalMain + TotalBonus) / activeSessionCount
    avgPlayTimePerSession: 0 // (TotalMainImproSeconds + TotalBonusImproSeconds) / activeSessionCount (en secondes)
});

export const formatTimestampForInput = (timestamp: number) => { const date = new Date(timestamp); const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); const hours = String(date.getHours()).padStart(2, '0'); const minutes = String(date.getMinutes()).padStart(2, '0'); return `${year}-${month}-${day}T${hours}:${minutes}`; }

export const simpleMarkdownToHtml = (markdown: string) => {
    if (!markdown) return '';
    let html = markdown
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\s*\*\s*(.*)/gm, '<li>$1</li>');
    
    html = html.replace(/((<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<br><ul>/g, '<ul>');
    html = html.replace(/<\/ul><br>/g, '</ul>');
    return html;
}

// Sorting Helper
export interface SortConfig {
    key: string;
    order: 'asc' | 'desc' | 'none';
}

export const sortData = (data: any[], config: SortConfig) => {
    if (!config || config.order === 'none') return data;
    return [...data].sort((a, b) => {
        let valA = a[config.key];
        let valB = b[config.key];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return config.order === 'asc' ? -1 : 1;
        if (valA > valB) return config.order === 'asc' ? 1 : -1;
        return 0;
    });
};