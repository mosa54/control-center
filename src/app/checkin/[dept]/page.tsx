'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { getEmployeesByDept, getControlDeptColor } from '@/lib/excel';
import SessionBanner from '@/components/SessionBanner';
import Toast from '@/components/Toast';

export default function CheckinPage({ params }: { params: Promise<{ dept: string }> }) {
    const resolvedParams = use(params);
    const deptName = decodeURIComponent(resolvedParams.dept);
    const router = useRouter();
    const { excelData, checkIn, isCheckedIn, currentEmployee } = useApp();

    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // 이 기기에서 이미 응소 완료했는지 확인
    const deviceAlreadyCheckedIn = currentEmployee !== null;

    const employees = useMemo(() => {
        if (!excelData) return [];
        return getEmployeesByDept(excelData.employees, deptName);
    }, [excelData, deptName]);

    // 소방서장인 경우 자동 선택
    const isSobangseojang = deptName === '소방서장';

    useEffect(() => {
        if (isSobangseojang && employees.length === 1 && !selectedEmployeeId) {
            setSelectedEmployeeId(employees[0].id);
        }
    }, [isSobangseojang, employees, selectedEmployeeId]);

    const selectedEmployee = useMemo(() => {
        return employees.find(e => e.id === selectedEmployeeId);
    }, [employees, selectedEmployeeId]);

    const [showConfirm, setShowConfirm] = useState(false);

    const handleCheckIn = () => {
        if (!selectedEmployee) return;

        if (isCheckedIn(selectedEmployee.id)) {
            setToast({ message: '이미 응소 완료된 인원입니다.', type: 'error' });
            return;
        }

        // 확인창 표시
        setShowConfirm(true);
    };

    const confirmCheckIn = () => {
        if (!selectedEmployee) return;

        const success = checkIn(selectedEmployee);
        if (success) {
            router.push('/dashboard');
        } else {
            setToast({ message: '이 기기에서는 이미 응소 완료했습니다.', type: 'error' });
        }
        setShowConfirm(false);
    };

    const color = getControlDeptColor(deptName);

    if (!excelData) {
        return (
            <div className="page">
                <SessionBanner />
                <div className="header">
                    <Link href="/" className="header-back">←</Link>
                    <h1 className="header-title">데이터 없음</h1>
                </div>
                <div className="page-content" style={{ padding: '16px' }}>
                    <p>엑셀 파일이 업로드되지 않았습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <SessionBanner />

            <div className="header" style={{ borderLeft: `4px solid ${color}` }}>
                <Link href="/" className="header-back">←</Link>
                <h1 className="header-title">{deptName}</h1>
            </div>

            <div className="page-content" style={{ padding: '16px' }}>
                {/* 이미 이 기기에서 응소 완료한 경우 */}
                {deviceAlreadyCheckedIn ? (
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h3 style={{ marginBottom: '8px' }}>이미 응소 완료되었습니다</h3>
                        <p style={{ color: '#757575', marginBottom: '16px' }}>
                            {currentEmployee?.직위} - {currentEmployee?.성명 || '(미지정)'}
                        </p>
                        <Link href="/dashboard" className="btn btn-primary btn-block">
                            대시보드로 이동
                        </Link>
                    </div>
                ) : (
                    <>
                        {!isSobangseojang && (
                            <div className="form-group">
                                <label className="form-label">직위 선택</label>
                                <select
                                    className="form-select"
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                >
                                    <option value="">직위를 선택하세요</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.직위}
                                            {isCheckedIn(emp.id) ? ' ✓ 응소완료' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedEmployee && (
                            <div className="card" style={{ margin: '16px 0' }}>
                                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isSobangseojang && (
                                        <span style={{ color: '#FFD700', fontSize: '20px' }}>★</span>
                                    )}
                                    선택된 인원
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#757575' }}>직위</span>
                                        <strong>{selectedEmployee.직위}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#757575' }}>성명</span>
                                        <span>{selectedEmployee.성명 || '(미지정)'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#757575' }}>직급</span>
                                        <span>{selectedEmployee.직급}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#757575' }}>편성부서</span>
                                        <span style={{
                                            fontWeight: 600,
                                            color: getControlDeptColor(selectedEmployee.통제단편성부),
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {selectedEmployee.통제단편성부 === '긴급구조통제단장' ? (
                                                <span style={{ color: '#FFD700', fontSize: '14px' }}>★</span>
                                            ) : (
                                                <span style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: getControlDeptColor(selectedEmployee.통제단편성부)
                                                }} />
                                            )}
                                            {selectedEmployee.통제단편성부}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            className="btn btn-primary btn-block"
                            disabled={!selectedEmployee}
                            onClick={handleCheckIn}
                            style={{ marginTop: '16px' }}
                        >
                            응소 완료
                        </button>
                    </>
                )}
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* 응소 확인 모달 */}
            {showConfirm && selectedEmployee && (
                <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
                            <h3 style={{ marginBottom: '8px' }}>응소 완료 확인</h3>
                            <p style={{ color: '#757575', marginBottom: '8px' }}>
                                아래 정보가 맞습니까?
                            </p>
                            <div style={{
                                padding: '16px',
                                background: '#F5F5F5',
                                borderRadius: '8px',
                                margin: '16px 0',
                                textAlign: 'left'
                            }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>직위:</strong> {selectedEmployee.직위}
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>성명:</strong> {selectedEmployee.성명 || '(미지정)'}
                                </div>
                                <div>
                                    <strong>편성부서:</strong> {selectedEmployee.통제단편성부}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowConfirm(false)}
                                    style={{ flex: 1 }}
                                >
                                    취소
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={confirmCheckIn}
                                    style={{ flex: 1 }}
                                >
                                    응소 완료
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
