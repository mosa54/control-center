'use client';

import { ControlDeptId, CONTROL_DEPT_MISSIONS, getControlDeptById } from '@/lib/data';
import { useApp } from '@/lib/store';

interface MissionDrawerProps {
    deptId: ControlDeptId;
    onClose: () => void;
}

export default function MissionDrawer({ deptId, onClose }: MissionDrawerProps) {
    const { getCountByControlDept } = useApp();
    const dept = getControlDeptById(deptId);
    const missions = CONTROL_DEPT_MISSIONS[deptId];
    const count = getCountByControlDept(deptId);

    if (!dept) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: dept.color
                            }}
                        />
                        {dept.name} ({count}명)
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <h4 style={{ marginBottom: '12px', color: '#757575', fontSize: '14px' }}>임무 목록</h4>
                    <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {missions.map((mission, idx) => (
                            <li key={idx} style={{ fontSize: '15px', lineHeight: '1.6' }}>{mission}</li>
                        ))}
                    </ol>
                    <p style={{ marginTop: '24px', padding: '12px', background: '#F5F5F5', borderRadius: '8px', fontSize: '13px', color: '#757575' }}>
                        ※ 임무 편집은 관리자 모드에서만 가능합니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
