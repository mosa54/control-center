'use client';

import FileUploadReport from '@/components/FileUploadReport';

export default function ResponsePlanPage() {
    return (
        <FileUploadReport
            reportId="response-plan"
            title="대응계획부 보고서"
            label="대응계획부 보고서"
            icon="📋"
        />
    );
}
