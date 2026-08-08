-- Baseline reproduction of the catalog schema already applied to the remote
-- "como" project via MCP without a tracked migration file. IF NOT EXISTS /
-- DROP+CREATE POLICY guards make this safe to run against that existing state.

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name_ja text not null,
  name_ko text not null,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id),
  category text not null check (category in (
    'girl-top','girl-setup','girl-bottom','girl-dress','girl-homewear','girl-swimwear',
    'boy-top','boy-setup','boy-bottom','boy-homewear','boy-swimwear',
    'mom','accessory','gift'
  )),
  name_ja text not null,
  name_ko text not null,
  description_ja text,
  description_ko text,
  price integer not null,
  list_price integer not null,
  season text not null check (season in ('ss','aw','all')),
  is_new boolean not null default false,
  is_best boolean not null default false,
  sold_out boolean not null default false,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  color text not null,
  size text not null,
  stock integer not null default 0,
  unique (product_id, color, size)
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

create table if not exists friend_looks (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  image_src text not null,
  model_info_ja text,
  model_info_ko text,
  created_at timestamptz not null default now()
);

create table if not exists friend_look_products (
  friend_look_id uuid not null references friend_looks(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  primary key (friend_look_id, product_id)
);

create index if not exists products_brand_id_idx on products(brand_id);
create index if not exists products_category_idx on products(category);
create index if not exists product_variants_product_id_idx on product_variants(product_id);
create index if not exists product_images_product_id_idx on product_images(product_id);
create index if not exists friend_look_products_product_id_idx on friend_look_products(product_id);

alter table brands enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table friend_looks enable row level security;
alter table friend_look_products enable row level security;

drop policy if exists "public read" on brands;
create policy "public read" on brands for select to anon, authenticated using (true);

drop policy if exists "public read" on products;
create policy "public read" on products for select to anon, authenticated using (true);

drop policy if exists "public read" on product_variants;
create policy "public read" on product_variants for select to anon, authenticated using (true);

drop policy if exists "public read" on product_images;
create policy "public read" on product_images for select to anon, authenticated using (true);

drop policy if exists "public read" on friend_looks;
create policy "public read" on friend_looks for select to anon, authenticated using (true);

drop policy if exists "public read" on friend_look_products;
create policy "public read" on friend_look_products for select to anon, authenticated using (true);
