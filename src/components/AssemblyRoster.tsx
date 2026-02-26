'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';

export default function AssemblyRoster({ onClose }: { onClose: () => void }) {
    const { excelData, checkedInEmployees } = useApp();
    const [dispatchInfo, setDispatchInfo] = useState('');

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

    return (
        <div className="page roster-page" style={{ minHeight: '100vh', background: 'white' }}>
            <div className="header no-print">
                <button onClick={onClose} className="header-back" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>←</button>
                <h1 className="header-title">응소부 미리보기</h1>
                <button onClick={handlePrint} className="btn" style={{ position: 'absolute', right: '16px', background: '#424242', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 600 }}>
                    🖨️ 인쇄
                </button>
            </div>

            <div className="page-content" style={{ padding: '0', background: 'white' }}>
                <div className="no-print" style={{ padding: '16px', background: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '13px' }}>발령시간/응소장소 (해당 행에 응소 데이터가 있을 때만 표기됩니다)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="예: 22:00 / 중부소방서 마당"
                            value={dispatchInfo}
                            onChange={(e) => setDispatchInfo(e.target.value)}
                        />
                    </div>
                </div>

                <div className="roster-print-area" style={{ padding: '40px', color: 'black', background: 'white', maxWidth: '210mm', margin: '0 auto' }}>
                    <h1 style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '12px', margin: '16px 0 32px', fontWeight: 900 }}>
                        통 제 단 소 집 응 소 부
                    </h1>

                    <table className="roster-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '5%', border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>연번</th>
                                <th style={{ width: '25%', border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>발령시간/응소장소</th>
                                <th style={{ width: '10%', border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>응소시간</th>
                                <th style={{ width: '15%', border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>소 속</th>
                                <th style={{ width: '12%', border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>계 급</th>
                                <th style={{ width: '13%', border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>성 명</th>
                                <th style={{ width: '20%', border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>서명</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx}>
                                    <td style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', height: '32px' }}>{row.index}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center', fontWeight: 600 }}>{row.hasData ? dispatchInfo : ''}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>{row.time}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>{row.originalDept}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>{row.rank}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}>{row.name}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 4px', textAlign: 'center' }}></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
