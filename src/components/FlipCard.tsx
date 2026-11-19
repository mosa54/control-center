'use client';

import MessageCardFaces from './MessageCardFaces';
import { ScenarioEvent } from '@/lib/store';
import { useApp } from '@/lib/store';
import RoleChecklist from './RoleChecklist';
import songdoCards from '@/lib/songdoTsunamiCards.json';

const hexToRgba = (hex: string, alpha: number) => {
    // 임시 색상 처리 대비 (ex: currentColor)
    if (hex.startsWith('rgba')) return hex;
    if (hex.startsWith('#')) {
        let h = hex.slice(1);
        if (h.length === 3) h = [...h].map(x => x + x).join('');
        const r = parseInt(h.slice(0, 2), 16) || 0;
        const g = parseInt(h.slice(2, 4), 16) || 0;
        const b = parseInt(h.slice(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(0,0,0,${alpha})`;
};

interface FlipCardProps {
    ev: ScenarioEvent;
    cat: { icon: string; color: string; label: string };
    isNew: boolean;
}

export default function FlipCard({ ev, cat, isNew }: FlipCardProps) {
    const { taskChecks, fetchTaskChecks, toggleTaskCheck } = useApp();
    const assignedRoles = ev.roles?.filter(role => role.tasks?.length);
    const scenarioCard = songdoCards.find(card =>
        card.title === ev.title?.trim() && card.time === ev.time_label?.trim()
    );
    const beforeArrival = scenarioCard !== undefined && scenarioCard.number < 20;
    const roles = beforeArrival ? undefined : (assignedRoles?.length ? assignedRoles : scenarioCard?.roles);

    return (
        <MessageCardFaces
            faceClassName={isNew ? 'scenario-card new' : 'scenario-card'}
            onViewTasks={() => { void fetchTaskChecks(ev.id); }}
            checklist={roles?.length ? (
                <RoleChecklist eventId={ev.id} roles={roles} checkedTasks={taskChecks[ev.id] || {}}
                    onToggleTask={id => toggleTaskCheck(ev.id, id)} />
            ) : undefined}
        >
            <div className="scenario-card-header" style={{
                background: `linear-gradient(to right, ${hexToRgba(cat.color, 0.08)}, transparent)`,
                borderBottom: `1px solid ${hexToRgba(cat.color, 0.1)}`,
                margin: '-16px -20px 16px -20px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                <div style={{ 
                    background: '#ffffff', 
                    width: 28, height: 28, minWidth: 28, 
                    borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)' 
                }}>
                    <span style={{ fontSize: 16, transform: 'translateY(-1px)' }}>{cat.icon}</span>
                </div>
                <span style={{ 
                    fontSize: 13, fontWeight: 700, color: '#424242', 
                    background: '#fff', padding: '3px 10px', borderRadius: 20, 
                    border: '1px solid #E0E0E0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' 
                }}>
                    {ev.time_label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: cat.color, letterSpacing: '-0.3px', marginRight: 4 }}>
                    {cat.label}
                </span>
                {ev.sub_types && ev.sub_types.length > 0 && ev.sub_types.map(st => (
                    <span key={st} style={{
                        background: '#fff', color: '#424242', padding: '3px 8px', borderRadius: 6,
                        fontSize: 11, fontWeight: 600, border: `1px solid ${hexToRgba(cat.color, 0.25)}`,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center',
                        letterSpacing: '-0.3px'
                    }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cat.color, display: 'inline-block', marginRight: 5 }} />
                        {st}
                    </span>
                ))}
            </div>
            
            <div className="scenario-card-title" style={{ fontSize: '17px', lineHeight: '1.4', marginBottom: '6px' }}>
                {ev.title}
            </div>
            
            {ev.description && <div className="scenario-card-desc">{ev.description}</div>}
        </MessageCardFaces>
    );
}
