'use client';

import { useApp } from '@/lib/store';

export default function RealtimeIndicator() {
    const { realtimeStatus } = useApp();

    const getStatusColor = () => {
        switch (realtimeStatus) {
            case 'connected': return '#4CAF50'; // Green
            case 'connecting': return '#FFC107'; // Amber
            case 'error': return '#F44336'; // Red
            case 'disconnected': return '#9E9E9E'; // Gray
            default: return '#9E9E9E';
        }
    };

    const getStatusText = () => {
        switch (realtimeStatus) {
            case 'connected': return '실시간 연결됨';
            case 'connecting': return '연결 중...';
            case 'error': return '연결 오류 (DB 설정 확인 필요)';
            case 'disconnected': return '연결 끊김';
            default: return '상태 확인 불가';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#333',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 10000,
            border: `1px solid ${getStatusColor()}44`,
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none'
        }}>
            <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getStatusColor(),
                boxShadow: `0 0 8px ${getStatusColor()}`,
                animation: realtimeStatus === 'connecting' ? 'blink 1s infinite' : 'none'
            }} />
            <span>{getStatusText()}</span>

            <style>
                {`
                    @keyframes blink {
                        0% { opacity: 1; }
                        50% { opacity: 0.3; }
                        100% { opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
}
