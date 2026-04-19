import React from 'react';
import { Toaster } from 'react-hot-toast';

export const ToastProvider = () => {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#1E293B',
                    color: '#F1F5F9',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
                success: {
                    iconTheme: {
                        primary: '#22C55E',
                        secondary: '#1E293B',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#EF4444',
                        secondary: '#1E293B',
                    },
                },
            }}
        />
    );
};
