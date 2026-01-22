'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Employee, Mission, ExcelData, getMissionByCode, getControlDeptColor } from './excel';

// 세션 모드 타입
export type SessionMode = 'training' | 'emergency';

// 체크인된 직원 정보
export interface CheckedInEmployee extends Employee {
    checkedInAt: Date;
    selectedDutyStatus?: '당번' | '비번';  // 교대근무자만 해당
}

// 앱 상태 인터페이스
interface AppState {
    // 세션 정보
    sessionMode: SessionMode;
    sessionSummary: string;

    // 엑셀 데이터
    excelData: ExcelData | null;

    // 체크인된 직원들
    checkedInEmployees: CheckedInEmployee[];

    // 현재 로그인한 직원
    currentEmployee: CheckedInEmployee | null;
}

// 컨텍스트 액션
interface AppActions {
    // 세션 관리
    setSessionMode: (mode: SessionMode) => void;
    setSessionSummary: (summary: string) => void;

    // 엑셀 데이터 관리
    setExcelData: (data: ExcelData) => void;

    // 체크인 관리
    checkIn: (employee: Employee, dutyStatus?: '당번' | '비번') => boolean;
    checkOut: (employeeId: string) => void;
    isCheckedIn: (employeeId: string) => boolean;

    // 통계
    getCountByControlDept: (dept: string) => number;
    getTotalCount: () => number;
    getCheckedInByControlDept: (dept: string) => CheckedInEmployee[];

    // 현재 사용자 관리
    setCurrentEmployee: (employee: CheckedInEmployee | null) => void;
    changeDept: (newDept: string) => void;

    // 임무 조회
    getMyMission: () => Mission | undefined;

    // 전체 초기화 (관리자용)
    resetAllCheckIns: () => void;

    // 내 응소 취소 (본인)
    cancelMyCheckIn: () => void;
}

type AppContextType = AppState & AppActions;

const AppContext = createContext<AppContextType | null>(null);

// 로컬스토리지 키
const STORAGE_KEYS = {
    excelData: 'controlCenter_excelData',
    sessionMode: 'controlCenter_sessionMode',
    sessionSummary: 'controlCenter_sessionSummary',
    checkedInEmployees: 'controlCenter_checkedIn',
    deviceCheckedIn: 'controlCenter_deviceCheckedIn', // 기기별 응소 완료 여부
};

