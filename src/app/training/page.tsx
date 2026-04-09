import { Suspense } from 'react';
import ScenarioTimeline from '@/components/ScenarioTimeline';

export default function TrainingPage() {
    return (
        <div className="page" style={{ padding: '20px 16px', paddingBottom: '96px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A237E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📋</span> 상황부여 메시지
                </h1>
                <p style={{ color: '#616161', fontSize: '14px', marginTop: '4px' }}>
                    통제단 훈련 중 수신된 상황 정보를 확인합니다.
                </p>
            </div>
            
            <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</div>}>
                <ScenarioTimeline />
            </Suspense>
        </div>
    );
}
