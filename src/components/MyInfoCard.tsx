'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { getOrderedControlDepts, getControlDeptColor } from '@/lib/excel';

export default function MyInfoCard() {
    const router = useRouter();
    const { currentEmployee, excelData, changeDept, cancelMyCheckIn } = useApp();
    const [showDeptChange, setShowDeptChange] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    if (!currentEmployee) return null;

    const controlDepts = excelData ? getOrderedControlDepts(excelData.employees) : [];
    const deptColor = getControlDeptColor(currentEmployee.통제단편성부);

    const handleCancelCheckIn = () => {
        cancelMyCheckIn();
        setShowCancelConfirm(false);
        router.push('/');
    };

    return (
        <div className="card">
            <div className="card-title">내 정보</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#757575' }}>직위</span>
                    <span style={{ fontWeight: 600 }}>{currentEmployee.직위}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#757575' }}>성명</span>
                    <span style={{ fontWeight: 600 }}>{currentEmployee.성명 || '(미지정)'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#757575' }}>직급</span>
                    <span>{currentEmployee.직급}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#757575' }}>소속 부서</span>
                    <span>{currentEmployee.소속부서}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#757575' }}>편성 부서</span>
                    <span
                        style={{
                            fontWeight: 700,
                            color: deptColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {currentEmployee.통제단편성부 === '긴급구조통제단장' ? (
                            <span style={{ color: '#FFD700', fontSize: '14px' }}>★</span>
                        ) : (
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: deptColor
                            }} />
                        )}
                        {currentEmployee.통제단편성부}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {!showDeptChange ? (
                    <>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                            onClick={() => setShowDeptChange(true)}
                        >
                            부서 변경
                        </button>
                        <button
                            className="btn"
                            style={{ flex: 1, background: '#FF5722', color: 'white' }}
                            onClick={() => setShowCancelConfirm(true)}
                        >
                            응소 취소
                        </button>
                    </>
                ) : (
                    <div style={{ width: '100%' }}>
                        <select
                            className="form-select"
                            value={currentEmployee.통제단편성부}
                            onChange={(e) => {
                                changeDept(e.target.value);
                                setShowDeptChange(false);
                            }}
                        >
                            {controlDepts.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <button
                            className="btn btn-secondary btn-block"
                            style={{ marginTop: '8px' }}
                            onClick={() => setShowDeptChange(false)}
                        >
                            취소
                        </button>
                    </div>
                )}
            </div>

            {/* 응소 취소 확인 모달 */}
            {showCancelConfirm && (
                <div className="modal-overlay" onClick={() => setShowCancelConfirm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                            <h3 style={{ marginBottom: '8px' }}>응소 취소</h3>
                            <p style={{ color: '#757575', marginBottom: '16px' }}>
                                정말 응소를 취소하시겠습니까?
                                <br />
                                취소 후 다시 응소할 수 있습니다.
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowCancelConfirm(false)}
                                    style={{ flex: 1 }}
                                >
                                    아니오
                                </button>
                                <button
                                    className="btn"
                                    onClick={handleCancelCheckIn}
                                    style={{ flex: 1, background: '#D32F2F', color: 'white' }}
                                >
                                    응소 취소
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
