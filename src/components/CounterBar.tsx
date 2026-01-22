'use client';

import { useApp } from '@/lib/store';
import { getOrderedControlDepts, getControlDeptColor } from '@/lib/excel';

export default function CounterBar() {
    const { excelData, getCountByControlDept, getTotalCount } = useApp();
    const total = getTotalCount();

    if (!excelData) return null;

    const orderedDepts = getOrderedControlDepts(excelData.employees);

    return (
        <div className="counter-bar-wrapper">
            <div className="counter-bar-grid">
                {orderedDepts.map(dept => {
                    const count = getCountByControlDept(dept);
                    const color = getControlDeptColor(dept);
                    return (
                        <div key={dept} className="counter-item">
                            {dept === '긴급구조통제단장' ? (
                                <span style={{ color: '#FFD700', fontSize: '14px' }}>★</span>
                            ) : (
                                <span className="dot" style={{ background: color }} />
                            )}
                            <span className="counter-label">{dept}</span>
                            <span className="counter-count">{count}</span>
                        </div>
                    );
                })}
            </div>
            <div className="counter-total">
                총원: {total}명
            </div>
        </div>
    );
}
