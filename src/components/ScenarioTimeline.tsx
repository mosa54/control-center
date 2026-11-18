'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
    const { scenarioDocument, getDeliveredEvents, getPendingEvents, deliverScenarioEvent, fetchTaskChecksForEvents, realtimeStatus } = useApp();
    const observer = useSearchParams().get('role') === 'observer';
    const [admin, setAdmin] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const sendLock = useRef(false);
    const next = getPendingEvents()[0];
    useEffect(() => { setAdmin(sessionStorage.getItem('adminAuth') === 'true'); }, []);

    const sendNext = async () => {
        if (!next || next.delivery_type !== 'instant' || observer || sessionStorage.getItem('adminAuth') !== 'true' || sendLock.current) return;
        sendLock.current = true;
        setSending(true);
        setSendError('');
        try {
            if (!await deliverScenarioEvent(next.id)) setSendError('메시지를 부여하지 못했습니다. 다시 시도해 주세요.');
        } catch {
            setSendError('메시지를 부여하지 못했습니다. 연결을 확인해 주세요.');
        } finally {
            sendLock.current = false;
            setSending(false);
        }
    };
    const delivered = getDeliveredEvents();
    const [newId, setNewId] = useState<string | null>(null);
    const prevCount = useRef(delivered.length);
    const deliveredIds = delivered.map(ev => ev.id);

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

    useEffect(() => {
        if (deliveredIds.length === 0) {
            return;
        }

        void fetchTaskChecksForEvents(deliveredIds);
    }, [deliveredIds.join(','), fetchTaskChecksForEvents]);

    useEffect(() => {
        if (deliveredIds.length === 0) {
            return;
        }

        const syncChecks = () => {
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
                return;
            }

            void fetchTaskChecksForEvents(deliveredIds);
        };

        const intervalId = window.setInterval(
            syncChecks,
            realtimeStatus === 'connected' ? 7000 : 2500
        );

        return () => {
            window.clearInterval(intervalId);
        };
    }, [deliveredIds.join(','), fetchTaskChecksForEvents, realtimeStatus]);

    const reversed = [...delivered].reverse();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {((admin && !observer) || scenarioDocument) && <div className="training-actions">
                {admin && !observer && (
                    <section className="card training-admin-panel">
                        <Link href="/admin/timeline">타임라인 관리 →</Link>
                        {next && <p className="training-next-message">다음 메시지 · {next.time_label} {next.title}</p>}
                        {next?.delivery_type === 'instant' &&
                            <button type="button" className="btn btn-primary btn-block" disabled={sending} onClick={sendNext}>
                                {sending ? '부여 중…' : '다음 메시지 부여'}
                            </button>}
                        {next && next.delivery_type !== 'instant' && <p>이 메시지는 타임라인 관리에서 부여하세요.</p>}
                        {sendError && <p role="alert">{sendError}</p>}
                    </section>
                )}
                {scenarioDocument && <Link href={observer ? '/training/scenario?role=observer' : '/training/scenario'} className="training-scenario-link">
                    원문 보기
                </Link>}
            </div>}
            {!delivered.length && <p style={{ textAlign: 'center', padding: '40px 20px', color: '#757575' }}>진행 중인 상황부여 내역이 없습니다.</p>}
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
