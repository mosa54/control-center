'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning';
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'error' ? '#D32F2F' : type === 'warning' ? '#FB8C00' : '#212121';

    return (
        <div className="toast" style={{ background: bgColor }}>
            {message}
        </div>
    );
}
