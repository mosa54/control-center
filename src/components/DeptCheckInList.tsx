'use client';

import { useApp } from '@/lib/store';
import { getControlDeptColor } from '@/lib/excel';

interface DeptCheckInListProps {
    deptName: string;
    onClose: () => void;
}

export default function DeptCheckInList({ deptName, onClose }: DeptCheckInListProps) {
    const { excelData, checkedInEmployees } = useApp();

    if (!excelData) return null;

    // 해당 통제단 부서의 *전체* 직원 목록 (엑셀 기준)
    const deptEmployees = excelData.employees.filter(e => e.통제단편성부 === deptName);

    // 응소 여부 확인 함수
    const getCheckInStatus = (empId: string) => {
        const checkedIn = checkedInEmployees.find(c => c.id === empId);
        return checkedIn ? { isCheckedIn: true, duty: checkedIn.selectedDutyStatus } : { isCheckedIn: false };
    };

    const color = getControlDeptColor(deptName);
    const checkedInCount = deptEmployees.filter(e => getCheckInStatus(e.id).isCheckedIn).length;

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
                                const { isCheckedIn } = getCheckInStatus(emp.id);
                                return (
                                    <div key={emp.id} style={{
                                        padding: '12px',
                                        background: isCheckedIn ? '#E3F2FD' : '#FAFAFA', // 응소 시 연한 파란 배경
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: isCheckedIn ? `1px solid ${color}` : '1px solid #eee',
                                        opacity: isCheckedIn ? 1 : 0.8
                                    }}>
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
                                            {/* 직위를 이름 옆으로 이동 */}
                                            {emp.직위 && (
                                                <span style={{ fontSize: '13px', color: '#757575', marginLeft: '4px' }}>
                                                    {emp.직위}
                                                </span>
                                            )}
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
