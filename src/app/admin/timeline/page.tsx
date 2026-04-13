'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, ScenarioEvent, RoleChecklist, RoleTask } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';
import { PHASE1_PRESET } from '@/lib/scenarioPresets';

const PREDEFINED_ROLES = ['상황실', '현장지휘대', '선착분대', '구조대', '구급대', '통제단', '통제단장', '대응계획부', '현장지휘부', '자원지원부', '후착부대'];

const CATEGORIES = [
    { value: 'phase_1', label: '재난인지·출동지령', icon: '🚨', color: '#C62828', subTypes: ['훈련메시지', '최초신고', '출동지령', '추가출동', '재난유형통보', '대상물정보', '위험물정보'] },
    { value: 'phase_2', label: '상황정보·통신운영', icon: '📡', color: '#1565C0', subTypes: ['상황전파', '추가정보', '관계자진술', '구조대상자정보', '건물정보', '무전채널운영', '상황보고'] },
    { value: 'phase_3', label: '현장지휘·지휘권확립', icon: '🚒', color: '#AD1457', subTypes: ['현장도착', '현장확인', '지휘권선언', '최초보고', '고정지휘', '안전평가'] },
    { value: 'phase_4', label: '대응단계·통제단가동', icon: '🏛️', color: '#E65100', subTypes: ['대응단계발령', '증원판단', '통제단가동', '통제단설치', '기능확대', '기능축소'] },
    { value: 'phase_5', label: '작전계획·상황판단', icon: '🗺️', color: '#4527A0', subTypes: ['전략결정', '방면설정', '전술변경', '상황판단회의', '통합지휘회의', '우선순위결정'] },
    { value: 'phase_6', label: '자원운용·지원기관조정', icon: '🚛', color: '#2E7D32', subTypes: ['자원배치', '임무부여', '부서위치선정', '자원집결지운영', '지원기관요청', '지원기관도착', '임무재지정'] },
    { value: 'phase_7', label: '구조·진압·인명검색', icon: '🦺', color: '#FF6F00', subTypes: ['요구조자발견', '인명검색', '구조개시', '구조완료', '고립구조', '고층구조', '진압곤란'] },
    { value: 'phase_8', label: '구급·다수사상자대응', icon: '🏥', color: '#D32F2F', subTypes: ['MCI가동', '응급의료소', '중증도분류', '병상파악', '의료지원요청', '이송조정', '사상자현황관리'] },
    { value: 'phase_9', label: '안전관리·RIT·비상탈출', icon: '⚠️', color: '#F57F17', subTypes: ['안전점검', 'RIT지정', 'RIT활동', '대원고립', '긴급탈출', '교대조편성', '활동대원점검', '특수위험'] },
    { value: 'phase_10', label: '공보·언론대응·상황종결', icon: '🏁', color: '#37474F', subTypes: ['언론브리핑', '공보자료', '오보대응', 'VIP대응', '대응단계해제', '최종상황보고', '지휘권이양', '종료·강평'] },
];

const MIGRATION_MAP: Record<string, string> = {
    fire: 'phase_1',
    explosion: 'phase_9',
    casualty: 'phase_8',
    collapse: 'phase_9',
    traffic: 'phase_6',
    comm: 'phase_2',
    media: 'phase_10',
    other: 'phase_10',
    phase_start: 'phase_1',
    phase_info: 'phase_2',
    phase_arrival: 'phase_3',
    phase_command: 'phase_5',
    phase_response: 'phase_4',
    phase_resource: 'phase_6',
    phase_rescue: 'phase_7',
    phase_ems: 'phase_8',
    phase_safety: 'phase_9',
    phase_close: 'phase_10',
};

interface ScenarioTemplate {
    id: string;
    name: string;
    events: any[];
    created_at?: string;
}

const getCat = (v: string) => CATEGORIES.find(c => c.value === v) || CATEGORIES[9];

const getCurrentHHMM = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

