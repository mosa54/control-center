export type MediaTab = 'general' | 'pressure' | 'briefing';

export const MEDIA_READING_STATE_KEY = 'control-center:media-reading-state:v1';

export interface MediaReadingPosition {
    anchorId: string | null;
    anchorTop: number;
    scrollY: number;
}

export interface MediaReadingState {
    version: 1;
    activeTab: MediaTab;
    selectedBriefingId: string;
    openQuestionIds: string[];
    position: MediaReadingPosition;
}

export function parseMediaReadingState(raw: string | null): MediaReadingState | null {
    if (!raw) return null;
    try {
        const value = JSON.parse(raw);
        if (
            value?.version !== 1
            || !['general', 'pressure', 'briefing'].includes(value.activeTab)
            || typeof value.selectedBriefingId !== 'string'
            || !Array.isArray(value.openQuestionIds)
            || !value.openQuestionIds.every((id: unknown) => typeof id === 'string')
            || !value.position
            || !(value.position.anchorId === null || typeof value.position.anchorId === 'string')
            || !Number.isFinite(value.position.anchorTop)
            || !Number.isFinite(value.position.scrollY)
            || value.position.scrollY < 0
        ) return null;

        return {
            version: 1,
            activeTab: value.activeTab,
            selectedBriefingId: value.selectedBriefingId,
            openQuestionIds: [...new Set<string>(value.openQuestionIds)],
            position: {
                anchorId: value.position.anchorId,
                anchorTop: value.position.anchorTop,
                scrollY: value.position.scrollY,
            },
        };
    } catch {
        return null;
    }
}
