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
  create publication supabase_realtime for table system_settings, checkins, scenario_events, reports, task_checks;
commit;

-- 5. 상황부여 타임라인 테이블
create table scenario_events (
  id uuid default gen_random_uuid() primary key,
  time_label text not null,
  title text not null,
  description text,
  category text default 'other',
  delivery_type text default 'instant',    -- instant / scheduled / conditional
  scheduled_delay_min integer default 0,
  condition_note text,
  status text default 'pending',           -- pending / delivered
  scheduled_at timestamp with time zone,   -- 예약 부여 시각
  delivered_at timestamp with time zone,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table scenario_events enable row level security;
create policy "Enable all for scenario_events" on scenario_events for all using (true) with check (true);

-- 6. 시나리오 템플릿 테이블
create table scenario_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  events jsonb not null default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table scenario_templates enable row level security;
create policy "Enable all for scenario_templates" on scenario_templates for all using (true) with check (true);

-- 7. 마이그레이션: scenario_events 에 roles(주체별 체크리스트) 컬럼 추가
-- ★ Supabase SQL Editor에서 아래 한 줄만 실행하면 됩니다 ★
ALTER TABLE scenario_events ADD COLUMN IF NOT EXISTS roles jsonb;

-- 8. 체크리스트 체크 상태 테이블 (실시간 동기화용)
create table if not exists task_checks (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references scenario_events(id) on delete cascade,
  task_key text not null,           -- "이벤트ID_역할명_taskIdx" 형태의 고유 키
  checked boolean default false,
  checked_by text,                  -- 체크한 사람 이름
  checked_at timestamp with time zone default timezone('utc'::text, now()),
  unique(event_id, task_key)        -- 같은 이벤트에서 같은 태스크는 1개만
);

alter table task_checks enable row level security;
create policy "Enable all for task_checks" on task_checks for all using (true) with check (true);

-- 10. Scenario source document storage
-- Run this migration when using the admin scenario PDF upload feature.
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS scenario_document jsonb;

-- 9. Report file storage bucket
-- Run this in the Supabase SQL editor to store large PDF/image uploads as files
-- instead of embedding Base64 strings in reports.data.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-files',
  'report-files',
  true,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Enable report file read" on storage.objects;
create policy "Enable report file read"
on storage.objects for select
using (bucket_id = 'report-files');

drop policy if exists "Enable report file insert" on storage.objects;
create policy "Enable report file insert"
on storage.objects for insert
with check (bucket_id = 'report-files');

drop policy if exists "Enable report file update" on storage.objects;
create policy "Enable report file update"
on storage.objects for update
using (bucket_id = 'report-files')
with check (bucket_id = 'report-files');

drop policy if exists "Enable report file delete" on storage.objects;
create policy "Enable report file delete"
on storage.objects for delete
using (bucket_id = 'report-files');