export function AppProvider({ children }: { children: ReactNode }) {
    const [sessionMode, setSessionModeState] = useState<SessionMode>('training');
    const [sessionSummary, setSessionSummaryState] = useState('');
    const [excelData, setExcelDataState] = useState<ExcelData | null>(null);
    const [checkedInEmployees, setCheckedInEmployees] = useState<CheckedInEmployee[]>([]);
    const [currentEmployee, setCurrentEmployee] = useState<CheckedInEmployee | null>(null);
    const [hasDeviceCheckedIn, setHasDeviceCheckedIn] = useState(false); // 기기별 응소 제한

    // 로컬스토리지에서 데이터 복원
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedExcel = localStorage.getItem(STORAGE_KEYS.excelData);
            if (savedExcel) {
                try {
                    const parsed = JSON.parse(savedExcel);
                    parsed.uploadedAt = new Date(parsed.uploadedAt);
                    setExcelDataState(parsed);
                } catch (e) {
                    console.error('Failed to parse saved Excel data', e);
                }
            }

            const savedMode = localStorage.getItem(STORAGE_KEYS.sessionMode);
            if (savedMode) setSessionModeState(savedMode as SessionMode);

            const savedSummary = localStorage.getItem(STORAGE_KEYS.sessionSummary);
            if (savedSummary) setSessionSummaryState(savedSummary);

            const savedCheckedIn = localStorage.getItem(STORAGE_KEYS.checkedInEmployees);
            if (savedCheckedIn) {
                try {
                    const parsed = JSON.parse(savedCheckedIn);
                    setCheckedInEmployees(parsed.map((e: CheckedInEmployee) => ({
                        ...e,
                        checkedInAt: new Date(e.checkedInAt),
                    })));
                } catch (e) {
                    console.error('Failed to parse checked in employees', e);
                }
            }

            // 기기별 응소 완료 상태 복원
            const savedDeviceCheckedIn = localStorage.getItem(STORAGE_KEYS.deviceCheckedIn);
            if (savedDeviceCheckedIn) {
                try {
                    const parsed = JSON.parse(savedDeviceCheckedIn);
                    setHasDeviceCheckedIn(parsed.checkedIn);
                    // currentEmployee도 복원
                    if (parsed.employee) {
                        setCurrentEmployee({
                            ...parsed.employee,
                            checkedInAt: new Date(parsed.employee.checkedInAt),
                        });
                    }
                } catch (e) {
                    console.error('Failed to parse device check-in status', e);
                }
            }
        }
    }, []);

    const setSessionMode = useCallback((mode: SessionMode) => {
        setSessionModeState(mode);
        localStorage.setItem(STORAGE_KEYS.sessionMode, mode);
    }, []);

    const setSessionSummary = useCallback((summary: string) => {
        setSessionSummaryState(summary);
        localStorage.setItem(STORAGE_KEYS.sessionSummary, summary);
    }, []);

    const setExcelData = useCallback((data: ExcelData) => {
        setExcelDataState(data);
        localStorage.setItem(STORAGE_KEYS.excelData, JSON.stringify(data));
    }, []);

    const checkIn = useCallback((employee: Employee, dutyStatus?: '당번' | '비번'): boolean => {
        // 기기별 응소 제한 확인
        if (hasDeviceCheckedIn) {
            return false;
        }

        const alreadyCheckedIn = checkedInEmployees.some(e => e.id === employee.id);
        if (alreadyCheckedIn) {
            return false;
        }

        const checkedIn: CheckedInEmployee = {
            ...employee,
            checkedInAt: new Date(),
            selectedDutyStatus: employee.근무형태 === '교대' ? dutyStatus : undefined,
        };

        const newList = [...checkedInEmployees, checkedIn];
        setCheckedInEmployees(newList);
        setCurrentEmployee(checkedIn);
        setHasDeviceCheckedIn(true);
        localStorage.setItem(STORAGE_KEYS.checkedInEmployees, JSON.stringify(newList));
        localStorage.setItem(STORAGE_KEYS.deviceCheckedIn, JSON.stringify({ checkedIn: true, employee: checkedIn }));
        return true;
    }, [checkedInEmployees, hasDeviceCheckedIn]);

    const checkOut = useCallback((employeeId: string) => {
        const newList = checkedInEmployees.filter(e => e.id !== employeeId);
        setCheckedInEmployees(newList);
        localStorage.setItem(STORAGE_KEYS.checkedInEmployees, JSON.stringify(newList));
        if (currentEmployee?.id === employeeId) {
            setCurrentEmployee(null);
        }
    }, [checkedInEmployees, currentEmployee]);

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

    const changeDept = useCallback((newDept: string) => {
        if (!currentEmployee) return;

        const updated: CheckedInEmployee = {
            ...currentEmployee,
            통제단편성부: newDept,
        };

        const newList = checkedInEmployees.map(e => e.id === currentEmployee.id ? updated : e);
        setCheckedInEmployees(newList);
        setCurrentEmployee(updated);
        localStorage.setItem(STORAGE_KEYS.checkedInEmployees, JSON.stringify(newList));
    }, [currentEmployee, checkedInEmployees]);

    const getMyMission = useCallback((): Mission | undefined => {
        if (!currentEmployee || !excelData) return undefined;
        // 교대근무자는 selectedDutyStatus에 따라 임무코드 선택
        const missionCode = currentEmployee.selectedDutyStatus === '비번'
            ? currentEmployee.임무코드_비번
            : currentEmployee.임무코드_당번;
        return getMissionByCode(excelData.missions, missionCode);
    }, [currentEmployee, excelData]);

    const resetAllCheckIns = useCallback(() => {
        setCheckedInEmployees([]);
        setCurrentEmployee(null);
        setHasDeviceCheckedIn(false);
        localStorage.removeItem(STORAGE_KEYS.checkedInEmployees);
        localStorage.removeItem(STORAGE_KEYS.deviceCheckedIn);
    }, []);

    const cancelMyCheckIn = useCallback(() => {
        if (!currentEmployee) return;

        // 체크인 목록에서 현재 사용자 제거
        const newList = checkedInEmployees.filter(e => e.id !== currentEmployee.id);
        setCheckedInEmployees(newList);
        localStorage.setItem(STORAGE_KEYS.checkedInEmployees, JSON.stringify(newList));

        // 기기 응소 상태 및 현재 사용자 초기화
        setCurrentEmployee(null);
        setHasDeviceCheckedIn(false);
        localStorage.removeItem(STORAGE_KEYS.deviceCheckedIn);
    }, [currentEmployee, checkedInEmployees]);

    const value: AppContextType = {
        sessionMode,
        sessionSummary,
        excelData,
        checkedInEmployees,
        currentEmployee,
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
