'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import FullscreenOverlay from '@/components/FullscreenOverlay';
import { FilePreview } from '@/components/FileUploadReport';
import { normalizeReportFileData, preloadPdfViewer, reportHasPdf, type NormalizedReportFileData } from '@/lib/pdfPreview';
import type { CasualtyReportData } from './casualty/page';

type PreviewType = 'accident' | 'casualty' | 'building-register' | 'building-plan' | 'misc-docs' | 'response-plan' | 'field-command' | 'resource-support';
type PreviewStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

interface PreviewCacheEntry {
    data: PreviewData;
    lastSavedAt: string;
    updatedAt: string;
}

type PreviewData = NormalizedReportFileData | CasualtyReportData;
const CASUALTY_PREVIEW_SYNC_INTERVAL_MS = 5000;

interface RealtimeReportRow {
    data?: unknown;
    updated_at?: string | null;
}

function ReportsContent() {
    const searchParams = useSearchParams();
    const isObserver = searchParams.get('role') === 'observer';
    const roleParam = isObserver ? '?role=observer' : '';

    const [previewType, setPreviewType] = useState<PreviewType | null>(null);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [lastSavedAt, setLastSavedAt] = useState<string>('');
    const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('idle');
    const previewCacheRef = useRef<Partial<Record<PreviewType, PreviewCacheEntry>>>({});
    const previewRequestRef = useRef<Partial<Record<PreviewType, Promise<PreviewCacheEntry | null>>>>({});
    const openRequestIdRef = useRef(0);
    const previewTypeRef = useRef<PreviewType | null>(null);
    const casualtySyncRevisionRef = useRef(0);

    const formatUpdatedAt = useCallback((value?: string | null) => {
        if (!value) {
            return '';
        }

        const d = new Date(value);
        return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }, []);

    const fetchPreviewData = useCallback(async (type: PreviewType, forceRefresh = false): Promise<PreviewCacheEntry | null> => {
        if (!forceRefresh) {
            const cached = previewCacheRef.current[type];
            if (cached) {
                return cached;
            }
        }

        const pending = previewRequestRef.current[type];
        if (pending) {
            return pending;
        }

        const casualtyRevisionAtStart = type === 'casualty'
            ? casualtySyncRevisionRef.current
            : null;
        const request: Promise<PreviewCacheEntry | null> = (async () => {
            try {
                const { data: row, error } = await supabase
                    .from('reports')
                    .select('data, updated_at')
                    .eq('id', type)
                    .single();

                if (error) {
                    throw error;
                }

                if (!row?.data) {
                    return null;
                }

                const normalizedData = type === 'casualty'
                    ? row.data
                    : normalizeReportFileData(row.data);

                if (!normalizedData) {
                    return null;
                }

                const entry = {
                    data: normalizedData,
                    lastSavedAt: formatUpdatedAt(row.updated_at),
                    updatedAt: row.updated_at ?? '',
                };

                if (type === 'casualty' && casualtyRevisionAtStart !== casualtySyncRevisionRef.current) {
                    return previewCacheRef.current.casualty ?? null;
                }

                previewCacheRef.current[type] = entry;

                if (reportHasPdf(normalizedData)) {
                    void preloadPdfViewer();
                }

                return entry;
            } finally {
                delete previewRequestRef.current[type];
            }
        })();

        previewRequestRef.current[type] = request;
        return request;
    }, [formatUpdatedAt]);

    const applyRealtimeCasualtyRow = useCallback((row: RealtimeReportRow | null) => {
        const currentEntry = previewCacheRef.current.casualty;
        const updatedAt = row?.updated_at ?? '';

        if (updatedAt && currentEntry?.updatedAt === updatedAt) {
            return;
        }

        casualtySyncRevisionRef.current += 1;

        if (!row?.data) {
            delete previewCacheRef.current.casualty;
            if (previewTypeRef.current === 'casualty') {
                setPreviewData(null);
                setLastSavedAt('');
                setPreviewStatus('empty');
            }
            return;
        }

        const entry: PreviewCacheEntry = {
            data: row.data as CasualtyReportData,
            lastSavedAt: formatUpdatedAt(row.updated_at),
            updatedAt,
        };
        previewCacheRef.current.casualty = entry;

        if (previewTypeRef.current === 'casualty') {
            setPreviewData(entry.data);
            setLastSavedAt(entry.lastSavedAt);
            setPreviewStatus('ready');
        }
    }, [formatUpdatedAt]);

    const refreshOpenCasualtyPreview = useCallback(async () => {
        if (previewTypeRef.current !== 'casualty') {
            return;
        }

        const previousUpdatedAt = previewCacheRef.current.casualty?.updatedAt;

        try {
            const entry = await fetchPreviewData('casualty', true);
            if (previewTypeRef.current !== 'casualty') {
                return;
            }

            if (!entry) {
                setPreviewData(null);
                setLastSavedAt('');
                setPreviewStatus('empty');
                return;
            }

            if (entry.updatedAt && entry.updatedAt === previousUpdatedAt) {
                return;
            }

            setPreviewData(entry.data);
            setLastSavedAt(entry.lastSavedAt);
            setPreviewStatus('ready');
        } catch (error) {
            console.warn('Failed to refresh casualty report preview:', error);
        }
    }, [fetchPreviewData]);

    useEffect(() => {
        const refresh = () => {
            if (previewTypeRef.current === 'casualty') {
                void refreshOpenCasualtyPreview();
            }
        };

        const channel = supabase
            .channel('report-casualty-preview')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reports',
                filter: 'id=eq.casualty',
            }, (payload) => {
                applyRealtimeCasualtyRow(payload.new as RealtimeReportRow | null);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    refresh();
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.warn(`Casualty preview realtime status: ${status}`);
                }
            });

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                refresh();
            }
        }, CASUALTY_PREVIEW_SYNC_INTERVAL_MS);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refresh();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            void supabase.removeChannel(channel);
        };
    }, [applyRealtimeCasualtyRow, refreshOpenCasualtyPreview]);

    const warmPreview = useCallback((type: PreviewType) => {
        void fetchPreviewData(type).catch(() => null);
    }, [fetchPreviewData]);

    const handlePreview = useCallback(async (type: PreviewType) => {
        const requestId = ++openRequestIdRef.current;
        previewTypeRef.current = type;
        setPreviewType(type);

        const cached = previewCacheRef.current[type];
        if (cached) {
            setPreviewData(cached.data);
            setLastSavedAt(cached.lastSavedAt);
            setPreviewStatus('ready');

            if (reportHasPdf(cached.data)) {
                void preloadPdfViewer();
            }
            if (type === 'casualty') {
                void refreshOpenCasualtyPreview();
            }
            return;
        }

        setPreviewData(null);
        setLastSavedAt('');
        setPreviewStatus('loading');

        try {
            const entry = await fetchPreviewData(type);
            if (openRequestIdRef.current !== requestId) {
                return;
            }

            if (!entry) {
                setPreviewData(null);
                setLastSavedAt('');
                setPreviewStatus('empty');
                return;
            }

            setPreviewData(entry.data);
            setLastSavedAt(entry.lastSavedAt);
            setPreviewStatus('ready');
        } catch (error) {
            if (openRequestIdRef.current !== requestId) {
                return;
            }

            console.error('Failed to load report preview:', error);
            setPreviewData(null);
            setLastSavedAt('');
            setPreviewStatus('error');
        }
    }, [fetchPreviewData, refreshOpenCasualtyPreview]);

    const closePreview = useCallback(() => {
        openRequestIdRef.current += 1;
        previewTypeRef.current = null;
        setPreviewType(null);
        setPreviewData(null);
        setLastSavedAt('');
        setPreviewStatus('idle');
    }, []);

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
                        <Link href={`/reports/accident${roleParam}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '12px 20px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="report-card-icon">🔥</span>
                            <div className="report-card-text">
                                <span className="report-card-title">화재 등 사고상황보고서</span>
                                <span className="report-card-desc">발생개요, 피해상황, 동원상황, 조치사항</span>
                            </div>
                        </Link>
                        <button
                            className="report-preview-btn"
                            onClick={() => handlePreview('accident')}
                            onPointerDown={() => warmPreview('accident')}
                            onMouseEnter={() => warmPreview('accident')}
                            title="보고서 보기"
                        >
                            👁️
                        </button>
                    </div>

                    {/* 사상자 이송현황 카드 */}
                    <div className="report-card" style={{ borderLeftColor: '#1E88E5', padding: 0, cursor: 'default' }}>
                        <Link href={`/reports/casualty${roleParam}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '12px 20px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="report-card-icon">🚑</span>
                            <div className="report-card-text">
                                <span className="report-card-title">사상자 이송현황</span>
                                <span className="report-card-desc">사상자 명단, 중증도 분류, 이송수단</span>
                            </div>
                        </Link>
                        <button
                            className="report-preview-btn"
                            onClick={() => handlePreview('casualty')}
                            onPointerDown={() => warmPreview('casualty')}
                            onMouseEnter={() => warmPreview('casualty')}
                            title="보고서 보기"
                        >
                            👁️
                        </button>
                    </div>

                    {/* 건축물 대장 등 카드 */}
                    <div className="report-card" style={{ borderLeftColor: '#43A047', padding: 0, cursor: 'default' }}>
                        <Link href={`/reports/building-register${roleParam}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '12px 20px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="report-card-icon">🏢</span>
                            <div className="report-card-text">
                                <span className="report-card-title">건축물 대장 등</span>
                                <span className="report-card-desc">건축물 대장, 관련 서류 업로드</span>
                            </div>
                        </Link>
                        <button
                            className="report-preview-btn"
                            onClick={() => handlePreview('building-register')}
                            onPointerDown={() => warmPreview('building-register')}
                            onMouseEnter={() => warmPreview('building-register')}
                            title="파일 보기"
                        >
                            👁️
                        </button>
                    </div>

                    {/* 건축물 도면 카드 */}
                    <div className="report-card" style={{ borderLeftColor: '#FB8C00', padding: 0, cursor: 'default' }}>
                        <Link href={`/reports/building-plan${roleParam}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '12px 20px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="report-card-icon">📐</span>
                            <div className="report-card-text">
                                <span className="report-card-title">건축물 도면</span>
                                <span className="report-card-desc">건축물 도면, 설계도 업로드</span>
                            </div>
                        </Link>
                        <button
                            className="report-preview-btn"
                            onClick={() => handlePreview('building-plan')}
                            onPointerDown={() => warmPreview('building-plan')}
                            onMouseEnter={() => warmPreview('building-plan')}
                            title="파일 보기"
                        >
                            👁️
                        </button>
                    </div>

                    {/* 기타 자료 카드 */}
                    <div className="report-card" style={{ borderLeftColor: '#7E57C2', padding: 0, cursor: 'default' }}>
                        <Link href={`/reports/misc-docs${roleParam}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '12px 20px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="report-card-icon">📂</span>
                            <div className="report-card-text">
                                <span className="report-card-title">기타 자료</span>
                                <span className="report-card-desc">현황판, 작전도 등 참고자료</span>
                            </div>
                        </Link>
                        <button
                            className="report-preview-btn"
                            onClick={() => handlePreview('misc-docs')}
                            onPointerDown={() => warmPreview('misc-docs')}
                            onMouseEnter={() => warmPreview('misc-docs')}
                            title="파일 보기"
                        >
                            👁️
                        </button>
                    </div>

                    {/* 대응계획부 보고서 카드 */}
                    <div className="report-card" style={{ borderLeftColor: '#43A047', padding: 0, cursor: 'default' }}>
                        <Link href={`/reports/response-plan${roleParam}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '12px 20px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="report-card-icon">📋</span>
                            <div className="report-card-text">
                                <span className="report-card-title">대응계획부 보고서</span>
                                <span className="report-card-desc">대응계획부 관련 자료 및 서류 업로드</span>
                            </div>
                        </Link>
                        <button
                            className="report-preview-btn"
                            onClick={() => handlePreview('response-plan')}
                            onPointerDown={() => warmPreview('response-plan')}
                            onMouseEnter={() => warmPreview('response-plan')}
                            title="파일 보기"
                        >
                            👁️
                        </button>
                    </div>

                    {/* 현장지휘부 보고서 카드 */}
                    <div className="report-card" style={{ borderLeftColor: '#8E24AA', padding: 0, cursor: 'default' }}>
                        <Link href={`/reports/field-command${roleParam}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '12px 20px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="report-card-icon">🚩</span>
                            <div className="report-card-text">
                                <span className="report-card-title">현장지휘부 보고서</span>
                                <span className="report-card-desc">현장지휘부 관련 자료 및 서류 업로드</span>
                            </div>
                        </Link>
                        <button
                            className="report-preview-btn"
                            onClick={() => handlePreview('field-command')}
                            onPointerDown={() => warmPreview('field-command')}
                            onMouseEnter={() => warmPreview('field-command')}
                            title="파일 보기"
                        >
                            👁️
                        </button>
                    </div>

                    {/* 자원지원부 보고서 카드 */}
                    <div className="report-card" style={{ borderLeftColor: '#1E88E5', padding: 0, cursor: 'default' }}>
                        <Link href={`/reports/resource-support${roleParam}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '12px 20px', textDecoration: 'none', color: 'inherit' }}>
                            <span className="report-card-icon">📦</span>
                            <div className="report-card-text">
                                <span className="report-card-title">자원지원부 보고서</span>
                                <span className="report-card-desc">자원지원부 관련 자료 및 서류 업로드</span>
                            </div>
                        </Link>
                        <button
                            className="report-preview-btn"
                            onClick={() => handlePreview('resource-support')}
                            onPointerDown={() => warmPreview('resource-support')}
                            onMouseEnter={() => warmPreview('resource-support')}
                            title="파일 보기"
                        >
                            👁️
                        </button>
                    </div>
                </div>
            </div>

            {/* 전체화면 미리보기 */}
            {previewType && (
                <FullscreenOverlay onClose={closePreview}>
                    {previewStatus === 'loading' ? (
                        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                            <p style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</p>
                            <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                                보고서를 불러오는 중입니다.
                            </p>
                            <p style={{ color: '#757575', fontSize: '14px' }}>
                                잠시만 기다려 주세요.
                            </p>
                        </div>
                    ) : previewStatus === 'empty' ? (
                        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
                            <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                                저장된 보고서가 없습니다
                            </p>
                            <p style={{ color: '#757575', fontSize: '14px' }}>
                                보고서를 먼저 작성하고 저장하세요
                            </p>
                        </div>
                    ) : previewStatus === 'error' ? (
                        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                            <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</p>
                            <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                                보고서를 불러오지 못했습니다.
                            </p>
                            <p style={{ color: '#757575', fontSize: '14px' }}>
                                다시 시도해 주세요.
                            </p>
                        </div>
                    ) : previewType === 'accident' ? (
                        <AccidentPreviewInline data={previewData as NormalizedReportFileData | null} />
                    ) : previewType === 'casualty' ? (
                        <CasualtyPreviewInline data={previewData as CasualtyReportData | null} lastSavedAt={lastSavedAt} />
                    ) : (
                        <FilePreview data={previewData as NormalizedReportFileData | null} />
                    )}
                </FullscreenOverlay>
            )}
        </div>
    );
}

