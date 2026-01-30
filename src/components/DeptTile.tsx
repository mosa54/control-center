'use client';

import Link from 'next/link';
import { OriginalDept, getEmployeesByOriginalDept } from '@/lib/data';

interface DeptTileProps {
    dept: OriginalDept;
    color: string;
}

const DEPT_COLORS: Record<OriginalDept, string> = {
    '청문감사담당관': '#E53935',
    '소방행정과': '#FB8C00',
    '예방안전과': '#43A047',
    '구조구급과': '#1E88E5',
    '현장대응단': '#8E24AA',
};

export default function DeptTile({ dept }: { dept: OriginalDept }) {
    const color = DEPT_COLORS[dept];
    const employeeCount = getEmployeesByOriginalDept(dept).length;

    return (
        <Link
            href={`/checkin/${encodeURIComponent(dept)}`}
            className="dept-tile"
            style={{ borderLeftColor: color }}
        >
            <span className="name">
                {dept === '청문감사담당관' ? (
                    <>청문감사<br />담당관</>
                ) : (
                    dept
                )}
            </span>
            <span className="count" style={{ color }}>{employeeCount}명</span>
        </Link>
    );
}

