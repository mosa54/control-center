const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../통제단 웹앱용 직원 임무.xlsx');
const outputPath = path.join(__dirname, '../src/lib/defaultData.ts');

try {
    const workbook = XLSX.readFile(filePath);

    // 시트 1: 직원 데이터
    const employeeSheet = workbook.Sheets[workbook.SheetNames[0]];
    const employeeRows = XLSX.utils.sheet_to_json(employeeSheet);

    // 시트 2: 임무 데이터
    const missionSheet = workbook.Sheets[workbook.SheetNames[1]];
    const missionRows = XLSX.utils.sheet_to_json(missionSheet);

    // 시트 3: 물품 데이터 (존재 시)
    let supplyRows = [];
    if (workbook.SheetNames.length > 2) {
        const supplySheet = workbook.Sheets[workbook.SheetNames[2]];
        supplyRows = XLSX.utils.sheet_to_json(supplySheet);
    }

    const employees = employeeRows.map((row, index) => ({
        id: `emp-${index + 1}`,
        순: Number(row['순']) || index + 1,
        소속부서: String(row['소속부서'] || ''),
        직급: String(row['직급'] || ''),
        성명: String(row['성명'] || ''),
        직위: String(row['직위'] || ''),
        통제단편성부: String(row['통제단편성부'] || ''),
        근무형태: String(row['근무형태'] || '일근'),
        임무코드_당번: String(row['임무코드_당번'] || ''),
        임무코드_비번: String(row['임무코드_비번'] || ''),
    })).filter(emp => emp.성명 || emp.직위);

    const missions = missionRows.map(row => ({
        임무코드: String(row['임무코드'] || ''),
        임무명: String(row['임무명'] || ''),
        임무내용: String(row['임무내용'] || ''),
    })).filter(m => m.임무코드);

    const supplies = supplyRows.map(row => ({
        부서: String(row['부서'] || row['통제단편성부'] || ''),
        비치물품: String(row['비치물품'] || row['내용'] || row['물품'] || ''),
    })).filter(s => s.부서 && s.비치물품);

    const fileContent = `import { ExcelData } from './excel';

export const DEFAULT_DATA: ExcelData = {
    employees: ${JSON.stringify(employees, null, 2)},
    missions: ${JSON.stringify(missions, null, 2)},
    supplies: ${JSON.stringify(supplies, null, 2)},
    uploadedAt: new Date('${new Date().toISOString()}'),
};
`;

    fs.writeFileSync(outputPath, fileContent, 'utf8');
    console.log(`Successfully generated ${outputPath}`);
    console.log(`Employees: ${employees.length}, Missions: ${missions.length}, Supplies: ${supplies.length}`);

} catch (error) {
    console.error('Error processing Excel:', error);
    process.exit(1);
}
