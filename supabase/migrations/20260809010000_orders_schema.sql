create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id),
  recipient_name text not null,
  recipient_furigana text not null,
  phone text not null,
  email text not null,
  postal_code text not null,
  prefecture text not null,
  city text not null,
  address_line text not null,
  building text,
  memo text,
  status text not null default 'pending_payment',
  total_price integer not null,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_variant_id uuid not null references product_variants(id),
  product_name_ja text not null,
  color text not null,
  size text not null,
  unit_price integer not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists order_items_order_id_idx on order_items(order_id);
create index if not exists order_items_product_variant_id_idx on order_items(product_variant_id);

alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "own orders" on orders;
create policy "own orders" on orders for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "own order items" on order_items;
create policy "own order items" on order_items for select to authenticated
  using (exists (
    select 1 from orders o where o.id = order_id and o.user_id = auth.uid()
  ));
