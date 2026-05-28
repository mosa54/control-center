'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface FullscreenOverlayProps {
    onClose: () => void;
    children: React.ReactNode;
}

export default function FullscreenOverlay({ onClose, children }: FullscreenOverlayProps) {
    const [showClose, setShowClose] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const onCloseRef = useRef(onClose);
    const historyStateIdRef = useRef<string | null>(null);
    const isClosingFromHistoryRef = useRef(false);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

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

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        document.body.classList.add('fullscreen-overlay-open');

        const stateId = `fullscreen-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const currentState = window.history.state;
        const baseState = typeof currentState === 'object' && currentState !== null ? currentState : {};

        historyStateIdRef.current = stateId;
        window.history.pushState(
            { ...baseState, controlCenterFullscreenOverlay: stateId },
            '',
            window.location.href
        );

        const handlePopState = () => {
            isClosingFromHistoryRef.current = true;
            onCloseRef.current();
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
            document.body.classList.remove('fullscreen-overlay-open');
        };
    }, []);

    const handleTap = () => {
        setShowClose(true);
        startHideTimer();
    };

    const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if (
            typeof window !== 'undefined' &&
            !isClosingFromHistoryRef.current &&
            historyStateIdRef.current &&
            window.history.state?.controlCenterFullscreenOverlay === historyStateIdRef.current
        ) {
            window.history.back();
            return;
        }

        onClose();
    };

    return (
        <div className="fullscreen-overlay" onClick={handleTap}>
            <button
                className={`fullscreen-close ${showClose ? '' : 'hidden'}`}
                onClick={handleClose}
            >
                ✕
            </button>
            {children}
        </div>
    );
}
