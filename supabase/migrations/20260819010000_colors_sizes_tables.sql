create table public.colors (
  id uuid primary key default gen_random_uuid(),
  hex text not null unique,
  name text not null,
  aliases text[] not null default '{}',
  sort_order int not null default 0
);

create table public.sizes (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,
  sort_order int not null default 0
);

alter table public.colors enable row level security;
alter table public.sizes enable row level security;

create policy "public read" on public.colors
  for select to anon, authenticated
  using (true);

create policy "public read" on public.sizes
  for select to anon, authenticated
  using (true);

insert into public.colors (hex, name, aliases, sort_order) values
  ('#fbf9f6', 'Ivory', array['아이보리'], 0),
  ('#f1ebe3', 'Cream', array['크림'], 1),
  ('#e9dfd2', 'Beige', array['베이지'], 2),
  ('#d9d0c4', 'Tan', array['탄'], 3),
  ('#dfe5d9', 'Sage', array['세이지'], 4),
  ('#f4e2df', 'Blush', array['블러시'], 5);

insert into public.sizes (value, sort_order) values
  ('50-60', 0),
  ('70', 1),
  ('80', 2),
  ('90', 3),
  ('95', 4);
