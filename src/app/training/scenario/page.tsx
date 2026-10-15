import ScenarioDocumentPageClient from '@/components/ScenarioDocumentPageClient';
import songdoDocument from '@/lib/scenarioDocument.songdo.generated.json';
import type { ScenarioDocument } from '@/lib/scenarioDocumentTypes';

export default function ScenarioDocumentPage() {
    return <ScenarioDocumentPageClient defaultDocument={songdoDocument as ScenarioDocument} />;
}
