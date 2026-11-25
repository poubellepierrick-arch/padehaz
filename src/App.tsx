import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getInitialState } from './services/StateFactory';
import { formatTime, SortConfig } from './utils/helpers';
import { parseProgEmbedInput } from './utils/progEmbed';
import { useWorkshopState } from './hooks/useWorkshopState';
import { useWorkshopTimers } from './hooks/useWorkshopTimers';
import { useFileHandler } from './hooks/useFileHandler';

import { Header } from './components/Header';
import { ProgView } from './components/ProgView';
import { AtelierView } from './components/AtelierView';
import { AlgoConfigView } from './components/AlgoConfigView';
import { OutilsConfigTab } from './components/OutilsConfigTab';
import { StatsHistoryTab } from './components/StatsHistoryTab';

import { InlineConfirmBanner } from './components/inline/InlineConfirmBanner';
import { InlineHistoryEditor } from './components/inline/InlineHistoryEditor';
import { InlineParticipantEditor } from './components/inline/InlineParticipantEditor';

export function App() {
    const {
        isLoading,
        localAllStates,
        currentGroupName,
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
    } = useWorkshopState();

    const {
        timers,
        timeWindowProgress,
        toggleTimer,
        resetTimer,
        getTimerValue
    } = useWorkshopTimers(currentState.timeWindowSettings);

    const [activeMainTab, setActiveMainTab] = useState<'prog' | 'atelier' | 'algo' | 'outils_config' | 'stats_history'>('atelier');
    const [uiMessage, setUiMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [draggedItem, setDraggedItem] = useState<{ type: string; payload: any } | null>(null);
    const [isGeneratingGroups] = useState(false);
    const [isEditingParticipantNamesMode, setIsEditingParticipantNamesMode] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('');
    const [sortConfigs, setSortConfigs] = useState<Record<string, SortConfig>>({});

    // Éditeurs et confirmations inline (sans modales popups)
    const [confirmState, setConfirmState] = useState<any | null>(null);
    const [promptInputVal, setPromptInputVal] = useState('');
    const [editHistoryState, setEditHistoryState] = useState<{ isOpen: boolean; index: number; data: any } | null>(null);
    const [editSingleParticipantState, setEditSingleParticipantState] = useState<{ isOpen: boolean; originalName: string; newName: string; newColor: string } | null>(null);
    const [isStyleEditorOpen, setIsStyleEditorOpen] = useState(false);
    const [customStyles, setCustomStyles] = useState<any>({});

    const sessionMarkerColorMapRef = useRef<Map<string, string>>(new Map());
    const uniqueMarkerCountRef = useRef<number>(0);

    const showMessage = useCallback((text: string, type: 'info' | 'error' | 'success' = 'info') => {
        setUiMessage({ text, type });
        setTimeout(() => setUiMessage(null), 3000);
    }, []);

    const {
        fileInputRef,
        toggleFullScreen,
        saveStateToFile,
        handleFileLoad,
        handlePaste
    } = useFileHandler(
        localAllStates,
        currentGroupName,
        globalAlgoTemplates,
        globalProgEmbed,
        updateGlobalState,
        modifyState,
        showMessage,
        setMenuOpen
    );

    const parsedProg = useMemo(() => parseProgEmbedInput(globalProgEmbed), [globalProgEmbed]);
    const handleOpenConfigFromProg = useCallback(() => setActiveMainTab('outils_config'), []);
    const handleOpenProgTab = useCallback(() => setActiveMainTab('prog'), []);

    // Application dynamique des styles
    useEffect(() => {
        const root = document.documentElement;
        if (customStyles.backgroundImage) {
            document.body.style.backgroundImage = `url(${customStyles.backgroundImage})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundAttachment = 'fixed';
        } else {
            document.body.style.backgroundImage = '';
            document.body.style.backgroundColor = customStyles.backgroundColor || '';
        }
        if (customStyles.sectionBgColor) root.style.setProperty('--section-bg', customStyles.sectionBgColor);
        if (customStyles.textColor) root.style.setProperty('--text-color', customStyles.textColor);
        if (customStyles.highlightColor) root.style.setProperty('--highlight-color', customStyles.highlightColor);
        if (customStyles.buttonBgColor) root.style.setProperty('--button-bg', customStyles.buttonBgColor);
        if (customStyles.fontFamily) root.style.setProperty('--font-family', customStyles.fontFamily);
    }, [customStyles]);

    // Fermeture du menu lors d'un clic extérieur
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (menuOpen && !(e.target as HTMLElement).closest('.header-menu-container')) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, [menuOpen]);

    const confirmAction = useCallback((message: string, options: any = {}) => {
        setPromptInputVal('');
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                message,
                ...options,
                onConfirm: (val?: string) => {
                    setConfirmState(null);
                    resolve(val !== undefined ? val : true);
                },
                onCancel: () => {
                    setConfirmState(null);
                    resolve(false);
                }
            });
        });
    }, []);

    const handleConfirmGroup = useCallback(() => {
        modifyState((s: any) => {
            const cleanMain = (s.proposedGroups.main || []).filter((p: string) => !s.excludedParticipants.main.includes(p));
            const cleanBonus = (s.proposedGroups.bonus || []).filter((p: string) => !s.excludedParticipants.bonus.includes(p));
            if (!cleanMain.length && !cleanBonus.length) return;
            if (s.currentActiveHistoryEntryIndex !== -1 && s.history[s.currentActiveHistoryEntryIndex]) {
                s.history[s.currentActiveHistoryEntryIndex].improTime = formatTime(getTimerValue('impro'));
                s.history[s.currentActiveHistoryEntryIndex].debriefTime = formatTime(getTimerValue('debrief'));
            }
            s.activeGroups = { main: cleanMain, bonus: cleanBonus, timestamp: Date.now() };
            s.history.push({
                timestamp: s.activeGroups.timestamp,
                main: [...s.activeGroups.main],
                bonus: [...s.activeGroups.bonus],
                sessionMarker: s.lastResetDate,
                improTime: '00:00',
                debriefTime: '00:00',
                exerciseNumber: s.currentExercise || 1
            });
            s.currentActiveHistoryEntryIndex = s.history.length - 1;
            s.proposedGroups = { main: null, bonus: null };
        });
        resetTimer('impro');
        resetTimer('debrief');
        setActiveMainTab('atelier');
    }, [modifyState, getTimerValue, resetTimer]);

    const handleSort = useCallback((tableKey: string, key: string) => {
        setSortConfigs((prev) => {
            const current = prev[tableKey] || { key: '', order: 'none' };
            const newOrder: 'asc' | 'desc' = current.key === key && current.order === 'asc' ? 'desc' : 'asc';
            return { ...prev, [tableKey]: { key, order: newOrder } };
        });
    }, []);

    if (isLoading) return <div className="text-[var(--text-color)] p-10">Chargement...</div>;

    return (
        <div
            className={
                activeMainTab === 'prog'
                    ? 'flex flex-col h-screen overflow-hidden text-[var(--text-color)]'
                    : 'flex flex-col min-h-screen text-[var(--text-color)]'
            }
            onPaste={handlePaste}
        >
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileLoad} />

            {/* Notification sobre */}
            {uiMessage && (
                <div
                    id="ui-message"
                    className={`visible ${uiMessage.type}`}
                    style={{
                        backgroundColor:
                            uiMessage.type === 'error'
                                ? 'var(--error-color)'
                                : uiMessage.type === 'success'
                                ? 'var(--success-color)'
                                : 'var(--highlight-color)'
                    }}
                >
                    {uiMessage.text}
                </div>
            )}

            {/* HEADER */}
            <Header
                localAllStates={localAllStates}
                currentGroupName={currentGroupName}
                updateGlobalState={updateGlobalState}
                confirmAction={confirmAction}
                showMessage={showMessage}
                activeMainTab={activeMainTab}
                setActiveMainTab={setActiveMainTab}
                modifyState={modifyState}
                updateProposedGroups={updateProposedGroups}
                toggleFullScreen={toggleFullScreen}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                saveStateToFile={saveStateToFile}
                fileInputRef={fileInputRef}
                setIsStyleEditorOpen={setIsStyleEditorOpen}
                setPromptInputVal={setPromptInputVal}
                getInitialState={getInitialState}
            />

            {/* BANDEAU DE CONFIRMATION INLINE */}
            {confirmState && (
                <div className="px-4 pt-2">
                    <InlineConfirmBanner
                        isOpen={!!confirmState}
                        message={confirmState?.message || ''}
                        title={confirmState?.title}
                        isDanger={confirmState?.isDanger}
                        prompt={confirmState?.prompt}
                        promptInputVal={promptInputVal}
                        setPromptInputVal={setPromptInputVal}
                        onConfirm={(val) => confirmState?.onConfirm(val)}
                        onCancel={() => confirmState?.onCancel()}
                    />
                </div>
            )}

            {/* ÉDITEUR D'HISTORIQUE INLINE */}
            {editHistoryState && editHistoryState.isOpen && (
                <div className="px-4 pt-2">
                    <InlineHistoryEditor
                        index={editHistoryState.index}
                        initialData={editHistoryState.data}
                        activeParticipants={activeParticipants}
                        getParticipantColor={getParticipantColor}
                        onSave={(index, updatedData) => {
                            modifyState((s) => {
                                s.history[index] = { ...updatedData };
                                updateProposedGroups(s);
                            });
                            setEditHistoryState(null);
                            showMessage('Entrée mise à jour', 'success');
                        }}
                        onCancel={() => setEditHistoryState(null)}
                    />
                </div>
            )}

            {/* ÉDITEUR DE PARTICIPANT INLINE */}
            {editSingleParticipantState && editSingleParticipantState.isOpen && (
                <div className="px-4 pt-2">
                    <InlineParticipantEditor
                        originalName={editSingleParticipantState.originalName}
                        initialColor={editSingleParticipantState.newColor}
                        onSave={(oldN, newN, newC) => {
                            modifyState((s) => {
                                if (oldN !== newN) {
                                    const idx = s.participantsList.indexOf(oldN);
                                    if (idx !== -1) s.participantsList[idx] = newN;
                                    s.participantColors[newN] = newC;
                                    delete s.participantColors[oldN];
                                    s.presence[newN] = s.presence[oldN];
                                    delete s.presence[oldN];
                                    s.participantStatus[newN] = s.participantStatus[oldN];
                                    delete s.participantStatus[oldN];
                                    if (s.stats.participations[oldN]) {
                                        s.stats.participations[newN] = s.stats.participations[oldN];
                                        delete s.stats.participations[oldN];
                                    }
                                } else {
                                    s.participantColors[newN] = newC;
                                }
                                updateProposedGroups(s);
                            });
                            setEditSingleParticipantState(null);
                            showMessage(`Participant "${newN}" modifié`, 'success');
                        }}
                        onCancel={() => setEditSingleParticipantState(null)}
                    />
                </div>
            )}

            {/* CONTENU PRINCIPAL */}
            <div id="app" className={activeMainTab === 'prog' ? 'prog-full-page' : ''}>
                {activeMainTab === 'prog' && (
                    <ProgView
                        srcUrl={parsedProg.srcUrl}
                        title={parsedProg.title}
                        errorMessage={parsedProg.errorMessage}
                        onOpenConfig={handleOpenConfigFromProg}
                    />
                )}

                {activeMainTab === 'atelier' && (
                    <AtelierView
                        currentState={currentState}
                        activeParticipants={activeParticipants}
                        isEditingParticipantNamesMode={isEditingParticipantNamesMode}
                        setIsEditingParticipantNamesMode={setIsEditingParticipantNamesMode}
                        setEditSingleParticipantState={setEditSingleParticipantState}
                        modifyState={modifyState}
                        updateProposedGroups={updateProposedGroups}
                        getParticipantColor={getParticipantColor}
                        setDraggedItem={setDraggedItem}
                        draggedItem={draggedItem}
                        setActiveMainTab={setActiveMainTab}
                        isGeneratingGroups={isGeneratingGroups}
                        globalAlgoTemplates={globalAlgoTemplates}
                        showMessage={showMessage}
                        timers={timers}
                        toggleTimer={toggleTimer}
                        resetTimer={resetTimer}
                        getTimerValue={getTimerValue}
                        handleConfirmGroup={handleConfirmGroup}
                        sessionMarkerColorMap={sessionMarkerColorMapRef.current}
                        uniqueMarkerCountRef={uniqueMarkerCountRef}
                        setEditHistoryState={setEditHistoryState}
                        confirmAction={confirmAction}
                    />
                )}

                {activeMainTab === 'algo' && (
                    <div id="tools-view-container">
                        <AlgoConfigView
                            currentState={currentState}
                            modifyState={modifyState}
                            updateProposedGroups={updateProposedGroups}
                            getParticipantColor={getParticipantColor}
                            globalTemplates={globalAlgoTemplates}
                            onUpdateGlobalTemplates={handleUpdateGlobalTemplates}
                        />
                    </div>
                )}

                {activeMainTab === 'outils_config' && (
                    <OutilsConfigTab
                        currentGroupName={currentGroupName}
                        allStates={localAllStates}
                        onUpdateGlobalState={updateGlobalState}
                        confirmAction={confirmAction}
                        showMessage={showMessage}
                        currentState={currentState}
                        modifyState={modifyState}
                        updateProposedGroups={updateProposedGroups}
                        getParticipantColor={getParticipantColor}
                        timeWindowProgress={timeWindowProgress}
                        customStyles={customStyles}
                        setCustomStyles={setCustomStyles}
                        isStyleEditorOpen={isStyleEditorOpen}
                        setIsStyleEditorOpen={setIsStyleEditorOpen}
                        globalProgEmbed={globalProgEmbed}
                        onUpdateGlobalProgEmbed={handleUpdateGlobalProgEmbed}
                        onOpenProgTab={handleOpenProgTab}
                    />
                )}

                {activeMainTab === 'stats_history' && (
                    <StatsHistoryTab
                        currentState={currentState}
                        historyFilter={historyFilter}
                        setHistoryFilter={setHistoryFilter}
                        getParticipantColor={getParticipantColor}
                        sessionMarkerColorMap={sessionMarkerColorMapRef.current}
                        uniqueMarkerCountRef={uniqueMarkerCountRef}
                        setEditHistoryState={setEditHistoryState}
                        confirmAction={confirmAction}
                        modifyState={modifyState}
                        updateProposedGroups={updateProposedGroups}
                        activeParticipants={activeParticipants}
                        sortConfigs={sortConfigs}
                        handleSort={handleSort}
                        showMessage={showMessage}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
