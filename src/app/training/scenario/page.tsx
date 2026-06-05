import ScenarioDocumentPageClient from '@/components/ScenarioDocumentPageClient';
import scenarioDocument from '@/lib/scenarioDocument.generated.json';

export default function ScenarioDocumentPage() {
    return <ScenarioDocumentPageClient defaultDocument={scenarioDocument} />;
}
