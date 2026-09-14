-- 주문 내역에서 현재 상품 상세로 이동할 수 있도록 상품 식별자를 함께 보관한다.
alter table public.order_items
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists product_category text;

update public.order_items oi
set product_id = pv.product_id,
    product_category = p.category
from public.product_variants pv
join public.products p on p.id = pv.product_id
where pv.id = oi.product_variant_id
  and (oi.product_id is null or oi.product_category is null);

-- 결제창을 연 동안만 재고를 잡는다. 완료된 결제는 차감 상태를 유지하고,
-- 실패·취소·만료된 결제는 stock_released_at을 기록한 뒤 한 번만 복구한다.
alter table public.orders
  add column if not exists stock_reserved_at timestamptz,
  add column if not exists stock_reservation_expires_at timestamptz,
  add column if not exists stock_released_at timestamptz;

create index if not exists orders_active_stock_reservations_idx
  on public.orders(stock_reservation_expires_at)
  where status = 'pending_payment'
    and stock_reserved_at is not null
    and stock_released_at is null;

create or replace function release_order_stock(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_reserved_at timestamptz;
  v_released_at timestamptz;
begin
  select status, stock_reserved_at, stock_released_at
  into v_status, v_reserved_at, v_released_at
  from public.orders where id = p_order_id for update;

  if not found then return 'notFound'; end if;
  if v_reserved_at is null or v_released_at is not null then return 'alreadyReleased'; end if;
  if v_status <> 'pending_payment' then return 'notPending'; end if;

  update public.product_variants pv
  set stock = pv.stock + requested.quantity
  from (
    select product_variant_id, sum(quantity)::integer as quantity
    from public.order_items where order_id = p_order_id
    group by product_variant_id
  ) requested
  where pv.id = requested.product_variant_id;

  update public.orders set stock_released_at = now() where id = p_order_id;
  return 'ok';
end;
$$;

create or replace function release_expired_stock_reservations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_count integer := 0;
begin
  for v_order_id in
    select id from public.orders
    where status = 'pending_payment'
      and stock_reserved_at is not null
      and stock_released_at is null
      and stock_reservation_expires_at <= now()
    order by id for update skip locked
  loop
    perform public.release_order_stock(v_order_id);
    update public.payments
    set status = 'failed', failure_code = 'expired'
    where order_id = v_order_id and status = 'pending';
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function reserve_order_stock(
  p_order_id uuid,
  p_ttl_minutes integer default 15
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  perform public.release_expired_stock_reservations();
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return 'notFound'; end if;
  if v_order.status <> 'pending_payment' then return 'notPending'; end if;
  if v_order.stock_reserved_at is not null and v_order.stock_released_at is null
     and v_order.stock_reservation_expires_at > now() then
    return 'alreadyReserved';
  end if;

  perform 1
  from public.product_variants pv
  join (
    select product_variant_id, sum(quantity)::integer as quantity
    from public.order_items where order_id = p_order_id
    group by product_variant_id
  ) requested on requested.product_variant_id = pv.id
  order by pv.id for update of pv;

  if exists (
    select 1
    from (
      select product_variant_id, sum(quantity)::integer as quantity
      from public.order_items where order_id = p_order_id
      group by product_variant_id
    ) requested
    left join public.product_variants pv on pv.id = requested.product_variant_id
    where pv.id is null or pv.stock < requested.quantity
  ) then return 'soldOut'; end if;

  update public.product_variants pv
  set stock = pv.stock - requested.quantity
  from (
    select product_variant_id, sum(quantity)::integer as quantity
    from public.order_items where order_id = p_order_id
    group by product_variant_id
  ) requested
  where pv.id = requested.product_variant_id;

  update public.orders
  set stock_reserved_at = now(),
      stock_reservation_expires_at = now() + make_interval(mins => greatest(p_ttl_minutes, 1)),
      stock_released_at = null
  where id = p_order_id;
  return 'ok';
end;
$$;

revoke execute on function reserve_order_stock(uuid, integer) from public, anon, authenticated;
revoke execute on function release_order_stock(uuid) from public, anon, authenticated;
revoke execute on function release_expired_stock_reservations() from public, anon, authenticated;
grant execute on function reserve_order_stock(uuid, integer) to service_role;
grant execute on function release_order_stock(uuid) to service_role;
grant execute on function release_expired_stock_reservations() to service_role;

-- 승인 시 선점이 살아 있는지까지 한 트랜잭션에서 확인한다. 만료된 뒤 재고가
-- 다른 주문에 잡혔는데 늦은 승인만 도착하는 경우 주문을 결제 완료로 만들지 않는다.
create or replace function confirm_payment(
  p_payment_id uuid,
  p_txn_id text,
  p_paid_amount integer,
  p_raw jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_status text;
  v_total integer;
  v_expires_at timestamptz;
  v_released_at timestamptz;
begin
  select order_id, status into v_order_id, v_status
  from public.payments where id = p_payment_id for update;
  if not found then return 'notFound'; end if;
  if v_status = 'paid' then return 'alreadyPaid'; end if;
  if v_status <> 'pending' then return 'notPending'; end if;

  select total_price, stock_reservation_expires_at, stock_released_at
  into v_total, v_expires_at, v_released_at
  from public.orders where id = v_order_id for update;

  if v_released_at is not null or v_expires_at is null or v_expires_at <= now() then
    update public.payments
    set status = 'failed', failure_code = 'expired', provider_txn_id = p_txn_id, raw = p_raw
    where id = p_payment_id;
    perform public.release_order_stock(v_order_id);
    return 'expired';
  end if;

  if v_total is distinct from p_paid_amount then
    update public.payments
    set status = 'failed', failure_code = 'amountMismatch', provider_txn_id = p_txn_id, raw = p_raw
    where id = p_payment_id;
    perform public.release_order_stock(v_order_id);
    return 'amountMismatch';
  end if;

  update public.payments
  set status = 'paid', provider_txn_id = p_txn_id, raw = p_raw, paid_at = now()
  where id = p_payment_id;
  update public.orders set status = 'paid' where id = v_order_id;
  return 'ok';
end;
$$;

-- 환불이 확정되면 결제 때 차감했던 재고도 한 번만 되돌린다.
create or replace function cancel_payment(p_payment_id uuid, p_raw jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_status text;
  v_reserved_at timestamptz;
  v_released_at timestamptz;
begin
  select order_id, status into v_order_id, v_status
  from public.payments where id = p_payment_id for update;
  if not found then return 'notFound'; end if;
  if v_status <> 'cancelling' then return 'notPaid'; end if;

  select stock_reserved_at, stock_released_at into v_reserved_at, v_released_at
  from public.orders where id = v_order_id for update;
  if v_reserved_at is not null and v_released_at is null then
    update public.product_variants pv
    set stock = pv.stock + requested.quantity
    from (
      select product_variant_id, sum(quantity)::integer as quantity
      from public.order_items where order_id = v_order_id
      group by product_variant_id
    ) requested
    where pv.id = requested.product_variant_id;
  end if;

  update public.payments
  set status = 'cancelled', raw = p_raw, cancelled_at = now()
  where id = p_payment_id;
  update public.orders
  set status = 'cancelled',
      stock_released_at = case when v_reserved_at is null then stock_released_at else now() end
  where id = v_order_id;
  return 'ok';
end;
$$;

revoke execute on function confirm_payment(uuid, text, integer, jsonb) from public, anon, authenticated;
revoke execute on function cancel_payment(uuid, jsonb) from public, anon, authenticated;
grant execute on function confirm_payment(uuid, text, integer, jsonb) to service_role;
grant execute on function cancel_payment(uuid, jsonb) to service_role;

-- 게스트 주문 조회도 상품 상세 경로에 필요한 두 필드를 반환한다.
create or replace function get_order_by_number_and_email(p_order_number text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'id', o.id, 'orderNumber', o.order_number, 'status', o.status, 'market', o.market,
    'recipientName', o.recipient_name, 'recipientFurigana', o.recipient_furigana,
    'phone', o.phone, 'email', o.email, 'postalCode', o.postal_code,
    'prefecture', o.prefecture, 'city', o.city, 'addressLine', o.address_line,
    'building', o.building, 'memo', o.memo, 'totalPrice', o.total_price,
    'createdAt', o.created_at, 'items', coalesce(items.items, '[]'::jsonb)
  ) into result
  from public.orders o
  left join (
    select oi.order_id, jsonb_agg(jsonb_build_object(
      'id', oi.id, 'productVariantId', oi.product_variant_id,
      'productId', oi.product_id, 'productCategory', oi.product_category,
      'productNameJa', oi.product_name_ja, 'productNameKo', oi.product_name_ko,
      'color', oi.color, 'size', oi.size, 'unitPrice', oi.unit_price,
      'quantity', oi.quantity
    )) as items
    from public.order_items oi group by oi.order_id
  ) items on items.order_id = o.id
  where o.order_number = p_order_number and lower(o.email) = lower(p_email)
  limit 1;
  return result;
end;
$$;
