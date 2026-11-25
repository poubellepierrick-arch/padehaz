import React, { useEffect, useRef } from 'react';

export interface InlineConfirmBannerProps {
    isOpen: boolean;
    message: string;
    title?: string;
    isDanger?: boolean;
    prompt?: {
        expected?: string;
        freeInput?: boolean;
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

    const trimmedInput = promptInputVal.trim();
    const isPromptValid = !prompt
        ? true
        : prompt.freeInput || !prompt.expected
        ? trimmedInput.length > 0
        : trimmedInput === prompt.expected;

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
                <div className="text-xs md:text-sm text-[var(--text-color)] whitespace-pre-line">
                    {message}
                </div>

                {prompt && (
                    <div className="mt-2 flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={promptInputVal}
                            placeholder={prompt.placeholder || (prompt.expected ? `Tapez '${prompt.expected}'` : '')}
                            onChange={(e) => setPromptInputVal(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && isPromptValid) {
                                    onConfirm(promptInputVal);
                                }
                            }}
                            className="px-2 py-1 bg-[var(--input-bg)] text-[var(--text-color)] border border-[var(--border-color)] rounded text-xs w-full max-w-xs focus:outline-none focus:border-[var(--highlight-color)]"
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1 bg-[var(--button-bg)] hover:bg-[var(--button-hover-bg)] text-[var(--text-color)] border border-[var(--border-color)] rounded text-xs transition-colors"
                >
                    Annuler
                </button>
                <button
                    type="button"
                    disabled={!isPromptValid}
                    onClick={() => onConfirm(prompt ? promptInputVal : undefined)}
                    className="px-3 py-1 text-white rounded text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{
                        backgroundColor: isDanger ? 'var(--error-color)' : 'var(--success-color)'
                    }}
                >
                    Confirmer
                </button>
            </div>
        </div>
    );
};
