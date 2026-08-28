-- 회원 동의 기록. 행을 덮어쓰지 않고 계속 쌓아 철회/재동의 이력을 보존한다.
-- "현재 동의 상태"는 consent_type별 최신 agreed_at 행이다.
create table if not exists user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null
    check (consent_type in ('terms', 'privacy', 'marketing')),
  agreed boolean not null,
  terms_version text not null default 'v1',
  agreed_at timestamptz not null default now()
);

create index if not exists user_consents_user_id_idx on user_consents(user_id);

alter table user_consents enable row level security;

drop policy if exists "own consents read" on user_consents;
create policy "own consents read" on user_consents for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "own consents insert" on user_consents;
create policy "own consents insert" on user_consents for insert to authenticated
  with check (user_id = auth.uid());

-- update/delete 정책은 일부러 만들지 않는다.
-- 동의 기록은 추가만 가능해야 감사 자료로서 의미가 있다.

-- 이메일 가입은 signUp() 반환 시점에 세션이 없어 RLS insert가 막힌다.
-- options.data로 넘어온 동의 값을 트리거가 대신 기록한다.
-- agreed가 not null이므로 키가 빠졌을 때 가입 전체가 롤백되지 않도록 coalesce로 막는다.
create or replace function handle_new_user_consents()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ? 'consent_terms' then
    insert into user_consents (user_id, consent_type, agreed)
    values
      (new.id, 'terms',     coalesce((new.raw_user_meta_data->>'consent_terms')::boolean, false)),
      (new.id, 'privacy',   coalesce((new.raw_user_meta_data->>'consent_privacy')::boolean, false)),
      (new.id, 'marketing', coalesce((new.raw_user_meta_data->>'consent_marketing')::boolean, false));
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created_consents on auth.users;
create trigger on_auth_user_created_consents
  after insert on auth.users
  for each row execute function handle_new_user_consents();

-- 기존 사용자 백필. 이미 통합 약관 동의(agreeRequired)를 받은 사용자들이다.
-- 초기 가입자 중 marketing_opt_in 키가 없는 행이 있을 수 있어 coalesce로 막는다.
insert into user_consents (user_id, consent_type, agreed, agreed_at)
select u.id, t.consent_type, t.agreed, u.created_at
from auth.users u
cross join lateral (
  values
    ('terms'::text,     true),
    ('privacy'::text,   true),
    ('marketing'::text, coalesce((u.raw_user_meta_data->>'marketing_opt_in')::boolean, false))
) as t(consent_type, agreed)
where not exists (
  select 1 from user_consents c where c.user_id = u.id
);
