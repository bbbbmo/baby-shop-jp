-- 결제 시도 이력. 주문에 컬럼을 붙이지 않는 이유는 재시도 때문이다.
-- 한 수단으로 실패하고 다른 수단으로 다시 하는 일이 흔한데, 주문에 붙이면
-- 그 이력이 덮어써진다.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,
  method text not null,
  -- cancelling은 「PG에 환불을 요청하는 중」이다. 이 상태를 먼저 선점해야
  -- 관리자가 취소를 두 번 눌렀을 때 PG에 환불이 두 번 가지 않는다.
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelling', 'cancelled')),
  amount integer not null,
  currency text not null check (currency in ('KRW', 'JPY')),
  provider_ref text,
  provider_txn_id text,
  failure_code text,
  -- PG 원본 응답. 지나간 결제는 복원할 수 없으므로 처음부터 남긴다.
  raw jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists payments_order_id_idx on payments(order_id);

-- 한 주문에 성공 결제는 하나뿐이다. 실패한 시도는 행으로 남되 재시도를 막지 않는다.
create unique index if not exists payments_one_paid_per_order
  on payments(order_id) where status = 'paid';

-- 클라이언트는 payments를 직접 읽지 않는다. Route Handler가 service-role로만
-- 접근하므로 정책을 하나도 만들지 않는다 (= anon/authenticated 전면 차단).
alter table payments enable row level security;

-- 결제가 붙으면서 주문 상태가 셋이 된다.
-- 결제 실패는 주문 상태를 바꾸지 않는다 — payments에만 남기고 재시도를 허용한다.
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending_payment', 'paid', 'cancelled'));
