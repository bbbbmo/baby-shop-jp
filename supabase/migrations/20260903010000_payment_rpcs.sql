-- 결제 승인 확정. payments와 orders를 한 트랜잭션으로 고친다.
-- 반환값: 'ok' | 'notFound' | 'alreadyPaid' | 'amountMismatch'
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
begin
  select order_id, status into v_order_id, v_status
  from public.payments where id = p_payment_id for update;

  if not found then
    return 'notFound';
  end if;

  -- 복귀 URL은 새로고침·뒤로가기로 여러 번 열린다.
  if v_status = 'paid' then
    return 'alreadyPaid';
  end if;

  select total_price into v_total from public.orders where id = v_order_id;

  -- 브라우저가 보낸 금액은 어디서도 믿지 않는다. 주문 금액이 기준이다.
  if v_total is distinct from p_paid_amount then
    update public.payments
      set status = 'failed',
          failure_code = 'amountMismatch',
          provider_txn_id = p_txn_id,
          raw = p_raw
      where id = p_payment_id;
    return 'amountMismatch';
  end if;

  update public.payments
    set status = 'paid',
        provider_txn_id = p_txn_id,
        raw = p_raw,
        paid_at = now()
    where id = p_payment_id;

  update public.orders set status = 'paid' where id = v_order_id;

  return 'ok';
end;
$$;

-- 결제 취소 확정. 반환값: 'ok' | 'notFound' | 'notPaid'
create or replace function cancel_payment(
  p_payment_id uuid,
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
begin
  select order_id, status into v_order_id, v_status
  from public.payments where id = p_payment_id for update;

  if not found then
    return 'notFound';
  end if;

  if v_status <> 'paid' then
    return 'notPaid';
  end if;

  update public.payments
    set status = 'cancelled',
        raw = p_raw,
        cancelled_at = now()
    where id = p_payment_id;

  update public.orders set status = 'cancelled' where id = v_order_id;

  return 'ok';
end;
$$;

-- 이 두 함수는 Route Handler가 service-role로만 부른다.
-- 손님이나 로그인 사용자가 직접 부를 수 있으면 안 된다.
revoke execute on function confirm_payment(uuid, text, integer, jsonb) from public, anon, authenticated;
revoke execute on function cancel_payment(uuid, jsonb) from public, anon, authenticated;
