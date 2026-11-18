'use client';

import { useApp } from '@/lib/store';
import ScenarioDocumentViewer from '@/components/ScenarioDocumentViewer';

export default function ScenarioDocumentPage() {
    const { scenarioDocument, isLoaded } = useApp();
    if (!scenarioDocument) {
        return <div className="scenario-doc-shell"><p>{isLoaded ? '등록된 시나리오가 없습니다.' : '원문 확인 중…'}</p></div>;
    }

    return (
        <div className="scenario-doc-shell">
            <div className="scenario-doc-hero">
                <h1>{scenarioDocument.title.replace(/\s*\(서장님용\)/g, '').trim()}</h1>
            </div>
            <ScenarioDocumentViewer key={scenarioDocument.uploadedAt ?? scenarioDocument.sourceFilename}
                document={scenarioDocument} restoreScrollPosition={isLoaded} />
        </div>
    );
}
