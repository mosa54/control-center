import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ScenarioDocument, ScenarioSection } from '@/lib/scenarioDocumentTypes';

export const runtime = 'nodejs';

const sections: ScenarioSection[] = [
    { id: 'pre', title: '훈련 전 단계', range: [6, 6] },
    { id: 'phase1', title: '훈련 1단계 - 화재발생 및 초동조치', range: [7, 9] },
    { id: 'phase2', title: '훈련 2단계 - 선착대 및 현장지휘대 활동', range: [10, 19] },
    { id: 'phase3', title: '훈련 3단계 - 긴급구조통제단 운영', range: [20, 26] },
    { id: 'phase4', title: '훈련 4단계 - 총력 대응', range: [27, 32] },
    { id: 'phase5', title: '훈련 5단계 - 복구 및 수습', range: [33, 34] },
];

const getSection = (pageNumber: number) => {
    return sections.find((section) => pageNumber >= section.range[0] && pageNumber <= section.range[1]);
};

const extractDisplayPageNumber = (text: string) => {
    const match = text.match(/^[-–—]\s*(\d{1,4})\s*[-–—]/);
    return match ? Number(match[1]) : undefined;
};

const getDisplayPageNumber = (pageNumber: number, section: ScenarioSection, text: string) => {
    if (section.id === 'pre') return 0;
    return extractDisplayPageNumber(text) ?? pageNumber;
};

const getPdfParseWorkerSrc = () => {
    const workerPath = join(
        process.cwd(),
        'node_modules',
        'pdf-parse',
        'dist',
        'pdf-parse',
        'esm',
        'pdf.worker.mjs',
    );

    if (!existsSync(workerPath)) {
        throw new Error(`PDF worker 파일을 찾을 수 없습니다: ${workerPath}`);
    }

    return pathToFileURL(workerPath).href;
};

const formatText = (text: string) => {
    return text
        .replace(/\s+/g, ' ')
        .replace(/^-\s*\d+\s*-\s*/, '')
        .replace(/주요상황 행동 및 시나리오 기타/g, '주요상황 / 행동 및 시나리오 / 기타')
        .replace(/\s+□\s+/g, '\n□ ')
        .replace(/\s+★\s*/g, '\n★ ')
        .replace(/\s+\s*/g, '\n- ')
        .replace(/\s+\[ /g, '\n[ ')
        .replace(/\s+\[/g, '\n[')
        .replace(/\s+-\s+/g, '\n- ')
        .replace(/\s*\/\s*\[/g, ' /\n[')
        .replace(/^-+\s*\d+\s*$/gm, '')
        .replace(/^-+\s+(□\s*)/gm, '$1')
        .replace(/^-+\s+(주요상황)/gm, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

const makeTitle = (pageNumber: number, text: string, sectionTitle: string) => {
    if (pageNumber === 6) return '훈련 전 안내 멘트';
    if (pageNumber === 34) return '마무리 여백';

    const withoutPage = text.replace(/^-\s*\d+\s*-\s*/, '').trim();
    const firstBracket = withoutPage.indexOf('[');
    const firstStar = withoutPage.indexOf('★');
    const cutAt = [firstBracket, firstStar].filter((n) => n > 0).sort((a, b) => a - b)[0] || 70;
    const title = withoutPage
        .slice(0, cutAt)
        .replace(/주요상황 \/ 행동 및 시나리오 \/ 기타/g, '')
        .trim();

    return title || sectionTitle;
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'PDF 파일이 없습니다.' }, { status: 400 });
        }

        if (file.type && file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'PDF 파일만 업로드할 수 있습니다.' }, { status: 400 });
        }

        const { PDFParse } = await import('pdf-parse');
        PDFParse.setWorker(getPdfParseWorkerSrc());
        const parser = new PDFParse({ data: Buffer.from(await file.arrayBuffer()) });
        const info = await parser.getInfo();
        const pages: ScenarioDocument['pages'] = [];

        try {
            for (let pageNumber = 1; pageNumber <= info.total; pageNumber += 1) {
                const section = getSection(pageNumber);
                if (!section) continue;

                const textResult = await parser.getText({
                    partial: [pageNumber],
                    pageJoiner: '',
                    itemJoiner: ' ',
                });
                const rawText = textResult.getPageText(pageNumber).replace(/\s+/g, ' ').trim();
                if (!rawText) continue;

                const displayPageNumber = getDisplayPageNumber(pageNumber, section, rawText);
                const text = formatText(rawText);
                pages.push({
                    pageNumber,
                    displayPageNumber,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    title: makeTitle(pageNumber, text, section.title),
                    text,
                });
            }
        } finally {
            await parser.destroy();
        }

        if (pages.length === 0) {
            return NextResponse.json({ error: 'PDF에서 시나리오 본문을 추출하지 못했습니다.' }, { status: 422 });
        }

        const document: ScenarioDocument = {
            title: '2026년 중부소방서 긴급구조종합훈련 시나리오',
            sourceFilename: file.name,
            uploadedAt: new Date().toISOString(),
            sections,
            pages,
        };

        return NextResponse.json({ document });
    } catch (error) {
        console.error('Scenario PDF parse failed:', error);
        const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        return NextResponse.json({ error: `시나리오 PDF 처리 실패: ${message}` }, { status: 500 });
    }
}
