'use client';

import { useApp } from '@/lib/store';
import { getControlDeptColor } from '@/lib/excel';

export default function MyMissionCard() {
    const { currentEmployee, getMyMission } = useApp();
    const mission = getMyMission();

    if (!currentEmployee) return null;

    const deptColor = getControlDeptColor(currentEmployee.통제단편성부);

    return (
        <div className="card">
            <div className="card-title">내 임무</div>

            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E0E0E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
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
                <div style={{ fontSize: '14px', color: '#757575' }}>
                    {currentEmployee.직위} · {currentEmployee.성명 || '(성명 미지정)'}
                </div>
            </div>

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
                        {mission.임무명}
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
        </div>
    );
}
