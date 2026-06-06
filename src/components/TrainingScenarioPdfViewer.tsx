'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { preloadPdfViewer } from '@/lib/pdfPreview';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const DocumentComp = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false });
const PageComp = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function TrainingScenarioPdfViewer() {
    const { trainingScenarioPdf } = useApp();
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdfReady, setPdfReady] = useState(false);
    const [loadedPdf, setLoadedPdf] = useState<{ fileUrl: string; numPages: number } | null>(null);
    const [viewerWidth, setViewerWidth] = useState(720);
    const [loadErrorUrl, setLoadErrorUrl] = useState<string | null>(null);
    const pdfFileUrl = trainingScenarioPdf?.fileUrl ?? '';
    const numPages = loadedPdf?.fileUrl === pdfFileUrl ? loadedPdf.numPages : undefined;
    const loadError = loadErrorUrl === pdfFileUrl;

    useEffect(() => {
        let cancelled = false;

        void preloadPdfViewer().then(() => {
            if (!cancelled) {
                setPdfReady(true);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!containerRef.current || typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width;
            if (width) {
                setViewerWidth(Math.max(280, Math.min(820, Math.floor(width - 24))));
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    if (!trainingScenarioPdf) {
        return (
            <main className="page" style={{ padding: '20px 16px 96px', maxWidth: '760px', margin: '0 auto' }}>
                <section className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                    <h1 style={{ margin: '0 0 8px', color: '#0D47A1', fontSize: '24px', fontWeight: 900, letterSpacing: 0 }}>
                        훈련 시나리오 PDF
                    </h1>
                    <p style={{ margin: '0 0 18px', color: '#616161', fontSize: '15px', letterSpacing: 0 }}>
                        관리자에서 훈련 시나리오 PDF를 업로드해주세요.
                    </p>
                    <Link href="/admin" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        관리자 설정으로 이동
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="page" style={{ padding: '16px 12px 96px', maxWidth: '980px', margin: '0 auto' }}>
            <header className="card" style={{ marginBottom: '12px' }}>
                <h1 style={{ margin: '0 0 6px', color: '#0D47A1', fontSize: '23px', fontWeight: 900, lineHeight: 1.25, letterSpacing: 0 }}>
                    훈련 시나리오 PDF
                </h1>
                <p style={{ margin: 0, color: '#455A64', fontSize: '14px', letterSpacing: 0 }}>
                    {trainingScenarioPdf.fileName}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', color: '#607D8B', fontSize: '13px', fontWeight: 700 }}>
                    <span>{formatFileSize(trainingScenarioPdf.fileSize)}</span>
                    <span>{new Date(trainingScenarioPdf.uploadedAt).toLocaleString('ko-KR')} 업로드</span>
                    {numPages && <span>총 {numPages}페이지</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
                    <a className="btn btn-primary" href={trainingScenarioPdf.fileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                        새 탭 열기
                    </a>
                    <a className="btn btn-secondary" href={trainingScenarioPdf.fileUrl} download={trainingScenarioPdf.fileName} style={{ textDecoration: 'none' }}>
                        다운로드
                    </a>
                </div>
            </header>

            <section
                ref={containerRef}
                className="card"
                style={{
                    padding: '12px',
                    minHeight: '420px',
                    overflowX: 'auto',
                    background: '#ECEFF1',
                }}
            >
                {!pdfReady && (
                    <div style={{ padding: '48px 16px', textAlign: 'center', color: '#607D8B', fontWeight: 700 }}>
                        PDF 뷰어를 준비하는 중입니다...
                    </div>
                )}

                {pdfReady && loadError && (
                    <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                        <p style={{ marginBottom: '14px', color: '#C62828', fontWeight: 800 }}>
                            PDF를 불러오지 못했습니다.
                        </p>
                        <a className="btn btn-primary" href={trainingScenarioPdf.fileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                            새 탭에서 확인
                        </a>
                    </div>
                )}

                {pdfReady && !loadError && (
                    <DocumentComp
                        key={pdfFileUrl}
                        file={trainingScenarioPdf.fileUrl}
                        onLoadSuccess={({ numPages }: { numPages: number }) => {
                            setLoadedPdf({ fileUrl: pdfFileUrl, numPages });
                            setLoadErrorUrl(null);
                        }}
                        onLoadError={(error) => {
                            console.error('Training scenario PDF load error:', error);
                            setLoadErrorUrl(pdfFileUrl);
                        }}
                        loading={<div style={{ padding: '48px 16px', textAlign: 'center' }}>PDF를 불러오는 중입니다...</div>}
                    >
                        {numPages && Array.from({ length: numPages }, (_, index) => (
                            <div
                                key={`training-scenario-page-${index + 1}`}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginBottom: index === numPages - 1 ? 0 : '12px',
                                }}
                            >
                                <PageComp
                                    pageNumber={index + 1}
                                    width={viewerWidth}
                                    renderAnnotationLayer
                                    renderTextLayer
                                    loading={<div style={{ padding: '24px' }}>페이지 로딩 중...</div>}
                                />
                            </div>
                        ))}
                    </DocumentComp>
                )}
            </section>
        </main>
    );
}