import { AccidentPreview } from './accident/page';

/* 사고상황보고서 인라인 미리보기 (파일 업로드 버전) */
function AccidentPreviewInline({ data }: { data: NormalizedReportFileData | null }) {
    // data is now { fileName, fileType, fileData, updatedAt }
    // We can reuse the same preview component from accident page
    return <AccidentPreview data={data} />;
}

/* 사상자 이송현황 인라인 미리보기 (간략 버전) */
function CasualtyPreviewInline({ data, lastSavedAt }: { data: CasualtyReportData | null, lastSavedAt?: string }) {
    if (!data) {
        return null;
    }

    const getSeverityBg = (severity: string) => {
        switch (severity) {
            case '긴급': return { backgroundColor: '#FFCDD2' };
            case '응급': return { backgroundColor: '#FFF9C4' };
            case '비응급': return { backgroundColor: '#C8E6C9' };
            case '지연': return { backgroundColor: '#E0E0E0' };
            default: return {};
        }
    };

    const rows = data.rows ?? [];
    const counts = {
        긴급: rows.filter((r) => r.중증도 === '긴급').length,
        응급: rows.filter((r) => r.중증도 === '응급').length,
        비응급: rows.filter((r) => r.중증도 === '비응급').length,
        지연: rows.filter((r) => r.중증도 === '지연').length,
    };
    const totalCount = counts.긴급 + counts.응급 + counts.비응급 + counts.지연;

    return (
        <div className="fullscreen-report">
            <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>사상자 이송현황</h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px', gap: '16px' }}>
                <table className="report-table" style={{ width: '55%', margin: 0 }}>
                    <thead>
                        <tr>
                            <th style={{ background: '#BBDEFB' }}>합계</th>
                            <th style={{ background: '#FFCDD2' }}>긴급</th>
                            <th style={{ background: '#FFF9C4' }}>응급</th>
                            <th style={{ background: '#C8E6C9' }}>비응급</th>
                            <th style={{ background: '#E0E0E0' }}>지연</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ fontWeight: 700 }}>{totalCount}</td>
                            <td style={{ color: '#D32F2F', fontWeight: 700 }}>{counts.긴급}</td>
                            <td style={{ color: '#FBC02D', fontWeight: 700 }}>{counts.응급}</td>
                            <td style={{ color: '#388E3C', fontWeight: 700 }}>{counts.비응급}</td>
                            <td style={{ fontWeight: 700 }}>{counts.지연}</td>
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
                            <th style={{ width: '4%' }}>성<br />별</th>
                            <th style={{ width: '5%' }}>연<br />령</th>
                            <th style={{ width: '13%' }}>주증상<br />(원인)</th>
                            <th style={{ width: '11%' }}>이송<br />병원</th>
                            <th style={{ width: '10%' }}>중증도<br />분류</th>
                            <th style={{ width: '10%' }}>발견<br />지점</th>
                            <th style={{ width: '9%' }}>이송<br />수단</th>
                            <th style={{ width: '8%' }}>출발<br />시간</th>
                            <th style={{ width: '9%' }}>인계자</th>
                            <th style={{ width: '8%' }}>비고</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{row.성명}</td>
                                <td>{row.성별}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>{row.연령}</td>
                                <td>{row.주증상}</td>
                                <td>{row.이송병원}</td>
                                <td style={getSeverityBg(row.중증도)}>{row.중증도}</td>
                                <td>{row.발견지점}</td>
                                <td>{row.이송수단}</td>
                                <td>{row.출발시간}</td>
                                <td>{row.인계자}</td>
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
