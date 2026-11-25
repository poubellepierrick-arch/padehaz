import React, { useState } from 'react';

export interface InlineParticipantEditorProps {
    originalName: string;
    initialColor: string;
    onSave: (originalName: string, newName: string, newColor: string) => void;
    onCancel: () => void;
}

export const InlineParticipantEditor: React.FC<InlineParticipantEditorProps> = ({
    originalName,
    initialColor,
    onSave,
    onCancel
}) => {
    const [name, setName] = useState(originalName);
    const [color, setColor] = useState(initialColor);

    return (
        <div
            id="inline-participant-editor"
            className="p-3 mb-3 bg-[#353a45] border border-[#61afef] rounded text-xs flex flex-col gap-2.5"
        >
            <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                <span className="font-semibold text-white">Modifier "{originalName}"</span>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="px-2 py-1 bg-[#4b505c] hover:bg-[#5a606d] text-gray-200 rounded"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => {
                            if (name.trim()) onSave(originalName, name.trim(), color);
                        }}
                        disabled={!name.trim()}
                        className="px-2 py-1 bg-[#98c379] hover:bg-[#86b96f] text-white font-semibold rounded disabled:opacity-50"
                    >
                        Enregistrer
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                    <label className="text-gray-400">Nom :</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-[#3a3f4b] text-white border border-[#404552] rounded focus:outline-none focus:border-[#61afef]"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-gray-400">Couleur :</label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-7 bg-transparent border-0 cursor-pointer rounded"
                    />
                    <span
                        className="badge-preview-color px-2 py-0.5 rounded text-white font-medium text-[11px]"
                        style={{ backgroundColor: color }}
                    >
                        Aperçu
                    </span>
                </div>
            </div>
        </div>
    );
};
