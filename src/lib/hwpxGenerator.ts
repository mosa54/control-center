import { saveAs } from 'file-saver';

// 공통 HTML 템플릿 래퍼 (문서 전체 구조 및 용지 여백 설정)
const htmlTemplate = (bodyContent: string) => `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        /* HWP에서 @page 여백을 인식하도록 설정 */
        @page {
            size: A4;
            margin: 20mm 20mm 10mm 20mm; /* 상 우 하 좌 */
            mso-page-orientation: portrait;
            mso-header-margin: 0mm;
            mso-footer-margin: 0mm;
            mso-page-margin-top: 20mm;
            mso-page-margin-bottom: 10mm;
            mso-page-margin-left: 20mm;
            mso-page-margin-right: 20mm;
        }
        /* 기본적으로 테이블 테두리 붕괴 방지 */
        table { border-collapse: collapse; width: 100%; border: 1px solid #000; margin-bottom: 15px; }
        th, td { border: 1px solid #000; padding: 6px 4px; vertical-align: middle; }
    </style>
</head>
<body style="font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 11pt; color: #000; margin: 20mm 20mm 10mm 20mm;">
    ${bodyContent}
</body>
</html>
`;

// 사고상황보고서 HTML -> HWP 생성
export async function generateAccidentReportHwpx(data: any): Promise<void> {
    const sumPersonnel = ['인원_소방', '인원_의용소방대', '인원_경찰', '인원_그밖의인원']
        .reduce((s, k) => s + (parseInt(data[k]) || 0), 0);
    const sumEquipment = ['장비_펌프', '장비_탱크', '장비_구조장비', '장비_구급장비', '장비_그밖의장비']
        .reduce((s, k) => s + (parseInt(data[k]) || 0), 0);
    const sumCasualties = (parseInt(data.인명피해_사망) || 0) + (parseInt(data.인명피해_부상) || 0);
    const sumProperty = (parseInt(data.재산피해_부동산) || 0) + (parseInt(data.재산피해_동산) || 0);

    // 인라인 스타일로 안전한 서식 지정
    const h1Style = "text-align: center; font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 18pt; font-weight: bold; margin-bottom: 20px;";
    const h2Style = "font-size: 12pt; margin-top: 20px; margin-bottom: 10px; font-weight: bold;";
    const pStyle = "margin: 5px 0; line-height: 1.5; font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 11pt;";
    const boxStyle = "border: 1px solid #000; padding: 10px; margin-bottom: 15px;";
    const thStyle = "background-color: #f2f2f2; text-align: center; font-weight: bold; font-size: 10pt;";
    const tdStyle = "font-size: 10pt;";

    let body = `
        <h1 style="${h1Style}">화재 등 사고상황보고서</h1>
        
        <table>
            <tr>
                <th style="width:15%; ${thStyle}">수신</th><td style="text-align:left; ${tdStyle}">${data.수신 || ''}</td>
                <th style="width:15%; ${thStyle}">보고일시</th><td style="${tdStyle}">${data.보고일시 || ''}</td>
            </tr>
            <tr>
                <th style="${thStyle}">참조</th><td style="text-align:left; ${tdStyle}">${data.참조 || ''}</td>
                <th style="${thStyle}">작성자</th><td style="${tdStyle}">${data.작성자 || ''}</td>
            </tr>
            <tr>
                <th style="${thStyle}">발신</th><td style="text-align:left; ${tdStyle}">${data.발신 || ''}</td>
                <th style="${thStyle}">보고책임자</th><td style="${tdStyle}">${data.보고책임자 || ''}</td>
            </tr>
        </table>
        
        <h2 style="${h2Style}">1. 발생개요</h2>
        <div style="${boxStyle}">
            <div style="${pStyle}">가. 일 시: ${data.일시 || ''}</div>
            <div style="${pStyle}">나. 장 소: ${data.장소 || ''}</div>
            <div style="${pStyle}">다. 대 상: ${data.대상 || ''}</div>
            <div style="${pStyle}">라. 건물구조: ${data.건물구조 || ''}</div>
            <div style="${pStyle}">마. 원 인: ${data.원인 || ''}</div>
            <div style="${pStyle}">바. 사고개요: ${(data.사고개요 || '').replace(/\n/g, '<br/>')}</div>
        </div>

        <h2 style="${h2Style}">2. 피해상황</h2>
        <div style="${boxStyle}">
            <div style="${pStyle}">가. 인명피해: ${sumCasualties}명 (사망 ${data.인명피해_사망 || 0}, 부상 ${data.인명피해_부상 || 0})</div>
            ${data.사망자명단 ? `<div style="${pStyle}; padding-left:15px">- 사망자 명단: ${data.사망자명단.replace(/\n/g, '<br/>')}</div>` : ''}
            ${data.부상자명단 ? `<div style="${pStyle}; padding-left:15px">- 부상자 명단: ${data.부상자명단.replace(/\n/g, '<br/>')}</div>` : ''}
            <div style="${pStyle}">나. 재산피해: ${sumProperty}천원 (부동산 ${data.재산피해_부동산 || 0}, 동산 ${data.재산피해_동산 || 0})</div>
        </div>

        <h2 style="${h2Style}">3. 동원상황</h2>
        <div style="${boxStyle}">
            <div style="${pStyle}">가. 인원: ${sumPersonnel}명 (소방 ${data.인원_소방 || 0}, 의용소방대 ${data.인원_의용소방대 || 0}, 경찰 ${data.인원_경찰 || 0}, 그밖의 인원 ${data.인원_그밖의인원 || 0})</div>
            <div style="${pStyle}">나. 장비: ${sumEquipment}대 (펌프 ${data.장비_펌프 || 0}, 탱크 ${data.장비_탱크 || 0}, 구조장비 ${data.장비_구조장비 || 0}, 구급장비 ${data.장비_구급장비 || 0}, 그밖의 장비 ${data.장비_그밖의장비 || 0})</div>
        </div>

        <h2 style="${h2Style}">4. 조치사항</h2>
        <div style="${boxStyle}">
    `;

    if (data.조치사항 && Array.isArray(data.조치사항)) {
        data.조치사항.forEach((action: any) => {
            if (action.시간 || action.내용) {
                body += `<div style="${pStyle}">○ ${action.시간 || ''} &nbsp; ${action.내용 || ''}</div>`;
            }
        });
    }

    let safeGita = '';
    if (typeof data.기타사항 === 'string') safeGita = data.기타사항.replace(/\n/g, '<br/>');
    else if (Array.isArray(data.기타사항)) safeGita = data.기타사항.join('<br/>');

    body += `
        </div>
        <h2 style="${h2Style}">5. 그 밖의 사항 (보험가입 및 언론보도내용 등)</h2>
        <div style="${boxStyle}">
            <div style="${pStyle}">${safeGita}</div>
        </div>
    `;

    const htmlBlob = new Blob(['\ufeff' + htmlTemplate(body)], { type: 'application/msword;charset=utf-8' });
    saveAs(htmlBlob, '사고상황보고서.hwp');
}

