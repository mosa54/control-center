'use client';

import { supabase } from './supabase';

let pdfViewerPromise: Promise<void> | null = null;
const PDF_WORKER_SRC = '/pdf.worker.min.mjs';
const PDF_WORKER_LINK_ID = 'control-center-pdf-worker-preload';
const REPORT_FILE_BUCKET = 'report-files';
const REPORT_UPLOAD_PROGRESS_WEIGHT = 95;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export interface ReportUploadProgress {
    phase: 'uploading' | 'embedding' | 'saving' | 'complete';
    percent: number;
    fileName?: string;
    fileIndex?: number;
    fileCount?: number;
}

export type ReportUploadProgressCallback = (progress: ReportUploadProgress) => void;

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

export function readFileAsDataUrl(file: File, onProgress?: (loaded: number, total: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress?.(event.loaded, event.total);
            }
        };
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

function uploadReportFileWithProgress(
    storagePath: string,
    file: File,
    contentType: string,
    onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!supabaseUrl || !supabaseKey) {
            reject(new Error('Supabase URL or anon key is missing.'));
            return;
        }

        const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${supabaseUrl}/storage/v1/object/${REPORT_FILE_BUCKET}/${encodedPath}`);
        xhr.setRequestHeader('apikey', supabaseKey);
        xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.setRequestHeader('Content-Type', contentType || file.type || 'application/octet-stream');

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress?.(event.loaded, event.total);
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
                return;
            }

            reject(new Error(xhr.responseText || `Storage upload failed with status ${xhr.status}.`));
        };
        xhr.onerror = () => reject(new Error('Storage upload network error.'));
        xhr.onabort = () => reject(new Error('Storage upload was aborted.'));
        xhr.send(file);
    });
}

async function uploadReportFile(
    reportId: string,
    file: ReportPreviewFileItem,
    index: number,
    onTransferProgress?: (loaded: number, total: number) => void,
): Promise<ReportPreviewFileItem> {
    if (!file.sourceFile) {
        return removeTransientFileFields(file);
    }

    const timestamp = Date.now();
    const safeName = sanitizeStorageFileName(file.fileName);
    const storagePath = `${reportId}/${timestamp}-${index}-${safeName}`;

    try {
        await uploadReportFileWithProgress(storagePath, file.sourceFile, file.fileType, onTransferProgress);

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
        const fileData = await readFileAsDataUrl(file.sourceFile, onTransferProgress);
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
    onProgress?: ReportUploadProgressCallback,
): Promise<NormalizedReportFileData> {
    if (!data) {
        onProgress?.({ phase: 'saving', percent: REPORT_UPLOAD_PROGRESS_WEIGHT });
        return { files: [], updatedAt: new Date().toISOString() };
    }

    const filesToTransfer = data.files.filter((file) => file.sourceFile);
    const totalBytes = filesToTransfer.reduce((sum, file) => sum + (file.sourceFile?.size || 0), 0);
    const fileCount = filesToTransfer.length;
    let transferredBytes = 0;
    let transferIndex = 0;

    const files: ReportPreviewFileItem[] = [];
    for (let index = 0; index < data.files.length; index += 1) {
        const file = data.files[index];
        if (!file.sourceFile) {
            files.push(removeTransientFileFields(file));
            continue;
        }

        transferIndex += 1;
        const fileSize = file.sourceFile.size || 1;
        const reportProgress = (loaded: number, total: number) => {
            const usableTotal = total || fileSize;
            const loadedBytes = Math.min(loaded, usableTotal);
            const denominator = totalBytes || usableTotal;
            const weightedPercent = Math.min(
                REPORT_UPLOAD_PROGRESS_WEIGHT,
                Math.max(1, Math.round(((transferredBytes + loadedBytes) / denominator) * REPORT_UPLOAD_PROGRESS_WEIGHT)),
            );

            onProgress?.({
                phase: 'uploading',
                percent: weightedPercent,
                fileName: file.fileName,
                fileIndex: transferIndex,
                fileCount,
            });
        };

        files.push(await uploadReportFile(reportId, file, index, reportProgress));
        transferredBytes += fileSize;
    }

    onProgress?.({ phase: 'saving', percent: REPORT_UPLOAD_PROGRESS_WEIGHT, fileCount });
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
