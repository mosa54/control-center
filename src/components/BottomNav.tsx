'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';

function BottomNavInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { currentEmployee } = useApp();

    // 체크인 과정에서는 항상 숨김
    if (pathname.startsWith('/checkin')) {
        return null;
    }

    // 첫 화면(/)에서는 응소 완료 직원만 하단바 표시
    if (pathname === '/' && !currentEmployee) {
        return null;
    }

    const isObserver = searchParams.get('role') === 'observer';
    // 참관 모드(Observer)로 진입한 사용자는 탭바를 눌러도 권한이 유지되도록 파라미터 보존
    const roleParam = isObserver ? '?role=observer' : '';

    const navItems = [
        { name: '대시보드', href: `/dashboard${roleParam}`, icon: '📱', baseRoute: '/dashboard' },
        { name: '보고서', href: `/reports${roleParam}`, icon: '📋', baseRoute: '/reports' },
        { name: '언론 대응', href: `/media${roleParam}`, icon: '🎤', baseRoute: '/media' },
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
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
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
