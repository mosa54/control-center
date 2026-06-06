'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Employee, Mission, ExcelData, getMissionByCode } from './excel';
import { supabase } from './supabase';
import { DEFAULT_DATA } from './defaultData';

// 세션 모드 타입
export type SessionMode = 'training' | 'emergency';

// 체크인된 직원 정보 (DB 구조에 맞춤)
export interface CheckedInEmployee extends Employee {
    checkedInAt: Date;
    selectedDutyStatus?: '당번' | '비번';
    customMissionCode?: string; // 부서 변경 시 직접 선택한 임무코드
}

// 주체별 임무 체크리스트 타입
export interface RoleTask {
    id?: string;       // 고유 ID (선택사항)
    label: string;     // "대상물명·주소·발생층 확인"
}

export interface RoleChecklist {
    roleName: string;  // "상황실", "현장지휘대" 등
    tasks: RoleTask[];
}

// 체크 상태 정보
export interface TaskCheckInfo {
    checked: boolean;
    checked_by?: string;
    checked_at?: string;
}

// 상황부여 이벤트
export interface ScenarioEvent {
    id: string;
    time_label: string;
    title: string;
    description?: string;
    category: string;
    sub_types?: string[];
    delivery_type: string;
    scheduled_delay_min: number;
    condition_note?: string;
    status: string;
    scheduled_at?: string;
    delivered_at?: string;
    sort_order: number;
    created_at?: string;
    roles?: RoleChecklist[];  // 주체별 체크리스트 (없으면 기존 앞면 전용 카드)
}

// 훈련 시나리오 PDF 정보
export interface TrainingScenarioPdfInfo {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
}

// 앱 상태 인터페이스
interface AppState {
    sessionMode: SessionMode;
    sessionSummary: string;
    excelData: ExcelData | null;
    checkedInEmployees: CheckedInEmployee[];
    currentEmployee: CheckedInEmployee | null;
    isLoaded: boolean;
    scenarioEvents: ScenarioEvent[];
    realtimeStatus: 'connecting' | 'connected' | 'error' | 'disconnected';
    taskChecks: Record<string, Record<string, TaskCheckInfo>>; // taskChecks[eventId][taskKey]
    trainingScenarioPdf: TrainingScenarioPdfInfo | null;
}

// 컨텍스트 액션
interface AppActions {
    setSessionMode: (mode: SessionMode) => Promise<void>;
    setSessionSummary: (summary: string) => Promise<void>;
    setExcelData: (data: ExcelData) => Promise<void>;
    checkIn: (employee: Employee, dutyStatus?: '당번' | '비번') => Promise<string | null>;
    checkOut: (employeeId: string) => Promise<void>;
    isCheckedIn: (employeeId: string) => boolean;
    getCountByControlDept: (dept: string) => number;
    getTotalCount: () => number;
    getCheckedInByControlDept: (dept: string) => CheckedInEmployee[];
    setCurrentEmployee: (employee: CheckedInEmployee | null) => void;
    changeDept: (newDept: string, missionCode?: string) => Promise<void>;
    getMyMission: () => Mission | undefined;
    resetAllCheckIns: () => Promise<void>;
    cancelMyCheckIn: () => Promise<void>;
    addScenarioEvent: (event: Omit<ScenarioEvent, 'id' | 'created_at'>) => Promise<void>;
    updateScenarioEvent: (id: string, updates: Partial<ScenarioEvent>) => Promise<void>;
    deleteScenarioEvent: (id: string) => Promise<void>;
    deliverScenarioEvent: (id: string) => Promise<void>;
    cancelDeliverScenarioEvent: (id: string) => Promise<void>;
    resetScenarioEvents: () => Promise<void>;
    getDeliveredEvents: () => ScenarioEvent[];
    getPendingEvents: () => ScenarioEvent[];
    fetchTaskChecks: (eventId: string) => Promise<void>;
    fetchTaskChecksForEvents: (eventIds: string[]) => Promise<void>;
    toggleTaskCheck: (eventId: string, taskKey: string) => Promise<void>;
}

type AppContextType = AppState & AppActions;

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
    myId: 'controlCenter_myId', // 내 ID만 로컬에 저장 (재접속 식별용)
};

const SETTINGS_ID = 1;

