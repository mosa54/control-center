'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface FullscreenOverlayProps {
    onClose: () => void;
    children: React.ReactNode;
}

export default function FullscreenOverlay({ onClose, children }: FullscreenOverlayProps) {
    const [showClose, setShowClose] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startHideTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShowClose(false), 3000);
    }, []);

    useEffect(() => {
        startHideTimer();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [startHideTimer]);

    const handleTap = () => {
        setShowClose(true);
        startHideTimer();
    };

    return (
        <div className="fullscreen-overlay" onClick={handleTap}>
            <button
                className={`fullscreen-close ${showClose ? '' : 'hidden'}`}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
                ✕
            </button>
            {children}
        </div>
    );
}
