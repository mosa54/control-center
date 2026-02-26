'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import FullscreenOverlay from '@/components/FullscreenOverlay';

interface AccidentReportData {
    fileName: string;
    fileType: string;
    fileData: string; // Base64 encoded string
    updatedAt: string;
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
                    보고서 업로드를 위해 PIN을 입력하세요
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

import dynamic from 'next/dynamic';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });

export function AccidentPreview({ data }: { data: AccidentReportData | null }) {
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [containerWidth, setContainerWidth] = useState<number>(800);

    useEffect(() => {
        // Initialize PDF worker safely on client-side only
        import('react-pdf').then(({ pdfjs }) => {
            pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
        });

        const handleResize = () => setContainerWidth(Math.min(window.innerWidth - 32, 800));
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }

    if (!data || !data.fileData) {
        return (
            <div className="fullscreen-report" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
                <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
                    업로드된 보고서가 없습니다
                </p>
            </div>
        );
    }

    const { fileType, fileData, fileName } = data;
    const isImage = fileType.startsWith('image/');
    const isPdf = fileType === 'application/pdf';

    return (
        <div className="fullscreen-report" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {fileName}
                    {isPdf && numPages && (
                        <span style={{ fontSize: '12px', background: '#e0e0e0', padding: '2px 8px', borderRadius: '12px', fontWeight: 'normal' }}>
                            {pageNumber} / {numPages} 페이지
                        </span>
                    )}
                </h2>
                <a
                    href={fileData}
                    download={fileName}
                    className="btn"
                    style={{ background: '#43A047', color: 'white', padding: '8px 16px', textDecoration: 'none', borderRadius: '4px', fontSize: '14px', flexShrink: 0 }}
                >
                    📥 다운로드
                </a>
            </div>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', padding: '16px' }}>
                {isImage && (
                    <img src={fileData} alt="보고서 미리보기" style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }} />
                )}
                {isPdf && (
                    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', border: '1px solid #e0e0e0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <Document
                            file={fileData}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={<div style={{ padding: '24px', textAlign: 'center' }}>PDF 불러오는 중...</div>}
                            error={<div style={{ padding: '24px', textAlign: 'center', color: '#d32f2f' }}>PDF를 불러오지 못했습니다.</div>}
                        >
                            <Page
                                pageNumber={pageNumber}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                width={containerWidth}
                            />
                        </Document>
                    </div>
                )}

                {isPdf && numPages && numPages > 1 && (
                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px', padding: '8px', background: '#f5f5f5', borderRadius: '8px' }}>
                        <button
                            className="btn btn-secondary"
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber(prev => prev - 1)}
                            style={{ padding: '4px 12px' }}
                        >
                            ← 이전
                        </button>
                        <button
                            className="btn btn-secondary"
                            disabled={pageNumber >= numPages}
                            onClick={() => setPageNumber(prev => prev + 1)}
                            style={{ padding: '4px 12px' }}
                        >
                            다음 →
                        </button>
                    </div>
                )}

                {!isImage && !isPdf && (
                    <div style={{ margin: 'auto', textAlign: 'center', padding: '48px 16px' }}>
                        <p style={{ fontSize: '48px', marginBottom: '16px' }}>📎</p>
                        <p>미리보기를 지원하지 않는 형식입니다.</p>
                        <p style={{ color: '#757575', fontSize: '14px' }}>다운로드 버튼을 클릭하여 확인해 주세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function AccidentReportContent() {
    const searchParams = useSearchParams();
    const isObserver = searchParams.get('role') === 'observer';
    const roleParam = isObserver ? '?role=observer' : '';

    const [isAuthed, setIsAuthed] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [data, setData] = useState<AccidentReportData | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isDbLoaded, setIsDbLoaded] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // DB에서 데이터 로드 + 실시간 구독
    useEffect(() => {
        const loadData = async () => {
            const { data: row } = await supabase
                .from('reports')
                .select('data')
                .eq('id', 'accident')
                .single();
            if (row?.data) {
                setData(row.data as AccidentReportData);
            }
            setIsDbLoaded(true);
        };
        loadData();

        const channel = supabase
            .channel('report-accident')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reports',
                filter: 'id=eq.accident',
            }, (payload: any) => {
                if (payload.new?.data) {
                    setData(payload.new.data as AccidentReportData);
                } else {
                    setData(null);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

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
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        // Check file type (allow images and pdf)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];
        if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
            alert('PDF 또는 이미지(JPG, PNG) 파일만 업로드 가능합니다.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Check file size (e.g., limit to 10MB to avoid base64 bloat)
        const MAX_MB = 10;
        if (file.size > MAX_MB * 1024 * 1024) {
            alert(`파일 크기는 ${MAX_MB}MB 이하만 가능합니다.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setData({
                fileName: file.name,
                fileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'unknown'),
                fileData: base64String,
                updatedAt: new Date().toISOString()
            });
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleSave = useCallback(async () => {
        if (!data) return;
        setSaveStatus('saving');
        try {
            const { error } = await supabase
                .from('reports')
                .upsert({ id: 'accident', data, updated_at: new Date().toISOString() });
            if (error) throw error;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error('Error saving report:', e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, [data]);

    const handleEdit = () => {
        if (isAuthed) return;
        setShowPinModal(true);
    };

    // 인증되지 않은 상태에서의 읽기 전용 뷰
    if (!isAuthed) {
        return (
            <div className="page">
                <div className="header">
                    <Link href={`/reports${roleParam}`} className="header-back">←</Link>
                    <h1 className="header-title">사고상황보고서</h1>
                </div>

                <div className="page-content" style={{ padding: '16px' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '48px', marginBottom: '12px' }}>📊</p>
                        <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>화재 등 사고상황보고서</p>
                        <p style={{ color: '#757575', fontSize: '14px', marginBottom: '16px' }}>
                            {data ? `최근 업로드: ${data.fileName}` : '보고서 파일(PDF, 이미지)을 업로드하거나 확인할 수 있습니다'}
                        </p>
                        <button className="btn btn-primary btn-block" onClick={handleEdit}>
                            🔒 PIN 입력하여 파일 업로드
                        </button>
                        <button
                            className="btn btn-secondary btn-block"
                            style={{ marginTop: '8px' }}
                            onClick={() => setShowFullscreen(true)}
                            disabled={!data}
                        >
                            👁️ 보고서 보기
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
                        <AccidentPreview data={data} />
                    </FullscreenOverlay>
                )}
            </div>
        );
    }

    // 인증된 상태: 파일 업로드 폼
    return (
        <div className="page">
            <div className="header">
                <Link href={`/reports${roleParam}`} className="header-back">←</Link>
                <h1 className="header-title">사고상황보고서 업로드</h1>
            </div>

            <div className="report-actions">
                <button
                    className="btn"
                    style={{
                        background: saveStatus === 'saved' ? '#2E7D32' : saveStatus === 'error' ? '#D32F2F' : '#1565C0',
                        color: 'white'
                    }}
                    onClick={handleSave}
                    disabled={saveStatus === 'saving' || !data}
                >
                    {saveStatus === 'saving' ? '⏳ 업로드 중...' : saveStatus === 'saved' ? '✅ 업로드 완료' : saveStatus === 'error' ? '❌ 오류' : '💾 파일 저장'}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowFullscreen(true)}
                    disabled={!data}
                >
                    👁️ 보고서 보기
                </button>
            </div>

            <div className="page-content" style={{ padding: '16px' }}>
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
                            (PDF 문서, JPG/PNG 이미지 - 최대 10MB)
                        </p>

                        <input
                            type="file"
                            accept="application/pdf, image/jpeg, image/png, image/heic"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="btn btn-secondary btn-block"
                            style={{ padding: '12px', display: 'inline-block', cursor: 'pointer', background: '#e3f2fd', color: '#1565c0', fontWeight: 'bold' }}
                        >
                            📁 파일 찾기
                        </label>

                        {data && data.fileName && (
                            <div style={{ marginTop: '24px', padding: '16px', background: '#F5F5F5', borderRadius: '8px', textAlign: 'left' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>선택된 파일:</p>
                                <p style={{ fontSize: '15px', wordBreak: 'break-all', color: '#1565C0' }}>{data.fileName}</p>
                                <p style={{ fontSize: '12px', color: '#757575', marginTop: '8px' }}>
                                    왼쪽 상단의 [💾 파일 저장] 버튼을 눌러야 최종적으로 서버에 업로드됩니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {showFullscreen && (
                <FullscreenOverlay onClose={() => setShowFullscreen(false)}>
                    <AccidentPreview data={data} />
                </FullscreenOverlay>
            )}
        </div>
    );
}

export default function AccidentReportPage() {
    return (
        <Suspense fallback={<div className="page"><div className="header"><h1 className="header-title">로딩 중...</h1></div></div>}>
            <AccidentReportContent />
        </Suspense>
    );
}
