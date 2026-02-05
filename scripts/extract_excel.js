const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../통제단 웹앱용 직원 임무.xlsx');

// 매핑 정보 (src/lib/data.ts 참고)
const DEPT_MAPPING = {
    '지휘보좌관': 'command-staff',
    '본서상황관리': 'situation',
    '대응계획부': 'planning',
    '현장지휘부': 'field',
    '자원지원부': 'support'
    // 엑셀의 부서명과 정확히 일치해야 함. 다를 경우 추가 매핑 필요.
    // src/lib/excel.ts의 CONTROL_DEPT_COLORS 키값 참고:
    // '긴급구조통제단장', '지휘보좌관', '본서 상황관리', '기동감찰', '지원기관 연락관', '대응계획부', '현장지휘부', '자원지원부'
};

// 원소속 부서 목록 (유효성 검사용)
const VALID_ORIGINAL_DEPTS = [
    '청문감사담당관',
    '소방행정과',
    '예방안전과',
    '구조구급과',
    '현장대응단',
];

// 직급 목록 (유효성 검사용)
const VALID_RANKS = [
    '소방정',
    '소방령',
    '소방경',
    '소방위',
    '소방장',
    '소방교',
    '소방사',
];

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // 첫 번째 시트라고 가정
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let employees = [];
    let idCounter = 1;

    console.log(`총 ${rows.length}개의 행을 읽었습니다.`);

    rows.forEach((row, index) => {
        // 필수 필드 확인
        const name = row['성명'];
        const rank = row['직급'];
        const originalDept = row['소속부서'];
        const controlDeptName = row['통제단편성부']; // 엑셀 컬럼명 확인 필요 (src/lib/excel.ts 참고)

        if (!name) return; // 이름 없으면 스킵

        let controlDeptId = DEPT_MAPPING[controlDeptName];

        // 매핑되지 않은 부서 처리 (예: 긴급구조통제단장 등)
        // src/lib/data.ts에는 5개 부서만 정의되어 있음. 
        // 매핑되지 않는 경우 경고 출력 후 null 처리하거나 기본값 할당
        if (!controlDeptId) {
            // 상황실 등으로 매핑해야 할 수도 있음. 일단 로그 출력.
            // console.warn(`Warning: Unmapped control dept '${controlDeptName}' for ${name}`);
            // 본서 상황관리, 자원지원부 등 매핑 추가 필요할 수 있음
            if (controlDeptName === '본서 상황관리') controlDeptId = 'situation';
            else if (controlDeptName === '자원지원부') controlDeptId = 'support';
            // ... 기타 처리
        }

        // CONTROL_DEPTS에 없는 부서는 일단 제외하거나 기타로 처리해야 함.
        // 여기서는 data.ts에 정의된 5개 부서 중 하나로 매핑되어야 함.
        // 매핑 표:
        // 지휘보좌관 -> command-staff
        // 본서상황관리(본서 상황관리) -> situation
        // 대응계획부 -> planning
        // 현장지휘부 -> field
        // 자원지원부 -> support

        // 추가 매핑 시도
        if (!controlDeptId) {
            if (controlDeptName && controlDeptName.includes('상황')) controlDeptId = 'situation';
            else if (controlDeptName && controlDeptName.includes('지휘보좌')) controlDeptId = 'command-staff';
            else if (controlDeptName && controlDeptName.includes('계획')) controlDeptId = 'planning';
            else if (controlDeptName && controlDeptName.includes('현장')) controlDeptId = 'field';
            else if (controlDeptName && controlDeptName.includes('지원')) controlDeptId = 'support';
        }

        if (controlDeptId) {
            employees.push({
                id: `e${String(idCounter++).padStart(3, '0')}`,
                name: name.trim(),
                rank: rank ? rank.trim() : '소방사', // 기본값
                originalDept: originalDept ? originalDept.trim() : '소방행정과', // 기본값
                controlDeptId: controlDeptId
            });
        } else {
            // console.log(`Skipping: ${name} (Dept: ${controlDeptName})`);
        }
    });

    console.log(`// 임시 직원 데이터 (총 ${employees.length}명)`);
    console.log('export const EMPLOYEES: Employee[] = [');

    // 부서별로 그룹화하여 출력 (가독성을 위해)
    const grouped = {};
    Object.values(DEPT_MAPPING).forEach(id => grouped[id] = []);

    employees.forEach(e => {
        if (!grouped[e.controlDeptId]) grouped[e.controlDeptId] = [];
        grouped[e.controlDeptId].push(e);
    });

    // data.ts의 주석 스타일을 따름
    // 지휘보좌관
    printGroup(grouped['command-staff'], '지휘보좌관');
    printGroup(grouped['situation'], '본서상황관리');
    printGroup(grouped['planning'], '대응계획부');
    printGroup(grouped['field'], '현장지휘부');
    printGroup(grouped['support'], '자원지원부');

    console.log('];');

} catch (error) {
    console.error('Error reading Excel file:', error);
}

function printGroup(list, groupName) {
    if (!list || list.length === 0) return;
    console.log(`  // ${groupName} (${list.length}명)`);
    list.forEach(e => {
        console.log(`  { id: '${e.id}', name: '${e.name}', rank: '${e.rank}', originalDept: '${e.originalDept}', controlDeptId: '${e.controlDeptId}' },`);
    });
    console.log('');
}
