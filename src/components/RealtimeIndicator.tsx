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

    return (
        <div className="realtime-indicator" style={{
            position: 'fixed',
            top: '14px',
            right: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 100,
            border: `1px solid ${getStatusColor()}44`,
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none'
        }}>
            <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: getStatusColor(),
                boxShadow: `0 0 8px ${getStatusColor()}`,
                animation: realtimeStatus === 'connecting' ? 'blink 1s infinite' : 'none'
            }} />

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
