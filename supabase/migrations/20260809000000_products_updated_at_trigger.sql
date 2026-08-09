-- Codifies a function + trigger that already exist on the remote project
-- (predate the 20260802000000 baseline migration, applied via MCP without a
-- tracked file). create or replace / drop trigger if exists make this safe
-- to re-run against that existing state.
--
-- `set search_path = ''` also clears the function_search_path_mutable
-- security advisory on set_updated_at.

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row
  execute function set_updated_at();