// 사상자 이송현황 HTML -> HWP 생성
export async function generateCasualtyReportHwpx(data: any): Promise<void> {
    const emergencyCount = (data.rows || []).filter((r: any) => r.중증도 === '긴급').length;
    const urgentCount = (data.rows || []).filter((r: any) => r.중증도 === '응급').length;
    const nonUrgentCount = (data.rows || []).filter((r: any) => r.중증도 === '비응급').length;
    const deadCount = (data.rows || []).filter((r: any) => r.중증도 === '사망').length;
    const totalCount = emergencyCount + urgentCount + nonUrgentCount + deadCount;

    // 인라인 스타일 선언
    const titleStyle = "text-align: center; font-family: 'Malgun Gothic', '맑은 고딕', serif; font-size: 15pt; font-weight: bold; margin-bottom: 20px;";
    const pStyle = "margin: 5px 0; font-family: 'Dotum', '돋움', serif; font-size: 11pt; line-height: 1.5;";
    const thStyle = "font-family: 'Dotum', '돋움', serif; font-size: 11pt; font-weight: bold; background-color: #f2f2f2; text-align: center; border: 1px solid #000;";
    const tdStyle = "font-family: 'Dotum', '돋움', serif; font-size: 11pt; font-weight: normal; border: 1px solid #000;";
    const writerStyle = "font-family: 'Dotum', '돋움', serif; font-size: 11pt; font-weight: normal; text-align: right; margin-top: 20px;";

    let body = `
        <h1 style="${titleStyle}">사상자 이송현황</h1>
        
        <div style="${pStyle} font-weight:bold; margin-bottom:10px;">
            [중증도 집계] 합계: ${totalCount}명 | 긴급: ${emergencyCount}명 | 응급: ${urgentCount}명 | 비응급: ${nonUrgentCount}명 | 사망: ${deadCount}명
        </div>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 15px;">
            <thead>
                <tr>
                    <th style="${thStyle} width:40px;">연번</th>
                    <th style="${thStyle}">성명</th>
                    <th style="${thStyle} width:40px;">성별</th>
                    <th style="${thStyle} width:40px;">연령</th>
                    <th style="${thStyle}">주증상(손상원인)</th>
                    <th style="${thStyle}">이송병원</th>
                    <th style="${thStyle} width:70px;">중증도<br/>분류</th>
                    <th style="${thStyle}">발견지점</th>
                    <th style="${thStyle} width:60px;">이송수단</th>
                    <th style="${thStyle} width:60px;">출발시간</th>
                    <th style="${thStyle}">비고</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (data.rows) {
        data.rows.forEach((row: any, i: number) => {
            if (!row.성명 && !row.주증상 && !row.이송병원) return; // 빈 행 건너뛰기
            body += `
                <tr>
                    <td style="${tdStyle} text-align:center;">${i + 1}</td>
                    <td style="${tdStyle} text-align:center;">${row.성명 || ''}</td>
                    <td style="${tdStyle} text-align:center;">${row.성별 || ''}</td>
                    <td style="${tdStyle} text-align:center;">${row.연령 || ''}</td>
                    <td style="${tdStyle}">${row.주증상 || ''}</td>
                    <td style="${tdStyle}">${row.이송병원 || ''}</td>
                    <td style="${tdStyle} text-align:center;">${row.중증도 || ''}</td>
                    <td style="${tdStyle}">${row.발견지점 || ''}</td>
                    <td style="${tdStyle} text-align:center;">${row.이송수단 || ''}</td>
                    <td style="${tdStyle} text-align:center;">${row.출발시간 || ''}</td>
                    <td style="${tdStyle}">${row.비고 || ''}</td>
                </tr>
            `;
        });
    }

    body += `
            </tbody>
        </table>
        
        <div style="${writerStyle}">
            □ 작성자 : 소속 <span style="font-weight:normal;">${data.작성자_소속 || ''}</span> &nbsp;&nbsp;직급 <span style="font-weight:normal;">${data.작성자_직급 || ''}</span> &nbsp;&nbsp;성명 <span style="font-weight:normal;">${data.작성자_성명 || ''}</span> &nbsp;&nbsp;(서명 또는 인)
        </div>
    `;

    const htmlBlob = new Blob(['\ufeff' + htmlTemplate(body)], { type: 'application/msword;charset=utf-8' });
    saveAs(htmlBlob, '사상자_이송현황.hwp');
}
