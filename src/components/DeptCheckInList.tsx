'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { getControlDeptColor, getMissionByCode } from '@/lib/excel';

interface DeptCheckInListProps {
    deptName: string;
    onClose: () => void;
}

export default function DeptCheckInList({ deptName, onClose }: DeptCheckInListProps) {
    const { excelData, checkedInEmployees } = useApp();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    if (!excelData) return null;

    // 해당 통제단 부서의 *전체* 직원 목록 (엑셀 기준)
    const deptEmployees = excelData.employees.filter(e => e.통제단편성부 === deptName);

    // 응소 여부 확인 함수
    const getCheckInStatus = (empId: string) => {
        const checkedIn = checkedInEmployees.find(c => c.id === empId);
        return checkedIn ? { isCheckedIn: true, duty: checkedIn.selectedDutyStatus } : { isCheckedIn: false };
    };

    // 직원의 임무 정보 조회
    const getEmployeeMission = (empId: string) => {
        const emp = deptEmployees.find(e => e.id === empId);
        if (!emp) return null;

        const checkInStatus = getCheckInStatus(empId);
        // 응소자는 체크인 시 선택한 근무형태에 맞는 임무코드 사용
        // 미응소자는 당번 기준으로 표시
        const missionCode = checkInStatus.isCheckedIn && checkInStatus.duty === '비번'
            ? emp.임무코드_비번
            : emp.임무코드_당번;

        return getMissionByCode(excelData.missions, missionCode);
    };

    const color = getControlDeptColor(deptName);
    const checkedInCount = deptEmployees.filter(e => getCheckInStatus(e.id).isCheckedIn).length;

    const handleEmployeeClick = (empId: string) => {
        setSelectedEmployeeId(prev => prev === empId ? null : empId);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ padding: '12px 20px' }}>
                    <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: color
                            }}
                        />
                        {deptName} <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#757575' }}>({checkedInCount}/{deptEmployees.length}명)</span>
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {deptEmployees.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {deptEmployees.map((emp) => {
                                const { isCheckedIn, duty } = getCheckInStatus(emp.id);
                                const isSelected = selectedEmployeeId === emp.id;
                                const mission = isSelected ? getEmployeeMission(emp.id) : null;

                                return (
                                    <div key={emp.id}>
                                        {/* 직원 항목 */}
                                        <div
                                            onClick={() => handleEmployeeClick(emp.id)}
                                            style={{
                                                padding: '12px',
                                                background: isCheckedIn ? '#E3F2FD' : '#FAFAFA',
                                                borderRadius: isSelected ? '8px 8px 0 0' : '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                border: isCheckedIn ? `1px solid ${color}` : '1px solid #eee',
                                                borderBottom: isSelected ? 'none' : undefined,
                                                opacity: isCheckedIn ? 1 : 0.8,
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                <span style={{
                                                    padding: '2px 6px',
                                                    background: '#fff',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ddd',
                                                    fontSize: '12px',
                                                    color: '#555',
                                                    minWidth: '50px',
                                                    textAlign: 'center'
                                                }}>
                                                    {emp.직급}
                                                </span>
                                                <span style={{ fontWeight: 600, fontSize: '15px' }}>{emp.성명}</span>
                                                {emp.직위 && (
                                                    <span style={{ fontSize: '13px', color: '#757575', marginLeft: '4px' }}>
                                                        {emp.직위}
                                                    </span>
                                                )}
                                                {/* 펼침 아이콘 */}
                                                <span style={{
                                                    marginLeft: 'auto',
                                                    fontSize: '12px',
                                                    color: '#999',
                                                    transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s'
                                                }}>
                                                    ▼
                                                </span>
                                            </div>

                                            {/* 우측 상태 배지 */}
                                            <div style={{ marginLeft: '12px' }}>
                                                {isCheckedIn ? (
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        background: color,
                                                        color: 'white',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 600
                                                    }}>
                                                        응소
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        background: '#E0E0E0',
                                                        color: '#757575',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 500
                                                    }}>
                                                        미응소
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 임무 상세 정보 (펼침 영역) */}
                                        {isSelected && (
                                            <div style={{
                                                padding: '12px 16px',
                                                background: '#FAFAFA',
                                                borderRadius: '0 0 8px 8px',
                                                border: isCheckedIn ? `1px solid ${color}` : '1px solid #eee',
                                                borderTop: 'none'
                                            }}>
                                                {mission ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                            <span style={{ fontSize: '14px', minWidth: '60px', color: '#555' }}>📋 임무명</span>
                                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{mission.임무명}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                            <span style={{ fontSize: '14px', minWidth: '60px', color: '#555' }}>📝 내용</span>
                                                            <span style={{ fontSize: '14px', color: '#444', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                                                {mission.임무내용}
                                                            </span>
                                                        </div>
                                                        {isCheckedIn && duty && (
                                                            <div style={{
                                                                fontSize: '12px',
                                                                color: '#888',
                                                                marginTop: '4px',
                                                                paddingTop: '8px',
                                                                borderTop: '1px dashed #ddd'
                                                            }}>
                                                                🕒 {duty} 기준 임무
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '14px', color: '#999', textAlign: 'center', padding: '8px 0' }}>
                                                        등록된 임무 정보가 없습니다.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{
                            padding: '32px 0',
                            textAlign: 'center',
                            color: '#999',
                            fontSize: '14px'
                        }}>
                            등록된 인원이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
