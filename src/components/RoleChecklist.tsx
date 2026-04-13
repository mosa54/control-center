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
    const myDept = currentEmployee?.통제단편성부 || '';

    // 내 부서의 역할군 매핑 (단순화: 부서명과 roleName이 포함 관계인지 확인)
    const isMyRole = (roleName: string) => {
        if (!myDept) return false;
        
        // 상황실, 현장지휘대, 선착분대, 구조대, 구급대, 통제단 준비요원 등
        if (roleName.includes('상황실') && myDept.includes('상황')) return true;
        if (roleName.includes('구조대') && myDept.includes('구조')) return true;
        if (roleName.includes('구급대') && myDept.includes('구급')) return true;
        if (roleName.includes('지휘') && myDept.includes('지휘')) return true;
        // 다른 매핑 규칙을 여기에 추가할 수 있습니다.
        
        return myDept.includes(roleName) || roleName.includes(myDept);
    };

    // 역할 정렬: 내 역할이 속한 것을 최상단으로
    const sortedRoles = [...roles].sort((a, b) => {
        const aIsMine = isMyRole(a.roleName);
        const bIsMine = isMyRole(b.roleName);
        if (aIsMine && !bIsMine) return -1;
        if (!aIsMine && bIsMine) return 1;
        return 0;
    });

    const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        sortedRoles.forEach(role => {
            initial[role.roleName] = true; // 모든 نقش 펼침
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
                    const isMine = isMyRole(role.roleName);
                    const isExpanded = expandedRoles[role.roleName];
                    const completedCount = role.tasks.filter((_, idx) => checkedTasks[getTaskStateId(role.roleName, idx)]).length;
                    const totalCount = role.tasks.length;
                    const isAllCompleted = completedCount === totalCount && totalCount > 0;

                    return (
                        <div key={role.roleName} style={{ 
                            background: isMine ? '#E3F2FD' : '#F5F5F5', 
                            borderRadius: '8px', 
                            border: `1px solid ${isMine ? '#90CAF9' : '#E0E0E0'}`,
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
                                    fontWeight: isMine ? 700 : 600,
                                    color: isMine ? '#1565C0' : '#424242'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{isExpanded ? '▼' : '▶'}</span>
                                    <span>{role.roleName} {isMine && <span style={{ fontSize: '11px', background: '#1565C0', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>내 담당</span>}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: isAllCompleted ? '#2E7D32' : '#757575', fontWeight: 600 }}>
                                    {completedCount}/{totalCount}
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div style={{ padding: '0 12px 12px 12px', borderTop: `1px solid ${isMine ? '#BBDEFB' : '#EEEEEE'}`, paddingTop: '8px', background: '#FFFFFF' }}>
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
