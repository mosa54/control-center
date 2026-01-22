'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { getOrderedControlDepts, getControlDeptColor, getMissionByCode } from '@/lib/excel';

export default function ControlDeptCards() {
    const { excelData, getCountByControlDept } = useApp();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    if (!excelData) return null;

    const controlDepts = getOrderedControlDepts(excelData.employees);
    const selectedMissions = selectedDept
        ? excelData.employees
            .filter(e => e.통제단편성부 === selectedDept)
            .map(e => e.임무코드_당번)
            .filter((v, i, a) => a.indexOf(v) === i) // unique
            .map(code => getMissionByCode(excelData.missions, code))
            .filter(Boolean)
        : [];

    return (
        <>
            <div className="card">
                <div className="card-title">통제단 부서별 현황</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {controlDepts.map(dept => {
                        const count = getCountByControlDept(dept);
                        const total = excelData.employees.filter(e => e.통제단편성부 === dept).length;
                        const color = getControlDeptColor(dept);
                        return (
                            <button
                                key={dept}
                                onClick={() => setSelectedDept(selectedDept === dept ? null : dept)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: selectedDept === dept ? '#E3F2FD' : '#F5F5F5',
                                    border: 'none',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${color}`,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{dept}</span>
                                <span>
                                    <span style={{ fontWeight: 700, color }}>{count}</span>
                                    <span style={{ color: '#757575' }}> / {total}명</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedDept && selectedMissions.length > 0 && (
                <div className="card">
                    <div className="card-title" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: getControlDeptColor(selectedDept)
                            }} />
                            {selectedDept} 임무
                        </span>
                        <button
                            onClick={() => setSelectedDept(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: '#757575'
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {selectedMissions.map((mission, idx) => mission && (
                            <div key={idx} style={{
                                padding: '12px',
                                background: '#FAFAFA',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${getControlDeptColor(selectedDept)}`
                            }}>
                                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                                    세부임무 : {mission.임무명}
                                </div>
                                <div style={{
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    color: '#424242'
                                }}>
                                    {mission.임무내용}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
