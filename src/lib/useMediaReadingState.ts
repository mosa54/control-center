'use client';

import { useEffect, useRef, useState } from 'react';
import {
    MEDIA_READING_STATE_KEY,
    parseMediaReadingState,
    type MediaReadingPosition,
    type MediaReadingState,
    type MediaTab,
} from './mediaReadingState';

export function useMediaReadingState(dataReady: boolean, defaultBriefingId: string, isEditMode: boolean) {
    const [activeTab, setActiveTab] = useState<MediaTab>('general');
    const [selectedBriefingId, setSelectedBriefingId] = useState(defaultBriefingId);
    const [openQuestionIds, setOpenQuestionIds] = useState<string[]>([]);
    const [isReady, setIsReady] = useState(false);
    const pageRef = useRef<HTMLDivElement>(null);
    const pendingPosition = useRef<MediaReadingPosition | null>(null);
    const restoring = useRef(true);

    useEffect(() => {
        // Read only viewing preferences; editing state and report contents are never persisted here.
        const frame = requestAnimationFrame(() => {
            let saved: MediaReadingState | null = null;
            try {
                saved = parseMediaReadingState(sessionStorage.getItem(MEDIA_READING_STATE_KEY));
            } catch {
                // Storage may be unavailable in private/restricted browsing.
            }
            if (saved) {
                setActiveTab(saved.activeTab);
                setSelectedBriefingId(saved.selectedBriefingId);
                setOpenQuestionIds(saved.openQuestionIds);
                pendingPosition.current = saved.position;
            }
            setIsReady(true);
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        if (!isReady || !dataReady || !restoring.current) return;
        const position = pendingPosition.current;
        let interrupted = false;
        const restore = () => {
            if (!interrupted && position) {
                const anchor = Array.from(pageRef.current?.querySelectorAll<HTMLElement>('[data-media-reading-id]') ?? [])
                    .find((element) => element.dataset.mediaReadingId === position.anchorId);
                const top = anchor
                    ? window.scrollY + anchor.getBoundingClientRect().top - position.anchorTop
                    : position.scrollY;
                window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
            }
            restoring.current = false;
        };
        const interrupt = () => { interrupted = true; restoring.current = false; };
        let secondFrame: number | undefined;
        const firstFrame = requestAnimationFrame(() => {
            secondFrame = requestAnimationFrame(restore);
        });
        const timer = window.setTimeout(restore, 250);
        const interruptEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
        interruptEvents.forEach((name) => window.addEventListener(name, interrupt, { passive: true }));
        return () => {
            cancelAnimationFrame(firstFrame);
            if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
            window.clearTimeout(timer);
            interruptEvents.forEach((name) => window.removeEventListener(name, interrupt));
        };
    }, [dataReady, isReady]);

    useEffect(() => {
        if (!isReady || !dataReady || isEditMode) return;
        let frame: number | undefined;
        let navigatingAway = false;
        const save = () => {
            if (restoring.current || !pageRef.current) return;
            const anchors = Array.from(pageRef.current.querySelectorAll<HTMLElement>('[data-media-reading-id]'));
            const anchorLine = Math.min(160, window.innerHeight / 3);
            const anchor = anchors.find((element) => element.getBoundingClientRect().bottom > anchorLine)
                ?? anchors[anchors.length - 1];
            const state: MediaReadingState = {
                version: 1,
                activeTab,
                selectedBriefingId,
                openQuestionIds,
                position: {
                    anchorId: anchor?.dataset.mediaReadingId ?? null,
                    anchorTop: anchor?.getBoundingClientRect().top ?? 0,
                    scrollY: window.scrollY,
                },
            };
            try {
                sessionStorage.setItem(MEDIA_READING_STATE_KEY, JSON.stringify(state));
            } catch {
                // Viewing and navigation still work when session storage is unavailable.
            }
        };
        const scheduleSave = () => {
            if (navigatingAway || frame !== undefined) return;
            frame = requestAnimationFrame(() => { frame = undefined; save(); });
        };
        const saveBeforeNavigation = (event: MouseEvent) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
                || !(event.target instanceof Element)) return;
            const link = event.target.closest<HTMLAnchorElement>('a[href]');
            if (!link) return;
            const url = new URL(link.href, window.location.href);
            if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
                // Capture before Next.js resets scroll for the destination page.
                restoring.current = false;
                save();
                navigatingAway = true;
            }
        };
        scheduleSave();
        window.addEventListener('scroll', scheduleSave, { passive: true });
        window.addEventListener('pagehide', save);
        document.addEventListener('click', saveBeforeNavigation, true);
        return () => {
            if (frame !== undefined) cancelAnimationFrame(frame);
            window.removeEventListener('scroll', scheduleSave);
            window.removeEventListener('pagehide', save);
            document.removeEventListener('click', saveBeforeNavigation, true);
        };
    }, [activeTab, dataReady, isEditMode, isReady, openQuestionIds, selectedBriefingId]);

    const toggleQuestion = (id: string, open: boolean) => {
        setOpenQuestionIds((current) => {
            if (current.includes(id) === open) return current;
            return open ? [...current, id] : current.filter((value) => value !== id);
        });
    };

    return { pageRef, isReady, activeTab, setActiveTab, selectedBriefingId, setSelectedBriefingId, openQuestionIds, toggleQuestion };
}
