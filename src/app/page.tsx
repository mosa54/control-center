'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { getUniqueDepts, getControlDeptColor } from '@/lib/excel';
import SessionBanner from '@/components/SessionBanner';

export default function HomePage() {
  const { excelData } = useApp();

  // 엑셀 데이터가 없으면 안내 메시지
  if (!excelData) {
    return (
      <div className="page">
        <SessionBanner />

        <div className="header" style={{ flexDirection: 'column', gap: '8px', paddingTop: '24px', paddingBottom: '16px' }}>
          <Image
            src="/119_symbolmark.png"
            alt="중부소방서 심볼마크"
            width={80}
            height={80}
            priority
          />
          <h1 className="header-title" style={{ textAlign: 'center', fontSize: '20px' }}>
            중부소방서 긴급구조통제단 소집
          </h1>
        </div>

        <Link href="/admin" className="admin-link">
          관리자
        </Link>

        <div className="page-content">
          <div className="card" style={{ margin: '16px', textAlign: 'center' }}>
            <p style={{ marginBottom: '16px', color: '#757575' }}>
              직원 편성 데이터가 없습니다.
            </p>
            <p>
              관리자 페이지에서 엑셀 파일을 업로드해주세요.
            </p>
            <Link href="/admin" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
              관리자 페이지로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const depts = getUniqueDepts(excelData.employees);

  return (
    <div className="page">
      <SessionBanner />

      <div className="header" style={{ flexDirection: 'column', gap: '8px', paddingTop: '24px', paddingBottom: '16px' }}>
        <Image
          src="/119_symbolmark.png"
          alt="중부소방서 심볼마크"
          width={80}
          height={80}
          priority
        />
        <h1 className="header-title" style={{ textAlign: 'center', fontSize: '20px' }}>
          중부소방서 긴급구조통제단 소집
        </h1>
      </div>

      <Link href="/admin" className="admin-link">
        관리자
      </Link>

      <div className="page-content">
        <p style={{ padding: '16px', textAlign: 'center', color: '#757575' }}>
          소속 부서를 선택하세요
        </p>

        <div className="dept-grid">
          {depts.map(dept => {
            const count = excelData.employees.filter(e => e.소속부서 === dept).length;
            return (
              <Link
                key={dept}
                href={`/checkin/${encodeURIComponent(dept)}`}
                className="dept-tile"
                style={{ borderLeftColor: getControlDeptColor(dept) }}
              >
                <span className="name">{dept}</span>
                <span className="count">{count}명</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
