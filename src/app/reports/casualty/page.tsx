'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import FullscreenOverlay from '@/components/FullscreenOverlay';

interface CasualtyRow {
    성명: string;
    성별: '남' | '여' | '';
    연령: string;
    주증상: string;
    이송병원: string;
    중증도: string;
    발견지점: string;
    이송수단: string;
    출발시간: string;
    비고: string;
}

export interface CasualtyReportData {
    수신: string;
    발신: string;
    rows: CasualtyRow[];
    작성자_소속: string;
    작성자_직급: string;
    작성자_성명: string;
}

const formatTimeInput = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length > 2) {
        return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
    }
    return numbers;
};

const createEmptyRow = (): CasualtyRow => ({
    성명: '', 성별: '', 연령: '', 주증상: '', 이송병원: '',
    중증도: '',
    발견지점: '',
    이송수단: '',
    출발시간: '', 비고: ''
});

const INITIAL_ROWS = Array.from({ length: 20 }, () => createEmptyRow());

function PinModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = () => {
        if (pin === '1234') {
            onSuccess();
        } else {
            setError(true);
        }
    };

    return (
        <div className="pin-overlay">
            <div className="pin-modal">
                <h3>🔒 PIN 입력</h3>
                <p style={{ fontSize: '14px', color: '#757575', marginBottom: '16px' }}>
                    보고서 작성을 위해 PIN을 입력하세요
                </p>
                <input
                    type="password"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="····"
                    maxLength={4}
                    autoFocus
                />
                {error && <p style={{ color: '#D32F2F', fontSize: '14px', marginBottom: '8px' }}>잘못된 PIN입니다.</p>}
                <div className="pin-modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>취소</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>확인</button>
                </div>
            </div>
        </div>
    );
}

