'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import Toast from '@/components/Toast';

export default function AssemblyRoster({ onClose }: { onClose: () => void }) {
    const { excelData, checkedInEmployees } = useApp();
    const [dispatchInfo, setDispatchInfo] = useState('');
    const [toast, setToast] = useState<string | null>(null);

    // 저장된 발령정보 불러오기
    useEffect(() => {
        const saved = localStorage.getItem('assemblyDispatchInfo');
        if (saved) {
            setDispatchInfo(saved);
        }
    }, []);

    const handleSaveInfo = () => {
        localStorage.setItem('assemblyDispatchInfo', dispatchInfo);
        setToast('발령정보가 기기에 저장되었습니다.');
    };

    // Sort check-ins by check-in time (ascending)
    const sortedCheckIns = [...checkedInEmployees].sort((a, b) => new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime());

    const rows = [];
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
        window.print();
    };

    const thStyle: React.CSSProperties = { border: '1px solid #000', padding: '8px 4px', textAlign: 'center', whiteSpace: 'nowrap' };
    const tdStyle: React.CSSProperties = { border: '1px solid #000', padding: '8px 4px', textAlign: 'center', height: '32px', whiteSpace: 'nowrap' };

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
                                style={{ height: '44px', padding: '0 16px', whiteSpace: 'nowrap' }}
                            >
                                💾 저장
                            </button>
                        </div>
                    </div>
                </div>

                {/* 가로 스크롤 허용 (모바일/작은화면에서 표 안잘림) */}
                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <div className="roster-print-area" style={{ padding: '40px', color: 'black', background: 'white', width: '210mm', minWidth: '800px', margin: '0 auto' }}>
                        <h1 style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '12px', margin: '16px 0 32px', fontWeight: 900, whiteSpace: 'nowrap' }}>
                            통 제 단 소 집 응 소 부
                        </h1>

                        <table className="roster-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, width: '5%' }}>연번</th>
                                    <th style={{ ...thStyle, width: '25%' }}>발령시간/응소장소</th>
                                    <th style={{ ...thStyle, width: '10%' }}>응소시간</th>
                                    <th style={{ ...thStyle, width: '15%' }}>소 속</th>
                                    <th style={{ ...thStyle, width: '12%' }}>계 급</th>
                                    <th style={{ ...thStyle, width: '13%' }}>성 명</th>
                                    <th style={{ ...thStyle, width: '20%' }}>서명</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={idx}>
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
