'use client';

let pdfViewerPromise: Promise<void> | null = null;
const PDF_WORKER_SRC = '/pdf.worker.min.mjs';
const PDF_WORKER_LINK_ID = 'control-center-pdf-worker-preload';

export interface ReportPreviewFileItem {
    fileName: string;
    fileType: string;
    fileData: string;
}

export interface NormalizedReportFileData {
    files: ReportPreviewFileItem[];
    updatedAt: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isReportPreviewFileItem(value: unknown): value is ReportPreviewFileItem {
    if (!isObject(value)) {
        return false;
    }

    return typeof value.fileName === 'string'
        && typeof value.fileType === 'string'
        && typeof value.fileData === 'string';
}

export function preloadPdfViewer(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }

    const existingLink = document.getElementById(PDF_WORKER_LINK_ID);
    if (!existingLink) {
        const link = document.createElement('link');
        link.id = PDF_WORKER_LINK_ID;
        link.rel = 'modulepreload';
        link.href = PDF_WORKER_SRC;
        document.head.appendChild(link);
    }

    if (!pdfViewerPromise) {
        pdfViewerPromise = import('react-pdf').then(({ pdfjs }) => {
            pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
        });
    }

    return pdfViewerPromise;
}

export function normalizeReportFileData(raw: unknown): NormalizedReportFileData | null {
    if (!isObject(raw)) {
        return null;
    }

    if (Array.isArray(raw.files) && raw.files.every(isReportPreviewFileItem)) {
        return {
            files: raw.files,
            updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
        };
    }

    if (typeof raw.fileName === 'string'
        && typeof raw.fileType === 'string'
        && typeof raw.fileData === 'string') {
        return {
            files: [{
                fileName: raw.fileName,
                fileType: raw.fileType,
                fileData: raw.fileData,
            }],
            updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
        };
    }

    return null;
}

export function reportHasPdf(data: unknown): boolean {
    const normalized = normalizeReportFileData(data);
    return Array.isArray(normalized?.files) && normalized.files[0]?.fileType === 'application/pdf';
}
