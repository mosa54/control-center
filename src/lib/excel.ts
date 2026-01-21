import * as XLSX from 'xlsx';

// 직원 인터페이스 (엑셀에서 읽어온 데이터)
export interface Employee {
    id: string;           // 자동 생성 (순번 기반)
    순: number;
    소속부서: string;
    직급: string;
    성명: string;
    직위: string;         // 체크인 시 선택하는 필드
    통제단편성부: string;
    임무코드: string;
    비고: string;
}

// 임무 인터페이스
export interface Mission {
    임무코드: string;
    임무명: string;
    임무내용: string;
}

// 엑셀 데이터 전체 구조
export interface ExcelData {
    employees: Employee[];
    missions: Mission[];
    uploadedAt: Date;
}

// 엑셀 파일 파싱 함수
export function parseExcelFile(file: ArrayBuffer): ExcelData {
    const workbook = XLSX.read(file, { type: 'array' });

    // 시트 1: 직원별 임무
    const employeeSheet = workbook.Sheets[workbook.SheetNames[0]];
    const employeeRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(employeeSheet);

    const employees: Employee[] = employeeRows.map((row, index) => ({
        id: `emp-${index + 1}`,
        순: Number(row['순']) || index + 1,
        소속부서: String(row['소속부서'] || ''),
        직급: String(row['직급'] || ''),
        성명: String(row['성명'] || ''),
        직위: String(row['직위'] || ''),
        통제단편성부: String(row['통제단편성부'] || ''),
        임무코드: String(row['임무코드'] || ''),
        비고: String(row['비고'] || ''),
    })).filter(emp => emp.성명 || emp.직위); // 성명이나 직위가 있는 행만

    // 시트 2: 임무코드
    const missionSheet = workbook.Sheets[workbook.SheetNames[1]];
    const missionRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(missionSheet);

    const missions: Mission[] = missionRows.map(row => ({
        임무코드: String(row['임무코드'] || ''),
        임무명: String(row['임무명'] || ''),
        임무내용: String(row['임무내용'] || ''),
    })).filter(m => m.임무코드); // 임무코드가 있는 행만

    return {
        employees,
        missions,
        uploadedAt: new Date(),
    };
}

// 소속부서별 직원 조회
export function getEmployeesByDept(employees: Employee[], dept: string): Employee[] {
    return employees.filter(e => e.소속부서 === dept);
}

// 임무코드로 임무 조회
export function getMissionByCode(missions: Mission[], code: string): Mission | undefined {
    return missions.find(m => m.임무코드 === code);
}

// 고유 소속부서 목록
export function getUniqueDepts(employees: Employee[]): string[] {
    const depts = new Set(employees.map(e => e.소속부서).filter(Boolean));
    return Array.from(depts);
}

// 고유 통제단편성부 목록
export function getUniqueControlDepts(employees: Employee[]): string[] {
    const depts = new Set(employees.map(e => e.통제단편성부).filter(Boolean));
    return Array.from(depts);
}

// 고정된 통제단편성부 순서
export const CONTROL_DEPT_ORDER = [
    '긴급구조통제단장',
    '대응계획부',
    '현장지휘부',
    '자원지원부',
    '지휘보좌관',
    '본서 상황관리',
    '기동감찰',
];

// 순서대로 정렬된 통제단편성부 목록 반환
export function getOrderedControlDepts(employees: Employee[]): string[] {
    const existingDepts = new Set(employees.map(e => e.통제단편성부).filter(Boolean));
    // 정의된 순서대로 필터링, 없는 부서는 마지막에 추가
    const ordered = CONTROL_DEPT_ORDER.filter(dept => existingDepts.has(dept));
    const remaining = Array.from(existingDepts).filter(dept => !CONTROL_DEPT_ORDER.includes(dept));
    return [...ordered, ...remaining];
}

// 통제단편성부 색상 (고정)
export const CONTROL_DEPT_COLORS: Record<string, string> = {
    '긴급구조통제단장': '#FFD700',
    '지휘보좌관': '#E53935',
    '본서 상황관리': '#FB8C00',
    '기동감찰': '#795548',
    '지원기관 연락관': '#607D8B',
    '대응계획부': '#43A047',
    '현장지휘부': '#1E88E5',
    '자원지원부': '#8E24AA',
};

export function getControlDeptColor(dept: string): string {
    return CONTROL_DEPT_COLORS[dept] || '#757575';
}
