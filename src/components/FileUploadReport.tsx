'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import FullscreenOverlay from '@/components/FullscreenOverlay';
import dynamic from 'next/dynamic';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const DocumentComp = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false });
const PageComp = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });

interface FileItem {
    fileName: string;
    fileType: string;
    fileData: string;
}

interface ReportData {
    files: FileItem[];
    updatedAt: string;
}

function migrateData(raw: any): ReportData | null {
    if (!raw) return null;
    if (raw.files && Array.isArray(raw.files)) {
        return raw as ReportData;
    }
    if (raw.fileName && raw.fileData) {
        return {
            files: [{
                fileName: raw.fileName,
                fileType: raw.fileType,
                fileData: raw.fileData,
            }],
            updatedAt: raw.updatedAt || new Date().toISOString(),
        };
    }
    return null;
}

function PinModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = () => {
        if (pin === '1234') {
            onSuccess();
        } else {
            setError(true);
        }
    };

    return (
        <div className="pin-overlay">
            <div className="pin-modal">
                <h3>🔒 PIN 입력</h3>
                <p style={{ fontSize: '14px', color: '#757575', marginBottom: '16px' }}>
                    파일 업로드를 위해 PIN을 입력하세요
                </p>
                <input
                    type="password"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="····"
                    maxLength={4}
                    autoFocus
                />
                {error && <p style={{ color: '#D32F2F', fontSize: '14px', marginBottom: '8px' }}>잘못된 PIN입니다.</p>}
                <div className="pin-modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>취소</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>확인</button>
                </div>
            </div>
        </div>
    );
}

