import React from 'react';

interface ProgViewProps {
    srcUrl: string;
    title?: string;
    errorMessage?: string | null;
    onOpenConfig: () => void;
}

// Utilisation de React.memo pour éviter le rechargement de l'iframe à chaque tick des chronomètres
export const ProgView: React.FC<ProgViewProps> = React.memo(({ srcUrl, title = 'Programme', errorMessage, onOpenConfig }) => {
    return (
        <div id="prog-full-container">
            {srcUrl ? (
                <iframe
                    src={srcUrl}
                    title={title}
                    className="w-full h-full border-0 flex-1 block bg-white"
                    allowFullScreen
                    allow="fullscreen; clipboard-read; clipboard-write; identity-credentials-get"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-4">
                    <h3 className="text-lg font-semibold m-0">
                        {errorMessage ? 'Lien Programme invalide' : 'Aucun lien Programme configuré'}
                    </h3>
                    <p className="text-sm opacity-80 max-w-md m-0">
                        {errorMessage ||
                            "Ajoutez une URL (https://...) ou un code d'intégration <iframe> dans Outils & Config pour l'afficher ici en pleine page."}
                    </p>
                    <button
                        type="button"
                        onClick={onOpenConfig}
                        className="save-btn whitespace-nowrap shrink-0"
                    >
                        Configurer dans Outils & Config
                    </button>
                </div>
            )}
        </div>
    );
});
