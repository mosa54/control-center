'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import FlipCard from './FlipCard';

const CATEGORIES: Record<string, { icon: string; color: string; label: string }> = {
    phase_1: { icon: '🚨', color: '#C62828', label: '재난인지·출동지령' },
    phase_2: { icon: '📡', color: '#1565C0', label: '상황정보·통신운영' },
    phase_3: { icon: '🚒', color: '#AD1457', label: '현장지휘·지휘권확립' },
    phase_4: { icon: '🏛️', color: '#E65100', label: '대응단계·통제단가동' },
    phase_5: { icon: '🗺️', color: '#4527A0', label: '작전계획·상황판단' },
    phase_6: { icon: '🚛', color: '#2E7D32', label: '자원운용·지원기관조정' },
    phase_7: { icon: '🦺', color: '#FF6F00', label: '구조·진압·인명검색' },
    phase_8: { icon: '🏥', color: '#D32F2F', label: '구급·다수사상자대응' },
    phase_9: { icon: '⚠️', color: '#F57F17', label: '안전관리·RIT·비상탈출' },
    phase_10: { icon: '🏁', color: '#37474F', label: '공보·언론대응·상황종결' },
};

const getCat = (v: string) => CATEGORIES[v] || CATEGORIES.phase_10;

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
                    <FlipCard 
                        key={ev.id} 
                        ev={ev} 
                        cat={cat} 
                        isNew={newId === ev.id} 
                    />
                );
            })}
        </div>
    );
}
