'use client';

import { useApp } from '@/lib/store';
import { getControlDeptColor } from '@/lib/excel';

export default function MyMissionCard() {
    const { currentEmployee, getMyMission, checkedInEmployees, excelData } = useApp();
    const mission = getMyMission();

    if (!currentEmployee) return null;

    const deptColor = getControlDeptColor(currentEmployee.통제단편성부);

    // 나와 같은 임무코드를 가진 직원들 (나 제외, 전체 직원 대상)
    const myMissionCode = currentEmployee.selectedDutyStatus === '비번'
        ? currentEmployee.임무코드_비번
        : currentEmployee.임무코드_당번;

    const sameMissionEmployees = excelData?.employees.filter(emp => {
        if (emp.id === currentEmployee.id) return false;
        // 당번 기준 임무코드 비교 (전체 직원이므로 당번 기준)
        return myMissionCode && emp.임무코드_당번 === myMissionCode;
    }) || [];

    // 체크인 여부 확인 함수
    const isCheckedIn = (empId: string) => {
        return checkedInEmployees.some(e => e.id === empId);
    };

    // 비치물품 표시 대상 부서인지 확인
    const isSupplyDept = ['대응계획부', '현장지휘부', '자원지원부'].includes(currentEmployee.통제단편성부);

    // 해당 부서의 비치물품 찾기
    const departmentSupply = isSupplyDept && excelData?.supplies
        ? excelData.supplies.find(s => s.부서 === currentEmployee.통제단편성부)
        : null;

    return (
        <div className="card">
            <div className="card-title">내 임무</div>

            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E0E0E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: deptColor
                    }} />
                    <span style={{ fontWeight: 700, color: deptColor }}>
                        {currentEmployee.통제단편성부}
                    </span>
                </div>
            </div>

            {/* 임무 내용 표시 */}
            {mission ? (
                <div>
                    <div style={{
                        fontWeight: 600,
                        marginBottom: '12px',
                        padding: '8px 12px',
                        background: '#F5F5F5',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${deptColor}`
                    }}>
                        세부임무 : {mission.임무명}
                    </div>
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.8',
                        fontSize: '15px',
                        paddingLeft: '8px'
                    }}>
                        {mission.임무내용}
                    </div>
                </div>
            ) : (
                <p style={{ color: '#757575', fontSize: '14px' }}>
                    임무 정보가 없습니다.
                </p>
            )}

            {/* 비치물품 현황 표시 (해당 부서만) */}
            {isSupplyDept && departmentSupply && (
                <div style={{ marginTop: '16px' }}>
                    <div style={{
                        fontWeight: 600,
                        marginBottom: '12px',
                        padding: '8px 12px',
                        background: '#E8F5E9', // 연한 녹색 배경
                        borderRadius: '8px',
                        borderLeft: `4px solid #43A047`, // 녹색 라인
                        color: '#2E7D32'
                    }}>
                        {currentEmployee.통제단편성부} 비치물품
                    </div>
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.8',
                        fontSize: '15px',
                        paddingLeft: '8px'
                    }}>
                        {departmentSupply.비치물품}
                    </div>
                </div>
            )}

            {/* 같은 임무자 표시 (항상 하단에) */}
            {sameMissionEmployees.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E0E0E0' }}>
                    <div style={{ fontSize: '13px', color: '#757575', marginBottom: '8px' }}>
                        같은 임무자
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {sameMissionEmployees.map(emp => {
                            const checked = isCheckedIn(emp.id);
                            return (
                                <span
                                    key={emp.id}
                                    style={{
                                        padding: '4px 10px',
                                        background: checked ? '#E3F2FD' : '#F5F5F5',
                                        borderRadius: '16px',
                                        fontSize: '13px',
                                        color: checked ? '#1565C0' : '#9E9E9E',
                                        fontWeight: checked ? 600 : 400,
                                    }}
                                >
                                    {emp.직위}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
