import React, { createContext, useContext, useMemo } from 'react';
import { useTaskManager, User, FirebaseActionResult } from '../hooks/useTaskManager';

interface DataContextType {
    textContent: any;
    isLoading: boolean;
    isAuthReady: boolean;
    isAuthenticating: boolean;
    lastLocalChange: number;
    
    // Firebase status
    isFirebaseConnected: boolean;
    isFirebaseBackingUp: boolean;
    lastFirebaseBackup: string | null;
    firebaseBackupError: string | null;
    firebaseUser: User | null;
}

interface ActionContextType {
    setTextContent: (data: any) => void;
    manualFirebaseBackup: () => Promise<FirebaseActionResult>;
    loadFromFirebaseBackup: () => Promise<FirebaseActionResult>;
    loginWithGoogle: () => Promise<FirebaseActionResult>;
    logout: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);
const ActionContext = createContext<ActionContextType | null>(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within GlobalProvider');
    return context;
};

export const useActions = () => {
    const context = useContext(ActionContext);
    if (!context) throw new Error('useActions must be used within GlobalProvider');
    return context;
};

export const useGlobal = () => {
    const data = useData();
    const actions = useActions();
    return { ...data, ...actions };
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const taskManagerData = useTaskManager();

    const actionValue: ActionContextType = useMemo(() => ({
        setTextContent: taskManagerData.setTextContent,
        manualFirebaseBackup: taskManagerData.manualFirebaseBackup,
        loadFromFirebaseBackup: taskManagerData.loadFromFirebaseBackup,
        loginWithGoogle: taskManagerData.loginWithGoogle,
        logout: taskManagerData.logout,
    }), [
        taskManagerData.setTextContent,
        taskManagerData.manualFirebaseBackup,
        taskManagerData.loadFromFirebaseBackup,
        taskManagerData.loginWithGoogle,
        taskManagerData.logout
    ]);

    const dataValue: DataContextType = useMemo(() => ({
        textContent: taskManagerData.textContent,
        isLoading: taskManagerData.isLoading,
        isAuthReady: taskManagerData.isAuthReady,
        isAuthenticating: taskManagerData.isAuthenticating,
        lastLocalChange: taskManagerData.lastLocalChange,
        isFirebaseConnected: taskManagerData.isFirebaseConnected,
        isFirebaseBackingUp: taskManagerData.isFirebaseBackingUp,
        lastFirebaseBackup: taskManagerData.lastFirebaseBackup,
        firebaseBackupError: taskManagerData.firebaseBackupError,
        firebaseUser: taskManagerData.firebaseUser,
    }), [
        taskManagerData.textContent,
        taskManagerData.isLoading,
        taskManagerData.isAuthReady,
        taskManagerData.isAuthenticating,
        taskManagerData.lastLocalChange,
        taskManagerData.isFirebaseConnected,
        taskManagerData.isFirebaseBackingUp,
        taskManagerData.lastFirebaseBackup,
        taskManagerData.firebaseBackupError,
        taskManagerData.firebaseUser
    ]);

    return (
        <DataContext.Provider value={dataValue}>
            <ActionContext.Provider value={actionValue}>
                {children}
            </ActionContext.Provider>
        </DataContext.Provider>
    );
};
export type { User, FirebaseActionResult };
