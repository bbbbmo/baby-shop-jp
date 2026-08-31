-- get_order_by_number_and_email는 테이블 select를 거치지 않고 jsonb를 직접
-- 만들어 Order 타입으로 캐스팅한다. orders.market / order_items.product_name_ko가
-- 생겼으니 이 함수도 같이 반환하지 않으면 게스트 주문 조회 화면에서
-- order.market이 undefined가 되어 통화 표시가 깨진다.
create or replace function get_order_by_number_and_email(
  p_order_number text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', o.id,
    'orderNumber', o.order_number,
    'status', o.status,
    'market', o.market,
    'recipientName', o.recipient_name,
    'recipientFurigana', o.recipient_furigana,
    'phone', o.phone,
    'email', o.email,
    'postalCode', o.postal_code,
    'prefecture', o.prefecture,
    'city', o.city,
    'addressLine', o.address_line,
    'building', o.building,
    'memo', o.memo,
    'totalPrice', o.total_price,
    'createdAt', o.created_at,
    'items', coalesce(items.items, '[]'::jsonb)
  )
  into result
  from public.orders o
  left join (
    select oi.order_id,
      jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'productVariantId', oi.product_variant_id,
        'productNameJa', oi.product_name_ja,
        'productNameKo', oi.product_name_ko,
        'color', oi.color,
        'size', oi.size,
        'unitPrice', oi.unit_price,
        'quantity', oi.quantity
      )) as items
    from public.order_items oi
    group by oi.order_id
  ) items on items.order_id = o.id
  where o.order_number = p_order_number
    and lower(o.email) = lower(p_email)
  limit 1;

  return result;
end;
$$;
