'use client';

import { useEffect, useState } from 'react';
import ScenarioDocumentViewer from '@/components/ScenarioDocumentViewer';
import { loadScenarioDocument } from '@/lib/scenarioDocumentStorage';
import { ScenarioDocument } from '@/lib/scenarioDocumentTypes';

interface ScenarioDocumentPageClientProps {
    defaultDocument: ScenarioDocument;
}

export default function ScenarioDocumentPageClient({ defaultDocument }: ScenarioDocumentPageClientProps) {
    const [document, setDocument] = useState<ScenarioDocument>(defaultDocument);
    const [isDocumentReady, setIsDocumentReady] = useState(false);

    useEffect(() => {
        let alive = true;

        loadScenarioDocument()
            .then((storedDocument) => {
                if (!alive || !storedDocument?.title || !storedDocument.pages?.length) return;
                // Do not restore the retired scenario from previously saved settings.
                if (storedDocument.title === '2026년 중부소방서 긴급구조종합훈련 시나리오') return;
                setDocument(storedDocument.sourceFilename === defaultDocument.sourceFilename
                    ? { ...storedDocument, title: defaultDocument.title }
                    : storedDocument);
            })
            .catch((error) => console.warn('Scenario document load failed:', error))
            .finally(() => {
                if (alive) setIsDocumentReady(true);
            });

        return () => {
            alive = false;
        };
    }, [defaultDocument.sourceFilename, defaultDocument.title]);

    return (
        <div className="scenario-doc-shell">
            <div className="scenario-doc-hero">
                <h1>{document.title.replace(/\s*\(서장님용\)/g, '').trim()}</h1>
            </div>

            <ScenarioDocumentViewer
                key={document.sourceFilename}
                document={document}
                restoreScrollPosition={isDocumentReady}
            />
        </div>
    );
}
