'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, ScenarioEvent } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';

const CATEGORIES = [
    { value: 'fire', label: '화재', icon: '🔥', color: '#E53935' },
    { value: 'explosion', label: '폭발', icon: '💥', color: '#FF6D00' },
    { value: 'casualty', label: '사상자', icon: '🚑', color: '#D32F2F' },
    { value: 'collapse', label: '붕괴', icon: '🏚️', color: '#795548' },
    { value: 'traffic', label: '교통', icon: '🚧', color: '#FB8C00' },
    { value: 'comm', label: '통신', icon: '📡', color: '#1565C0' },
    { value: 'media', label: '언론', icon: '🎤', color: '#7B1FA2' },
    { value: 'other', label: '기타', icon: '📋', color: '#757575' },
];

interface ScenarioTemplate {
    id: string;
    name: string;
    events: any[];
    created_at?: string;
}

const getCat = (v: string) => CATEGORIES.find(c => c.value === v) || CATEGORIES[7];

export default function TimelinePage() {
    const router = useRouter();
    const {
        scenarioEvents, addScenarioEvent, updateScenarioEvent,
        deleteScenarioEvent, deliverScenarioEvent, resetScenarioEvents,
    } = useApp();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScenarioEvent | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // 템플릿
    const [templates, setTemplates] = useState<ScenarioTemplate[]>([]);
    const [showTemplateSave, setShowTemplateSave] = useState(false);
    const [showTemplateList, setShowTemplateList] = useState(false);
    const [templateName, setTemplateName] = useState('');

    // 예약 타이머
    const [scheduledTimes, setScheduledTimes] = useState<Record<string, string>>({});
    const [countdowns, setCountdowns] = useState<Record<string, number>>({});
    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // 폼
    const defaultForm = {
        time_label: '', title: '', description: '', category: 'fire',
        delivery_type: 'instant', scheduled_delay_min: 5, condition_note: '', sort_order: 0,
    };
    const [form, setForm] = useState(defaultForm);

    // 인증
    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('adminAuth') === 'true') {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = () => {
        if (pin === '1234') {
            setIsLoggedIn(true);
            sessionStorage.setItem('adminAuth', 'true');
        } else setPinError(true);
    };

    // 템플릿 로드
    useEffect(() => {
        if (!isLoggedIn) return;
        supabase.from('scenario_templates').select('*').order('created_at', { ascending: false })
            .then(({ data }) => { if (data) setTemplates(data); });
    }, [isLoggedIn]);

    // 예약 배달 복구 & 타이머
    useEffect(() => {
        if (!isLoggedIn) return;
        scenarioEvents.forEach(ev => {
            if (ev.status === 'pending' && ev.scheduled_at) {
                const target = new Date(ev.scheduled_at).getTime();
                const now = Date.now();
                if (target <= now) {
                    deliverScenarioEvent(ev.id);
                } else if (!timersRef.current.has(ev.id)) {
                    const timer = setTimeout(() => {
                        deliverScenarioEvent(ev.id);
                        timersRef.current.delete(ev.id);
                        setScheduledTimes(p => { const n = { ...p }; delete n[ev.id]; return n; });
                    }, target - now);
                    timersRef.current.set(ev.id, timer);
                    setScheduledTimes(p => ({ ...p, [ev.id]: ev.scheduled_at! }));
                }
            }
        });
    }, [isLoggedIn, scenarioEvents, deliverScenarioEvent]);

    // 카운트다운 갱신
    useEffect(() => {
        const iv = setInterval(() => {
            setCountdowns(() => {
                const cd: Record<string, number> = {};
                for (const [id, iso] of Object.entries(scheduledTimes)) {
                    cd[id] = Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));
                }
                return cd;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [scheduledTimes]);

    useEffect(() => () => { timersRef.current.forEach(t => clearTimeout(t)); }, []);

    // 폼 제출
    const handleSubmit = async () => {
        if (!form.time_label || !form.title) { setToast('시간과 제목은 필수입니다.'); return; }
        if (editingEvent) {
            await updateScenarioEvent(editingEvent.id, { ...form, description: form.description || undefined, condition_note: form.condition_note || undefined });
            setToast('수정 완료');
        } else {
            await addScenarioEvent({ ...form, status: 'pending', description: form.description || undefined, condition_note: form.condition_note || undefined });
            setToast('상황 카드 추가 완료');
        }
        closeModal();
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEvent(null);
        setForm({ ...defaultForm, sort_order: scenarioEvents.length });
    };

    const openAdd = () => {
        setEditingEvent(null);
        setForm({ ...defaultForm, sort_order: scenarioEvents.length });
        setShowModal(true);
    };

    const openEdit = (ev: ScenarioEvent) => {
        setEditingEvent(ev);
        setForm({
            time_label: ev.time_label, title: ev.title, description: ev.description || '',
            category: ev.category, delivery_type: ev.delivery_type,
            scheduled_delay_min: ev.scheduled_delay_min, condition_note: ev.condition_note || '',
            sort_order: ev.sort_order,
        });
        setShowModal(true);
    };

    // 부여
    const handleDeliver = async (ev: ScenarioEvent) => {
        if (ev.delivery_type === 'scheduled') {
            const ms = ev.scheduled_delay_min * 60 * 1000;
            const at = new Date(Date.now() + ms).toISOString();
            await updateScenarioEvent(ev.id, { scheduled_at: at });
            const timer = setTimeout(() => {
                deliverScenarioEvent(ev.id);
                timersRef.current.delete(ev.id);
                setScheduledTimes(p => { const n = { ...p }; delete n[ev.id]; return n; });
            }, ms);
            timersRef.current.set(ev.id, timer);
            setScheduledTimes(p => ({ ...p, [ev.id]: at }));
            setToast(`${ev.scheduled_delay_min}분 후 자동 부여`);
        } else {
            await deliverScenarioEvent(ev.id);
            setToast('상황 부여 완료');
        }
    };

    const cancelSchedule = (id: string) => {
        const t = timersRef.current.get(id);
        if (t) { clearTimeout(t); timersRef.current.delete(id); }
        setScheduledTimes(p => { const n = { ...p }; delete n[id]; return n; });
        updateScenarioEvent(id, { scheduled_at: undefined as any });
        setToast('예약 취소됨');
    };

    // 템플릿
    const saveTemplate = async () => {
        if (!templateName.trim()) { setToast('이름을 입력하세요.'); return; }
        const evts = scenarioEvents.map(e => ({
            time_label: e.time_label, title: e.title, description: e.description,
            category: e.category, delivery_type: e.delivery_type,
            scheduled_delay_min: e.scheduled_delay_min, condition_note: e.condition_note,
            sort_order: e.sort_order,
        }));
        await supabase.from('scenario_templates').insert({ name: templateName.trim(), events: evts });
        const { data } = await supabase.from('scenario_templates').select('*').order('created_at', { ascending: false });
        if (data) setTemplates(data);
        setTemplateName('');
        setShowTemplateSave(false);
        setToast('템플릿 저장 완료');
    };

    const loadTemplate = async (tpl: ScenarioTemplate) => {
        await resetScenarioEvents();
        for (const ev of tpl.events) {
            await addScenarioEvent({ ...ev, status: 'pending', sort_order: ev.sort_order ?? 0, scheduled_delay_min: ev.scheduled_delay_min ?? 0 });
        }
        setShowTemplateList(false);
        setToast(`"${tpl.name}" 불러옴`);
    };

    const deleteTemplate = async (id: string) => {
        await supabase.from('scenario_templates').delete().eq('id', id);
        setTemplates(p => p.filter(t => t.id !== id));
        setToast('템플릿 삭제');
    };

    const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const sorted = [...scenarioEvents].sort((a, b) => {
        if (a.status === b.status) return a.sort_order - b.sort_order;
        return a.status === 'pending' ? -1 : 1;
    });

    const pendingCount = scenarioEvents.filter(e => e.status === 'pending').length;
    const deliveredCount = scenarioEvents.filter(e => e.status === 'delivered').length;

    // 로그인 화면
    if (!isLoggedIn) {
        return (
            <div className="page">
                <div className="header">
                    <button onClick={() => router.back()} className="header-back">←</button>
                    <h1 className="header-title">관리자 로그인</h1>
                </div>
                <div className="page-content" style={{ padding: 16 }}>
                    <div className="card">
                        <div className="form-group">
                            <label className="form-label">관리자 PIN</label>
                            <input type="password" className="form-input" value={pin}
                                onChange={e => { setPin(e.target.value); setPinError(false); }}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                placeholder="PIN 입력" maxLength={4} />
                            {pinError && <p style={{ color: '#D32F2F', fontSize: 14, marginTop: 8 }}>잘못된 PIN입니다.</p>}
                        </div>
                        <button className="btn btn-primary btn-block" onClick={handleLogin}>로그인</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="header">
                <button onClick={() => router.push('/admin')} className="header-back">←</button>
                <h1 className="header-title">상황부여 타임라인</h1>
            </div>

            {/* 요약 바 */}
            <div style={{ display: 'flex', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #E0E0E0' }}>
                <span className="delivery-badge pending" style={{ background: '#FFF9C4', color: '#F57F17' }}>
                    대기 {pendingCount}
                </span>
                <span className="delivery-badge delivered" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                    부여됨 {deliveredCount}
                </span>
                <div style={{ flex: 1 }} />
                <button onClick={() => setShowTemplateList(true)}
                    style={{ background: 'none', border: 'none', fontSize: 14, color: '#1565C0', fontWeight: 600, cursor: 'pointer' }}>
                    📂 불러오기
                </button>
                <button onClick={() => { if (scenarioEvents.length === 0) { setToast('저장할 이벤트가 없습니다.'); return; } setShowTemplateSave(true); }}
                    style={{ background: 'none', border: 'none', fontSize: 14, color: '#1565C0', fontWeight: 600, cursor: 'pointer' }}>
                    💾 저장
                </button>
            </div>

            <div className="page-content" style={{ padding: '8px 16px 120px 16px' }}>
                {sorted.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', color: '#757575' }}>
                        <p style={{ fontSize: 40, marginBottom: 8 }}>📋</p>
                        <p style={{ fontWeight: 600 }}>상황 카드가 없습니다</p>
                        <p style={{ fontSize: 13, marginTop: 4 }}>우측 하단 + 버튼으로 추가하거나<br />템플릿을 불러오세요.</p>
                    </div>
                )}

                {sorted.map(ev => {
                    const cat = getCat(ev.category);
                    const isDelivered = ev.status === 'delivered';
                    const isScheduling = !!scheduledTimes[ev.id];
                    return (
                        <div key={ev.id} className={`admin-event-card ${isDelivered ? 'delivered' : ''}`}
                            style={{ borderLeftColor: cat.color }}>
                            <div className="event-header">
                                <span style={{ fontSize: 22 }}>{cat.icon}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#757575' }}>{ev.time_label}</span>
                                <span className="event-title">{ev.title}</span>
                            </div>
                            {ev.description && <div style={{ fontSize: 13, color: '#757575', marginBottom: 8 }}>{ev.description}</div>}
                            <div className="event-badges">
                                <span className={`delivery-badge ${ev.delivery_type}`}>
                                    {ev.delivery_type === 'instant' ? '즉시' : ev.delivery_type === 'scheduled' ? `${ev.scheduled_delay_min}분 후` : '조건'}
                                </span>
                                {ev.delivery_type === 'conditional' && ev.condition_note && (
                                    <span style={{ fontSize: 11, color: '#7B1FA2' }}>({ev.condition_note})</span>
                                )}
                                <span className={`status-badge ${ev.status}`}>
                                    {isDelivered ? '✓ 부여됨' : '대기'}
                                </span>
                            </div>
                            {isDelivered && ev.delivered_at && (
                                <div style={{ fontSize: 11, color: '#757575', marginTop: 4 }}>
                                    부여 시각: {new Date(ev.delivered_at).toLocaleTimeString('ko-KR')}
                                </div>
                            )}
                            {isScheduling && countdowns[ev.id] !== undefined && (
                                <div className="countdown-display">
                                    ⏱️ {fmtCountdown(countdowns[ev.id])} 후 자동 부여
                                    <button onClick={() => cancelSchedule(ev.id)}
                                        style={{ display: 'block', margin: '4px auto 0', fontSize: 12, color: '#D32F2F', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        예약 취소
                                    </button>
                                </div>
                            )}
                            <div className="event-actions">
                                {!isDelivered && !isScheduling && (
                                    <button className="btn btn-primary" onClick={() => handleDeliver(ev)} style={{ background: '#43A047' }}>
                                        {ev.delivery_type === 'scheduled' ? `${ev.scheduled_delay_min}분 후 부여` : '부여'}
                                    </button>
                                )}
                                {!isDelivered && (
                                    <>
                                        <button className="btn btn-secondary" onClick={() => openEdit(ev)}>수정</button>
                                        <button className="btn" onClick={() => deleteScenarioEvent(ev.id)}
                                            style={{ background: '#FFEBEE', color: '#D32F2F' }}>삭제</button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* 초기화 */}
                {scenarioEvents.length > 0 && (
                    <div className="card" style={{ marginTop: 16 }}>
                        {!showResetConfirm ? (
                            <button className="btn btn-block" style={{ background: '#FF5722', color: '#fff' }}
                                onClick={() => setShowResetConfirm(true)}>전체 초기화</button>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontWeight: 600, color: '#D32F2F', marginBottom: 8 }}>⚠️ 모든 상황 카드가 삭제됩니다.</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowResetConfirm(false)}>취소</button>
                                    <button className="btn" style={{ flex: 1, background: '#D32F2F', color: '#fff' }}
                                        onClick={async () => { await resetScenarioEvents(); setShowResetConfirm(false); setToast('초기화 완료'); }}>
                                        확인
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* FAB */}
            <button className="timeline-fab" onClick={openAdd}>+</button>

            {/* 추가/수정 모달 */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
                        <div className="modal-header">
                            <span className="modal-title">{editingEvent ? '상황 카드 수정' : '상황 카드 추가'}</span>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">시간 라벨 *</label>
                                <input className="form-input" placeholder="예: 14:00" value={form.time_label}
                                    onChange={e => setForm(p => ({ ...p, time_label: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">제목 *</label>
                                <input className="form-input" placeholder="예: 화재 신고 접수" value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">상세 내용</label>
                                <textarea className="form-input" rows={2} placeholder="선택사항" value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'none' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">카테고리</label>
                                <div className="category-grid">
                                    {CATEGORIES.map(c => (
                                        <button key={c.value} type="button"
                                            className={`category-option ${form.category === c.value ? 'selected' : ''}`}
                                            onClick={() => setForm(p => ({ ...p, category: c.value }))}>
                                            <span className="cat-icon">{c.icon}</span>
                                            <span className="cat-label">{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">부여 방식</label>
                                <div className="delivery-options">
                                    {[{ v: 'instant', l: '즉시' }, { v: 'scheduled', l: '예약' }, { v: 'conditional', l: '조건' }].map(o => (
                                        <button key={o.v} type="button"
                                            className={`delivery-option ${form.delivery_type === o.v ? 'selected' : ''}`}
                                            onClick={() => setForm(p => ({ ...p, delivery_type: o.v }))}>
                                            {o.l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {form.delivery_type === 'scheduled' && (
                                <div className="form-group">
                                    <label className="form-label">지연 시간 (분)</label>
                                    <input className="form-input" type="number" min={1} max={120} value={form.scheduled_delay_min}
                                        onChange={e => setForm(p => ({ ...p, scheduled_delay_min: parseInt(e.target.value) || 1 }))} />
                                </div>
                            )}
                            {form.delivery_type === 'conditional' && (
                                <div className="form-group">
                                    <label className="form-label">조건 메모</label>
                                    <input className="form-input" placeholder="예: 현장 진입 완료 시" value={form.condition_note}
                                        onChange={e => setForm(p => ({ ...p, condition_note: e.target.value }))} />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">정렬 순서</label>
                                <input className="form-input" type="number" min={0} value={form.sort_order}
                                    onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <button className="btn btn-primary btn-block" onClick={handleSubmit}>
                                {editingEvent ? '수정 완료' : '추가'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 템플릿 저장 모달 */}
            {showTemplateSave && (
                <div className="modal-overlay" onClick={() => setShowTemplateSave(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">💾 템플릿 저장</span>
                            <button className="modal-close" onClick={() => setShowTemplateSave(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">템플릿 이름</label>
                                <input className="form-input" placeholder="예: 화재 시나리오" value={templateName}
                                    onChange={e => setTemplateName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && saveTemplate()} />
                            </div>
                            <p style={{ fontSize: 13, color: '#757575', marginBottom: 16 }}>
                                현재 {scenarioEvents.length}개의 상황 카드가 템플릿으로 저장됩니다.
                            </p>
                            <button className="btn btn-primary btn-block" onClick={saveTemplate}>저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 템플릿 불러오기 모달 */}
            {showTemplateList && (
                <div className="modal-overlay" onClick={() => setShowTemplateList(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">📂 템플릿 불러오기</span>
                            <button className="modal-close" onClick={() => setShowTemplateList(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {templates.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#757575' }}>저장된 템플릿이 없습니다.</p>
                            ) : templates.map(tpl => (
                                <div key={tpl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', borderBottom: '1px solid #E0E0E0' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{tpl.name}</div>
                                        <div style={{ fontSize: 12, color: '#757575' }}>
                                            {tpl.events.length}개 카드 · {tpl.created_at ? new Date(tpl.created_at).toLocaleDateString('ko-KR') : ''}
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" style={{ fontSize: 13, minHeight: 36, padding: '4px 12px' }}
                                        onClick={() => loadTemplate(tpl)}>불러오기</button>
                                    <button className="btn" style={{ fontSize: 13, minHeight: 36, padding: '4px 8px', background: '#FFEBEE', color: '#D32F2F' }}
                                        onClick={() => deleteTemplate(tpl.id)}>삭제</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
