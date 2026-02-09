const fs = require('fs');
const path = require('path');

async function extractPDF(filePath) {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const dataBuffer = fs.readFileSync(filePath);
    const data = new Uint8Array(dataBuffer);

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDoc = await loadingTask.promise;

    const result = {
        filename: path.basename(filePath),
        numPages: pdfDoc.numPages,
        pages: []
    };

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const strings = textContent.items.map(item => item.str);
        result.pages.push({
            pageNum: i,
            content: strings.join(' ')
        });
    }

    return result;
}

async function main() {
    const pdfFiles = [
        path.join(__dirname, '..', '사상자 이송현황판.pdf'),
        path.join(__dirname, '..', '화재 등 사고상황보고서.pdf')
    ];

    const results = [];
    for (const file of pdfFiles) {
        results.push(await extractPDF(file));
    }

    const outputPath = path.join(__dirname, 'pdf_extracted.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log('Saved to:', outputPath);
}

main().catch(console.error);
