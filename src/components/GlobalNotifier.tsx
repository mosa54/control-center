'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';

export default function GlobalNotifier() {
    const { getDeliveredEvents } = useApp();
    const router = useRouter();
    const pathname = usePathname();
    const delivered = getDeliveredEvents();
    const prevCount = useRef(delivered.length);
    const [show, setShow] = useState<string | null>(null);

    useEffect(() => {
        // 데이터 변경 확인용 로그
        console.log('실시간 상황 모니터링 중... (전체 상황 수:', delivered.length, ')');
        
        if (delivered.length > prevCount.current) {
            // 새 상황 부여됨
            const latest = delivered[delivered.length - 1];
            console.log('신규 상황 감지됨:', latest.title);

            // 훈련 모드 화면을 보고 있는 중이 아니거나 관리자 페이지가 아닌 경우에만 팝업 표시
            if (pathname !== '/training' && !pathname.startsWith('/admin')) {
                setShow(latest.title || '새 상황 메시지');
                
                // 진동 알림 (모바일 기기 지원 시)
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate([200, 100, 200, 100, 500]);
                }
                
                const t = setTimeout(() => setShow(null), 6000);
                prevCount.current = delivered.length;
                return () => clearTimeout(t);
            }
        }
        
        prevCount.current = delivered.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [delivered.length, pathname]);

    if (!show) return null;

    return (
        <div
            className="global-notifier"
            style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(211, 47, 47, 0.95)',
                color: '#fff',
                padding: '16px 20px',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(211, 47, 47, 0.4)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '90%',
                maxWidth: '400px',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onClick={() => {
                setShow(null);
                router.push('/training');
            }}
        >
            <span style={{ fontSize: '28px', animation: 'pulse 1.5s infinite' }}>🚨</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '2px', color: '#FFCDD2', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    상황 전파 알림
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.3 }}>{show}</div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                확인
            </div>

            <style>
                {`
                    @keyframes slideDown {
                        0% { transform: translate(-50%, -120%); opacity: 0; }
                        100% { transform: translate(-50%, 0); opacity: 1; }
                    }
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.15); }
                        100% { transform: scale(1); }
                    }
                `}
            </style>
        </div>
    );
}
