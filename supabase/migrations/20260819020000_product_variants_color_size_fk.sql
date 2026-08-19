alter table public.product_variants
  add column color_id uuid references public.colors(id),
  add column size_id uuid references public.sizes(id);

update public.product_variants pv
set color_id = c.id
from public.colors c
where pv.color = c.hex;

update public.product_variants pv
set size_id = s.id
from public.sizes s
where pv.size = s.value;

alter table public.product_variants
  drop column color,
  drop column size;

alter table public.product_variants
  drop constraint if exists product_variants_product_id_color_size_key,
  add constraint product_variants_product_id_color_id_size_id_key
    unique (product_id, color_id, size_id);
