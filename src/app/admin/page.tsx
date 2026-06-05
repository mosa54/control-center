'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp, SessionMode } from '@/lib/store';
import { parseExcelFile } from '@/lib/excel';
import { saveScenarioDocument } from '@/lib/scenarioDocumentStorage';
import { ScenarioDocument } from '@/lib/scenarioDocumentTypes';
import Toast from '@/components/Toast';
import AssemblyRoster from '@/components/AssemblyRoster';

export default function AdminPage() {
    const {
        sessionMode, sessionSummary, excelData, getTotalCount,
        setSessionMode, setSessionSummary, setExcelData, resetAllCheckIns
    } = useApp();
    const router = useRouter();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);

    const [tempMode, setTempMode] = useState<SessionMode>(sessionMode);
    const [tempSummary, setTempSummary] = useState(sessionSummary);
    const [toast, setToast] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isScenarioUploading, setIsScenarioUploading] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showRoster, setShowRoster] = useState(false);

    const handleLogin = () => {
        if (pin === '1234') {
            setIsLoggedIn(true);
            setPinError(false);
            sessionStorage.setItem('adminAuth', 'true');
        } else {
            setPinError(true);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('adminAuth') === 'true') {
            setIsLoggedIn(true);
        }
    }, []);

    const handleSave = async () => {
        await setSessionMode(tempMode);
        await setSessionSummary(tempSummary);
        setToast('설정이 저장되었습니다.');
    };

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const buffer = await file.arrayBuffer();
            const data = parseExcelFile(buffer);
            await setExcelData(data);
            setToast(`엑셀 업로드 완료: 직원 ${data.employees.length}명, 임무 ${data.missions.length}개`);
        } catch (error) {
            console.error('Excel parse error:', error);
            setToast('엑셀 파일 파싱에 실패했습니다.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    }, [setExcelData]);

    const handleScenarioPdfUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type && file.type !== 'application/pdf') {
            setToast('PDF 파일만 업로드할 수 있습니다.');
            e.target.value = '';
            return;
        }

        setIsScenarioUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/scenario-document/parse', {
                method: 'POST',
                body: formData,
            });
            const responseText = await response.text();
            let result: { document?: ScenarioDocument; error?: string } | null = null;
            try {
                result = responseText ? JSON.parse(responseText) : null;
            } catch {
                throw new Error(responseText || `서버가 빈 응답을 반환했습니다. HTTP ${response.status}`);
            }

            if (!response.ok || !result?.document) {
                throw new Error(result?.error || `PDF 텍스트 추출에 실패했습니다. HTTP ${response.status}`);
            }

            const document = result.document as ScenarioDocument;
            await saveScenarioDocument(document);
            setToast(`시나리오 업로드 완료: ${document.pages.length}쪽`);
        } catch (error) {
            console.error('Scenario PDF upload error:', error);
            const message = error instanceof Error ? error.message : '시나리오 PDF 업로드에 실패했습니다.';
            setToast(`${message} Supabase에 scenario_document 컬럼이 없으면 supabase_schema.sql의 마이그레이션을 먼저 실행하세요.`);
        } finally {
            setIsScenarioUploading(false);
            e.target.value = '';
        }
    }, []);

    if (!isLoggedIn) {
        return (
            <div className="page">
                <div className="header">
                <button onClick={() => router.back()} className="header-back">←</button>
                    <h1 className="header-title">관리자 로그인</h1>
                </div>

                <div className="page-content" style={{ padding: '16px' }}>
                    <div className="card">
                        <div className="form-group">
                            <label className="form-label">관리자 PIN</label>
                            <input
                                type="password"
                                className="form-input"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value);
                                    setPinError(false);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                placeholder="PIN 입력"
                                maxLength={4}
                            />
                            {pinError && (
                                <p style={{ color: '#D32F2F', fontSize: '14px', marginTop: '8px' }}>
                                    잘못된 PIN입니다.
                                </p>
                            )}
                        </div>
                        <button
                            className="btn btn-primary btn-block"
                            onClick={handleLogin}
                        >
                            로그인
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showRoster) {
        return <AssemblyRoster onClose={() => setShowRoster(false)} />;
    }

    return (
        <div className="page">
            <div className="header">
                <button onClick={() => router.back()} className="header-back">←</button>
                <h1 className="header-title">관리자 설정</h1>
            </div>

            <div className="page-content" style={{ padding: '16px 16px 96px 16px' }}>
                {/* 엑셀 업로드 섹션 */}
                <div className="card">
                    <div className="card-title">📊 직원·임무 데이터 관리</div>

                    {excelData && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '12px',
                            background: '#E8F5E9',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}>
                            <div>✓ 직원: {excelData.employees.length}명</div>
                            <div>✓ 임무: {excelData.missions.length}개</div>
                            <div style={{ color: '#757575', marginTop: '4px' }}>
                                업로드: {excelData.uploadedAt.toLocaleString('ko-KR')}
                            </div>
                        </div>
                    )}

                    <label
                        className="btn btn-primary btn-block"
                        style={{
                            cursor: isUploading ? 'wait' : 'pointer',
                            opacity: isUploading ? 0.7 : 1
                        }}
                    >
                        {isUploading ? '업로드 중...' : '엑셀 파일 업로드'}
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            style={{ display: 'none' }}
                        />
                    </label>

                    <p style={{ marginTop: '12px', fontSize: '13px', color: '#757575' }}>
                        ※ 시트1: 직원별 임무 (순, 소속부서, 직급, 성명, 직위, 통제단편성부, 임무코드, 비고)
                        <br />
                        ※ 시트2: 임무코드 (임무코드, 임무명, 임무내용)
                    </p>
                </div>

                {/* 시나리오 원문 업로드 */}
                <div className="card">
                    <div className="card-title">📄 시나리오 원문 관리</div>
                    <div style={{ padding: '12px', background: '#E8F5E9', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
                        수정된 훈련 시나리오 PDF를 업로드하면 원문 보기 화면에 텍스트 문서로 반영됩니다.
                    </div>
                    <label
                        className="btn btn-primary btn-block"
                        style={{
                            cursor: isScenarioUploading ? 'wait' : 'pointer',
                            opacity: isScenarioUploading ? 0.7 : 1,
                            background: '#2E7D32'
                        }}
                    >
                        {isScenarioUploading ? '시나리오 반영 중...' : '시나리오 PDF 업로드'}
                        <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleScenarioPdfUpload}
                            disabled={isScenarioUploading}
                            style={{ display: 'none' }}
                        />
                    </label>
                    <p style={{ marginTop: '12px', fontSize: '13px', color: '#757575' }}>
                        ※ PDF의 6쪽부터 훈련 전 단계, 7쪽부터 1단계로 인식합니다.
                    </p>
                </div>

                {/* 세션 모드 설정 */}
                <div className="card">
                    <div className="card-title">🚨 소집 모드 설정</div>

                    <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        background: sessionMode === 'emergency' ? '#FFEBEE' : '#E3F2FD',
                        borderRadius: '8px'
                    }}>
                        <span className={`session-badge ${sessionMode}`}>
                            {sessionMode === 'training' ? '훈련' : '실제 비상소집'}
                        </span>
                        <span style={{ fontSize: '14px', color: '#757575', marginLeft: '8px' }}>
                            {sessionSummary || '개요 없음'}
                        </span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">소집 유형</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className={`btn ${tempMode === 'training' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                    flex: 1,
                                    background: tempMode === 'training' ? '#2196F3' : undefined
                                }}
                                onClick={() => setTempMode('training')}
                            >
                                훈련
                            </button>
                            <button
                                className={`btn ${tempMode === 'emergency' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                    flex: 1,
                                    background: tempMode === 'emergency' ? '#D32F2F' : undefined
                                }}
                                onClick={() => setTempMode('emergency')}
                            >
                                실제 비상소집
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">개요 (최대 200자)</label>
                        <textarea
                            className="form-input"
                            value={tempSummary}
                            onChange={(e) => setTempSummary(e.target.value.slice(0, 200))}
                            placeholder="예: 2026년 상반기 재난대응 훈련"
                            rows={3}
                            style={{ resize: 'none' }}
                        />
                        <span style={{ fontSize: '12px', color: '#757575' }}>
                            {tempSummary.length}/200
                        </span>
                    </div>

                    <button
                        className="btn btn-primary btn-block"
                        onClick={handleSave}
                    >
                        설정 저장
                    </button>
                </div>

                {/* 상황부여 타임라인 */}
                <div className="card">
                    <div className="card-title">📋 상황부여 타임라인</div>
                    <div style={{ padding: '12px', background: '#F3E5F5', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
                        훈련 중 시간순 상황 카드를 만들고, 즉시·예약·조건부로 참가자에게 부여합니다.
                    </div>
                    <Link href="/admin/timeline">
                        <button className="btn btn-block" style={{ background: '#7B1FA2', color: 'white' }}>
                            타임라인 관리
                        </button>
                    </Link>
                </div>

                {/* 통제단 소집 응소부 */}
                <div className="card">
                    <div className="card-title">📝 통제단 소집 응소부</div>
                    <div style={{ padding: '12px', background: '#F5F5F5', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
                        현재까지 응소한 {getTotalCount()}명의 명단을 인쇄용 표 형태로 확인합니다.
                    </div>
                    <button
                        className="btn btn-secondary btn-block"
                        onClick={() => setShowRoster(true)}
                        style={{ border: '1px solid #E0E0E0', background: 'white' }}
                    >
                        응소부 보기 (인쇄)
                    </button>
                </div>

                {/* 응소 현황 초기화 */}
                <div className="card">
                    <div className="card-title">🔄 응소 현황 초기화</div>

                    <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        background: '#FFF3E0',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}>
                        현재 응소 인원: <strong>{getTotalCount()}명</strong>
                    </div>

                    {!showResetConfirm ? (
                        <button
                            className="btn btn-block"
                            style={{
                                background: '#FF5722',
                                color: 'white',
                                opacity: getTotalCount() === 0 ? 0.5 : 1
                            }}
                            disabled={getTotalCount() === 0}
                            onClick={() => setShowResetConfirm(true)}
                        >
                            응소 현황 초기화
                        </button>
                    ) : (
                        <div style={{
                            padding: '16px',
                            background: '#FFEBEE',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <p style={{ marginBottom: '12px', fontWeight: 600, color: '#D32F2F' }}>
                                ⚠️ 모든 응소 데이터가 삭제됩니다.
                            </p>
                            <p style={{ marginBottom: '16px', fontSize: '14px', color: '#757575' }}>
                                모든 사용자가 자동 퇴청 처리됩니다.
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => setShowResetConfirm(false)}
                                >
                                    취소
                                </button>
                                <button
                                    className="btn"
                                    style={{ flex: 1, background: '#D32F2F', color: 'white' }}
                                    onClick={async () => {
                                        await resetAllCheckIns();
                                        setShowResetConfirm(false);
                                        setToast('응소 현황이 초기화되었습니다.');
                                    }}
                                >
                                    초기화 확인
                                </button>
                            </div>
                        </div>
                    )}

                    <p style={{ marginTop: '12px', fontSize: '13px', color: '#757575' }}>
                        ※ 훈련 또는 비상소집 종료 후 초기화하세요.
                    </p>
                </div>

                {/* 다음 버전 기능 */}
                <details className="card" style={{ cursor: 'pointer' }}>
                    <summary style={{ fontWeight: 600, color: '#757575' }}>
                        다음 버전 기능 (준비 중)
                    </summary>
                    <div style={{ marginTop: '16px', color: '#9E9E9E', fontSize: '14px' }}>
                        <ul style={{ paddingLeft: '20px' }}>
                            <li>통계 및 리포트 출력</li>
                            <li>실시간 동기화 (WebSocket)</li>
                        </ul>
                    </div>
                </details>
            </div>

            {toast && (
                <Toast
                    message={toast}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
