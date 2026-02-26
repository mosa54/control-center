'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import FullscreenOverlay from '@/components/FullscreenOverlay';

function ReportsContent() {
    const searchParams = useSearchParams();
    const isObserver = searchParams.get('role') === 'observer';
    const roleParam = isObserver ? '?role=observer' : '';

    const [previewType, setPreviewType] = useState<'accident' | 'casualty' | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [lastSavedAt, setLastSavedAt] = useState<string>('');

    const handlePreview = async (type: 'accident' | 'casualty') => {
        const { data: row } = await supabase
            .from('reports')
            .select('data, updated_at')
            .eq('id', type)
            .single();

        if (row?.data) {
            setPreviewData(row.data);
            if (row.updated_at) {
                const d = new Date(row.updated_at);
                setLastSavedAt(`${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
            }
        } else {
            setPreviewData(null);
        }
        setPreviewType(type);
    };

    return (
        <div className="page">
            <div className="header">
                <Link href={`/dashboard${roleParam}`} className="header-back">←</Link>
                <h1 className="header-title">보고서 작성 또는 보기</h1>
            </div>

            <div className="page-content" style={{ padding: '16px' }}>
                <p style={{ textAlign: 'center', color: '#757575', marginBottom: '16px' }}>
                    작성하거나 확인할 보고서를 선택하세요
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* 사고상황보고서 카드 */}
                    <div className="report-card" style={{ borderLeftColor: '#E53935', padding: 0, cursor: 'default' }}>
                        <Link href={`/reports/accident${roleParam}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '20px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="report-card-icon">🔥</span>
                            <div className="report-card-text">
                                <span className="report-card-title">화재 등 사고상황보고서</span>
                                <span className="report-card-desc">발생개요, 피해상황, 동원상황, 조치사항</span>
                            </div>
                        </Link>
                        <button
                            className="report-preview-btn"
                            onClick={() => handlePreview('accident')}
                            title="보고서 보기"
                        >
                            👁️
                        </button>
                    </div>

                    {/* 사상자 이송현황 카드 */}
                    <div className="report-card" style={{ borderLeftColor: '#1E88E5', padding: 0, cursor: 'default' }}>
                        <Link href={`/reports/casualty${roleParam}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '20px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="report-card-icon">🚑</span>
                            <div className="report-card-text">
                                <span className="report-card-title">사상자 이송현황</span>
                                <span className="report-card-desc">사상자 명단, 중증도 분류, 이송수단</span>
                            </div>
                        </Link>
                        <button
                            className="report-preview-btn"
                            onClick={() => handlePreview('casualty')}
                            title="보고서 보기"
                        >
                            👁️
                        </button>
                    </div>
                </div>
            </div>

            {/* 전체화면 미리보기 */}
            {previewType && (
                <FullscreenOverlay onClose={() => { setPreviewType(null); setPreviewData(null); }}>
                    {!previewData ? (
                        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
                            <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                                저장된 보고서가 없습니다
                            </p>
                            <p style={{ color: '#757575', fontSize: '14px' }}>
                                보고서를 먼저 작성하고 저장하세요
                            </p>
                        </div>
                    ) : previewType === 'accident' ? (
                        <AccidentPreviewInline data={previewData} />
                    ) : (
                        <CasualtyPreviewInline data={previewData} lastSavedAt={lastSavedAt} />
                    )}
                </FullscreenOverlay>
            )}
        </div>
    );
}

import { AccidentPreview } from './accident/page';

/* 사고상황보고서 인라인 미리보기 (파일 업로드 버전) */
function AccidentPreviewInline({ data }: { data: any }) {
    // data is now { fileName, fileType, fileData, updatedAt }
    // We can reuse the same preview component from accident page
    return <AccidentPreview data={data} />;
}

/* 사상자 이송현황 인라인 미리보기 (간략 버전) */
function CasualtyPreviewInline({ data, lastSavedAt }: { data: any, lastSavedAt?: string }) {
    const counts = {
        긴급: data.rows?.filter((r: any) => r.중증도 === '긴급').length || 0,
        응급: data.rows?.filter((r: any) => r.중증도 === '응급').length || 0,
        비응급: data.rows?.filter((r: any) => r.중증도 === '비응급').length || 0,
        사망: data.rows?.filter((r: any) => r.중증도 === '사망').length || 0,
    };
    const totalCount = counts.긴급 + counts.응급 + counts.비응급 + counts.사망;

    return (
        <div className="fullscreen-report">
            <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>사상자 이송현황</h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px', gap: '16px' }}>
                <table className="report-table" style={{ width: '55%', margin: 0 }}>
                    <thead>
                        <tr>
                            <th style={{ background: '#E0E0E0' }}>합계</th>
                            <th style={{ background: '#FFCDD2' }}>긴급</th>
                            <th style={{ background: '#FFF9C4' }}>응급</th>
                            <th style={{ background: '#C8E6C9' }}>비응급</th>
                            <th style={{ background: '#E0E0E0' }}>사망</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ fontWeight: 700 }}>{totalCount}</td>
                            <td style={{ color: '#D32F2F', fontWeight: 700 }}>{counts.긴급}</td>
                            <td style={{ color: '#FBC02D', fontWeight: 700 }}>{counts.응급}</td>
                            <td style={{ color: '#388E3C', fontWeight: 700 }}>{counts.비응급}</td>
                            <td style={{ fontWeight: 700 }}>{counts.사망}</td>
                        </tr>
                    </tbody>
                </table>

                {lastSavedAt && (
                    <div style={{ flexShrink: 0, fontSize: '14px', color: '#757575', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {lastSavedAt}
                    </div>
                )}
            </div>

            <div>
                <table className="report-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>연<br />번</th>
                            <th style={{ width: '8%' }}>성명</th>
                            <th style={{ width: '5%' }}>성<br />별</th>
                            <th style={{ width: '5%' }}>연<br />령</th>
                            <th style={{ width: '14%' }}>주증상<br />(손상원인)</th>
                            <th style={{ width: '12%' }}>이송<br />병원</th>
                            <th style={{ width: '11%' }}>중증도<br />분류</th>
                            <th style={{ width: '13%' }}>발견<br />지점</th>
                            <th style={{ width: '10%' }}>이송수단</th>
                            <th style={{ width: '9%' }}>출발<br />시간</th>
                            <th style={{ width: '8%' }}>비고</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows?.map((row: any, i: number) => (
                            <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{row.성명}</td>
                                <td>{row.성별}</td>
                                <td>{row.연령}</td>
                                <td>{row.주증상}</td>
                                <td>{row.이송병원}</td>
                                <td>{row.중증도}</td>
                                <td>{row.발견지점}</td>
                                <td>{row.이송수단}</td>
                                <td>{row.출발시간}</td>
                                <td>{row.비고}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '16px', fontSize: '14px', display: 'flex', gap: '24px', justifyContent: 'center' }}>
                <span>□ 작성자 : 소속 <strong>{data.작성자_소속}</strong></span>
                <span>직급 <strong>{data.작성자_직급}</strong></span>
                <span>성명 <strong>{data.작성자_성명}</strong></span>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<div className="page"><div className="header"><h1 className="header-title">로딩 중...</h1></div></div>}>
            <ReportsContent />
        </Suspense>
    );
}
