import React from 'react';

export interface InlineStyleEditorProps {
    isOpen: boolean;
    customStyles: any;
    setCustomStyles: (styles: any) => void;
    onClose: () => void;
}

export const InlineStyleEditor: React.FC<InlineStyleEditorProps> = ({
    isOpen,
    customStyles,
    setCustomStyles,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div
            id="inline-style-editor"
            className="p-4 mb-4 bg-[#353a45] border border-[#61afef] rounded-lg text-xs flex flex-col gap-4"
        >
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h4 className="text-sm font-semibold text-white m-0">Personnalisation du style</h4>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCustomStyles({})}
                        className="px-2 py-1 bg-[#4b505c] hover:bg-[#5a606d] text-gray-200 rounded"
                    >
                        Réinitialiser
                    </button>
                    <button
                        onClick={onClose}
                        className="px-2 py-1 bg-[#61afef] hover:bg-[#529cd8] text-white font-semibold rounded"
                    >
                        Fermer
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Arrière-plan */}
                <div className="flex flex-col gap-2 p-2 bg-black/20 rounded border border-white/5">
                    <strong className="text-white text-xs">Arrière-plan</strong>
                    <div className="flex flex-col gap-1">
                        <label className="text-gray-400 text-[11px]">Image URL :</label>
                        <input
                            type="url"
                            placeholder="https://..."
                            value={customStyles.backgroundImage || ''}
                            onChange={(e) => setCustomStyles({ ...customStyles, backgroundImage: e.target.value })}
                            className="px-2 py-1 bg-[#3a3f4b] text-white border border-[#404552] rounded"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                        <label className="text-gray-400 text-[11px]">Couleur fond :</label>
                        <input
                            type="color"
                            value={customStyles.backgroundColor || '#282c34'}
                            onChange={(e) => setCustomStyles({ ...customStyles, backgroundColor: e.target.value })}
                            className="w-7 h-6 bg-transparent border-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Couleurs de l'interface */}
                <div className="flex flex-col gap-2 p-2 bg-black/20 rounded border border-white/5">
                    <strong className="text-white text-xs">Couleurs</strong>
                    <div className="flex items-center justify-between gap-2">
                        <label className="text-gray-400 text-[11px]">Fond sections :</label>
                        <input
                            type="color"
                            value={customStyles.sectionBgColor || '#282c34'}
                            onChange={(e) => setCustomStyles({ ...customStyles, sectionBgColor: e.target.value })}
                            className="w-7 h-6 bg-transparent border-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <label className="text-gray-400 text-[11px]">Texte :</label>
                        <input
                            type="color"
                            value={customStyles.textColor || '#abb2bf'}
                            onChange={(e) => setCustomStyles({ ...customStyles, textColor: e.target.value })}
                            className="w-7 h-6 bg-transparent border-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <label className="text-gray-400 text-[11px]">Accent :</label>
                        <input
                            type="color"
                            value={customStyles.highlightColor || '#61afef'}
                            onChange={(e) => setCustomStyles({ ...customStyles, highlightColor: e.target.value })}
                            className="w-7 h-6 bg-transparent border-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <label className="text-gray-400 text-[11px]">Boutons :</label>
                        <input
                            type="color"
                            value={customStyles.buttonBgColor || '#4b505c'}
                            onChange={(e) => setCustomStyles({ ...customStyles, buttonBgColor: e.target.value })}
                            className="w-7 h-6 bg-transparent border-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Police */}
                <div className="flex flex-col gap-2 p-2 bg-black/20 rounded border border-white/5">
                    <strong className="text-white text-xs">Typographie</strong>
                    <div className="flex flex-col gap-1">
                        <label className="text-gray-400 text-[11px]">Police :</label>
                        <select
                            value={customStyles.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"}
                            onChange={(e) => setCustomStyles({ ...customStyles, fontFamily: e.target.value })}
                            className="px-2 py-1 bg-[#3a3f4b] text-white border border-[#404552] rounded"
                        >
                            <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">Système (Défaut)</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Open Sans', sans-serif">Open Sans</option>
                            <option value="'Lato', sans-serif">Lato</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
