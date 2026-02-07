import { useState } from 'react';
import { useApp } from '@/lib/store';
import { getOrderedControlDepts, getControlDeptColor, CONTROL_DEPT_ORDER_ORIGINAL } from '@/lib/excel';
import DeptCheckInList from './DeptCheckInList';

export default function CounterBar() {
    const { excelData, getCountByControlDept, getTotalCount } = useApp();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const total = getTotalCount();

    if (!excelData) return null;

    const orderedDepts = getOrderedControlDepts(excelData.employees, CONTROL_DEPT_ORDER_ORIGINAL);

    return (
        <>
            <div className="counter-bar-wrapper">
                <div className="counter-bar-grid">
                    {orderedDepts.map(dept => {
                        const count = getCountByControlDept(dept);
                        const color = getControlDeptColor(dept);
                        return (
                            <div
                                key={dept}
                                className="counter-item"
                                onClick={() => setSelectedDept(dept)}
                                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                            >
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

            {selectedDept && (
                <DeptCheckInList
                    deptName={selectedDept}
                    onClose={() => setSelectedDept(null)}
                />
            )}
        </>
    );
}
