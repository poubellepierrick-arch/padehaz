import React, { useState } from 'react';

export interface InlineHistoryEditorProps {
    index: number;
    initialData: any;
    activeParticipants: string[];
    getParticipantColor: (name: string) => string;
    onSave: (index: number, updatedData: any) => void;
    onCancel: () => void;
}

export const InlineHistoryEditor: React.FC<InlineHistoryEditorProps> = ({
    index,
    initialData,
    activeParticipants,
    getParticipantColor,
    onSave,
    onCancel
}) => {
    const [data, setData] = useState<any>(() => JSON.parse(JSON.stringify(initialData)));
    const [addingGroupType, setAddingGroupType] = useState<'main' | 'bonus' | null>(null);

    const availableForMain = activeParticipants.filter((p) => !(data.main || []).includes(p));
    const availableForBonus = activeParticipants.filter((p) => !(data.bonus || []).includes(p));

    const handleRemoveParticipant = (type: 'main' | 'bonus', pIdx: number) => {
        const nextList = [...(data[type] || [])];
        nextList.splice(pIdx, 1);
        setData({ ...data, [type]: nextList });
    };

    const handleAddParticipant = (type: 'main' | 'bonus', name: string) => {
        const nextList = [...(data[type] || []), name];
        setData({ ...data, [type]: nextList });
        setAddingGroupType(null);
    };

    return (
        <div
            id="inline-history-editor"
            className="p-3 mb-3 bg-[#353a45] border border-[#61afef] rounded text-xs flex flex-col gap-3"
        >
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="font-semibold text-white">
                    Édition de l'entrée — {new Date(data.timestamp).toLocaleString('fr-FR')}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="px-2 py-1 bg-[#4b505c] hover:bg-[#5a606d] text-gray-200 rounded"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => onSave(index, data)}
                        className="px-2 py-1 bg-[#98c379] hover:bg-[#86b96f] text-white font-semibold rounded"
                    >
                        Enregistrer
                    </button>
                </div>
            </div>

            {/* Durées et Exercice */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <label className="text-gray-400">Exo :</label>
                    <input
                        type="number"
                        min="1"
                        value={data.exerciseNumber || 1}
                        onChange={(e) => setData({ ...data, exerciseNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className="w-14 px-2 py-1 bg-[#3a3f4b] text-white border border-[#404552] rounded text-center font-mono"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-gray-400">Impro :</label>
                    <input
                        type="text"
                        value={data.improTime || '00:00'}
                        onChange={(e) => setData({ ...data, improTime: e.target.value })}
                        className="w-16 px-2 py-1 bg-[#3a3f4b] text-white border border-[#404552] rounded text-center font-mono"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-gray-400">Débrief :</label>
                    <input
                        type="text"
                        value={data.debriefTime || '00:00'}
                        onChange={(e) => setData({ ...data, debriefTime: e.target.value })}
                        className="w-16 px-2 py-1 bg-[#3a3f4b] text-white border border-[#404552] rounded text-center font-mono"
                    />
                </div>
            </div>

            {/* Groupe Principal */}
            <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <strong className="text-[#61afef]">Groupe Principal ({data.main?.length || 0}) :</strong>
                    <button
                        type="button"
                        onClick={() => setAddingGroupType(addingGroupType === 'main' ? null : 'main')}
                        className="px-2 py-0.5 bg-[#4b505c] hover:bg-[#5a606d] text-white rounded text-[11px]"
                    >
                        {addingGroupType === 'main' ? 'Fermer' : '+ Ajouter'}
                    </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[26px] items-center">
                    {(data.main || []).map((name: string, pIdx: number) => (
                        <span
                            key={name}
                            className="participant-color-pill inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-white font-medium text-[11px]"
                            style={{ backgroundColor: getParticipantColor(name) }}
                        >
                            {name}
                            <button
                                type="button"
                                onClick={() => handleRemoveParticipant('main', pIdx)}
                                className="text-white/80 hover:text-white text-xs font-bold leading-none"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {(!data.main || data.main.length === 0) && (
                        <span className="text-gray-500 italic text-[11px]">Aucun participant</span>
                    )}
                </div>

                {addingGroupType === 'main' && (
                    <div className="mt-1 pt-1 border-t border-white/10 flex flex-wrap gap-1">
                        <span className="text-gray-400 text-[11px] self-center mr-1">Choisir :</span>
                        {availableForMain.length > 0 ? (
                            availableForMain.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => handleAddParticipant('main', name)}
                                    className="participant-color-pill px-2 py-0.5 rounded text-white text-[11px] hover:brightness-110"
                                    style={{ backgroundColor: getParticipantColor(name) }}
                                >
                                    + {name}
                                </button>
                            ))
                        ) : (
                            <span className="text-gray-500 italic text-[11px]">Tous sont déjà ajoutés</span>
                        )}
                    </div>
                )}
            </div>

            {/* Groupe Bonus */}
            <div className="p-2 bg-black/20 rounded border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <strong className="text-[#e5c07b]">Groupe Bonus ({data.bonus?.length || 0}) :</strong>
                    <button
                        type="button"
                        onClick={() => setAddingGroupType(addingGroupType === 'bonus' ? null : 'bonus')}
                        className="px-2 py-0.5 bg-[#4b505c] hover:bg-[#5a606d] text-white rounded text-[11px]"
                    >
                        {addingGroupType === 'bonus' ? 'Fermer' : '+ Ajouter'}
                    </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[26px] items-center">
                    {(data.bonus || []).map((name: string, pIdx: number) => (
                        <span
                            key={name}
                            className="participant-color-pill inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-white font-medium text-[11px]"
                            style={{ backgroundColor: getParticipantColor(name) }}
                        >
                            {name}
                            <button
                                type="button"
                                onClick={() => handleRemoveParticipant('bonus', pIdx)}
                                className="text-white/80 hover:text-white text-xs font-bold leading-none"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {(!data.bonus || data.bonus.length === 0) && (
                        <span className="text-gray-500 italic text-[11px]">Aucun participant</span>
                    )}
                </div>

                {addingGroupType === 'bonus' && (
                    <div className="mt-1 pt-1 border-t border-white/10 flex flex-wrap gap-1">
                        <span className="text-gray-400 text-[11px] self-center mr-1">Choisir :</span>
                        {availableForBonus.length > 0 ? (
                            availableForBonus.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => handleAddParticipant('bonus', name)}
                                    className="participant-color-pill px-2 py-0.5 rounded text-white text-[11px] hover:brightness-110"
                                    style={{ backgroundColor: getParticipantColor(name) }}
                                >
                                    + {name}
                                </button>
                            ))
                        ) : (
                            <span className="text-gray-500 italic text-[11px]">Tous sont déjà ajoutés</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
