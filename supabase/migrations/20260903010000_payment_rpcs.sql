-- 결제 승인 확정. payments와 orders를 한 트랜잭션으로 고친다.
-- 반환값: 'ok' | 'notFound' | 'alreadyPaid' | 'notPending' | 'amountMismatch'
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

  -- pending이 아닌 것을 승인하지 않는다. 이 검사가 없으면 이미 취소된 결제에
  -- 승인이 한 번 더 들어왔을 때 주문이 조용히 결제완료로 되살아난다.
  if v_status <> 'pending' then
    return 'notPending';
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

-- 취소 확정. 라우트가 먼저 status를 cancelling으로 선점한 뒤에 부른다.
-- 반환값: 'ok' | 'notFound' | 'notPaid'
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

  -- 라우트가 선점해 둔 행만 마무리한다. paid를 곧바로 cancelled로 바꾸지
  -- 않는 이유는, 그러면 PG 환불 전에 이미 취소로 적히기 때문이다.
  if v_status <> 'cancelling' then
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

-- service_role에는 명시적으로 준다. public에서 revoke하면 상속으로 얻던 권한이
-- 함께 사라지는데, 그러면 모든 결제 승인이 실패한다. 기본 권한 설정에 기대지 않는다.
grant execute on function confirm_payment(uuid, text, integer, jsonb) to service_role;
grant execute on function cancel_payment(uuid, jsonb) to service_role;
