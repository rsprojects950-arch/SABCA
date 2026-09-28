import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '../components/Toast';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextData {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({ showToast: () => { } });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
        message: '',
        type: 'info',
        visible: false,
    });

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ message, type, visible: true });
        // Auto-hide handled in Component or via timeout
        setTimeout(() => {
            setToast((prev) => ({ ...prev, visible: false }));
        }, 3000); // Hide after 3 seconds
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast.visible && <Toast message={toast.message} type={toast.type} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />}
        </ToastContext.Provider>
    );
};
