import Link from 'next/link';
import ScenarioDocumentViewer from '@/components/ScenarioDocumentViewer';
import scenarioDocument from '@/lib/scenarioDocument.generated.json';

export default function ScenarioDocumentPage() {
    return (
        <div className="scenario-doc-shell">
            <div className="scenario-doc-hero">
                <Link href="/training" className="scenario-doc-back no-print">
                    ← 상황부여 메시지
                </Link>
                <h1>{scenarioDocument.title}</h1>
                <p>
                    PDF 원문을 앱 안에서 텍스트 문서로 열람합니다.
                </p>
            </div>

            <ScenarioDocumentViewer document={scenarioDocument} />
        </div>
    );
}