export function AppProvider({ children }: { children: ReactNode }) {
    const [sessionMode, setSessionModeState] = useState<SessionMode>('training');
    const [sessionSummary, setSessionSummaryState] = useState('');
    const [excelData, setExcelDataState] = useState<ExcelData | null>(DEFAULT_DATA);
    const [checkedInEmployees, setCheckedInEmployees] = useState<CheckedInEmployee[]>([]);
    const [currentEmployee, setCurrentEmployee] = useState<CheckedInEmployee | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [scenarioEvents, setScenarioEvents] = useState<ScenarioEvent[]>([]);
    const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
    const [taskChecks, setTaskChecks] = useState<Record<string, Record<string, TaskCheckInfo>>>({});
    const [trainingScenarioPdf, setTrainingScenarioPdf] = useState<TrainingScenarioPdfInfo | null>(null);
    const channelRef = useRef<any>(null);
    const realtimeStatusRef = useRef<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. 데이터 로드 및 실시간 구독 초기화 로직
    const fetchData = useCallback(async () => {
        try {
            // 시스템 설정 로드
            const { data: settings } = await supabase
                .from('system_settings')
                .select('*')
                .eq('id', SETTINGS_ID)
                .single();

            if (settings) {
                setSessionModeState(settings.mode as SessionMode);
                setSessionSummaryState(settings.summary || '');
                if (settings.training_scenario_pdf) {
                    setTrainingScenarioPdf(settings.training_scenario_pdf as TrainingScenarioPdfInfo);
                }
                if (settings.excel_data) {
                    try {
                        const parsedExcel = settings.excel_data as any;
                        if (parsedExcel.uploadedAt) parsedExcel.uploadedAt = new Date(parsedExcel.uploadedAt);
                        setExcelDataState(parsedExcel);
                    } catch (e) {
                        console.error('Excel parse error', e);
                    }
                }
            }

            // 체크인 현황 로드
            const { data: checkins } = await supabase.from('checkins').select('*');
            if (checkins && settings?.excel_data) {
                const employees = (settings.excel_data as ExcelData).employees;
                const mapped: CheckedInEmployee[] = checkins.map(c => {
                    const original = employees.find(e => e.id === c.employee_id);
                    if (!original) return null;
                    return {
                        ...original,
                        checkedInAt: new Date(c.checked_in_at),
                        selectedDutyStatus: c.duty_status as any,
                        직위: c.position || original.직위,
                        통제단편성부: c.dept || original.통제단편성부,
                        customMissionCode: c.mission_code || undefined,
                    };
                }).filter(Boolean) as CheckedInEmployee[];
                setCheckedInEmployees(mapped);
            }

            // 상황 이벤트 로드
            const { data: events } = await supabase
                .from('scenario_events')
                .select('*')
                .order('sort_order');
            if (events) {
                setScenarioEvents(events as ScenarioEvent[]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        realtimeStatusRef.current = realtimeStatus;
    }, [realtimeStatus]);

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const cleanupRealtime = useCallback(async () => {
        clearReconnectTimer();
        const existingChannel = channelRef.current;
        channelRef.current = null;

        if (!existingChannel) {
            return;
        }

        try {
            await supabase.removeChannel(existingChannel);
        } catch (error) {
            console.error('Failed to remove realtime channel:', error);
        }
    }, [clearReconnectTimer]);

    const initRealtime = useCallback(async function startRealtime(reason = 'manual') {
        if (channelRef.current) {
            return;
        }

        console.log('실시간 채널 초기화 중...');
        console.log('Initializing realtime channel:', reason);
        setRealtimeStatus('connecting');

        const channel = supabase.channel('realtime-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'system_settings' },
                () => {
                    console.log('시스템 설정 데이터 변경 감지');
                    void fetchData();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'checkins' },
                () => {
                    console.log('체크인 데이터 변경 감지');
                    void fetchData();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'scenario_events' },
                async () => {
                    console.log('상황 이벤트 데이터 변경 감지');
                    const { data: events } = await supabase
                        .from('scenario_events')
                        .select('*')
                        .order('sort_order');
                    if (events) {
                        setScenarioEvents(events as ScenarioEvent[]);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'task_checks' },
                async (payload: any) => {
                    console.log('체크리스트 상태 변경 감지');
                    const eventId = payload.new?.event_id || payload.old?.event_id;
                    if (eventId) {
                        // 해당 이벤트의 체크 상태만 다시 가져오기
                        const { data } = await supabase
                            .from('task_checks')
                            .select('*')
                            .eq('event_id', eventId);
                        if (data) {
                            const checks: Record<string, TaskCheckInfo> = {};
                            data.forEach((row: any) => {
                                checks[row.task_key] = {
                                    checked: row.checked,
                                    checked_by: row.checked_by,
                                    checked_at: row.checked_at,
                                };
                            });
                            setTaskChecks(prev => ({ ...prev, [eventId]: checks }));
                        }
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('Supabase Realtime 연결 상태:', status);
                if (channelRef.current !== channel) {
                    return;
                }

                console.log('Supabase Realtime status:', status, err?.message || '');
                if (status === 'SUBSCRIBED') {
                    setRealtimeStatus('connected');
                    clearReconnectTimer();
                    console.log('✅ 서버와 실시간으로 연결되었습니다.');
                    return;
                }

                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    const details = err?.message || status;
                    setRealtimeStatus('connecting');
                    console.warn(`🔄 실시간 연결 이슈 (${status}). Supabase 자동 재연결을 기다립니다.`, details);

                    if (!reconnectTimerRef.current) {
                        reconnectTimerRef.current = setTimeout(async () => {
                            reconnectTimerRef.current = null;

                            if (realtimeStatusRef.current === 'connected') {
                                return;
                            }

                            if (document.visibilityState !== 'visible') {
                                return;
                            }

                            console.warn('⏳ 실시간 연결이 회복되지 않아 채널을 다시 시작합니다.');
                            await cleanupRealtime();
                            void startRealtime('timeout-recover');
                        }, 12000);
                    }
                    return;
                }

                if (status === 'CLOSED') {
                    clearReconnectTimer();
                    channelRef.current = null;
                    setRealtimeStatus('disconnected');

                    if (document.visibilityState === 'visible') {
                        void startRealtime('closed');
                    }
                }
            });

        channelRef.current = channel;
    }, [fetchData]);

    useEffect(() => {
        void fetchData();
        void initRealtime('mount');

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('앱 복귀 감지: 데이터 동기화 및 실시간 재연결 시도...');
                void fetchData();

                if (!channelRef.current) {
                    void initRealtime('tab-visible');
                    return;
                }

                if (realtimeStatusRef.current !== 'connected') {
                    void (async () => {
                        console.warn('↻ 복귀 후 실시간 연결 상태가 비정상이어서 채널을 새로 붙입니다.');
                        await cleanupRealtime();
                        void initRealtime('tab-visible-recover');
                    })();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            void cleanupRealtime();
        };
    }, [cleanupRealtime, fetchData, initRealtime]);


    // 2. 내 정보 복원 (로컬 스토리지 myId + loaded checkedInEmployees)
    useEffect(() => {
        if (isLoaded && checkedInEmployees.length > 0) {
            const myId = localStorage.getItem(STORAGE_KEYS.myId);
            if (myId) {
                const found = checkedInEmployees.find(e => e.id === myId);
                if (found) setCurrentEmployee(found);
                else {
                    // DB에는 없는데 로컬엔 남아있다면 -> 초기화된 것임
                    localStorage.removeItem(STORAGE_KEYS.myId);
                    setCurrentEmployee(null);
                }
            }
        } else if (isLoaded && checkedInEmployees.length === 0) {
            // 전체 초기화된 경우
            localStorage.removeItem(STORAGE_KEYS.myId);
            setCurrentEmployee(null);
        }
    }, [isLoaded, checkedInEmployees]);


    // Actions 구현 (Supabase 호출)

    const setSessionMode = useCallback(async (mode: SessionMode) => {
        // Optimistic Update
        setSessionModeState(mode);
        await supabase.from('system_settings').update({ mode }).eq('id', SETTINGS_ID);
    }, []);

    const setSessionSummary = useCallback(async (summary: string) => {
        setSessionSummaryState(summary);
        await supabase.from('system_settings').update({ summary }).eq('id', SETTINGS_ID);
    }, []);

    const setExcelData = useCallback(async (data: ExcelData) => {
        setExcelDataState(data);
        await supabase.from('system_settings').update({ excel_data: data }).eq('id', SETTINGS_ID);
    }, []);

    const checkIn = useCallback(async (employee: Employee, dutyStatus?: '당번' | '비번'): Promise<string | null> => {
        // 이미 체크인 확인 (로컬 상태 기준)
        if (checkedInEmployees.some(e => e.id === employee.id)) return '이미 다른 기기에서 응소 완료된 인원입니다.';

        const { error } = await supabase.from('checkins').insert({
            employee_id: employee.id,
            dept: employee.통제단편성부,
            name: employee.성명,
            position: employee.직위,
            duty_status: dutyStatus
        });

        if (!error) {
            localStorage.setItem(STORAGE_KEYS.myId, employee.id); // 내 ID 저장
            return null; // 성공 (에러 없음)
        }
        console.error('Checkin failed', error);
        return error.message || '알 수 없는 오류가 발생했습니다.';
    }, [checkedInEmployees]);

    const checkOut = useCallback(async (employeeId: string) => {
        const { error } = await supabase.from('checkins').delete().eq('employee_id', employeeId);
        if (error) {
            console.error('Checkout failed', error);
        } else {
            if (localStorage.getItem(STORAGE_KEYS.myId) === employeeId) {
                localStorage.removeItem(STORAGE_KEYS.myId);
                setCurrentEmployee(null);
            }
        }
    }, []);

    const resetAllCheckIns = useCallback(async () => {
        await supabase.from('checkins').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        localStorage.removeItem(STORAGE_KEYS.myId);
        setCurrentEmployee(null);
    }, []);

    const cancelMyCheckIn = useCallback(async () => {
        if (!currentEmployee) return;
        await checkOut(currentEmployee.id);
    }, [currentEmployee, checkOut]);

    // === 상황부여 타임라인 액션 ===
    const fetchScenarioEventsLocal = async () => {
        const { data } = await supabase.from('scenario_events').select('*').order('sort_order');
        if (data) setScenarioEvents(data as ScenarioEvent[]);
    };

    const addScenarioEvent = useCallback(async (event: Omit<ScenarioEvent, 'id' | 'created_at'>) => {
        const { error } = await supabase.from('scenario_events').insert(event);
        if (error) console.error('insert event error', error.message || error.details || error, JSON.stringify(error));
        await fetchScenarioEventsLocal();
    }, []);

    const updateScenarioEvent = useCallback(async (id: string, updates: Partial<ScenarioEvent>) => {
        await supabase.from('scenario_events').update(updates).eq('id', id);
        await fetchScenarioEventsLocal();
    }, []);

    const deleteScenarioEvent = useCallback(async (id: string) => {
        await supabase.from('scenario_events').delete().eq('id', id);
        await fetchScenarioEventsLocal();
    }, []);

    const deliverScenarioEvent = useCallback(async (id: string) => {
        await supabase.from('scenario_events').update({
            status: 'delivered',
            delivered_at: new Date().toISOString()
        }).eq('id', id);
        await fetchScenarioEventsLocal();
    }, []);

    const cancelDeliverScenarioEvent = useCallback(async (id: string) => {
        await supabase.from('scenario_events').update({
            status: 'pending',
            delivered_at: null
        }).eq('id', id);
        await fetchScenarioEventsLocal();
    }, []);

    const resetScenarioEvents = useCallback(async () => {
        // task_checks는 on delete cascade로 자동 삭제됨
        await supabase.from('scenario_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        setTaskChecks({});
        await fetchScenarioEventsLocal();
    }, []);

    const getDeliveredEvents = useCallback((): ScenarioEvent[] => {
        return scenarioEvents
            .filter(e => e.status === 'delivered')
            .sort((a, b) => a.sort_order - b.sort_order);
    }, [scenarioEvents]);

    const getPendingEvents = useCallback((): ScenarioEvent[] => {
        return scenarioEvents
            .filter(e => e.status === 'pending')
            .sort((a, b) => a.sort_order - b.sort_order);
    }, [scenarioEvents]);

    const changeDept = useCallback(async (newDept: string, missionCode?: string) => {
        if (!currentEmployee) return;
        
        // 낙관적 업데이트 (Optimistic Update)
        // DB 응답을 기다리지 않고 즉시 UI(요약바 등)를 업데이트하여 반응성 향상
        setCheckedInEmployees(prev => prev.map(emp => 
            emp.id === currentEmployee.id 
                ? { ...emp, 통제단편성부: newDept, customMissionCode: missionCode } 
                : emp
        ));

        const updateData: Record<string, any> = { dept: newDept };
        // mission_code: 선택한 임무코드가 있으면 저장, 없으면 null로 초기화
        updateData.mission_code = missionCode || null;
        await supabase.from('checkins').update(updateData).eq('employee_id', currentEmployee.id);
    }, [currentEmployee]);

    // === 체크리스트 체크 상태 액션 ===
    const fetchTaskChecks = useCallback(async (eventId: string) => {
        const { data } = await supabase
            .from('task_checks')
            .select('*')
            .eq('event_id', eventId);
        if (data) {
            const checks: Record<string, TaskCheckInfo> = {};
            data.forEach((row: any) => {
                checks[row.task_key] = {
                    checked: row.checked,
                    checked_by: row.checked_by,
                    checked_at: row.checked_at,
                };
            });
            setTaskChecks(prev => ({ ...prev, [eventId]: checks }));
        }
    }, []);

    const fetchTaskChecksForEvents = useCallback(async (eventIds: string[]) => {
        const uniqueEventIds = [...new Set(eventIds.filter(Boolean))];

        if (uniqueEventIds.length === 0) {
            return;
        }

        const { data } = await supabase
            .from('task_checks')
            .select('*')
            .in('event_id', uniqueEventIds);

        if (!data) {
            return;
        }

        const groupedChecks = uniqueEventIds.reduce<Record<string, Record<string, TaskCheckInfo>>>((acc, eventId) => {
            acc[eventId] = {};
            return acc;
        }, {});

        data.forEach((row: any) => {
            if (!groupedChecks[row.event_id]) {
                groupedChecks[row.event_id] = {};
            }

            groupedChecks[row.event_id][row.task_key] = {
                checked: row.checked,
                checked_by: row.checked_by,
                checked_at: row.checked_at,
            };
        });

        setTaskChecks(prev => ({
            ...prev,
            ...groupedChecks,
        }));
    }, []);

    const toggleTaskCheck = useCallback(async (eventId: string, taskKey: string) => {
        const currentCheck = taskChecks[eventId]?.[taskKey];
        const newChecked = !currentCheck?.checked;
        const checkerName = currentEmployee?.성명 || '알 수 없음';

        // Optimistic update
        setTaskChecks(prev => ({
            ...prev,
            [eventId]: {
                ...prev[eventId],
                [taskKey]: {
                    checked: newChecked,
                    checked_by: newChecked ? checkerName : undefined,
                    checked_at: newChecked ? new Date().toISOString() : undefined,
                },
            },
        }));

        // DB upsert
        if (newChecked) {
            await supabase.from('task_checks').upsert({
                event_id: eventId,
                task_key: taskKey,
                checked: true,
                checked_by: checkerName,
                checked_at: new Date().toISOString(),
            }, { onConflict: 'event_id,task_key' });
        } else {
            await supabase.from('task_checks')
                .update({ checked: false, checked_by: null, checked_at: null })
                .eq('event_id', eventId)
                .eq('task_key', taskKey);
        }
    }, [taskChecks, currentEmployee]);


    // Read-only helpers (상태 기반)
    const isCheckedIn = useCallback((employeeId: string): boolean => {
        return checkedInEmployees.some(e => e.id === employeeId);
    }, [checkedInEmployees]);

    const getCountByControlDept = useCallback((dept: string): number => {
        return checkedInEmployees.filter(e => e.통제단편성부 === dept).length;
    }, [checkedInEmployees]);

    const getTotalCount = useCallback((): number => {
        return checkedInEmployees.length;
    }, [checkedInEmployees]);

    const getCheckedInByControlDept = useCallback((dept: string): CheckedInEmployee[] => {
        return checkedInEmployees.filter(e => e.통제단편성부 === dept);
    }, [checkedInEmployees]);

    const getMyMission = useCallback((): Mission | undefined => {
        if (!currentEmployee || !excelData) return undefined;
        // 부서 변경 시 직접 선택한 임무코드가 있으면 우선 사용
        if (currentEmployee.customMissionCode) {
            return getMissionByCode(excelData.missions, currentEmployee.customMissionCode);
        }
        const missionCode = currentEmployee.selectedDutyStatus === '비번'
            ? currentEmployee.임무코드_비번
            : currentEmployee.임무코드_당번;
        return getMissionByCode(excelData.missions, missionCode);
    }, [currentEmployee, excelData]);


    const value: AppContextType = {
        sessionMode,
        sessionSummary,
        excelData,
        checkedInEmployees,
        currentEmployee,
        isLoaded,
        scenarioEvents,
        setSessionMode,
        setSessionSummary,
        setExcelData,
        checkIn,
        checkOut,
        isCheckedIn,
        getCountByControlDept,
        getTotalCount,
        getCheckedInByControlDept,
        setCurrentEmployee,
        changeDept,
        getMyMission,
        resetAllCheckIns,
        cancelMyCheckIn,
        addScenarioEvent,
        updateScenarioEvent,
        deleteScenarioEvent,
        deliverScenarioEvent,
        cancelDeliverScenarioEvent,
        resetScenarioEvents,
        getDeliveredEvents,
        getPendingEvents,
        realtimeStatus,
        taskChecks,
        fetchTaskChecks,
        fetchTaskChecksForEvents,
        toggleTaskCheck,
        trainingScenarioPdf,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
