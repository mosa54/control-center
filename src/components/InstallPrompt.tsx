'use client';

import { useState, useEffect } from 'react';

// 'beforeinstallprompt' 이벤트 타입 정의
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 이미 앱 모드(standalone)인지 확인
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        setIsStandalone(isStandaloneMode);
        if (isStandaloneMode) return;

        // Android/PC 설치 이벤트 감지
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // iOS 감지
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);

        if (isIOS) {
            setIsVisible(true);
            setShowIOSPrompt(true);
        } else {
            // PC/Android에서도 일단 배너를 보여줌 (beforeinstallprompt가 나중에 발생할 수 있음)
            // 3초 후에도 이벤트가 없으면 일단 배너를 띄움
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible || isStandalone) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTop: '1px solid #eee',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            padding: '16px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'slideUp 0.3s ease-out'
        }}>
            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#f5f5f5'
                    }}>
                        <img src="/icon.png" alt="앱 아이콘" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>통제단 앱 설치</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            {showIOSPrompt
                                ? '홈 화면에 추가하여 앱처럼 사용하세요'
                                : '빠르고 편하게 접속하세요'}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleClose}
                    style={{
                        border: 'none',
                        background: 'none',
                        fontSize: '20px',
                        color: '#999',
                        padding: '8px',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
            </div>

            {showIOSPrompt ? (
                <div style={{
                    background: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#444',
                    lineHeight: '1.5'
                }}>
                    브라우저 하단의 <strong>공유 버튼</strong> <span style={{ fontSize: '16px' }}>⎋</span> 을 누르고<br />
                    <strong>'홈 화면에 추가'</strong>를 선택해 주세요.
                </div>
            ) : (
                <button
                    onClick={handleInstallClick}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#0D47A1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        cursor: 'pointer'
                    }}
                >
                    앱 다운로드
                </button>
            )}
        </div>
    );
}
