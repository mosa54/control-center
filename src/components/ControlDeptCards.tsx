'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { getOrderedControlDepts, getControlDeptColor, getMissionByCode, CONTROL_DEPT_ORDER_LIST } from '@/lib/excel';

export default function ControlDeptCards() {
    const { excelData, getCountByControlDept } = useApp();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    if (!excelData) return null;

    const controlDepts = getOrderedControlDepts(excelData.employees, CONTROL_DEPT_ORDER_LIST);
    const selectedMissions = selectedDept
        ? excelData.employees
            .filter(e => e.통제단편성부 === selectedDept)
            .map(e => e.임무코드_당번)
            .filter((v, i, a) => a.indexOf(v) === i) // unique
            .map(code => getMissionByCode(excelData.missions, code))
            .filter(Boolean)
        : [];

    return (
        <div className="card">
            <div className="card-title">통제단 부서별 현황</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {controlDepts.map(dept => {
                    const count = getCountByControlDept(dept);
                    const total = excelData.employees.filter(e => e.통제단편성부 === dept).length;
                    const color = getControlDeptColor(dept);
                    const isSelected = selectedDept === dept;

                    const deptMissions = isSelected
                        ? excelData.employees
                            .filter(e => e.통제단편성부 === dept)
                            .map(e => e.임무코드_당번)
                            .filter((v, i, a) => a.indexOf(v) === i) // unique
                            .map(code => getMissionByCode(excelData.missions, code))
                            .filter(Boolean)
                        : [];

                    return (
                        <div key={dept} style={{ display: 'flex', flexDirection: 'column' }}>
                            <button
                                onClick={() => setSelectedDept(isSelected ? null : dept)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: isSelected ? '#E3F2FD' : '#F5F5F5',
                                    border: 'none',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${color}`,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{dept}</span>
                                <span>
                                    <span style={{ fontWeight: 700, color }}>{count}</span>
                                    <span style={{ color: '#757575' }}> / {total}명</span>
                                </span>
                            </button>

                            {isSelected && (
                                <div style={{
                                    marginTop: '8px',
                                    marginLeft: '12px',
                                    paddingLeft: '12px',
                                    borderLeft: `2px dashed ${color}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    animation: 'slideDown 0.3s ease-out'
                                }}>
                                    <style jsx>{`
                                        @keyframes slideDown {
                                            from { opacity: 0; transform: translateY(-10px); }
                                            to { opacity: 1; transform: translateY(0); }
                                        }
                                    `}</style>

                                    {deptMissions.length > 0 ? (
                                        deptMissions.map((mission, idx) => mission && (
                                            <div key={idx} style={{
                                                padding: '12px',
                                                background: '#fff',
                                                borderRadius: '8px',
                                                border: '1px solid #eee',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                            }}>
                                                <div style={{ fontWeight: 600, marginBottom: '6px', color: '#333', fontSize: '15px' }}>
                                                    {mission.임무명}
                                                </div>
                                                <div style={{
                                                    whiteSpace: 'pre-wrap',
                                                    fontSize: '14px',
                                                    lineHeight: '1.5',
                                                    color: '#616161'
                                                }}>
                                                    {mission.임무내용}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '8px', color: '#999', fontSize: '14px' }}>
                                            등록된 임무가 없습니다.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
