'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import SessionBanner from '@/components/SessionBanner';
import CounterBar from '@/components/CounterBar';
import MyInfoCard from '@/components/MyInfoCard';
import MyMissionCard from '@/components/MyMissionCard';
import ControlDeptCards from '@/components/ControlDeptCards';

export default function DashboardPage() {
    const { currentEmployee, getTotalCount, excelData } = useApp();
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
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
                <h1 className="header-title">통제단 대시보드</h1>
            </div>

            <div className="last-updated">
                마지막 갱신: {formatTime(lastUpdated)}
            </div>

            <div className="page-content">
                {currentEmployee ? (
                    <>
                        <MyInfoCard />
                        <MyMissionCard />
                    </>
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
        </div>
    );
}
