'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useApp } from '@/lib/store';
import SessionBanner from '@/components/SessionBanner';
import CounterBar from '@/components/CounterBar';
import MyInfoCard from '@/components/MyInfoCard';
import MyMissionCard from '@/components/MyMissionCard';
import ControlDeptCards from '@/components/ControlDeptCards';

function DashboardContent() {
    const { currentEmployee, getTotalCount, excelData } = useApp();
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isMounted, setIsMounted] = useState(false);
    const searchParams = useSearchParams();
    const isObserver = searchParams.get('role') === 'observer';

    useEffect(() => {
        setIsMounted(true);
        const interval = setInterval(() => {
            setLastUpdated(new Date());
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (!excelData) {
        return (
            <div className="page">
                <SessionBanner />
                <div className="header">
                    <Link href="/" className="header-back">←</Link>
                    <h1 className="header-title">통제단 대시보드</h1>
                </div>
                <div className="page-content">
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#757575' }}>
                            데이터가 없습니다.
                            <br />
                            <Link href="/admin" style={{ color: '#1E88E5' }}>관리자 페이지에서 엑셀 업로드</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <SessionBanner />
            <CounterBar />

            <div className="header">
                <Link href="/" className="header-back">←</Link>
                <h1 className="header-title">
                    통제단 대시보드
                    {isObserver && <span style={{ fontSize: '12px', color: '#1565C0', marginLeft: '8px', fontWeight: 500 }}>(참관)</span>}
                </h1>
            </div>

            <div className="last-updated">
                마지막 갱신: {isMounted ? formatTime(lastUpdated) : ''}
            </div>

            <div className="page-content">
                {currentEmployee && !isObserver ? (
                    <>
                        <MyInfoCard />
                        <MyMissionCard />
                    </>
                ) : isObserver ? (
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ color: '#1565C0', fontWeight: 600 }}>👁️ 통제단 외 직원 모드</p>
                        <p style={{ color: '#757575', fontSize: '14px', marginTop: '4px' }}>
                            통제단 현황을 열람하고 있습니다
                        </p>
                    </div>
                ) : (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#757575' }}>
                            체크인된 정보가 없습니다.
                            <br />
                            <Link href="/" style={{ color: '#1E88E5' }}>소속 부서 선택하기</Link>
                        </p>
                    </div>
                )}

                <ControlDeptCards />
            </div>

            <Link href={`/reports${isObserver ? '?role=observer' : ''}`} className="report-fab">
                📋 보고서
            </Link>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="page"><div className="header"><h1 className="header-title">로딩 중...</h1></div></div>}>
            <DashboardContent />
        </Suspense>
    );
}

