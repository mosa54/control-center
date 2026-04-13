'use client';

import { useState, useEffect } from 'react';
import { ScenarioEvent } from '@/lib/store';
import RoleChecklist from './RoleChecklist';

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
    const [isFlipped, setIsFlipped] = useState(false);
    const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
    
    const hasRoles = ev.roles && ev.roles.length > 0;

    // 로컬 스토리지에서 체크 상태 복원
    useEffect(() => {
        if (!hasRoles) return;
        try {
            const stored = localStorage.getItem(`scenario_checks_${ev.id}`);
            if (stored) {
                setCheckedTasks(JSON.parse(stored));
            }
        } catch (e) {
            console.error("체크 상태 복원 실패", e);
        }
    }, [ev.id, hasRoles]);

    const handleToggleTask = (taskId: string) => {
        setCheckedTasks(prev => {
            const next = { ...prev, [taskId]: !prev[taskId] };
            localStorage.setItem(`scenario_checks_${ev.id}`, JSON.stringify(next));
            return next;
        });
    };

    const toggleFlip = (e?: React.MouseEvent) => {
        if (e && (e.target as HTMLElement).tagName === 'INPUT') return; // input 클릭 무시
        if (hasRoles) {
            setIsFlipped(!isFlipped);
        }
    };

    const cardShadow = `0 4px 16px ${hexToRgba(cat.color, 0.18)}, 0 1px 4px rgba(0,0,0,0.06)`;

    return (
        <>
            {isFlipped && (
                <div 
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1999 }} 
                    onClick={toggleFlip} 
                />
            )}
            <div 
                className={`flip-card ${isNew && !isFlipped ? 'new' : ''}`} 
                style={{ 
                    width: '100%', 
                    zIndex: isFlipped ? 2000 : 1, 
                    position: isFlipped ? 'fixed' : 'relative',
                    top: isFlipped ? '90px' : 'auto',
                    left: isFlipped ? '0' : 'auto',
                    right: isFlipped ? '0' : 'auto',
                    bottom: isFlipped ? '16px' : 'auto',
                    padding: isFlipped ? '0 16px' : '0',
                    maxWidth: isFlipped ? '800px' : 'none',
                    margin: isFlipped ? '0 auto' : '0'
                }}
            >
                <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`} style={{ height: isFlipped ? '100%' : 'auto' }}>
                    
                    {/* ---------- 앞면 ---------- */}
                    <div 
                        className="flip-card-front scenario-card" 
                        onClick={toggleFlip}
                        style={{ 
                            boxShadow: cardShadow, 
                            cursor: hasRoles ? 'pointer' : 'default',
                            display: 'flex', flexDirection: 'column'
                        }}
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

                        {/* 플립 유도 힌트 */}
                        {hasRoles && (
                            <div style={{ 
                                marginTop: '16px', 
                                textAlign: 'right', 
                                fontSize: '13px', 
                                color: '#757575', 
                                fontWeight: 600, 
                                display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' 
                            }}>
                                임무 확인하기 <span style={{ fontSize: '16px' }}>↪</span>
                            </div>
                        )}
                    </div>

                    {/* ---------- 뒷면 ---------- */}
                    {hasRoles && (
                        <div 
                            className="flip-card-back scenario-card" 
                            style={{ 
                                boxShadow: cardShadow, 
                                display: 'flex', flexDirection: 'column',
                                height: isFlipped ? '100%' : 'max-content'
                            }}
                        >
                            <div style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                borderBottom: '1px solid #EEEEEE', paddingBottom: '12px', marginBottom: '16px' 
                            }}>
                                <div>
                                    <span style={{ fontSize: '13px', color: '#757575', fontWeight: 600, background: '#F5F5F5', padding: '4px 8px', borderRadius: '4px' }}>
                                        {ev.time_label}
                                    </span>
                                </div>
                                <button 
                                    onClick={toggleFlip}
                                    style={{ 
                                        background: 'none', border: 'none', fontSize: '20px', color: '#9E9E9E', cursor: 'pointer', padding: '0 8px' 
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                                <RoleChecklist 
                                    eventId={ev.id} 
                                    roles={ev.roles!} 
                                    checkedTasks={checkedTasks} 
                                    onToggleTask={handleToggleTask} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* 플레이스홀더: 고정 위치로 떠버린 동안 뒷배경 높이 유지 (Layout Shift 방지) */}
            {isFlipped && (
                <div style={{ width: '100%', height: '180px' }} />
            )}
        </>
    );
}