const addMinutesToHHMM = (timeStr: string, minutes: number) => {
    const match = timeStr.match(/^(\d{1,2}):(\d{1,2})$/);
    if (!match) return timeStr;
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const date = new Date();
    date.setHours(h, m + minutes, 0, 0);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

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
        time_label: '', title: '', description: '', category: 'phase_1', sub_types: [] as string[],
        delivery_type: 'instant' as 'instant' | 'scheduled' | 'conditional', scheduled_delay_min: 5, condition_note: '', sort_order: 0,
        roles: [] as RoleChecklist[]
    };
    const [form, setForm] = useState(defaultForm);
    const [subTypeInput, setSubTypeInput] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [isMigrating, setIsMigrating] = useState(false);

    // 역할 및 임무 상태
    const [customRoleInput, setCustomRoleInput] = useState('');
    const [taskInputs, setTaskInputs] = useState<Record<number, string>>({});

    const addFormRole = (roleName: string) => {
        if (!roleName.trim()) return;
        // 이미 해당 역할이 있는지 검사
        if (form.roles.some(r => r.roleName === roleName.trim())) {
            setToast('이미 추가된 주체(역할)입니다.');
            return;
        }
        setForm(p => ({ ...p, roles: [...(p.roles || []), { roleName: roleName.trim(), tasks: [] }] }));
        setCustomRoleInput('');
    };

    const removeFormRole = (index: number) => {
        if (!confirm('해당 주체와 임무를 모두 삭제하시겠습니까?')) return;
        setForm(p => {
            const newRoles = [...(p.roles || [])];
            newRoles.splice(index, 1);
            return { ...p, roles: newRoles };
        });
    };

    const addFormTask = (roleIndex: number, label: string) => {
        if (!label.trim()) return;
        setForm(p => {
            const newRoles = [...(p.roles || [])];
            const t: RoleTask = { id: crypto.randomUUID(), label: label.trim() };
            newRoles[roleIndex].tasks = [...newRoles[roleIndex].tasks, t];
            return { ...p, roles: newRoles };
        });
        setTaskInputs(p => ({ ...p, [roleIndex]: '' }));
    };

    const removeFormTask = (roleIndex: number, taskId: string) => {
        setForm(p => {
            const newRoles = [...(p.roles || [])];
            newRoles[roleIndex].tasks = newRoles[roleIndex].tasks.filter(t => t.id && t.id !== taskId);
            return { ...p, roles: newRoles };
        });
    };

    const handleTimeChange = (val: string) => {
        // 숫자만 남기기
        let nums = val.replace(/[^0-9]/g, '');

        // 덮어쓰기 로직: 기존에 이미 4자리가 차 있는데 숫자가 하나 더 들어온 경우 (nums.length가 5)
        // 새로운 숫자로 시작하도록 처리
        if (nums.length === 5 && form.time_label.replace(':', '').length === 4) {
            nums = nums.charAt(4);
        }

        if (nums.length > 4) nums = nums.substring(0, 4);

        // 시간 유효성 검사 (실시간 차단)
        if (nums.length >= 1 && parseInt(nums[0]) > 2) return; // 첫 자리는 0,1,2만 가능
        if (nums.length >= 2) {
            const h = parseInt(nums.substring(0, 2));
            if (h > 23) return; // 시간은 23시까지
        }
        if (nums.length >= 3) {
            const m1 = parseInt(nums[2]);
            if (m1 > 5) return; // 분 첫 자리는 5까지만 가능
        }

        let formatted = nums;
        if (nums.length >= 3) {
            formatted = nums.substring(0, 2) + ':' + nums.substring(2);
        }

        setForm(p => ({ ...p, time_label: formatted }));
    };

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

    // 마이그레이션 실행
    useEffect(() => {
        const runMigration = async () => {
            if (!isLoggedIn || scenarioEvents.length === 0 || isMigrating) return;
            const needsMigration = scenarioEvents.filter(ev => MIGRATION_MAP[ev.category]);
            if (needsMigration.length > 0) {
                setIsMigrating(true);
                for (const ev of needsMigration) {
                    await updateScenarioEvent(ev.id, { category: MIGRATION_MAP[ev.category], sub_types: [] });
                }
                setIsMigrating(false);
            }
        };
        runMigration();
    }, [isLoggedIn, scenarioEvents, updateScenarioEvent, isMigrating]);

    // 폼 제출
    const handleSubmit = async () => {
        if (!form.time_label || !form.title) { setToast('시간과 제목은 필수입니다.'); return; }
        if (editingEvent) {
            await updateScenarioEvent(editingEvent.id, { ...form, description: form.description || undefined, condition_note: form.condition_note || undefined, sub_types: form.sub_types });
            setToast('수정 완료');
        } else {
            await addScenarioEvent({ ...form, status: 'pending', description: form.description || undefined, condition_note: form.condition_note || undefined, sub_types: form.sub_types });
            setToast('상황 카드 추가 완료');
        }
        closeModal();
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEvent(null);
        setSubTypeInput('');
        setForm({ ...defaultForm, sort_order: scenarioEvents.length });
    };

    const openAdd = () => {
        setEditingEvent(null);
        setSubTypeInput('');
        
        // 시간 추측: 마지막 이벤트 시간 + 5분
        let nextTime = '';
        if (scenarioEvents.length > 0) {
            const sortedEvents = [...scenarioEvents].sort((a, b) => b.sort_order - a.sort_order);
            const lastEvent = sortedEvents[0];
            if (lastEvent.time_label && lastEvent.time_label.includes(':')) {
                nextTime = addMinutesToHHMM(lastEvent.time_label, 5);
            }
        }
        if (!nextTime) nextTime = getCurrentHHMM();

        setForm({ ...defaultForm, time_label: nextTime, sort_order: scenarioEvents.length });
        setShowModal(true);
    };

    const openEdit = (ev: ScenarioEvent) => {
        setEditingEvent(ev);
        setSubTypeInput('');
        setForm({
            time_label: ev.time_label, title: ev.title, description: ev.description || '',
            category: ev.category, sub_types: ev.sub_types || [], 
            delivery_type: ev.delivery_type as 'instant' | 'scheduled',
            scheduled_delay_min: ev.scheduled_delay_min, condition_note: ev.condition_note || '',
            sort_order: ev.sort_order,
            roles: ev.roles || []
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
            category: e.category, sub_types: e.sub_types, delivery_type: e.delivery_type,
            scheduled_delay_min: e.scheduled_delay_min, condition_note: e.condition_note,
            sort_order: e.sort_order,
            roles: e.roles
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
            await addScenarioEvent({ ...ev, sub_types: ev.sub_types || [], status: 'pending', sort_order: ev.sort_order ?? 0, scheduled_delay_min: ev.scheduled_delay_min ?? 0 });
        }
        setShowTemplateList(false);
        setToast(`"${tpl.name}" 불러옴`);
    };

    const loadPhase1Preset = async () => {
        if (!confirm('기존 상황부여 목록이 모두 삭제되고 1단계 프리셋 10개가 로드됩니다. 진행하시겠습니까?')) return;
        
        await resetScenarioEvents();
        
        // 09:30 부터 시작해서 5분 간격으로 시간 부여
        const startTime = new Date();
        startTime.setHours(9, 30, 0, 0);

        for (let i = 0; i < PHASE1_PRESET.length; i++) {
            const ev = PHASE1_PRESET[i];
            const eventTime = new Date(startTime.getTime() + i * 5 * 60000);
            const time_label = `${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`;
            
            await addScenarioEvent({
                time_label,
                title: ev.title || '',
                description: ev.description || '',
                category: ev.category || 'phase_1',
                sub_types: ev.sub_types || [],
                delivery_type: ev.delivery_type || 'instant',
                scheduled_delay_min: ev.scheduled_delay_min || 0,
                condition_note: ev.condition_note || '',
                status: 'pending',
                sort_order: i,
                roles: ev.roles
            });
        }
        
        setToast('1단계 프리셋 로드 완료');
    };

    const deleteTemplate = async (id: string) => {
        await supabase.from('scenario_templates').delete().eq('id', id);
        setTemplates(p => p.filter(t => t.id !== id));
        setToast('템플릿 삭제');
    };

    const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const filteredEvents = filterCategory === 'all' ? scenarioEvents : scenarioEvents.filter(e => e.category === filterCategory);
    const sorted = [...filteredEvents].sort((a, b) => {
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
            <div style={{ display: 'flex', gap: 8, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #E0E0E0', flexWrap: 'wrap' }}>
                <span className="delivery-badge pending" style={{ background: '#FFF9C4', color: '#F57F17' }}>
                    대기 {pendingCount}
                </span>
                <span className="delivery-badge delivered" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                    부여됨 {deliveredCount}
                </span>
                <div style={{ flex: 1 }} />
                <button onClick={loadPhase1Preset}
                    style={{ background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: '4px', fontSize: 13, color: '#1565C0', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}>
                    🚀 1단계 프리셋
                </button>
                <button onClick={() => setShowTemplateList(true)}
                    style={{ background: 'none', border: 'none', fontSize: 14, color: '#1565C0', fontWeight: 600, cursor: 'pointer' }}>
                    📂 불러오기
                </button>
                <button onClick={() => { if (scenarioEvents.length === 0) { setToast('저장할 이벤트가 없습니다.'); return; } setShowTemplateSave(true); }}
                    style={{ background: 'none', border: 'none', fontSize: 14, color: '#1565C0', fontWeight: 600, cursor: 'pointer' }}>
                    💾 저장
                </button>
            </div>

            {/* 카테고리 필터 */}
            <div className="filter-scroll-container" style={{ display: 'flex', gap: 8, padding: '8px 16px', overflowX: 'auto', background: '#FAFAFA', borderBottom: '1px solid #E0E0E0', WebkitOverflowScrolling: 'touch' }}>
                <button
                    onClick={() => setFilterCategory('all')}
                    style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid #E0E0E0', background: filterCategory === 'all' ? '#212121' : '#fff', color: filterCategory === 'all' ? '#fff' : '#424242', fontSize: 13, fontWeight: filterCategory === 'all' ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                    전체
                </button>
                {CATEGORIES.map(c => (
                    <button
                        key={c.value}
                        onClick={() => setFilterCategory(c.value)}
                        style={{ padding: '6px 16px', borderRadius: 20, border: filterCategory === c.value ? `1px solid ${c.color}` : '1px solid #E0E0E0', background: filterCategory === c.value ? c.color : '#fff', color: filterCategory === c.value ? '#fff' : '#424242', fontSize: 13, fontWeight: filterCategory === c.value ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                        {c.icon} {c.label}
                    </button>
                ))}
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
                            {ev.sub_types && ev.sub_types.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                                    {ev.sub_types.map(st => (
                                        <span key={st} style={{ background: '#F5F5F5', color: '#616161', padding: '2px 8px', borderRadius: 12, fontSize: 11, border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center' }}>
                                            <span style={{ color: cat.color, marginRight: 4, fontSize: 8 }}>●</span> {st}
                                        </span>
                                    ))}
                                </div>
                            )}
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
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    시간 라벨 *
                                    <button type="button" onClick={() => setForm(p => ({ ...p, time_label: getCurrentHHMM() }))}
                                        style={{ background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>
                                        🕒 현재 시각
                                    </button>
                                </label>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                    <input className="form-input" style={{ flex: 1 }} placeholder="예: 14:00" value={form.time_label}
                                        maxLength={5}
                                        onFocus={e => e.target.select()}
                                        onClick={e => (e.target as HTMLInputElement).select()}
                                        onChange={e => handleTimeChange(e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {[1, 3, 5, 7, 10].map(min => (
                                        <button key={min} type="button" onClick={() => setForm(p => ({ ...p, time_label: addMinutesToHHMM(form.time_label, min) }))}
                                            style={{ flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 4, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', minWidth: 40 }}>
                                            +{min}
                                        </button>
                                    ))}
                                </div>
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
                                <label className="form-label">카테고리 (훈련 단계)</label>
                                <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                    {CATEGORIES.map(c => (
                                        <button key={c.value} type="button"
                                            className={`category-option ${form.category === c.value ? 'selected' : ''}`}
                                            onClick={() => setForm(p => ({ ...p, category: c.value, sub_types: [] }))}
                                            style={{ textAlign: 'left', padding: '10px', border: form.category === c.value ? `2px solid ${c.color}` : '1px solid #E0E0E0', borderRadius: 10, background: form.category === c.value ? '#FFF' : '#FAFAFA', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 24 }}>{c.icon}</span>
                                            <span style={{ fontSize: 13, fontWeight: form.category === c.value ? 700 : 400, color: form.category === c.value ? '#212121' : '#616161' }}>{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    세부유형 (다중 선택/입력)
                                    <span style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 400 }}>분류 선택 후 항목 조정</span>
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                    {(getCat(form.category) as any).subTypes.map((st: string) => {
                                        const isSelected = form.sub_types.includes(st);
                                        return (
                                            <button key={st} type="button"
                                                onClick={() => setForm(p => ({ ...p, sub_types: isSelected ? p.sub_types.filter(t => t !== st) : [...p.sub_types, st] }))}
                                                style={{ padding: '6px 12px', borderRadius: 16, border: isSelected ? `1px solid ${getCat(form.category).color}` : '1px solid #E0E0E0', background: isSelected ? `${getCat(form.category).color}10` : '#fff', color: isSelected ? getCat(form.category).color : '#757575', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                                                {isSelected ? '✓ ' : ''}{st}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="form-input" placeholder="직접 입력 (Enter로 추가)" value={subTypeInput}
                                        onChange={e => setSubTypeInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = subTypeInput.trim();
                                                if (val && !form.sub_types.includes(val)) {
                                                    setForm(p => ({ ...p, sub_types: [...p.sub_types, val] }));
                                                }
                                                setSubTypeInput('');
                                            }
                                        }} />
                                    <button type="button" className="btn btn-secondary" onClick={() => {
                                        const val = subTypeInput.trim();
                                        if (val && !form.sub_types.includes(val)) {
                                            setForm(p => ({ ...p, sub_types: [...p.sub_types, val] }));
                                        }
                                        setSubTypeInput('');
                                    }}>추가</button>
                                </div>
                                {form.sub_types.filter(st => !(getCat(form.category) as any).subTypes.includes(st)).length > 0 && (
                                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {form.sub_types.filter(st => !(getCat(form.category) as any).subTypes.includes(st)).map(st => (
                                            <span key={st} style={{ padding: '4px 12px', borderRadius: 16, background: '#EEEEEE', color: '#424242', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {st}
                                                <button type="button" onClick={() => setForm(p => ({ ...p, sub_types: p.sub_types.filter(t => t !== st) }))} style={{ background: 'none', border: 'none', color: '#9E9E9E', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* 주체별 체크리스트 관리 */}
                            <div className="form-group" style={{ background: '#F5F5F5', padding: '16px', borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                                <label className="form-label" style={{ marginBottom: '12px', fontWeight: 800, color: '#1565C0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>☑️</span> 주체별 임무 체크리스트 설정
                                </label>
                                
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                    {PREDEFINED_ROLES.map(role => (
                                        <button key={role} type="button" onClick={() => addFormRole(role)}
                                            style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #BBDEFB', background: '#E3F2FD', color: '#0D47A1', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                                            + {role}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                                    <input className="form-input" style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }} placeholder="직접 주체명 입력 (예: 소방서장)" value={customRoleInput} onChange={e => setCustomRoleInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFormRole(customRoleInput))} />
                                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => addFormRole(customRoleInput)}>추가</button>
                                </div>

                                {form.roles && form.roles.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {form.roles.map((kr, rIdx) => (
                                            <div key={rIdx} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: '6px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #EEEEEE', paddingBottom: '8px' }}>
                                                    <span style={{ fontWeight: 800, color: '#0D47A1', fontSize: '15px' }}>{kr.roleName}</span>
                                                    <button type="button" onClick={() => removeFormRole(rIdx)} style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', color: '#C62828', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: '4px 8px' }}>삭제</button>
                                                </div>
                                                
                                                <ul style={{ paddingLeft: '22px', margin: '0 0 12px 0', fontSize: '13px', color: '#424242', lineHeight: '1.6' }}>
                                                    {kr.tasks.map(t => (
                                                        <li key={t.id} style={{ marginBottom: '6px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <span style={{ flex: 1 }}>{t.label}</span>
                                                                <button type="button" onClick={() => t.id && removeFormTask(rIdx, t.id)} style={{ background: 'none', border: 'none', color: '#9E9E9E', cursor: 'pointer', padding: '0 4px', fontSize: '14px', marginLeft: '8px' }}>✕</button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                    {kr.tasks.length === 0 && <li style={{ listStyle: 'none', marginLeft: '-22px', color: '#9E9E9E', fontSize: '12px', textAlign: 'center', padding: '8px 0', background: '#FAFAFA', borderRadius: '4px' }}>등록된 임무가 없습니다. 추가해 주세요.</li>}
                                                </ul>

                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <input className="form-input" style={{ flex: 1, padding: '8px 10px', fontSize: '12px' }} placeholder="수행해야 할 세부 임무 입력" value={taskInputs[rIdx] || ''} onChange={e => setTaskInputs(p => ({ ...p, [rIdx]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFormTask(rIdx, taskInputs[rIdx] || ''); } }} />
                                                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', background: '#E0E0E0', color: '#424242', border: 'none' }} onClick={() => addFormTask(rIdx, taskInputs[rIdx] || '')}>임무 추가</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E', fontSize: '13px', border: '1px dashed #BDBDBD', borderRadius: '6px', background: '#fff' }}>
                                        아직 추가된 주체가 없습니다.<br />위 메뉴에서 주체를 추가해 보세요.
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">부여 방식</label>
                                <div className="delivery-options">
                                    {[{ v: 'instant', l: '즉시' }, { v: 'scheduled', l: '예약' }, { v: 'conditional', l: '조건' }].map(o => (
                                        <button key={o.v} type="button"
                                            className={`delivery-option ${form.delivery_type === o.v ? 'selected' : ''}`}
                                            onClick={() => setForm(p => ({ ...p, delivery_type: o.v as any }))}>
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