/* Base64 데이터를 파일로 다운로드 */
function downloadFile(fileData: string, fileName: string) {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* 이미지 리사이즈 및 압축 함수 */
const compressImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(event.target?.result as string);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const compressedDataUrl = canvas.toDataURL(outputFormat, quality);
                resolve(compressedDataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

/* 파일 미리보기 컴포넌트 */
export function FilePreview({ data }: { data: ReportData | null }) {
    const [numPages, setNumPages] = useState<number>();
    const [containerWidth, setContainerWidth] = useState<number>(800);
    const [workerReady, setWorkerReady] = useState(false);

    useEffect(() => {
        let isMounted = true;
        import('react-pdf').then(({ pdfjs }) => {
            if (isMounted) {
                pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                setWorkerReady(true);
            }
        });

        const handleResize = () => setContainerWidth(Math.min(window.innerWidth - 16, 800));
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            isMounted = false;
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }

    if (!data || !data.files || data.files.length === 0) {
        return (
            <div className="fullscreen-report" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
                <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                    업로드된 파일이 없습니다
                </p>
            </div>
        );
    }

    const firstFile = data.files[0];
    const isPdf = firstFile.fileType === 'application/pdf';
    const allImages = data.files.every(f => f.fileType.startsWith('image/'));

    if (isPdf) {
        return (
            <div className="fullscreen-report" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={firstFile.fileName}>
                            {firstFile.fileName}
                        </span>
                        {numPages && (
                            <span style={{ flexShrink: 0, fontSize: '12px', background: '#e0e0e0', padding: '2px 8px', borderRadius: '12px', fontWeight: 'normal' }}>
                                총 {numPages}페이지
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={(e) => { e.stopPropagation(); downloadFile(firstFile.fileData, firstFile.fileName); }}
                        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', background: '#1565C0', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
                        <span>⬇️</span> <span>다운로드</span>
                    </button>
                </div>

                <div style={{ flex: 1, overflow: 'auto', background: '#e8e8e8', padding: '0' }}>
                    {!workerReady && (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#757575' }}>PDF 뷰어 초기화 중...</div>
                    )}

                    {workerReady && (
                        <DocumentComp
                            file={firstFile.fileData}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={<div style={{ padding: '24px', textAlign: 'center' }}>PDF 불러오는 중...</div>}
                            error={<div style={{ padding: '24px', textAlign: 'center', color: '#d32f2f' }}>PDF를 불러오지 못했습니다.</div>}
                        >
                            {numPages && Array.from({ length: numPages }, (_, i) => (
                                <div key={i} style={{
                                    width: '100%',
                                    maxWidth: '800px',
                                    margin: '0 auto 8px auto',
                                    background: '#fff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                }}>
                                    <PageComp
                                        pageNumber={i + 1}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        width={containerWidth}
                                    />
                                </div>
                            ))}
                        </DocumentComp>
                    )}
                </div>
            </div>
        );
    }

    if (allImages) {
        return (
            <div style={{ height: '100%', overflow: 'auto', background: '#fff', position: 'relative' }}>
                <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(245,245,245,0.95)', borderBottom: '1px solid #e0e0e0', padding: '8px 12px', display: 'flex', overflowX: 'auto', gap: '8px', WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ display: 'flex', gap: '8px', margin: '0 auto' }}>
                        {data.files.map((file, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); downloadFile(file.fileData, file.fileName); }}
                                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', background: '#1565C0', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                                title={file.fileName}
                            >
                                <span>⬇️</span>
                                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {data.files.length > 1 ? file.fileName : '다운로드'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                {data.files.map((file, i) => (
                    <div key={i} style={{ width: '100%' }}>
                        <img
                            src={file.fileData}
                            alt={`파일 ${i + 1}`}
                            style={{
                                display: 'block',
                                width: '100%',
                                height: 'auto',
                            }}
                        />
                        {data.files.length > 1 && i < data.files.length - 1 && (
                            <div style={{
                                height: '2px',
                                background: '#e0e0e0',
                            }} />
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ margin: 'auto', textAlign: 'center', padding: '48px 16px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📎</p>
            <p>미리보기를 지원하지 않는 형식입니다.</p>
        </div>
    );
}

/* 메인 파일 업로드 보고서 컨텐츠 컴포넌트 */
interface FileUploadReportProps {
    reportId: string;
    title: string;
    label: string;
    icon: string;
}

function FileUploadReportContent({ reportId, title, label, icon }: FileUploadReportProps) {
    const searchParams = useSearchParams();
    const isObserver = searchParams.get('role') === 'observer';
    const roleParam = isObserver ? '?role=observer' : '';

    const [isAuthed, setIsAuthed] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [data, setData] = useState<ReportData | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isDbLoaded, setIsDbLoaded] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadData = async () => {
            const { data: row } = await supabase
                .from('reports')
                .select('data')
                .eq('id', reportId)
                .single();
            if (row?.data) {
                setData(migrateData(row.data));
            }
            setIsDbLoaded(true);
        };
        loadData();

        const channel = supabase
            .channel(`report-${reportId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reports',
                filter: `id=eq.${reportId}`,
            }, (payload: any) => {
                if (payload.new?.data) {
                    setData(migrateData(payload.new.data));
                } else {
                    setData(null);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [reportId]);

    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFiles(Array.from(files));
        }
    };

    const processFiles = (files: File[]) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];
        const MAX_MB = 10;
        const MAX_FILES = 50; // 사실상 제한 해제

        const currentCount = data?.files?.length || 0;
        const availableSlots = MAX_FILES - currentCount;

        if (availableSlots <= 0) {
            alert(`최대 ${MAX_FILES}개의 파일까지만 업로드 가능합니다.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const hasPdf = files.some(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        const existingHasPdf = data?.files?.some(f => f.fileType === 'application/pdf');

        if (hasPdf && (files.length > 1 || currentCount > 0)) {
            alert('PDF 파일은 단독으로만 업로드 가능합니다. 이미지 파일은 여러 장을 동시에 업로드할 수 있습니다.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const filesToProcess = files.slice(0, availableSlots);

        for (const file of filesToProcess) {
            if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
                alert('PDF 또는 이미지(JPG, PNG) 파일만 업로드 가능합니다.');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            if (file.size > MAX_MB * 1024 * 1024) {
                alert(`파일 크기는 ${MAX_MB}MB 이하만 가능합니다.`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }

        Promise.all(filesToProcess.map(async (file) => {
            const isImage = file.type.startsWith('image/') || file.name.toLowerCase().match(/\.(jpg|jpeg|png|heic)$/i);
            let base64String = '';
            let finalType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'unknown');

            if (isImage) {
                try {
                    base64String = await compressImage(file);
                    if (finalType === 'image/heic') finalType = 'image/jpeg';
                } catch (e) {
                    console.error('Compression failed', e);
                    base64String = await new Promise((res) => {
                        const reader = new FileReader();
                        reader.onloadend = () => res(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                }
            } else {
                base64String = await new Promise((res) => {
                    const reader = new FileReader();
                    reader.onloadend = () => res(reader.result as string);
                    reader.readAsDataURL(file);
                });
            }

            return {
                fileName: file.name,
                fileType: finalType,
                fileData: base64String,
            } as FileItem;
        })).then((newItems) => {
            setData(prev => {
                const isPdfUpload = newItems.some(item => item.fileType === 'application/pdf');
                if (isPdfUpload || !prev || existingHasPdf) {
                    return {
                        files: newItems,
                        updatedAt: new Date().toISOString(),
                    };
                }
                return {
                    files: [...prev.files, ...newItems].slice(0, MAX_FILES),
                    updatedAt: new Date().toISOString(),
                };
            });
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFiles(Array.from(files));
        }
    };

    const removeFile = (index: number) => {
        setData(prev => {
            if (!prev) return prev;
            const newFiles = prev.files.filter((_, i) => i !== index);
            if (newFiles.length === 0) return null;
            return { ...prev, files: newFiles };
        });
    };

    const handleSave = useCallback(async () => {
        const saveData = data || { files: [], updatedAt: new Date().toISOString() };
        setSaveStatus('saving');
        try {
            const { error } = await supabase
                .from('reports')
                .upsert({ id: reportId, data: saveData, updated_at: new Date().toISOString() });
            if (error) throw error;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error('Error saving report:', e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, [data, reportId]);

    const canSave = saveStatus !== 'saving' && isDbLoaded;

    const handleEdit = () => {
        if (isAuthed) return;
        setShowPinModal(true);
    };

    const hasFiles = data && data.files && data.files.length > 0;
    const fileCount = data?.files?.length || 0;
    const fileNames = data?.files?.map(f => f.fileName).join(', ') || '';

    const fileInputId = `file-upload-${reportId}`;

    if (!isAuthed) {
        return (
            <div className="page">
                <div className="header">
                    <Link href={`/reports${roleParam}`} className="header-back">←</Link>
                    <h1 className="header-title">{title}</h1>
                </div>

                <div className="page-content" style={{ padding: '16px 16px 96px 16px' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '48px', marginBottom: '12px' }}>{icon}</p>
                        <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>{label}</p>
                        <p style={{ color: '#757575', fontSize: '14px', marginBottom: '16px' }}>
                            {hasFiles ? `업로드됨: ${fileNames}` : '파일(PDF, 이미지)을 업로드하거나 확인할 수 있습니다'}
                        </p>
                        <button className="btn btn-primary btn-block" onClick={handleEdit}>
                            🔒 PIN 입력하여 파일 업로드
                        </button>
                        <button
                            className="btn btn-secondary btn-block"
                            style={{ marginTop: '8px' }}
                            onClick={() => setShowFullscreen(true)}
                            disabled={!hasFiles}
                        >
                            👁️ 파일 보기
                        </button>
                    </div>
                </div>

                {showPinModal && (
                    <PinModal
                        onSuccess={() => { setIsAuthed(true); setShowPinModal(false); }}
                        onCancel={() => setShowPinModal(false)}
                    />
                )}

                {showFullscreen && (
                    <FullscreenOverlay onClose={() => setShowFullscreen(false)}>
                        <FilePreview data={data} />
                    </FullscreenOverlay>
                )}
            </div>
        );
    }

    return (
        <div className="page">
            <div className="header">
                <Link href={`/reports${roleParam}`} className="header-back">←</Link>
                <h1 className="header-title">{title} 업로드</h1>
            </div>

            <div className="report-actions">
                <button
                    className="btn"
                    style={{
                        background: saveStatus === 'saved' ? '#2E7D32' : saveStatus === 'error' ? '#D32F2F' : '#1565C0',
                        color: 'white'
                    }}
                    onClick={handleSave}
                    disabled={!canSave}
                >
                    {saveStatus === 'saving' ? '⏳ 업로드 중...' : saveStatus === 'saved' ? '✅ 업로드 완료' : saveStatus === 'error' ? '❌ 오류' : '💾 파일 저장'}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowFullscreen(true)}
                    disabled={!hasFiles}
                >
                    👁️ 파일 보기
                </button>
            </div>

            <div className="page-content" style={{ padding: '16px 16px 96px 16px' }}>
                <div className="card">
                    <div
                        className="report-form-section"
                        style={{
                            textAlign: 'center',
                            padding: '48px 16px',
                            border: isDragging ? '2px dashed #1565C0' : '2px dashed #E0E0E0',
                            borderRadius: '12px',
                            backgroundColor: isDragging ? '#E3F2FD' : 'transparent',
                            transition: 'all 0.2s ease-in-out'
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <p style={{ fontSize: '48px', marginBottom: '16px' }}>📤</p>
                        <h3 style={{ marginBottom: '8px' }}>여기로 파일을 드래그 하세요</h3>
                        <p style={{ fontSize: '14px', color: '#757575', marginBottom: '24px' }}>
                            또는 아래 버튼을 눌러 문서를 선택하세요.<br />
                            이미지는 여러 장, PDF는 1개 단독 업로드 가능 (각 파일 최대 10MB)
                        </p>

                        <input
                            type="file"
                            accept="application/pdf, image/jpeg, image/png, image/heic"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            multiple
                            style={{ display: 'none' }}
                            id={fileInputId}
                        />
                        <label
                            htmlFor={fileInputId}
                            className="btn btn-secondary btn-block"
                            style={{ padding: '12px', display: 'inline-block', cursor: 'pointer', background: '#e3f2fd', color: '#1565c0', fontWeight: 'bold' }}
                        >
                            📁 파일 찾기
                        </label>

                        {hasFiles && (
                            <div style={{ marginTop: '24px', textAlign: 'left' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                                    선택된 파일 ({fileCount}개):
                                </p>
                                {data.files.map((file, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        background: '#F5F5F5',
                                        borderRadius: '8px',
                                        marginBottom: '6px',
                                    }}>
                                        <span style={{ fontSize: '14px', wordBreak: 'break-all', color: '#1565C0', flex: 1 }}>
                                            {file.fileType.startsWith('image/') ? '🖼️' : '📄'} {file.fileName}
                                        </span>
                                        <button
                                            onClick={() => removeFile(i)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '18px',
                                                color: '#D32F2F',
                                                padding: '0 4px',
                                                marginLeft: '8px',
                                                flexShrink: 0,
                                            }}
                                            title="파일 삭제"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <p style={{ fontSize: '12px', color: '#757575', marginTop: '8px' }}>
                                    상단의 [💾 파일 저장] 버튼을 눌러야 최종적으로 서버에 업로드됩니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showFullscreen && (
                <FullscreenOverlay onClose={() => setShowFullscreen(false)}>
                    <FilePreview data={data} />
                </FullscreenOverlay>
            )}
        </div>
    );
}

export default function FileUploadReport(props: FileUploadReportProps) {
    return (
        <Suspense fallback={<div className="page"><div className="header"><h1 className="header-title">로딩 중...</h1></div></div>}>
            <FileUploadReportContent {...props} />
        </Suspense>
    );
}