function CasualtyPreview({ data, lastSavedAt }: { data: CasualtyReportData, lastSavedAt?: string }) {
    const counts = {
        긴급: data.rows.filter(r => r.중증도 === '긴급').length,
        응급: data.rows.filter(r => r.중증도 === '응급').length,
        비응급: data.rows.filter(r => r.중증도 === '비응급').length,
        사망: data.rows.filter(r => r.중증도 === '사망').length,
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
                        {data.rows.map((row, i) => (
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

function CasualtyReportContent() {
    const searchParams = useSearchParams();
    const isObserver = searchParams.get('role') === 'observer';
    const roleParam = isObserver ? '?role=observer' : '';

    const [isAuthed, setIsAuthed] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [data, setData] = useState<CasualtyReportData>({
        수신: '', 발신: '',
        rows: [...INITIAL_ROWS],
        작성자_소속: '', 작성자_직급: '', 작성자_성명: '',
    });
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<string>('');

    // DB에서 데이터 로드 + 실시간 구독
    useEffect(() => {
        const loadData = async () => {
            const { data: row, error } = await supabase
                .from('reports')
                .select('data, updated_at')
                .eq('id', 'casualty')
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error("Error loading initial data:", error);
            }
            if (row?.data) {
                setData(row.data as CasualtyReportData);
                if (row.updated_at) {
                    const d = new Date(row.updated_at);
                    setLastSavedAt(`${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
                }
            }
        };
        loadData();

        const channel = supabase
            .channel('report-casualty')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reports',
                filter: 'id=eq.casualty',
            }, (payload: any) => {
                if (payload.new?.data) {
                    setData(payload.new.data as CasualtyReportData);
                    if (payload.new.updated_at) {
                        const d = new Date(payload.new.updated_at);
                        setLastSavedAt(`${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
                    }
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const updateRow = (index: number, field: keyof CasualtyRow, value: any) => {
        setData(prev => {
            const newRows = [...prev.rows];
            newRows[index] = { ...newRows[index], [field]: value };
            return { ...prev, rows: newRows };
        });
    };

    const addRow = () => {
        setData(prev => ({ ...prev, rows: [...prev.rows, createEmptyRow()] }));
    };

    const removeRow = (index: number) => {
        setData(prev => ({ ...prev, rows: prev.rows.filter((_, i) => i !== index) }));
    };

    const handleSave = useCallback(async () => {
        setSaveStatus('saving');
        try {
            const { error } = await supabase
                .from('reports')
                .upsert({ id: 'casualty', data, updated_at: new Date().toISOString() });
            if (error) {
                console.error("Supabase Save Error:", error);
                alert(`저장 실패: ${error.message}`);
                throw error;
            }
            const d = new Date();
            setLastSavedAt(`${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, [data]);

    const handleEdit = () => {
        if (isAuthed) return;
        setShowPinModal(true);
    };

    const handleDownloadHwpx = async () => {
        const { generateCasualtyReportHwpx } = await import('@/lib/hwpxGenerator');
        await generateCasualtyReportHwpx(data);
    };

    // 인증되지 않은 상태
    if (!isAuthed) {
        return (
            <div className="page">
                <div className="header">
                    <Link href={`/reports${roleParam}`} className="header-back">←</Link>
                    <h1 className="header-title">사상자 이송현황</h1>
                </div>

                <div className="page-content" style={{ padding: '16px' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '48px', marginBottom: '12px' }}>🚑</p>
                        <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>사상자 이송현황</p>
                        <p style={{ color: '#757575', fontSize: '14px', marginBottom: '16px' }}>
                            사상자 명단과 이송 현황을 관리합니다
                        </p>
                        <button className="btn btn-primary btn-block" onClick={handleEdit}>
                            🔒 PIN 입력하여 작성하기
                        </button>
                        <button
                            className="btn btn-secondary btn-block"
                            style={{ marginTop: '8px' }}
                            onClick={() => setShowFullscreen(true)}
                        >
                            👁️ 보고서 보기
                        </button>
                        <button
                            className="btn btn-block"
                            style={{ marginTop: '8px', background: '#43A047', color: 'white' }}
                            onClick={handleDownloadHwpx}
                        >
                            📥 HWPX 다운로드
                        </button>
                    </div>
                </div>

                {showPinModal && (
                    <PinModal
                        onSuccess={() => { setIsAuthed(true); setShowPinModal(false); }}
                        onCancel={() => setShowPinModal(false)}
                    />
                )}

                {showFullscreen && (
                    <FullscreenOverlay onClose={() => setShowFullscreen(false)}>
                        <CasualtyPreview data={data} lastSavedAt={lastSavedAt} />
                    </FullscreenOverlay>
                )}
            </div>
        );
    }

    const counts = {
        긴급: data.rows.filter(r => r.중증도 === '긴급').length,
        응급: data.rows.filter(r => r.중증도 === '응급').length,
        비응급: data.rows.filter(r => r.중증도 === '비응급').length,
        사망: data.rows.filter(r => r.중증도 === '사망').length,
    };
    const totalCount = counts.긴급 + counts.응급 + counts.비응급 + counts.사망;

    // 인증된 상태: 편집 폼
    return (
        <div className="page">
            <div className="header">
                <Link href={`/reports${roleParam}`} className="header-back">←</Link>
                <h1 className="header-title">사상자 이송현황 작성</h1>
            </div>

            <div className="report-actions">
                <button
                    className="btn"
                    style={{
                        background: saveStatus === 'saved' ? '#2E7D32' : saveStatus === 'error' ? '#D32F2F' : '#1565C0',
                        color: 'white'
                    }}
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                >
                    {saveStatus === 'saving' ? '⏳ 저장 중...' : saveStatus === 'saved' ? '✅ 저장 완료' : saveStatus === 'error' ? '❌ 오류' : '💾 저장'}
                </button>
                <button className="btn btn-primary" onClick={() => setShowFullscreen(true)}>👁️ 보고서 보기</button>
                <button className="btn" style={{ background: '#43A047', color: 'white' }} onClick={handleDownloadHwpx}>📥 HWPX</button>
            </div>

            <div className="page-content" style={{ padding: '16px' }}>
                {/* 상단 정보 */}

                {/* 사상자 목록 */}
                <div className="card">
                    <div className="report-form-section">
                        <h3>🚑 사상자 명단</h3>
                        <p style={{ fontSize: '12px', color: '#757575', marginBottom: '12px' }}>
                            좌우로 스크롤하여 모든 항목을 입력하세요
                        </p>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: '60px' }}>번호</th>
                                        <th style={{ minWidth: '80px' }}>성명</th>
                                        <th style={{ minWidth: '60px' }}>성별</th>
                                        <th style={{ minWidth: '60px' }}>연<br />령</th>
                                        <th style={{ minWidth: '120px' }}>주증상(손상원인)</th>
                                        <th style={{ minWidth: '90px' }}>이송병원</th>
                                        <th style={{ minWidth: '65px' }}>중증도<br />분류</th>
                                        <th style={{ minWidth: '90px' }}>발견지점</th>
                                        <th style={{ minWidth: '80px' }}>이송수단</th>
                                        <th style={{ minWidth: '60px' }}>출발시간</th>
                                        <th style={{ minWidth: '80px' }}>비고</th>
                                        <th style={{ minWidth: '40px' }}>삭제</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.rows.map((row, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td><input value={row.성명} onChange={e => updateRow(i, '성명', e.target.value)} /></td>
                                            <td>
                                                <select value={row.성별} onChange={e => updateRow(i, '성별', e.target.value)}>
                                                    <option value=""></option>
                                                    <option value="남">남</option>
                                                    <option value="여">여</option>
                                                </select>
                                            </td>
                                            <td><input type="number" value={row.연령} onChange={e => updateRow(i, '연령', e.target.value)} style={{ width: '40px' }} /></td>
                                            <td><input value={row.주증상} onChange={e => updateRow(i, '주증상', e.target.value)} /></td>
                                            <td><input value={row.이송병원} onChange={e => updateRow(i, '이송병원', e.target.value)} /></td>
                                            <td>
                                                <select value={row.중증도} onChange={e => updateRow(i, '중증도', e.target.value)}>
                                                    <option value=""></option>
                                                    <option value="긴급">긴급</option>
                                                    <option value="응급">응급</option>
                                                    <option value="비응급">비응급</option>
                                                    <option value="사망">사망</option>
                                                </select>
                                            </td>
                                            <td><input value={row.발견지점} onChange={e => updateRow(i, '발견지점', e.target.value)} /></td>
                                            <td>
                                                <select value={row.이송수단} onChange={e => updateRow(i, '이송수단', e.target.value)}>
                                                    <option value=""></option>
                                                    <option value="119">119</option>
                                                    <option value="병원">병원</option>
                                                    <option value="이송업자">이송업자</option>
                                                    <option value="기타">기타</option>
                                                </select>
                                            </td>
                                            <td><input value={row.출발시간} onChange={e => updateRow(i, '출발시간', formatTimeInput(e.target.value))} placeholder="00:00" style={{ width: '45px' }} /></td>
                                            <td><input value={row.비고} onChange={e => updateRow(i, '비고', e.target.value)} style={{ width: '45px' }} /></td>
                                            <td>
                                                <button
                                                    onClick={() => { if (confirm('이 행을 삭제하시겠습니까?')) removeRow(i); }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '16px',
                                                        color: '#D32F2F',
                                                        padding: '4px'
                                                    }}
                                                    title="행 삭제"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            className="btn btn-secondary btn-block"
                            style={{ marginTop: '12px' }}
                            onClick={addRow}
                        >
                            + 행 추가
                        </button>
                    </div>
                </div>

                {/* 작성자 */}
                <div className="card">
                    <div className="report-form-section">
                        <h3>✍️ 작성자</h3>
                        <div className="report-form-row">
                            <label>소속</label>
                            <input value={data.작성자_소속} onChange={e => setData(prev => ({ ...prev, 작성자_소속: e.target.value }))} />
                        </div>
                        <div className="report-form-row">
                            <label>직급</label>
                            <input value={data.작성자_직급} onChange={e => setData(prev => ({ ...prev, 작성자_직급: e.target.value }))} />
                        </div>
                        <div className="report-form-row">
                            <label>성명</label>
                            <input value={data.작성자_성명} onChange={e => setData(prev => ({ ...prev, 작성자_성명: e.target.value }))} />
                        </div>
                    </div>
                </div>

                <div style={{ height: '60px' }} />
            </div>

            {showFullscreen && (
                <FullscreenOverlay onClose={() => setShowFullscreen(false)}>
                    <CasualtyPreview data={data} lastSavedAt={lastSavedAt} />
                </FullscreenOverlay>
            )}
        </div>
    );
}

export default function CasualtyReportPage() {
    return (
        <Suspense fallback={<div className="page"><div className="header"><h1 className="header-title">로딩 중...</h1></div></div>}>
            <CasualtyReportContent />
        </Suspense>
    );
}
