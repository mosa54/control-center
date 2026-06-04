'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';

const ROSTER_REPORT_ID = 'assembly-roster';
const ROSTER_SYNC_INTERVAL_MS = 5000;

interface RosterReportData {
    dispatchInfo?: string;
}

interface StoredRosterReport {
    data?: unknown;
    updated_at?: string | null;
}

interface RosterRow {
    index: number;
    hasData: boolean;
    time: string;
    originalDept: string;
    rank: string;
    name: string;
}

export default function AssemblyRoster({ onClose }: { onClose: () => void }) {
    const { checkedInEmployees } = useApp();
    const [dispatchInfo, setDispatchInfo] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving'>('idle');
    const [toast, setToast] = useState<string | null>(null);
    const originalDocumentTitleRef = useRef('');
    const lastAppliedUpdatedAtRef = useRef<string | null>(null);
    const syncRevisionRef = useRef(0);

    const applyStoredReport = useCallback((row: StoredRosterReport | null) => {
        if (!row?.data) {
            return;
        }

        const updatedAt = row.updated_at ?? null;
        if (updatedAt && lastAppliedUpdatedAtRef.current === updatedAt) {
            return;
        }

        const reportData = row.data as RosterReportData;
        setDispatchInfo(reportData.dispatchInfo || '');
        lastAppliedUpdatedAtRef.current = updatedAt;
    }, []);

    const loadDispatchInfo = useCallback(async () => {
        const requestRevision = ++syncRevisionRef.current;
        const { data: row, error } = await supabase
            .from('reports')
            .select('data, updated_at')
            .eq('id', ROSTER_REPORT_ID)
            .single();

        if (requestRevision !== syncRevisionRef.current) {
            return;
        }

        if (error && error.code !== 'PGRST116') {
            console.error('Error loading assembly roster dispatch info:', error);
            return;
        }

        applyStoredReport(row);
    }, [applyStoredReport]);

    useEffect(() => {
        const startPrintMode = () => {
            if (document.body.classList.contains('roster-printing')) {
                return;
            }

            originalDocumentTitleRef.current = document.title;
            document.title = '\u200B';
            document.body.classList.add('roster-printing');
        };

        const finishPrintMode = () => {
            document.body.classList.remove('roster-printing');
            if (originalDocumentTitleRef.current) {
                document.title = originalDocumentTitleRef.current;
            }
        };

        document.body.classList.add('roster-preview-open');
        window.addEventListener('beforeprint', startPrintMode);
        window.addEventListener('afterprint', finishPrintMode);

        return () => {
            window.removeEventListener('beforeprint', startPrintMode);
            window.removeEventListener('afterprint', finishPrintMode);
            document.body.classList.remove('roster-preview-open', 'roster-printing');
            if (originalDocumentTitleRef.current) {
                document.title = originalDocumentTitleRef.current;
            }
        };
    }, []);

    useEffect(() => {
        const refresh = () => {
            void loadDispatchInfo();
        };

        refresh();

        const channel = supabase
            .channel('report-assembly-roster')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reports',
                filter: `id=eq.${ROSTER_REPORT_ID}`,
            }, (payload) => {
                syncRevisionRef.current += 1;
                applyStoredReport(payload.new as StoredRosterReport | null);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    refresh();
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.warn(`Assembly roster realtime status: ${status}`);
                }
            });

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                refresh();
            }
        }, ROSTER_SYNC_INTERVAL_MS);

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
    }, [applyStoredReport, loadDispatchInfo]);

    const handleSaveInfo = useCallback(async () => {
        setSaveStatus('saving');
        const updatedAt = new Date().toISOString();
        const { error } = await supabase
            .from('reports')
            .upsert({
                id: ROSTER_REPORT_ID,
                data: { dispatchInfo },
                updated_at: updatedAt,
            });

        if (error) {
            console.error('Error saving assembly roster dispatch info:', error);
            setToast(`저장 실패: ${error.message}`);
            setSaveStatus('idle');
            return;
        }

        syncRevisionRef.current += 1;
        lastAppliedUpdatedAtRef.current = updatedAt;
        setToast('발령정보가 모든 응소부 화면에 공유되었습니다.');
        setSaveStatus('idle');
    }, [dispatchInfo]);

    // Sort check-ins by check-in time (ascending)
    const sortedCheckIns = [...checkedInEmployees].sort((a, b) => new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime());

    const rows: RosterRow[] = [];
    const minRowsPerPage = 30; // Sufficient rows for a full page
    const totalRows = Math.max(minRowsPerPage, sortedCheckIns.length + 5);

    for (let i = 0; i < totalRows; i++) {
        const emp = sortedCheckIns[i];
        if (emp) {
            const checkInDate = new Date(emp.checkedInAt);
            const timeString = `${checkInDate.getHours().toString().padStart(2, '0')}:${checkInDate.getMinutes().toString().padStart(2, '0')}`;

            rows.push({
                index: i + 1,
                hasData: true,
                time: timeString,
                originalDept: emp.소속부서 || '', // Regular department
                rank: emp.직급 || '',
                name: emp.성명 || ''
            });
        } else {
            rows.push({
                index: i + 1,
                hasData: false,
                time: '',
                originalDept: '',
                rank: '',
                name: ''
            });
        }
    }

    const handlePrint = () => {
        if (!document.body.classList.contains('roster-printing')) {
            originalDocumentTitleRef.current = document.title;
            document.title = '\u200B';
            document.body.classList.add('roster-printing');
        }
        window.print();
    };

    const thStyle: React.CSSProperties = { border: '1px solid #000', padding: '4px 2px', textAlign: 'center' };
    const tdStyle: React.CSSProperties = { border: '1px solid #000', padding: '4px 2px', textAlign: 'center', height: '24px' };
    const firstPrintPageRows = 22;
    const followingPrintPageRows = 23;
    const printPages = [rows.slice(0, firstPrintPageRows)];

    for (let startIndex = firstPrintPageRows; startIndex < rows.length; startIndex += followingPrintPageRows) {
        printPages.push(rows.slice(startIndex, startIndex + followingPrintPageRows));
    }

    const renderRosterTable = (tableRows: RosterRow[]) => (
        <table className="roster-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
                <tr>
                    <th style={{ ...thStyle, width: '6%' }}>연번</th>
                    <th style={{ ...thStyle, width: '24%' }}>발령시간/응소장소</th>
                    <th style={{ ...thStyle, width: '11%' }}>응소시간</th>
                    <th style={{ ...thStyle, width: '16%' }}>소 속</th>
                    <th style={{ ...thStyle, width: '12%' }}>계 급</th>
                    <th style={{ ...thStyle, width: '13%' }}>성 명</th>
                    <th style={{ ...thStyle, width: '18%' }}>서명</th>
                </tr>
            </thead>
            <tbody>
                {tableRows.map((row) => (
                    <tr key={row.index}>
                        <td style={tdStyle}>{row.index}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{row.hasData ? dispatchInfo : ''}</td>
                        <td style={tdStyle}>{row.time}</td>
                        <td style={tdStyle}>{row.originalDept}</td>
                        <td style={tdStyle}>{row.rank}</td>
                        <td style={tdStyle}>{row.name}</td>
                        <td style={tdStyle}></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className="page roster-page" style={{ minHeight: '100vh', background: 'white' }}>
            <div className="header no-print">
                <button onClick={onClose} className="header-back" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>←</button>
                <h1 className="header-title" style={{ whiteSpace: 'nowrap' }}>응소부 미리보기</h1>
                <button onClick={handlePrint} className="btn" style={{ position: 'absolute', right: '16px', background: '#424242', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 600 }}>
                    🖨️ 인쇄
                </button>
            </div>

            <div className="page-content" style={{ padding: '0', background: 'white' }}>
                <div className="no-print" style={{ padding: '16px', background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label className="form-label" style={{ fontSize: '13px' }}>발령시간/응소장소 (해당 행에 응소 데이터가 있을 때만 표기됩니다)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="예: 22:00 / 중부소방서 마당"
                                    value={dispatchInfo}
                                    onChange={(e) => setDispatchInfo(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSaveInfo}
                                className="btn btn-primary"
                                disabled={saveStatus === 'saving'}
                                style={{ height: '44px', padding: '0 16px', whiteSpace: 'nowrap' }}
                            >
                                {saveStatus === 'saving' ? '저장 중...' : '💾 저장'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 화면 꽉 차게 조절 (모바일에서도 줄바꿈 안 되게 폰트 크기 자동 조절) */}
                <div className="roster-wrapper" style={{ width: '100%', padding: '16px 8px', overflow: 'hidden' }}>
                    <div className="roster-print-area roster-screen-area" style={{ color: 'black', background: 'white', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                        <h1 className="roster-title" style={{ textAlign: 'center', letterSpacing: '8px', margin: '16px 0 24px', fontWeight: 900, whiteSpace: 'nowrap' }}>
                            통 제 단 소 집 응 소 부
                        </h1>

                        {renderRosterTable(rows)}
                    </div>

                    <div className="roster-print-pages">
                        {printPages.map((pageRows, pageIndex) => (
                            <section className="roster-print-sheet" key={pageIndex}>
                                {pageIndex === 0 && (
                                    <h1 className="roster-title" style={{ textAlign: 'center', letterSpacing: '8px', margin: '16px 0 24px', fontWeight: 900, whiteSpace: 'nowrap' }}>
                                        통 제 단 소 집 응 소 부
                                    </h1>
                                )}
                                {renderRosterTable(pageRows)}
                            </section>
                        ))}
                    </div>
                </div>
            </div>

            {toast && (
                <Toast
                    message={toast}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
