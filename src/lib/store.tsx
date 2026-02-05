'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Employee, Mission, ExcelData, getMissionByCode } from './excel';
import { supabase } from './supabase';

// 세션 모드 타입
export type SessionMode = 'training' | 'emergency';

// 체크인된 직원 정보 (DB 구조에 맞춤)
export interface CheckedInEmployee extends Employee {
    checkedInAt: Date;
    selectedDutyStatus?: '당번' | '비번';
    // DB의 id (uuid)는 필요하면 추가
}

// 앱 상태 인터페이스
interface AppState {
    sessionMode: SessionMode;
    sessionSummary: string;
    excelData: ExcelData | null;
    checkedInEmployees: CheckedInEmployee[];
    currentEmployee: CheckedInEmployee | null;
    isLoaded: boolean; // 데이터 로딩 완료 여부
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
    changeDept: (newDept: string) => Promise<void>;
    getMyMission: () => Mission | undefined;
    resetAllCheckIns: () => Promise<void>;
    cancelMyCheckIn: () => Promise<void>;
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
    const [excelData, setExcelDataState] = useState<ExcelData | null>(null);
    const [checkedInEmployees, setCheckedInEmployees] = useState<CheckedInEmployee[]>([]);
    const [currentEmployee, setCurrentEmployee] = useState<CheckedInEmployee | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. 초기 데이터 로드 및 Realtime 구독
    useEffect(() => {
        const fetchData = async () => {
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
                    if (settings.excel_data) {
                        try {
                            const parsedExcel = settings.excel_data as any; // 타입 단언 필요 시
                            // Date 객체 복원
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
                    // DB checkins 데이터를 CheckedInEmployee 형태로 변환
                    const mapped: CheckedInEmployee[] = checkins.map(c => {
                        const original = employees.find(e => e.id === c.employee_id);
                        if (!original) return null;
                        return {
                            ...original,
                            checkedInAt: new Date(c.checked_in_at),
                            selectedDutyStatus: c.duty_status as any,
                            // DB의 최신 정보(직위 등)가 있으면 덮어쓰기
                            직위: c.position || original.직위,
                            통제단편성부: c.dept || original.통제단편성부,
                        };
                    }).filter(Boolean) as CheckedInEmployee[];
                    setCheckedInEmployees(mapped);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        fetchData();

        // Realtime 구독
        const channel = supabase.channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'system_settings' },
                (payload) => {
                    const newRow = payload.new as any;
                    if (newRow) {
                        setSessionModeState(newRow.mode as SessionMode);
                        setSessionSummaryState(newRow.summary || '');
                        if (newRow.excel_data) {
                            const parsedExcel = newRow.excel_data;
                            if (parsedExcel.uploadedAt) parsedExcel.uploadedAt = new Date(parsedExcel.uploadedAt);
                            setExcelDataState(parsedExcel);
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'checkins' },
                async () => {
                    // 체크인 변경 시 전체 다시 불러오기 (간단한 동기화)
                    // 최적화를 위해 insert/update/delete를 구분할 수도 있지만,
                    // 조인(Join) 데이터가 필요하므로 다시 fetch 하는게 안전함.
                    const { data: checkins } = await supabase.from('checkins').select('*');
                    // excelData 상태가 있어야 매핑 가능
                    setExcelDataState(prev => {
                        if (!prev) return prev;
                        if (checkins) {
                            const mapped: CheckedInEmployee[] = checkins.map(c => {
                                const original = prev.employees.find(e => e.id === c.employee_id);
                                if (!original) return null;
                                return {
                                    ...original,
                                    checkedInAt: new Date(c.checked_in_at),
                                    selectedDutyStatus: c.duty_status as any,
                                    직위: c.position || original.직위,
                                    통제단편성부: c.dept || original.통제단편성부,
                                };
                            }).filter(Boolean) as CheckedInEmployee[];
                            setCheckedInEmployees(mapped);
                        }
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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
            // 필요시 에러 처리 로직 추가
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

    const changeDept = useCallback(async (newDept: string) => {
        if (!currentEmployee) return;
        await supabase.from('checkins').update({ dept: newDept }).eq('employee_id', currentEmployee.id);
    }, [currentEmployee]);


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
