'use client';

import { useApp } from '@/lib/store';

export default function SessionBanner() {
    const { sessionMode, sessionSummary } = useApp();

    return (
        <div className="session-banner">
            <span className={`session-badge ${sessionMode}`}>
                {sessionMode === 'training' ? '훈련' : '실제 비상소집'}
            </span>
            <span className="session-summary">
                {sessionSummary || '개요 없음'}
            </span>
        </div>
    );
}
