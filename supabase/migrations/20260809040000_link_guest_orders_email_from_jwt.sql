create or replace function link_guest_orders_to_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set user_id = auth.uid()
  where user_id is null
    and auth.uid() is not null
    and lower(email) = lower(auth.jwt() ->> 'email');
end;
$$;

drop function if exists link_guest_orders_to_current_user(text);

revoke execute on function link_guest_orders_to_current_user() from public;
revoke execute on function link_guest_orders_to_current_user() from anon;
grant execute on function link_guest_orders_to_current_user() to authenticated;
