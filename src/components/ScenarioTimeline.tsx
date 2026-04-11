'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';

const CATEGORIES: Record<string, { icon: string; color: string }> = {
    phase_1: { icon: '🚨', color: '#C62828' },
    phase_2: { icon: '📡', color: '#1565C0' },
    phase_3: { icon: '🚒', color: '#AD1457' },
    phase_4: { icon: '🏛️', color: '#E65100' },
    phase_5: { icon: '🗺️', color: '#4527A0' },
    phase_6: { icon: '🚛', color: '#2E7D32' },
    phase_7: { icon: '🦺', color: '#FF6F00' },
    phase_8: { icon: '🏥', color: '#D32F2F' },
    phase_9: { icon: '⚠️', color: '#F57F17' },
    phase_10: { icon: '🏁', color: '#37474F' },
};

const getCat = (v: string) => CATEGORIES[v] || CATEGORIES.phase_10;

const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function ScenarioTimeline() {
    const { getDeliveredEvents } = useApp();
    const delivered = getDeliveredEvents();
    const [newId, setNewId] = useState<string | null>(null);
    const prevCount = useRef(delivered.length);

    useEffect(() => {
        if (delivered.length > prevCount.current) {
            const latest = delivered[delivered.length - 1];
            setNewId(latest?.id ?? null);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
            const timer = setTimeout(() => setNewId(null), 3000);
            prevCount.current = delivered.length;
            return () => clearTimeout(timer);
        }
        prevCount.current = delivered.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [delivered.length]);

    if (delivered.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#757575' }}>
                진행 중인 상황부여 내역이 없습니다.
            </div>
        );
    }

    const reversed = [...delivered].reverse();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reversed.map(ev => {
                const cat = getCat(ev.category);
                return (
                    <div key={ev.id}
                        className={`scenario-card ${newId === ev.id ? 'new' : ''}`}
                        style={{ boxShadow: `0 4px 16px ${hexToRgba(cat.color, 0.18)}, 0 1px 4px rgba(0,0,0,0.06)` }}>
                        <div className="scenario-card-header" style={{
                            background: `linear-gradient(to right, ${cat.color}15, transparent)`,
                            margin: '-16px -20px 16px -20px',
                            padding: '12px 20px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="scenario-card-icon">{cat.icon}</span>
                                <span className="scenario-card-time">{ev.time_label}</span>
                            </div>
                            {ev.delivered_at && (
                                <span className="scenario-card-meta" style={{ marginTop: 0 }}>
                                    {new Date(ev.delivered_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            )}
                        </div>
                        <div className="scenario-card-title" style={{ fontSize: '17px', lineHeight: '1.4', marginBottom: '6px' }}>{ev.title}</div>
                        {ev.description && <div className="scenario-card-desc">{ev.description}</div>}
                        {ev.sub_types && ev.sub_types.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                {ev.sub_types.map(st => (
                                    <span key={st} style={{ background: '#F5F5F5', color: '#616161', padding: '1px 6px', borderRadius: 4, fontSize: 10, border: '1px solid #E0E0E0' }}>
                                        {st}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
