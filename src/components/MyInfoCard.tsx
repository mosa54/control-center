'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { getOrderedControlDepts, getControlDeptColor, getMissionsByDept } from '@/lib/excel';

export default function MyInfoCard() {
    const router = useRouter();
    const { currentEmployee, excelData, changeDept, cancelMyCheckIn } = useApp();
    const [showDeptChange, setShowDeptChange] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedMission, setSelectedMission] = useState('');

    if (!currentEmployee) return null;

    const controlDepts = excelData ? getOrderedControlDepts(excelData.employees) : [];
    const deptColor = getControlDeptColor(currentEmployee.통제단편성부);

    // 선택된 부서의 세부임무 목록
    const deptMissions = excelData && selectedDept
        ? getMissionsByDept(excelData.missions, selectedDept)
        : [];

    // 세부임무 선택이 필요한 부서인지 확인
    const needsMissionSelect = ['대응계획부', '현장지휘부', '자원지원부'].includes(selectedDept);

    const handleDeptChangeStart = () => {
        setSelectedDept(currentEmployee.통제단편성부);
        setSelectedMission('');
        setShowDeptChange(true);
    };

    const handleDeptSelect = (dept: string) => {
        setSelectedDept(dept);
        setSelectedMission(''); // 부서 변경 시 세부임무 초기화
    };

    const handleConfirmChange = () => {
        if (needsMissionSelect && !selectedMission) return; // 세부임무 선택 필요
        changeDept(selectedDept, needsMissionSelect ? selectedMission : undefined);
        setShowDeptChange(false);
    };

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
                            onClick={handleDeptChangeStart}
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
                        {/* 부서 선택 */}
                        <select
                            className="form-select"
                            value={selectedDept}
                            onChange={(e) => handleDeptSelect(e.target.value)}
                        >
                            {controlDepts.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        {/* 세부임무 선택 (대응계획부, 현장지휘부, 자원지원부) */}
                        {needsMissionSelect && deptMissions.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#757575',
                                    marginBottom: '4px',
                                    fontWeight: 500
                                }}>
                                    세부임무 선택
                                </div>
                                <select
                                    className="form-select"
                                    value={selectedMission}
                                    onChange={(e) => setSelectedMission(e.target.value)}
                                    style={{
                                        borderColor: !selectedMission ? '#FF9800' : undefined,
                                    }}
                                >
                                    <option value="">-- 세부임무를 선택하세요 --</option>
                                    {deptMissions.map(mission => (
                                        <option key={mission.임무코드} value={mission.임무코드}>
                                            {mission.임무명}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                                onClick={() => setShowDeptChange(false)}
                            >
                                취소
                            </button>
                            <button
                                className="btn"
                                style={{
                                    flex: 1,
                                    background: (needsMissionSelect && !selectedMission)
                                        ? '#BDBDBD' : '#1976D2',
                                    color: 'white',
                                }}
                                disabled={needsMissionSelect && !selectedMission}
                                onClick={handleConfirmChange}
                            >
                                변경 확인
                            </button>
                        </div>
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
