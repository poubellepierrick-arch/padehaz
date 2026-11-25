import { useState, useEffect } from 'react';
import { formatTime, timeStringToMs, getTimeWindowColor } from '../utils/helpers';

export interface TimersState {
    warmup: { running: boolean; start: number; elapsed: number };
    plateau: { running: boolean; start: number; elapsed: number };
    impro: { running: boolean; start: number; elapsed: number };
    debrief: { running: boolean; start: number; elapsed: number };
}

export interface TimeWindowProgress {
    early: { pct: number; color: string; text: string; textColor: string };
    late: { pct: number; color: string; text: string; textColor: string };
}

export function useWorkshopTimers(timeWindowSettings?: any) {
    const [timers, setTimers] = useState<TimersState>({
        warmup: { running: false, start: 0, elapsed: 0 },
        plateau: { running: false, start: 0, elapsed: 0 },
        impro: { running: false, start: 0, elapsed: 0 },
        debrief: { running: false, start: 0, elapsed: 0 }
    });

    const [timeWindowProgress, setTimeWindowProgress] = useState<TimeWindowProgress>({
        early: { pct: 0, color: 'var(--success-color)', text: '--:--', textColor: 'var(--text-color)' },
        late: { pct: 0, color: 'var(--success-color)', text: '--:--', textColor: 'var(--text-color)' }
    });

    useEffect(() => {
        const tick = () => {
            setTimers((prev) => {
                const next = { ...prev };
                let changed = false;
                (['warmup', 'plateau', 'impro', 'debrief'] as const).forEach((key) => {
                    if (prev[key].running) changed = true;
                });
                return changed ? next : prev;
            });

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const currentMs = now.getTime() - today;

            const calcProgress = (settings: any, isEarly: boolean) => {
                if (!settings) return { pct: 0, color: 'var(--success-color)', text: '--:--', textColor: 'var(--text-color)' };
                const sT = timeStringToMs(settings.start);
                const tST = timeStringToMs(settings.transition);
                const eT = timeStringToMs(settings.end);
                const dur = eT - sT;
                let pct = 0;
                let text = '--:--';
                let textColor = 'var(--text-color)';
                if (dur > 0) {
                    if (currentMs < sT) pct = 0;
                    else if (currentMs >= eT) pct = 100;
                    else pct = ((currentMs - sT) / dur) * 100;
                }
                if (currentMs >= sT && currentMs < eT) {
                    const rM = eT - currentMs;
                    text = formatTime(rM);
                    if (rM < (isEarly ? 10 : 5) * 60 * 1000) textColor = 'var(--highlight-color)';
                } else if (currentMs >= eT) {
                    text = '00:00';
                    textColor = 'var(--error-color)';
                }

                return { pct, color: getTimeWindowColor(currentMs, sT, tST, eT), text, textColor };
            };

            if (timeWindowSettings) {
                setTimeWindowProgress({
                    early: calcProgress(timeWindowSettings.early, true),
                    late: calcProgress(timeWindowSettings.late, false)
                });
            }
        };

        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [timeWindowSettings]);

    const toggleTimer = (key: keyof TimersState) => {
        setTimers((prev) => {
            const t = prev[key];
            if (t.running) {
                return { ...prev, [key]: { ...t, running: false, elapsed: t.elapsed + (Date.now() - t.start) } };
            }
            const next = { ...prev, [key]: { ...t, running: true, start: Date.now() } };
            if (key === 'impro' && next.debrief.running) {
                next.debrief.running = false;
                next.debrief.elapsed += Date.now() - next.debrief.start;
            }
            if (key === 'debrief' && next.impro.running) {
                next.impro.running = false;
                next.impro.elapsed += Date.now() - next.impro.start;
            }
            return next;
        });
    };

    const resetTimer = (key: keyof TimersState) => {
        setTimers((prev) => ({ ...prev, [key]: { running: false, start: 0, elapsed: 0 } }));
    };

    const getTimerValue = (key: keyof TimersState) => {
        const t = timers[key];
        let val = t.elapsed;
        if (t.running) val += Date.now() - t.start;
        return val;
    };

    return {
        timers,
        timeWindowProgress,
        toggleTimer,
        resetTimer,
        getTimerValue
    };
}
