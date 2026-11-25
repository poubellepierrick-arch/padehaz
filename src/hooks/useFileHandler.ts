import React, { useRef, useCallback, ChangeEvent, ClipboardEvent } from 'react';
import { DEFAULT_ALGO_TEMPLATES } from '../services/StateFactory';
import { recalculateStats } from '../utils/statsCalculator';

export function useFileHandler(
    localAllStates: any,
    currentGroupName: string,
    globalAlgoTemplates: any[],
    globalProgEmbed: string,
    updateGlobalState: (states: any, group: string, templates?: any[], progEmbed?: string) => void,
    modifyState: (updater: (s: any) => void) => void,
    showMessage: (text: string, type?: 'info' | 'error' | 'success') => void,
    setMenuOpen: (open: boolean) => void
) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => {
                console.error('Plein écran non disponible', e);
                showMessage('Plein écran non supporté ou bloqué', 'error');
            });
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }, [showMessage]);

    const saveStateToFile = useCallback(() => {
        const dataStr = JSON.stringify(
            {
                allStates: localAllStates,
                currentGroupName,
                globalAlgoTemplates,
                globalProgEmbed
            },
            null,
            2
        );
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date();
        const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date
            .getDate()
            .toString()
            .padStart(2, '0')}`;
        a.href = url;
        a.download = `atelier-${currentGroupName.replace(/\s/g, '_')}-${dateString}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showMessage('Fichier téléchargé', 'success');
        setMenuOpen(false);
    }, [localAllStates, currentGroupName, globalAlgoTemplates, globalProgEmbed, showMessage, setMenuOpen]);

    const handleFileLoad = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const result = e.target?.result as string;
                    const loaded = JSON.parse(result);
                    const newAllStates = JSON.parse(JSON.stringify(localAllStates));
                    let targetGroupName = currentGroupName;

                    let mergedTemplates = [...DEFAULT_ALGO_TEMPLATES];
                    if (loaded.globalAlgoTemplates && Array.isArray(loaded.globalAlgoTemplates)) {
                        mergedTemplates = [...loaded.globalAlgoTemplates];
                        DEFAULT_ALGO_TEMPLATES.forEach((def) => {
                            if (!mergedTemplates.find((t) => t.id === def.id)) mergedTemplates.push(def);
                        });
                    }

                    const existingIds = new Set(mergedTemplates.map((t) => t.id));
                    const statesToScan = loaded.allStates || (loaded.participantsList ? { [targetGroupName]: loaded } : {});

                    Object.values(statesToScan).forEach((s: any) => {
                        if (s.algoTemplates && Array.isArray(s.algoTemplates)) {
                            s.algoTemplates.forEach((t: any) => {
                                if (!existingIds.has(t.id)) {
                                    mergedTemplates.push(t);
                                    existingIds.add(t.id);
                                }
                            });
                        }
                    });

                    const loadedProgEmbed = typeof loaded.globalProgEmbed === 'string' ? loaded.globalProgEmbed : undefined;

                    if (loaded && typeof loaded === 'object') {
                        if (loaded.allStates) {
                            const loadedAllStates = loaded.allStates;
                            targetGroupName = loaded.currentGroupName || currentGroupName;
                            Object.keys(loadedAllStates).forEach((key) => recalculateStats(loadedAllStates[key]));
                            updateGlobalState(loadedAllStates, targetGroupName, mergedTemplates, loadedProgEmbed);
                            showMessage('Données chargées', 'success');
                        } else if (loaded.participantsList) {
                            newAllStates[targetGroupName] = loaded;
                            recalculateStats(newAllStates[targetGroupName]);
                            updateGlobalState(newAllStates, targetGroupName, mergedTemplates, loadedProgEmbed);
                            showMessage(`Atelier "${targetGroupName}" chargé`, 'success');
                        }
                    }
                } catch {
                    showMessage('Erreur de lecture du fichier', 'error');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
            setMenuOpen(false);
        },
        [localAllStates, currentGroupName, updateGlobalState, showMessage, setMenuOpen]
    );

    const handlePaste = useCallback(
        (e: ClipboardEvent) => {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const base64Image = event.target?.result as string;
                            modifyState((s) => (s.pastedImage = base64Image));
                            showMessage('Image collée', 'success');
                        };
                        reader.readAsDataURL(blob);
                    }
                }
            }
        },
        [modifyState, showMessage]
    );

    return {
        fileInputRef,
        toggleFullScreen,
        saveStateToFile,
        handleFileLoad,
        handlePaste
    };
}
