import React from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
    errorMessage: string;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    declare state: ErrorBoundaryState;
    declare props: { children: React.ReactNode };

    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            errorMessage: error?.message || 'Erreur inattendue'
        };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error('Erreur applicative :', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-color)] text-[var(--text-color)]">
                    <div className="max-w-md w-full p-6 rounded-lg border border-[var(--error-color)] bg-[var(--section-bg)] flex flex-col gap-4">
                        <h2 className="text-base font-semibold text-[var(--error-color)] m-0">
                            Erreur de l&apos;application
                        </h2>
                        <p className="text-sm opacity-85 m-0 break-words">
                            {this.state.errorMessage}
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="self-start px-4 py-2 rounded text-sm font-semibold text-white bg-[var(--highlight-color)] hover:opacity-90"
                        >
                            Recharger
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
