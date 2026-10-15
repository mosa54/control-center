import * as XLSX from 'xlsx';
import type { ScenarioDocument, ScenarioPage } from './scenarioDocumentTypes';

// Keep each spreadsheet row intact: dialogue and its decision/reference notes belong together.
export function parseScenarioExcel(data: ArrayBuffer, sourceFilename: string): ScenarioDocument {
    const workbook = XLSX.read(data, { type: 'array' });
    const document: ScenarioDocument = {
        title: sourceFilename.replace(/\.xlsx$/i, ''),
        sourceFilename,
        sourceType: 'xlsx',
        sections: [],
        pages: [],
    };

    for (const [sheetIndex, sheetName] of workbook.SheetNames.entries()) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '', raw: false });
        const headerIndex = rows.findIndex((row) => {
            const labels = row.map((cell) => String(cell).replace(/\s/g, ''));
            return ['주요상황', '시간', '대상자', '내용'].every((label) => labels.includes(label));
        });
        if (headerIndex < 0) continue;

        const headers = rows[headerIndex].map((cell) => String(cell).replace(/\s/g, ''));
        const cellText = (row: string[], label: string) => String(row[headers.indexOf(label)] ?? '').replace(/\r/g, '').trim();
        const title = rows.slice(0, headerIndex).flat().find((cell) => String(cell).trim());
        if (title && document.sections.length === 0) document.title = String(title).trim();
        const sectionId = `sheet-${sheetIndex + 1}`;
        const firstPage = document.pages.length + 1;
        let currentPage: ScenarioPage | undefined;

        for (const row of rows.slice(headerIndex + 1)) {
            const situation = cellText(row, '주요상황');
            const time = cellText(row, '시간');
            const speaker = cellText(row, '대상자').replace(/\s*\n\s*/g, ' / ');
            const content = cellText(row, '내용');
            const points = cellText(row, '판단·행동포인트');
            const reference = cellText(row, '근거');
            if (![situation, time, speaker, content, points, reference].some(Boolean)) continue;

            if (!currentPage || situation || time) {
                currentPage = {
                    pageNumber: document.pages.length + 1,
                    sectionId,
                    sectionTitle: sheetName,
                    title: [time && `[${time}]`, situation.replace(/\n/g, ' ')].filter(Boolean).join(' ') || sheetName,
                    text: '',
                    rows: [],
                    hasOtherColumn: true,
                };
                document.pages.push(currentPage);
            }

            const action = [speaker && `[${speaker}]`, content].filter(Boolean).join(' ');
            const other = [points && `판단·행동 포인트: ${points}`, reference && `근거: ${reference}`].filter(Boolean).join('\n');
            // Standalone merged footer rows (e.g. 훈 련 종 료) are already in the page title.
            if (action || other) currentPage.rows!.push({ situation: '', action, other });
            currentPage.text = [currentPage.text, action, other].filter(Boolean).join('\n');
        }

        if (document.pages.length >= firstPage) {
            document.sections.push({ id: sectionId, title: sheetName, range: [firstPage, document.pages.length] });
        }
    }

    if (document.pages.length === 0) {
        throw new Error('엑셀에서 시나리오를 찾지 못했습니다. 주요상황, 시간, 대상자, 내용 열을 확인해주세요.');
    }
    return document;
}
