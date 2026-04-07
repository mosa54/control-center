'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';

const CATEGORIES: Record<string, { icon: string; color: string }> = {
    fire: { icon: '🔥', color: '#E53935' },
    explosion: { icon: '💥', color: '#FF6D00' },
    casualty: { icon: '🚑', color: '#D32F2F' },
    collapse: { icon: '🏚️', color: '#795548' },
    traffic: { icon: '🚧', color: '#FB8C00' },
    comm: { icon: '📡', color: '#1565C0' },
    media: { icon: '🎤', color: '#7B1FA2' },
    other: { icon: '📋', color: '#757575' },
};

const getCat = (v: string) => CATEGORIES[v] || CATEGORIES.other;

export default function ScenarioTimeline() {
    const { getDeliveredEvents } = useApp();
    const delivered = getDeliveredEvents();
    const pathname = usePathname();
    const [newId, setNewId] = useState<string | null>(null);
    const prevCount = useRef(delivered.length);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (delivered.length > prevCount.current) {
            const latest = delivered[delivered.length - 1];
            setNewId(latest?.id ?? null);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
            setExpanded(true);
            const timer = setTimeout(() => setNewId(null), 3000);
            const closeTimer = setTimeout(() => setExpanded(false), 10000);
            prevCount.current = delivered.length;
            return () => {
                clearTimeout(timer);
                clearTimeout(closeTimer);
            };
        }
        prevCount.current = delivered.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [delivered.length]);

    // 첫 화면(/), 관리자 페이지에서는 숨김
    if (pathname === '/' || pathname.startsWith('/admin')) return null;
    if (delivered.length === 0) return null;

    const reversed = [...delivered].reverse();

    // 접힌 상태: 화면 구석에 작은 미니 버튼만 표시
    if (!expanded) {
        return (
            <button
                className="scenario-mini-fab"
                onClick={() => setExpanded(true)}
            >
                🚨 <span className="scenario-mini-count">{delivered.length}</span>
            </button>
        );
    }

    // 펼쳐진 상태: 전체 카드 표시
    return (
        <div className="scenario-timeline">
            <div className="scenario-timeline-header" onClick={() => setExpanded(false)} style={{ cursor: 'pointer' }}>
                <span style={{ color: '#D32F2F' }}>🚨 상황부여</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="scenario-count">{delivered.length}건</span>
                    <span style={{ fontSize: 13, color: '#1565C0', fontWeight: 600 }}>
                        접기 ▲
                    </span>
                </div>
            </div>
            <div className="scenario-cards-container">
                {reversed.map(ev => {
                    const cat = getCat(ev.category);
                    return (
                        <div key={ev.id}
                            className={`scenario-card ${newId === ev.id ? 'new' : ''}`}>
                            <div className="scenario-card-header">
                                <span className="scenario-card-icon">{cat.icon}</span>
                                <span className="scenario-card-time">{ev.time_label}</span>
                            </div>
                            <div className="scenario-card-title">{ev.title}</div>
                            {ev.description && <div className="scenario-card-desc">{ev.description}</div>}
                            {ev.delivered_at && (
                                <div className="scenario-card-meta">
                                    {new Date(ev.delivered_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
