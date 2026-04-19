import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ fullScreen = false, size = 48 }) => {
    const content = (
        <Loader2
            size={size}
            className="animate-spin text-primary"
        />
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                {content}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-4">
            {content}
        </div>
    );
};
