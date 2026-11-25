
import React, { useMemo } from 'react';

// Icônes SVG intégrées pour supprimer la dépendance à useIcons
const CloudIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.407 4.451 4.451 0 01-1.08-2.785A4.48 4.48 0 0011.996 4c-1.855 0-3.483 1.07-4.104 2.766A4.526 4.526 0 002.25 15z" />
    </svg>
);

const SyncIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

const ExclamationIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface FirebaseStatusIndicatorProps {
    instanceNumber: 1 | 2;
    isConnected: boolean;
    isBackingUp: boolean;
    isAuthenticating?: boolean;
    lastBackup: string | null;
    error: string | null;
    onBackup?: () => void;
    isLoggedIn?: boolean;
    lastLocalChange: number;
    isOldest?: boolean;
}

export const FirebaseStatusIndicator: React.FC<FirebaseStatusIndicatorProps> = ({ instanceNumber, isConnected, isBackingUp, isAuthenticating = false, lastBackup, error, onBackup, isLoggedIn = false, lastLocalChange, isOldest = false }) => {
    
    const isUpToDate = useMemo(() => {
        if (!lastBackup) return false;
        const lastBackupDate = getLocalDateString(new Date(lastBackup));
        const today = getLocalDateString(new Date());
        return lastBackupDate === today;
    }, [lastBackup]);

    const hasUnsavedChanges = useMemo(() => {
        if (!lastLocalChange) return false;
        if (!lastBackup) return true;
        // Une petite marge de 1000ms pour éviter les faux positifs dus à la latence réseau
        return lastLocalChange > (new Date(lastBackup).getTime() + 1000);
    }, [lastLocalChange, lastBackup]);

    const renderIcon = () => {
        if (isBackingUp || isAuthenticating) {
            return <SyncIcon className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />;
        }
        if (error) {
            return <ExclamationIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
        }
        if (!isLoggedIn) {
             return <CloudIcon className="w-5 h-5 text-slate-400" />;
        }
        return <CloudIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />;
    };
    
    const isAutoSync = instanceNumber === 1;

    const getBorderClasses = () => {
        if (error || !isLoggedIn) return 'border-rose-600 bg-rose-50 dark:bg-rose-900/30';
        if (isBackingUp || isAuthenticating) return 'border-blue-500 bg-blue-50 dark:bg-blue-900/30';
        
        // Priorité : Si changements non sauvegardés -> Orange
        if (hasUnsavedChanges) {
             return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
        }

        // Si c'est la version la plus ancienne -> Orange aussi pour alerter (PRIORITAIRE sur UpToDate)
        if (isOldest) {
            return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
        }

        if (isAutoSync) {
            return isUpToDate ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
        } else { 
            return isUpToDate ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-orange-400 bg-orange-50 dark:bg-orange-900/20';
        }
    };
    
    const title = useMemo(() => {
        const prefix = isAutoSync ? "Synchro auto" : "Sauvegarde manuelle";
        
        if (isAuthenticating) return `Connexion à Firebase en cours...`;
        if (error) return `Erreur (${prefix}): ${error}`;
        if (!isLoggedIn) return `Non connecté (${prefix}). Cliquez pour vous connecter à Firebase.`;
        if (isBackingUp) return `Sauvegarde en cours...`;
        
        let status = "";
        
        if (lastBackup) {
            // Affichage explicite de l'heure exacte demandée
            const dateObj = new Date(lastBackup);
            const dateStr = dateObj.toLocaleDateString('fr-FR');
            const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            status = `Dernière : ${dateStr} à ${timeStr}`;
        } else {
            status = 'Jamais sauvegardé';
        }

        if (hasUnsavedChanges) {
            status += "\n⚠️ Changements non sauvegardés";
        }
        
        if (isOldest && !hasUnsavedChanges) {
            status += "\n(Version la plus ancienne)";
        }

        return `${prefix}\n${status}`;
    }, [error, lastBackup, isAutoSync, isLoggedIn, isBackingUp, isAuthenticating, hasUnsavedChanges, isOldest]);
    
    const content = (
        <div className={`p-1.5 rounded-full border-2 border-solid box-border transition-colors shadow-sm ${getBorderClasses()}`}>
            {renderIcon()}
        </div>
    );
    
    return (
        <div className="relative group" title={title}>
            {onBackup ? (
                 <button
                    onClick={onBackup}
                    disabled={isBackingUp || isAuthenticating}
                    className="disabled:opacity-50 rounded-full hover:scale-105 transition-transform block focus:outline-none"
                    aria-label={title}
                >
                    {content}
                </button>
            ) : (
                <div aria-label={title}>
                    {content}
                </div>
            )}
        </div>
    );
};
