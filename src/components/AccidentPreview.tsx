'use client';

import { useEffect, useState } from 'react';
import { preloadPdfViewer, type NormalizedReportFileData } from '@/lib/pdfPreview';

import dynamic from 'next/dynamic';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const DocumentComp = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false });
const PageComp = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });

/* Base64 데이터를 파일로 다운로드 */
function downloadFile(fileData: string, fileName: string) {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function AccidentPreview({ data }: { data: NormalizedReportFileData | null }) {
    const [numPages, setNumPages] = useState<number>();
    const [containerWidth, setContainerWidth] = useState<number>(800);
    const [workerReady, setWorkerReady] = useState(false);
    const firstFile = data?.files?.[0];
    const isPdf = firstFile?.fileType === 'application/pdf';
    const pdfFileData = isPdf ? firstFile?.fileData : undefined;
    const effectiveWorkerReady = !isPdf || workerReady;
    const allImages = data?.files?.every(f => f.fileType.startsWith('image/')) ?? false;

    useEffect(() => {
        let isMounted = true;

        if (isPdf) {
            void preloadPdfViewer().then(() => {
                if (isMounted) {
                    setWorkerReady(true);
                }
            });
        }

        const handleResize = () => setContainerWidth(Math.min(window.innerWidth - 16, 800));
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            isMounted = false;
            window.removeEventListener('resize', handleResize);
        }
    }, [isPdf, pdfFileData]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }

    if (!data || !data.files || data.files.length === 0) {
        return (
            <div className="fullscreen-report" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
                <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                    업로드된 보고서가 없습니다
                </p>
            </div>
        );
    }

    // PDF인 경우 (첫 번째 파일 기준)
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
                    {!effectiveWorkerReady && (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#757575' }}>PDF 뷰어 초기화 중...</div>
                    )}

                    {effectiveWorkerReady && (
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

    // 이미지인 경우 - 화면에 꽉 차게 표시
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
                            alt={`보고서 ${i + 1}`}
                            loading="eager"
                            decoding="async"
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

    // 지원하지 않는 형식
    return (
        <div style={{ margin: 'auto', textAlign: 'center', padding: '48px 16px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📎</p>
            <p>미리보기를 지원하지 않는 형식입니다.</p>
        </div>
    );
}
