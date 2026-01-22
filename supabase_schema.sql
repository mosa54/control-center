-- 1. 시스템 설정 테이블 (엑셀 데이터 및 모드 저장)
create table system_settings (
  id bigint primary key default 1, -- 항상 1번 행만 사용
  mode text default 'training',
  summary text,
  excel_data jsonb, -- 엑셀 파일 파싱 데이터 전체
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 초기 데이터 삽입 (반드시 실행해야 함)
insert into system_settings (id, mode, summary) values (1, 'training', '초기 설정');

-- 2. 체크인 테이블 (직원 체크인 현황)
create table checkins (
  id uuid default gen_random_uuid() primary key,
  employee_id text not null, -- 엑셀의 id (emp-1 등)
  dept text not null, -- 통제단편성부
  name text not null, -- 성명
  position text, -- 직위
  duty_status text, -- 당번/비번 (교대근무자용)
  checked_in_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Row Level Security (RLS) 설정 - 누구나 읽기/쓰기 허용 (Anon Key 사용)
alter table system_settings enable row level security;
create policy "Enable all for system_settings" on system_settings for all using (true) with check (true);

alter table checkins enable row level security;
create policy "Enable all for checkins" on checkins for all using (true) with check (true);

-- 4. Realtime (실시간) 활성화
-- 이 쿼리가 실패하면 Supabase 대시보드 -> Database -> Replication 에서 직접 설정해야 함
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table system_settings, checkins;
commit;
