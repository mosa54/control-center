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

    useEffect(() => {
        let alive = true;

        loadScenarioDocument().then((storedDocument) => {
            if (!alive || !storedDocument) return;
            setDocument(storedDocument);
        });

        return () => {
            alive = false;
        };
    }, []);

    return (
        <div className="scenario-doc-shell">
            <div className="scenario-doc-hero">
                <h1>{document.title}</h1>
            </div>

            <ScenarioDocumentViewer document={document} />
        </div>
    );
}
