import React, { useEffect, useRef } from 'react';

export interface InlineConfirmBannerProps {
    isOpen: boolean;
    message: string;
    title?: string;
    isDanger?: boolean;
    prompt?: {
        expected: string;
        placeholder?: string;
    };
    promptInputVal: string;
    setPromptInputVal: (val: string) => void;
    onConfirm: (val?: string) => void;
    onCancel: () => void;
}

export const InlineConfirmBanner: React.FC<InlineConfirmBannerProps> = ({
    isOpen,
    message,
    title,
    isDanger,
    prompt,
    promptInputVal,
    setPromptInputVal,
    onConfirm,
    onCancel
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && prompt && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, prompt]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const isPromptValid = !prompt || promptInputVal.trim() === prompt.expected;

    return (
        <div
            id="inline-confirm-banner"
            className="w-full p-3 mb-3 rounded border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-sm transition-all"
            style={{
                backgroundColor: isDanger ? 'rgba(224, 108, 117, 0.15)' : 'rgba(97, 175, 239, 0.15)',
                borderColor: isDanger ? 'var(--error-color)' : 'var(--highlight-color)'
            }}
        >
            <div className="flex flex-col gap-1 flex-1">
                {title && (
                    <strong
                        className="text-sm font-semibold"
                        style={{ color: isDanger ? 'var(--error-color)' : 'var(--highlight-color)' }}
                    >
                        {title}
                    </strong>
                )}
                <div
                    className="text-xs md:text-sm text-gray-200"
                    dangerouslySetInnerHTML={{ __html: message }}
                />

                {prompt && (
                    <div className="mt-2 flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={promptInputVal}
                            placeholder={prompt.placeholder || `Tapez '${prompt.expected}'`}
                            onChange={(e) => setPromptInputVal(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && isPromptValid) {
                                    onConfirm(promptInputVal);
                                }
                            }}
                            className="px-2 py-1 bg-[#3a3f4b] text-white border border-[#404552] rounded text-xs w-full max-w-xs focus:outline-none focus:border-[#61afef]"
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                    onClick={onCancel}
                    className="px-3 py-1 bg-[#4b505c] hover:bg-[#5a606d] text-gray-200 rounded text-xs transition-colors"
                >
                    Annuler (Échap)
                </button>
                <button
                    disabled={!isPromptValid}
                    onClick={() => onConfirm(prompt ? promptInputVal : undefined)}
                    className="px-3 py-1 text-white rounded text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{
                        backgroundColor: isDanger ? 'var(--error-color)' : 'var(--success-color)'
                    }}
                >
                    Confirmer (Entrée)
                </button>
            </div>
        </div>
    );
};
