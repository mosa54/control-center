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

// 임시 직원 데이터 (총 58명)
export const EMPLOYEES: Employee[] = [
  // 지휘보좌관 (7명)
  { id: 'e006', name: '정성고', rank: '소방경', originalDept: '소방행정과', controlDeptId: 'command-staff' },
  { id: 'e009', name: '김만수', rank: '소방사', originalDept: '소방행정과', controlDeptId: 'command-staff' },
  { id: 'e029', name: '김경훈', rank: '소방경', originalDept: '구조구급과', controlDeptId: 'command-staff' },
  { id: 'e039', name: '오무원', rank: '소방경', originalDept: '현장대응단', controlDeptId: 'command-staff' },
  { id: 'e046', name: '황중석', rank: '소방위', originalDept: '현장대응단', controlDeptId: 'command-staff' },
  { id: 'e051', name: '이현명', rank: '소방위', originalDept: '현장대응단', controlDeptId: 'command-staff' },
  { id: 'e056', name: '윤재윤', rank: '소방위', originalDept: '현장대응단', controlDeptId: 'command-staff' },

  // 본서상황관리 (4명)
  { id: 'e001', name: '김승일', rank: '소방교', originalDept: '청문감사담당관', controlDeptId: 'situation' },
  { id: 'e005', name: '강승주', rank: '소방령', originalDept: '소방행정과', controlDeptId: 'situation' },
  { id: 'e023', name: '송지훈', rank: '소방교', originalDept: '예방안전과', controlDeptId: 'situation' },
  { id: 'e027', name: '이유진', rank: '소방사', originalDept: '예방안전과', controlDeptId: 'situation' },

  // 대응계획부 (13명)
  { id: 'e007', name: '김경민', rank: '소방위', originalDept: '소방행정과', controlDeptId: 'planning' },
  { id: 'e008', name: '홍승민', rank: '소방장', originalDept: '소방행정과', controlDeptId: 'planning' },
  { id: 'e025', name: '정문수', rank: '소방경', originalDept: '예방안전과', controlDeptId: 'planning' },
  { id: 'e028', name: '박종도', rank: '소방령', originalDept: '구조구급과', controlDeptId: 'planning' },
  { id: 'e033', name: '신희진', rank: '소방경', originalDept: '구조구급과', controlDeptId: 'planning' },
  { id: 'e034', name: '이순미', rank: '소방위', originalDept: '구조구급과', controlDeptId: 'planning' },
  { id: 'e040', name: '문효찬', rank: '소방위', originalDept: '현장대응단', controlDeptId: 'planning' },
  { id: 'e041', name: '박민지', rank: '소방장', originalDept: '현장대응단', controlDeptId: 'planning' },
  { id: 'e042', name: '양미주', rank: '소방장', originalDept: '현장대응단', controlDeptId: 'planning' },
  { id: 'e043', name: '강찬우', rank: '소방사', originalDept: '현장대응단', controlDeptId: 'planning' },
  { id: 'e045', name: '강병윤', rank: '소방위', originalDept: '현장대응단', controlDeptId: 'planning' },
  { id: 'e050', name: '이정민', rank: '소방위', originalDept: '현장대응단', controlDeptId: 'planning' },
  { id: 'e055', name: '이창석', rank: '소방위', originalDept: '현장대응단', controlDeptId: 'planning' },

  // 현장지휘부 (23명)
  { id: 'e002', name: '김지영', rank: '소방경', originalDept: '청문감사담당관', controlDeptId: 'field' },
  { id: 'e003', name: '이우종', rank: '소방위', originalDept: '청문감사담당관', controlDeptId: 'field' },
  { id: 'e004', name: '오지은', rank: '소방교', originalDept: '청문감사담당관', controlDeptId: 'field' },
  { id: 'e015', name: '최해출', rank: '소방경', originalDept: '예방안전과', controlDeptId: 'field' },
  { id: 'e016', name: '최철준', rank: '소방위', originalDept: '예방안전과', controlDeptId: 'field' },
  { id: 'e017', name: '장한성', rank: '소방위', originalDept: '예방안전과', controlDeptId: 'field' },
  { id: 'e019', name: '박성철', rank: '소방장', originalDept: '예방안전과', controlDeptId: 'field' },
  { id: 'e021', name: '이동찬', rank: '소방교', originalDept: '예방안전과', controlDeptId: 'field' },
  { id: 'e024', name: '노혜정', rank: '소방장', originalDept: '예방안전과', controlDeptId: 'field' },
  { id: 'e031', name: '이성은', rank: '소방교', originalDept: '구조구급과', controlDeptId: 'field' },
  { id: 'e035', name: '정상혁', rank: '소방교', originalDept: '구조구급과', controlDeptId: 'field' },
  { id: 'e036', name: '손시헌', rank: '소방령', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e037', name: '박형찬', rank: '소방령', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e038', name: '김준해', rank: '소방령', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e044', name: '조강원', rank: '소방경', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e047', name: '김종철', rank: '소방장', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e048', name: '김정석', rank: '소방장', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e049', name: '정희석', rank: '소방경', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e052', name: '장민석', rank: '소방교', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e053', name: '이상빈', rank: '소방장', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e054', name: '정호근', rank: '소방경', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e057', name: '김동혁', rank: '소방교', originalDept: '현장대응단', controlDeptId: 'field' },
  { id: 'e058', name: '김원형', rank: '소방교', originalDept: '현장대응단', controlDeptId: 'field' },

  // 자원지원부 (11명)
  { id: 'e010', name: '정우식', rank: '소방경', originalDept: '소방행정과', controlDeptId: 'support' },
  { id: 'e011', name: '강인호', rank: '소방위', originalDept: '소방행정과', controlDeptId: 'support' },
  { id: 'e012', name: '이동주', rank: '소방장', originalDept: '소방행정과', controlDeptId: 'support' },
  { id: 'e013', name: '권순호', rank: '소방교', originalDept: '소방행정과', controlDeptId: 'support' },
  { id: 'e014', name: '장윤영', rank: '소방령', originalDept: '예방안전과', controlDeptId: 'support' },
  { id: 'e018', name: '양재원', rank: '소방위', originalDept: '예방안전과', controlDeptId: 'support' },
  { id: 'e020', name: '김명선', rank: '소방교', originalDept: '예방안전과', controlDeptId: 'support' },
  { id: 'e022', name: '남상균', rank: '소방교', originalDept: '예방안전과', controlDeptId: 'support' },
  { id: 'e026', name: '진영재', rank: '소방장', originalDept: '예방안전과', controlDeptId: 'support' },
  { id: 'e030', name: '정희도', rank: '소방위', originalDept: '구조구급과', controlDeptId: 'support' },
  { id: 'e032', name: '이두영', rank: '소방교', originalDept: '구조구급과', controlDeptId: 'support' },

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
