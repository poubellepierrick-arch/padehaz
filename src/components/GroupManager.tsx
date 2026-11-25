
import React from 'react';

interface GroupManagerProps {
    allStates: any;
    currentGroupName: string;
    onUpdateGlobalState: (newAllStates: any, newGroupName: string) => void;
    confirmAction: (message: string, options?: any) => Promise<unknown>;
    showMessage: (msg: string, type: 'info' | 'error' | 'success') => void;
    onOpenConfig?: () => void;
}

export const GroupManager: React.FC<GroupManagerProps> = ({ 
    allStates, 
    currentGroupName, 
    onUpdateGlobalState,
    onOpenConfig
}) => {
    const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '__ADD__' || val === '__MANAGE__') {
            if (onOpenConfig) {
                onOpenConfig();
            }
        } else {
            onUpdateGlobalState(allStates, val);
        }
    };

    return (
        <div id="group-switcher-container">
            <select id="group-switcher" value={currentGroupName} onChange={handleGroupChange}>
                {Object.keys(allStates).sort().map(n => <option key={n} value={n}>{n}</option>)}
                <option disabled>──────</option>
                <option value="__ADD__">➕ Nouveau (Outils & Config)...</option>
                <option value="__MANAGE__">⚙️ Gérer Ateliers...</option>
            </select>
        </div>
    );
};
