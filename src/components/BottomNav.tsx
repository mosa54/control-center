'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';

const LAST_TRAINING_PATH_STORAGE_KEY = 'control-center:last-training-path';

const isTrainingHref = (href: string | null): href is string =>
    href === '/training' || Boolean(href?.startsWith('/training/'));

const applyObserverRole = (href: string, isObserver: boolean) => {
    const [pathname, query = ''] = href.split('?');
    const params = new URLSearchParams(query);

    if (isObserver) {
        params.set('role', 'observer');
    } else {
        params.delete('role');
    }

    const nextQuery = params.toString();
    return `${pathname}${nextQuery ? `?${nextQuery}` : ''}`;
};

function BottomNavInner() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentEmployee, getDeliveredEvents } = useApp();

    const isObserver = searchParams.get('role') === 'observer';
    // 참관 모드(Observer)로 진입한 사용자는 탭바를 눌러도 권한이 유지되도록 파라미터 보존
    const roleParam = isObserver ? '?role=observer' : '';
    const defaultTrainingHref = `/training${roleParam}`;
    const currentQuery = searchParams.toString();

    useEffect(() => {
        if (!pathname.startsWith('/training')) return;

        const currentTrainingHref = applyObserverRole(
            `${pathname}${currentQuery ? `?${currentQuery}` : ''}`,
            isObserver
        );

        try {
            sessionStorage.setItem(LAST_TRAINING_PATH_STORAGE_KEY, currentTrainingHref);
        } catch {
            // Storage can be unavailable in restricted browser modes.
        }
    }, [currentQuery, isObserver, pathname]);

    const handleTrainingClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (
            pathname.startsWith('/training')
            || event.button !== 0
            || event.metaKey
            || event.ctrlKey
            || event.shiftKey
            || event.altKey
        ) {
            return;
        }

        let storedTrainingHref: string | null = null;
        try {
            storedTrainingHref = sessionStorage.getItem(LAST_TRAINING_PATH_STORAGE_KEY);
        } catch {
            storedTrainingHref = null;
        }

        if (!isTrainingHref(storedTrainingHref)) return;

        const targetHref = applyObserverRole(storedTrainingHref, isObserver);
        if (targetHref === defaultTrainingHref) return;

        event.preventDefault();
        router.push(targetHref);
    };

    // 체크인 과정에서는 항상 숨김
    if (pathname.startsWith('/checkin')) {
        return null;
    }

    // 첫 화면(/)에서는 응소 완료 직원만 하단바 표시
    if (pathname === '/' && !currentEmployee) {
        return null;
    }

    const eventCount = getDeliveredEvents().length;

    const navItems = [
        { name: '대시보드', href: `/dashboard${roleParam}`, icon: '📱', baseRoute: '/dashboard' },
        { name: '보고서', href: `/reports${roleParam}`, icon: '📋', baseRoute: '/reports' },
        { name: '언론 대응', href: `/media${roleParam}`, icon: '🎤', baseRoute: '/media' },
        { name: '훈련모드', href: defaultTrainingHref, icon: '🚨', baseRoute: '/training', badge: eventCount },
        { name: '관리자', href: '/admin', icon: '⚙️', baseRoute: '/admin' }
    ];

    return (
        <div className="bottom-nav-container">
            <div className="bottom-nav">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.baseRoute);
                    return (
                        <Link 
                            key={item.name}
                            href={item.href}
                            onClick={item.baseRoute === '/training' ? handleTrainingClick : undefined}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            style={{ position: 'relative' }}
                        >
                            <span className="nav-icon">
                                {item.icon}
                                {item.badge && item.badge > 0 ? (
                                    <span style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '25%',
                                        background: '#D32F2F',
                                        color: 'white',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        minWidth: '16px',
                                        height: '16px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 4px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}>
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                ) : null}
                            </span>
                            <span className="nav-label">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default function BottomNav() {
    return (
        <Suspense fallback={null}>
            <BottomNavInner />
        </Suspense>
    );
}
