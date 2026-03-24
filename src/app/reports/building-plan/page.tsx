'use client';

import FileUploadReport from '@/components/FileUploadReport';

export default function BuildingPlanPage() {
    return (
        <FileUploadReport
            reportId="building-plan"
            title="건축물 도면"
            label="건축물 도면"
            icon="📐"
        />
    );
}
