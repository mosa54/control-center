'use client';

import FileUploadReport from '@/components/FileUploadReport';

export default function MiscDocsPage() {
    return (
        <FileUploadReport
            reportId="misc-docs"
            title="기타 자료"
            label="현황판, 작전도 등 참고자료"
            icon="📂"
        />
    );
}
