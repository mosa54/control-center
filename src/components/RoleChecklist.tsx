'use client';

import { useState } from 'react';
import { RoleChecklist as RoleChecklistType } from '@/lib/store';
import { useApp } from '@/lib/store';

interface RoleChecklistProps {
    eventId: string;
    roles: RoleChecklistType[];
    checkedTasks: Record<string, boolean>;
    onToggleTask: (taskId: string) => void;
}

export default function RoleChecklist({ eventId, roles, checkedTasks, onToggleTask }: RoleChecklistProps) {
    const { currentEmployee } = useApp();
    // const myDept = currentEmployee?.통제단편성부 || '';

    // 역할 정렬: 현재는 정렬 없이 원본 순서대로 유지 (추후 필요시 내 역할 우선순위 적용)
    const sortedRoles = [...roles];

    const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        sortedRoles.forEach(role => {
            initial[role.roleName] = true; // 모든 역할 펼침
        });
        return initial;
    });

    const toggleExpanded = (roleName: string, e: React.MouseEvent) => {
        e.stopPropagation(); // 카드 뒤집기 방지
        setExpandedRoles(prev => ({ ...prev, [roleName]: !prev[roleName] }));
    };

    const getTaskStateId = (roleName: string, taskIdx: number) => {
        return `${eventId}_${roleName}_${taskIdx}`;
    };

    return (
        <div className="role-checklist" onClick={e => e.stopPropagation()}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1A237E', borderBottom: '1px solid #E8EAF6', paddingBottom: '8px' }}>
                주체별 역할 체크리스트
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sortedRoles.map((role) => {
                    const isExpanded = expandedRoles[role.roleName];
                    const completedCount = role.tasks.filter((_, idx) => checkedTasks[getTaskStateId(role.roleName, idx)]).length;
                    const totalCount = role.tasks.length;
                    const isAllCompleted = completedCount === totalCount && totalCount > 0;

                    return (
                        <div key={role.roleName} style={{ 
                            background: '#F5F5F5', 
                            borderRadius: '8px', 
                            border: '1px solid #E0E0E0',
                            overflow: 'hidden'
                        }}>
                            <div 
                                onClick={(e) => toggleExpanded(role.roleName, e)}
                                style={{ 
                                    padding: '10px 12px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    color: '#424242'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{isExpanded ? '▼' : '▶'}</span>
                                    <span>{role.roleName}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: isAllCompleted ? '#2E7D32' : '#757575', fontWeight: 600 }}>
                                    {completedCount}/{totalCount}
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div style={{ padding: '0 12px 12px 12px', borderTop: '1px solid #EEEEEE', paddingTop: '8px', background: '#FFFFFF' }}>
                                    {role.tasks.map((task, idx) => {
                                        const taskId = getTaskStateId(role.roleName, idx);
                                        const isChecked = !!checkedTasks[taskId];
                                        
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => onToggleTask(taskId)}
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'flex-start', 
                                                    gap: '8px', 
                                                    padding: '6px 0',
                                                    cursor: 'pointer',
                                                    opacity: isChecked ? 0.7 : 1
                                                }}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked}
                                                    readOnly
                                                    style={{ marginTop: '3px', transform: 'scale(1.2)' }}
                                                />
                                                <span style={{ 
                                                    fontSize: '14px', 
                                                    color: isChecked ? '#9E9E9E' : '#212121',
                                                    textDecoration: isChecked ? 'line-through' : 'none',
                                                    lineHeight: 1.4
                                                }}>
                                                    {task.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
