'use client';

import { supabase } from './supabase';

let pdfViewerPromise: Promise<void> | null = null;
const PDF_WORKER_SRC = '/pdf.worker.min.mjs';
const PDF_WORKER_LINK_ID = 'control-center-pdf-worker-preload';
const REPORT_FILE_BUCKET = 'report-files';

export interface ReportPreviewFileItem {
    fileName: string;
    fileType: string;
    fileData: string;
    storagePath?: string;
    sourceFile?: File;
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

export function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function sanitizeStorageFileName(fileName: string): string {
    const sanitized = fileName
        .normalize('NFKC')
        .replace(/[^\w.\-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return sanitized.slice(-120) || 'report-file';
}

function removeTransientFileFields(file: ReportPreviewFileItem): ReportPreviewFileItem {
    const { sourceFile, ...persistedFile } = file;
    void sourceFile;
    return persistedFile;
}

function revokeLocalObjectUrl(fileData: string) {
    if (typeof URL !== 'undefined' && fileData.startsWith('blob:')) {
        URL.revokeObjectURL(fileData);
    }
}

async function uploadReportFile(reportId: string, file: ReportPreviewFileItem, index: number): Promise<ReportPreviewFileItem> {
    if (!file.sourceFile) {
        return removeTransientFileFields(file);
    }

    const timestamp = Date.now();
    const safeName = sanitizeStorageFileName(file.fileName);
    const storagePath = `${reportId}/${timestamp}-${index}-${safeName}`;

    try {
        const { error } = await supabase.storage
            .from(REPORT_FILE_BUCKET)
            .upload(storagePath, file.sourceFile, {
                contentType: file.fileType,
                upsert: true,
            });

        if (error) {
            throw error;
        }

        const { data } = supabase.storage.from(REPORT_FILE_BUCKET).getPublicUrl(storagePath);
        if (!data.publicUrl) {
            throw new Error('Report file public URL was not returned.');
        }

        revokeLocalObjectUrl(file.fileData);

        return {
            fileName: file.fileName,
            fileType: file.fileType,
            fileData: data.publicUrl,
            storagePath,
        };
    } catch (error) {
        console.warn('Report storage upload failed. Falling back to embedded file data.', error);
        const fileData = await readFileAsDataUrl(file.sourceFile);
        revokeLocalObjectUrl(file.fileData);

        return {
            fileName: file.fileName,
            fileType: file.fileType,
            fileData,
        };
    }
}

export async function prepareReportFileDataForSave(
    reportId: string,
    data: NormalizedReportFileData | null,
): Promise<NormalizedReportFileData> {
    if (!data) {
        return { files: [], updatedAt: new Date().toISOString() };
    }

    const files = await Promise.all(data.files.map((file, index) => uploadReportFile(reportId, file, index)));
    return {
        files,
        updatedAt: new Date().toISOString(),
    };
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
