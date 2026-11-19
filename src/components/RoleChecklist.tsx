'use client';

import type { RoleChecklist as Role, TaskCheckInfo } from '@/lib/store';
import styles from './RoleChecklist.module.css';

interface Props {
    eventId: string;
    roles: Role[];
    checkedTasks: Record<string, TaskCheckInfo>;
    onToggleTask: (taskId: string) => void;
}

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Seoul',
});

export default function RoleChecklist({ eventId, roles, checkedTasks, onToggleTask }: Props) {
    const departments = new Map<string, Role[]>();
    for (const role of roles) {
        const name = role.department ?? '';
        const group = departments.get(name) ?? [];
        group.push(role);
        departments.set(name, group);
    }

    // Keep stored check keys for records created before department grouping.
    const taskKey = (role: Role, index: number) => `${eventId}_${role.roleName}_${index}`;

    return (
        <div className={styles.checklist} onClick={event => event.stopPropagation()}>
            {Array.from(departments, ([department, groups]) => (
                <section key={department} className={styles.department}>
                    {department && <h3 className={styles.departmentName}>{department}</h3>}
                    {groups.map(role => {
                        const complete = role.tasks.filter((_, i) => checkedTasks[taskKey(role, i)]?.checked).length;
                        return (
                            <details key={role.roleName} className={styles.group} open>
                                <summary>
                                    <span className={styles.groupName}>{role.roleName}</span>
                                    <span className={styles.count} aria-label={`총 ${role.tasks.length}개 중 ${complete}개 완료`}>
                                        {complete} / {role.tasks.length}
                                    </span>
                                </summary>
                                <ul>
                                    {role.tasks.map((task, i) => {
                                        const id = taskKey(role, i);
                                        const status = checkedTasks[id];
                                        const date = status?.checked_at ? new Date(status.checked_at) : undefined;
                                        return (
                                            <li key={id}>
                                                <label className={styles.item}>
                                                    <input type="checkbox" checked={!!status?.checked} onChange={() => onToggleTask(id)} />
                                                    <span>
                                                        <span className={status?.checked ? styles.done : undefined}>{task.label}</span>
                                                        {status?.checked && status.checked_by && (
                                                            <small>완료 · {status.checked_by}
                                                                {date && Number.isFinite(date.getTime()) && <> · {timeFormat.format(date)}</>}
                                                            </small>
                                                        )}
                                                    </span>
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </details>
                        );
                    })}
                </section>
            ))}
        </div>
    );
}
