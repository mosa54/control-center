const fs = require('fs');

const sections = [
  { id: 'pre', title: '훈련 전 단계', range: [6, 6] },
  { id: 'phase1', title: '훈련 1단계 - 화재발생 및 초동조치', range: [7, 9] },
  { id: 'phase2', title: '훈련 2단계 - 선착대 및 현장지휘대 활동', range: [10, 19] },
  { id: 'phase3', title: '훈련 3단계 - 긴급구조통제단 운영', range: [20, 26] },
  { id: 'phase4', title: '훈련 4단계 - 총력 대응', range: [27, 32] },
  { id: 'phase5', title: '훈련 5단계 - 복구 및 수습', range: [33, 34] },
];

function getSection(pageNumber) {
  return sections.find((section) => pageNumber >= section.range[0] && pageNumber <= section.range[1]);
}

function formatText(text) {
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
}

function makeTitle(pageNumber, text, sectionTitle) {
  if (pageNumber === 3) return '훈련 계획표';
  if (pageNumber === 4) return '각 역할별 담당자';
  if (pageNumber === 5) return '훈련 진행별 차량 출동 순서';
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
}

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync('scenario-source.pdf'));
  const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let i = 1; i <= pdfDoc.numPages; i += 1) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const rawText = textContent.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
    if (!rawText) continue;

    const section = getSection(i);
    if (!section) continue;

    const text = formatText(rawText);
    pages.push({
      pageNumber: i,
      sectionId: section.id,
      sectionTitle: section.title,
      title: makeTitle(i, text, section.title),
      text,
    });
  }

  const document = {
    title: '2026년 중부소방서 긴급구조종합훈련 시나리오',
    sourceFilename: '★(중부)2026년 긴급구조종합훈련 시나리오###.pdf',
    sections,
    pages,
  };

  fs.writeFileSync('src/lib/scenarioDocument.generated.json', JSON.stringify(document, null, 2), 'utf8');
  console.log(`wrote ${pages.length} pages`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
