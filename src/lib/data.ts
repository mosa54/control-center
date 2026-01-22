// 직급 목록
export const RANKS = [
  '소방정',
  '소방령',
  '소방경',
  '소방위',
  '소방장',
  '소방교',
  '소방사',
] as const;

export type Rank = typeof RANKS[number];

// 소속 부서 (원래 근무하는 부서)
export const ORIGINAL_DEPTS = [
  '청문감사담당관',
  '소방행정과',
  '예방안전과',
  '구조구급과',
  '현장대응단',
] as const;

export type OriginalDept = typeof ORIGINAL_DEPTS[number];

// 통제단 부서 (비상시 편성되는 부서)
export const CONTROL_DEPTS = [
  { id: 'command-staff', name: '지휘보좌관', capacity: 6, color: '#E53935' },
  { id: 'situation', name: '본서상황관리', capacity: 4, color: '#FB8C00' },
  { id: 'planning', name: '대응계획부', capacity: 7, color: '#43A047' },
  { id: 'field', name: '현장지휘부', capacity: 9, color: '#1E88E5' },
  { id: 'support', name: '자원지원부', capacity: 6, color: '#8E24AA' },
] as const;

export type ControlDeptId = typeof CONTROL_DEPTS[number]['id'];

// 직원 인터페이스
export interface Employee {
  id: string;
  name: string;
  rank: Rank;
  originalDept: OriginalDept;
  controlDeptId: ControlDeptId;
}

// 임시 직원 데이터 (총 32명)
export const EMPLOYEES: Employee[] = [
  // 청문감사담당관 (6명) → 지휘보좌관
  { id: 'e001', name: '김정훈', rank: '소방정', originalDept: '청문감사담당관', controlDeptId: 'command-staff' },
  { id: 'e002', name: '이상민', rank: '소방령', originalDept: '청문감사담당관', controlDeptId: 'command-staff' },
  { id: 'e003', name: '박준형', rank: '소방경', originalDept: '청문감사담당관', controlDeptId: 'command-staff' },
  { id: 'e004', name: '최영호', rank: '소방위', originalDept: '청문감사담당관', controlDeptId: 'command-staff' },
  { id: 'e005', name: '정민수', rank: '소방장', originalDept: '청문감사담당관', controlDeptId: 'command-staff' },
  { id: 'e006', name: '강태우', rank: '소방교', originalDept: '청문감사담당관', controlDeptId: 'command-staff' },

  // 소방행정과 (6명) → 본서상황관리 4명 + 자원지원부 2명
  { id: 'e007', name: '윤성재', rank: '소방령', originalDept: '소방행정과', controlDeptId: 'situation' },
  { id: 'e008', name: '임현우', rank: '소방경', originalDept: '소방행정과', controlDeptId: 'situation' },
  { id: 'e009', name: '한지훈', rank: '소방위', originalDept: '소방행정과', controlDeptId: 'situation' },
  { id: 'e010', name: '오세진', rank: '소방장', originalDept: '소방행정과', controlDeptId: 'situation' },
  { id: 'e011', name: '서동현', rank: '소방교', originalDept: '소방행정과', controlDeptId: 'support' },
  { id: 'e012', name: '권영민', rank: '소방사', originalDept: '소방행정과', controlDeptId: 'support' },

  // 예방안전과 (7명) → 대응계획부
  { id: 'e013', name: '조현석', rank: '소방령', originalDept: '예방안전과', controlDeptId: 'planning' },
  { id: 'e014', name: '황인호', rank: '소방경', originalDept: '예방안전과', controlDeptId: 'planning' },
  { id: 'e015', name: '안재현', rank: '소방경', originalDept: '예방안전과', controlDeptId: 'planning' },
  { id: 'e016', name: '송민규', rank: '소방위', originalDept: '예방안전과', controlDeptId: 'planning' },
  { id: 'e017', name: '전용희', rank: '소방장', originalDept: '예방안전과', controlDeptId: 'planning' },
  { id: 'e018', name: '홍준표', rank: '소방교', originalDept: '예방안전과', controlDeptId: 'planning' },
  { id: 'e019', name: '유승호', rank: '소방사', originalDept: '예방안전과', controlDeptId: 'planning' },

  // 구조구급과 (9명) → 현장지휘부
  { id: 'e020', name: '배성훈', rank: '소방령', originalDept: '구조구급과', controlDeptId: 'field' },
  { id: 'e021', name: '노진우', rank: '소방경', originalDept: '구조구급과', controlDeptId: 'field' },
  { id: 'e022', name: '문태영', rank: '소방경', originalDept: '구조구급과', controlDeptId: 'field' },
  { id: 'e023', name: '고영준', rank: '소방위', originalDept: '구조구급과', controlDeptId: 'field' },
  { id: 'e024', name: '신동욱', rank: '소방위', originalDept: '구조구급과', controlDeptId: 'field' },
  { id: 'e025', name: '양현수', rank: '소방장', originalDept: '구조구급과', controlDeptId: 'field' },
  { id: 'e026', name: '류재혁', rank: '소방장', originalDept: '구조구급과', controlDeptId: 'field' },
  { id: 'e027', name: '장호진', rank: '소방교', originalDept: '구조구급과', controlDeptId: 'field' },
  { id: 'e028', name: '김동훈', rank: '소방사', originalDept: '구조구급과', controlDeptId: 'field' },

  // 현장대응단 (4명) → 자원지원부
  { id: 'e029', name: '이건희', rank: '소방경', originalDept: '현장대응단', controlDeptId: 'support' },
  { id: 'e030', name: '박상우', rank: '소방위', originalDept: '현장대응단', controlDeptId: 'support' },
  { id: 'e031', name: '최준혁', rank: '소방장', originalDept: '현장대응단', controlDeptId: 'support' },
  { id: 'e032', name: '정우성', rank: '소방교', originalDept: '현장대응단', controlDeptId: 'support' },
];

// 부서별 임무 목록
export const CONTROL_DEPT_MISSIONS: Record<ControlDeptId, string[]> = {
  'command-staff': [
    '통제단장 보좌 및 지휘 지원',
    '유관기관 연락 및 협조',
    '상황 보고서 작성 및 전파',
    '언론 대응 및 홍보',
    '지휘소 운영 지원',
  ],
  'situation': [
    '재난상황 접수 및 전파',
    '상황판 운영 및 관리',
    '유관기관 상황 공유',
    '상황일지 작성',
  ],
  'planning': [
    '대응 계획 수립 및 조정',
    '자원 배치 계획 수립',
    '피해 현황 분석',
    '복구 계획 수립',
    '대응 매뉴얼 적용',
    '상황 예측 및 대비',
    '사후 평가 계획',
  ],
  'field': [
    '현장 지휘 및 통제',
    '인명 구조 작업 지휘',
    '화재 진압 작업 지휘',
    '현장 안전 관리',
    '현장 상황 보고',
    '구조대 운영',
    '구급대 운영',
    '현장 질서 유지',
    '대피 유도',
  ],
  'support': [
    '인력 동원 및 배치',
    '장비 지원 및 관리',
    '급식 및 휴식 지원',
    '차량 운용 지원',
    '물자 보급',
    '기타 행정 지원',
  ],
};

// 직원 조회 함수
export function getEmployeesByOriginalDept(dept: OriginalDept): Employee[] {
  return EMPLOYEES.filter(e => e.originalDept === dept);
}

export function getEmployeeById(id: string): Employee | undefined {
  return EMPLOYEES.find(e => e.id === id);
}

export function getControlDeptById(id: ControlDeptId) {
  return CONTROL_DEPTS.find(d => d.id === id);
}
