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

grant execute on function get_order_by_number_and_email(text, text) to anon, authenticated;

create or replace function link_guest_orders_to_current_user(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  update public.orders
  set user_id = auth.uid()
  where user_id is null
    and lower(email) = lower(p_email);
end;
$$;

revoke execute on function link_guest_orders_to_current_user(text) from public;
grant execute on function link_guest_orders_to_current_user(text) to authenticated;
