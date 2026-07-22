-- Jalankan file ini melalui Supabase SQL Editor.
-- File ini idempotent. workspace_states dipertahankan hanya untuk migrasi data lama.

create table if not exists public.workspace_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  schema_version integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fee_rules (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  kind text not null check (kind in ('percentage', 'fixed')),
  value numeric(18, 4) not null default 0 check (value >= 0),
  applies_per text not null check (applies_per in ('item', 'order')),
  cap_amount numeric(18, 2) check (cap_amount is null or cap_amount >= 0),
  active boolean not null default true,
  default_for_products boolean not null default false,
  default_for_decants boolean not null default false,
  effective_from date not null default current_date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.products (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  brand text not null default '',
  size text not null default '',
  name text not null,
  sku text not null default '',
  identity_key text not null default '',
  capital_cost numeric(18, 2) not null default 0 check (capital_cost >= 0),
  target_profit numeric(18, 2) not null default 0 check (target_profit >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  fee_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.products drop constraint if exists products_identity_unique;

create table if not exists public.vial_costs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  size_ml numeric(10, 2) not null check (size_ml > 0),
  cost numeric(18, 2) not null default 0 check (cost >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, size_ml)
);

create table if not exists public.decant_recipes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  concentration text not null default 'EDP',
  full_bottle_cost numeric(18, 2) not null default 0 check (full_bottle_cost >= 0),
  bottle_volume_ml numeric(10, 2) not null default 100 check (bottle_volume_ml > 0),
  decant_size_ml numeric(10, 2) not null default 10 check (decant_size_ml > 0),
  vial_cost_id text,
  bubble_wrap_cost numeric(18, 2) not null default 0 check (bubble_wrap_cost >= 0),
  sticker_cost numeric(18, 2) not null default 0 check (sticker_cost >= 0),
  card_cost numeric(18, 2) not null default 0 check (card_cost >= 0),
  target_profit numeric(18, 2) not null default 0 check (target_profit >= 0),
  wholesale_two_discount numeric(7, 4) not null default 0,
  wholesale_three_discount numeric(7, 4) not null default 0,
  fee_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.sales (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  order_number text not null,
  sold_at date not null,
  source text not null check (source in ('manual', 'import')),
  calculation_mode text not null check (calculation_mode in ('estimated', 'actual')),
  stock_adjusted boolean not null default false,
  stock_delta integer not null default 0 check (stock_delta >= 0),
  product_id text,
  product_name text not null,
  sku text not null default '',
  quantity integer not null check (quantity > 0),
  unit_selling_price numeric(18, 2) not null default 0,
  gross_revenue numeric(18, 2) not null default 0,
  received_amount numeric(18, 2) not null default 0,
  unit_capital_cost numeric(18, 2) not null default 0,
  total_capital_cost numeric(18, 2) not null default 0,
  extra_cost numeric(18, 2) not null default 0,
  total_fees numeric(18, 2) not null default 0,
  profit numeric(18, 2) not null default 0,
  fee_snapshot jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, order_number, sku, product_name)
);

create index if not exists products_user_created_idx
  on public.products (user_id, created_at desc, id);
create index if not exists products_user_brand_idx
  on public.products (user_id, brand, id);
create index if not exists products_user_identity_idx
  on public.products (user_id, identity_key);
create index if not exists products_user_stock_idx
  on public.products (user_id, stock, low_stock_threshold, id);
create index if not exists products_search_idx
  on public.products using gin (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(size, '') || ' ' || coalesce(sku, ''))
  );
create index if not exists sales_user_sold_idx
  on public.sales (user_id, sold_at desc, created_at desc, id);
create index if not exists fee_rules_user_created_idx
  on public.fee_rules (user_id, created_at desc, id);
create index if not exists decants_user_created_idx
  on public.decant_recipes (user_id, created_at desc, id);
create index if not exists vials_user_size_idx
  on public.vial_costs (user_id, size_ml, id);

alter table public.workspace_states enable row level security;
alter table public.workspace_profiles enable row level security;
alter table public.fee_rules enable row level security;
alter table public.products enable row level security;
alter table public.vial_costs enable row level security;
alter table public.decant_recipes enable row level security;
alter table public.sales enable row level security;

drop policy if exists "Users manage own legacy workspace" on public.workspace_states;
create policy "Users manage own legacy workspace" on public.workspace_states
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own profile" on public.workspace_profiles;
create policy "Users manage own profile" on public.workspace_profiles
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own fees" on public.fee_rules;
create policy "Users manage own fees" on public.fee_rules
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own products" on public.products;
create policy "Users manage own products" on public.products
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own vials" on public.vial_costs;
create policy "Users manage own vials" on public.vial_costs
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own decants" on public.decant_recipes;
create policy "Users manage own decants" on public.decant_recipes
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own sales" on public.sales;
create policy "Users manage own sales" on public.sales
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_product_identity_key()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.identity_key = lower(trim(new.brand) || '|' || trim(new.size) || '|' || trim(new.name));
  return new;
end;
$$;

drop trigger if exists set_product_identity_key on public.products;
create trigger set_product_identity_key
before insert or update of brand, size, name on public.products
for each row execute function public.set_product_identity_key();

drop trigger if exists set_profile_updated_at on public.workspace_profiles;
create trigger set_profile_updated_at before update on public.workspace_profiles
for each row execute function public.set_row_updated_at();
drop trigger if exists set_fee_updated_at on public.fee_rules;
create trigger set_fee_updated_at before update on public.fee_rules
for each row execute function public.set_row_updated_at();
drop trigger if exists set_product_updated_at on public.products;
create trigger set_product_updated_at before update on public.products
for each row execute function public.set_row_updated_at();
drop trigger if exists set_vial_updated_at on public.vial_costs;
create trigger set_vial_updated_at before update on public.vial_costs
for each row execute function public.set_row_updated_at();
drop trigger if exists set_decant_updated_at on public.decant_recipes;
create trigger set_decant_updated_at before update on public.decant_recipes
for each row execute function public.set_row_updated_at();
drop trigger if exists set_sale_updated_at on public.sales;
create trigger set_sale_updated_at before update on public.sales
for each row execute function public.set_row_updated_at();

create or replace function public.clear_product_references()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.sales
  set product_id = null
  where user_id = old.user_id and product_id = old.id;
  return old;
end;
$$;

drop trigger if exists clear_product_references on public.products;
create trigger clear_product_references
before delete on public.products
for each row execute function public.clear_product_references();

create or replace function public.clear_vial_references()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.decant_recipes
  set vial_cost_id = null
  where user_id = old.user_id and vial_cost_id = old.id;
  return old;
end;
$$;

drop trigger if exists clear_vial_references on public.vial_costs;
create trigger clear_vial_references
before delete on public.vial_costs
for each row execute function public.clear_vial_references();

create or replace function public.bootstrap_workspace(p_seed jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_data jsonb;
  item jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if exists (select 1 from public.workspace_profiles where user_id = v_user) then
    return;
  end if;

  select data into v_data from public.workspace_states where user_id = v_user;
  v_data := coalesce(v_data, p_seed, '{}'::jsonb);

  insert into public.workspace_profiles (user_id, settings, schema_version)
  values (v_user, coalesce(v_data->'settings', '{}'::jsonb), 2);

  for item in select value from jsonb_array_elements(coalesce(v_data->'fees', '[]'::jsonb)) loop
    insert into public.fee_rules (
      user_id, id, name, kind, value, applies_per, cap_amount, active,
      default_for_products, default_for_decants, effective_from, archived_at,
      created_at, updated_at
    ) values (
      v_user, item->>'id', item->>'name', item->>'kind', coalesce((item->>'value')::numeric, 0),
      item->>'appliesPer', nullif(item->>'capAmount', '')::numeric,
      coalesce((item->>'active')::boolean, true),
      coalesce((item->>'defaultForProducts')::boolean, false),
      coalesce((item->>'defaultForDecants')::boolean, false),
      coalesce(nullif(item->>'effectiveFrom', '')::date, current_date),
      nullif(item->>'archivedAt', '')::timestamptz,
      coalesce(nullif(item->>'createdAt', '')::timestamptz, now()),
      coalesce(nullif(item->>'updatedAt', '')::timestamptz, now())
    ) on conflict do nothing;
  end loop;

  for item in select value from jsonb_array_elements(coalesce(v_data->'products', '[]'::jsonb)) loop
    insert into public.products (
      user_id, id, brand, size, name, sku, capital_cost, target_profit, stock,
      low_stock_threshold, fee_overrides, created_at, updated_at
    ) values (
      v_user, item->>'id', coalesce(item->>'brand', ''), coalesce(item->>'size', ''),
      item->>'name', coalesce(item->>'sku', ''), coalesce((item->>'capitalCost')::numeric, 0),
      coalesce((item->>'targetProfit')::numeric, 0), coalesce((item->>'stock')::integer, 0),
      coalesce((item->>'lowStockThreshold')::integer, 0), coalesce(item->'feeOverrides', '{}'::jsonb),
      coalesce(nullif(item->>'createdAt', '')::timestamptz, now()),
      coalesce(nullif(item->>'updatedAt', '')::timestamptz, now())
    ) on conflict do nothing;
  end loop;

  for item in select value from jsonb_array_elements(coalesce(v_data->'vialCosts', '[]'::jsonb)) loop
    insert into public.vial_costs (user_id, id, size_ml, cost, active, created_at, updated_at)
    values (
      v_user, item->>'id', (item->>'sizeMl')::numeric, coalesce((item->>'cost')::numeric, 0),
      coalesce((item->>'active')::boolean, true),
      coalesce(nullif(item->>'createdAt', '')::timestamptz, now()),
      coalesce(nullif(item->>'updatedAt', '')::timestamptz, now())
    ) on conflict do nothing;
  end loop;

  for item in select value from jsonb_array_elements(coalesce(v_data->'decants', '[]'::jsonb)) loop
    insert into public.decant_recipes (
      user_id, id, name, concentration, full_bottle_cost, bottle_volume_ml,
      decant_size_ml, vial_cost_id, bubble_wrap_cost, sticker_cost, card_cost,
      target_profit, wholesale_two_discount, wholesale_three_discount,
      fee_overrides, created_at, updated_at
    ) values (
      v_user, item->>'id', item->>'name', coalesce(item->>'concentration', 'EDP'),
      coalesce((item->>'fullBottleCost')::numeric, 0), coalesce((item->>'bottleVolumeMl')::numeric, 100),
      coalesce((item->>'decantSizeMl')::numeric, 10), nullif(item->>'vialCostId', ''),
      coalesce((item->>'bubbleWrapCost')::numeric, 0), coalesce((item->>'stickerCost')::numeric, 0),
      coalesce((item->>'cardCost')::numeric, 0), coalesce((item->>'targetProfit')::numeric, 0),
      coalesce((item->>'wholesaleTwoDiscount')::numeric, 0),
      coalesce((item->>'wholesaleThreeDiscount')::numeric, 0),
      coalesce(item->'feeOverrides', '{}'::jsonb),
      coalesce(nullif(item->>'createdAt', '')::timestamptz, now()),
      coalesce(nullif(item->>'updatedAt', '')::timestamptz, now())
    ) on conflict do nothing;
  end loop;

  for item in select value from jsonb_array_elements(coalesce(v_data->'sales', '[]'::jsonb)) loop
    insert into public.sales (
      user_id, id, order_number, sold_at, source, calculation_mode, stock_adjusted,
      stock_delta, product_id, product_name, sku, quantity, unit_selling_price,
      gross_revenue, received_amount, unit_capital_cost, total_capital_cost,
      extra_cost, total_fees, profit, fee_snapshot, notes, created_at, updated_at
    ) values (
      v_user, item->>'id', item->>'orderNumber', (item->>'soldAt')::date,
      item->>'source', item->>'calculationMode', coalesce((item->>'stockAdjusted')::boolean, false),
      case when coalesce((item->>'stockAdjusted')::boolean, false) then coalesce((item->>'quantity')::integer, 0) else 0 end,
      nullif(item->>'productId', ''), item->>'productName', coalesce(item->>'sku', ''),
      coalesce((item->>'quantity')::integer, 1), coalesce((item->>'unitSellingPrice')::numeric, 0),
      coalesce((item->>'grossRevenue')::numeric, 0), coalesce((item->>'receivedAmount')::numeric, 0),
      coalesce((item->>'unitCapitalCost')::numeric, 0), coalesce((item->>'totalCapitalCost')::numeric, 0),
      coalesce((item->>'extraCost')::numeric, 0), coalesce((item->>'totalFees')::numeric, 0),
      coalesce((item->>'profit')::numeric, 0), coalesce(item->'feeSnapshot', '[]'::jsonb),
      coalesce(item->>'notes', ''), coalesce(nullif(item->>'createdAt', '')::timestamptz, now()),
      coalesce(nullif(item->>'updatedAt', '')::timestamptz, now())
    ) on conflict do nothing;
  end loop;
end;
$$;

create or replace function public.get_product_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'total', count(*),
    'total_capital', coalesce(sum(capital_cost), 0),
    'total_target', coalesce(sum(target_profit), 0),
    'total_stock', coalesce(sum(stock), 0),
    'inventory_capital', coalesce(sum(capital_cost * stock), 0)
  )
  from public.products
  where user_id = auth.uid();
$$;

create or replace function public.update_workspace_settings(p_settings jsonb)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.workspace_profiles
  set settings = settings || coalesce(p_settings, '{}'::jsonb)
  where user_id = auth.uid();
$$;

create or replace function public.get_sale_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'total', count(*),
    'gross_revenue', coalesce(sum(gross_revenue), 0),
    'received_amount', coalesce(sum(received_amount), 0),
    'total_fees', coalesce(sum(total_fees), 0),
    'profit', coalesce(sum(profit), 0)
  )
  from public.sales
  where user_id = auth.uid();
$$;

create or replace function public.get_fee_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'total', count(*) filter (where archived_at is null),
    'product_percentage', coalesce(sum(value) filter (
      where archived_at is null and active and default_for_products and kind = 'percentage'
    ), 0),
    'product_fixed', coalesce(sum(value) filter (
      where archived_at is null and active and default_for_products and kind = 'fixed'
    ), 0)
  )
  from public.fee_rules
  where user_id = auth.uid();
$$;

create or replace function public.list_product_brands(p_limit integer default 100)
returns table (brand text)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.brand
  from public.products p
  where p.user_id = auth.uid() and p.brand <> ''
  group by p.brand
  order by p.brand
  limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.find_import_products(
  p_skus text[],
  p_names text[],
  p_limit integer default 100
)
returns setof public.products
language sql
stable
security invoker
set search_path = ''
as $$
  select p.*
  from public.products p
  where p.user_id = auth.uid()
    and (
      (p.sku <> '' and lower(p.sku) in (
        select lower(valueset.value)
        from unnest(coalesce(p_skus, array[]::text[])) as valueset(value)
      ))
      or lower(p.name) in (
        select lower(valueset.value)
        from unnest(coalesce(p_names, array[]::text[])) as valueset(value)
      )
    )
  order by p.updated_at desc, p.id
  limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.get_dashboard_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with product_summary as (
    select
      count(*) as product_count,
      coalesce(sum(capital_cost), 0) as catalog_capital,
      coalesce(sum(target_profit), 0) as catalog_target_profit,
      coalesce(sum(capital_cost * stock), 0) as inventory_capital,
      coalesce(sum(stock), 0) as total_stock,
      count(*) filter (where stock <= low_stock_threshold) as low_stock_count
    from public.products where user_id = auth.uid()
  ), sale_summary as (
    select
      count(*) as sales_count,
      coalesce(sum(received_amount), 0) as sales_revenue,
      coalesce(sum(profit), 0) as realized_profit,
      coalesce(sum(total_fees), 0) as total_fees
    from public.sales where user_id = auth.uid()
  )
  select jsonb_build_object(
    'product_count', ps.product_count,
    'catalog_capital', ps.catalog_capital,
    'catalog_target_profit', ps.catalog_target_profit,
    'inventory_capital', ps.inventory_capital,
    'total_stock', ps.total_stock,
    'low_stock_count', ps.low_stock_count,
    'sales_count', ss.sales_count,
    'sales_revenue', ss.sales_revenue,
    'realized_profit', ss.realized_profit,
    'total_fees', ss.total_fees,
    'brand_chart', coalesce((
      select jsonb_agg(to_jsonb(metric)) from (
        select brand, sum(capital_cost) as modal, sum(target_profit) as target
        from public.products
        where user_id = auth.uid()
        group by brand
        order by sum(capital_cost) desc, brand
        limit 12
      ) metric
    ), '[]'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(to_jsonb(product_row) - 'user_id' - 'identity_key') from (
        select * from public.products
        where user_id = auth.uid()
        order by target_profit desc, id
        limit 5
      ) product_row
    ), '[]'::jsonb),
    'low_stock_products', coalesce((
      select jsonb_agg(to_jsonb(product_row) - 'user_id' - 'identity_key') from (
        select * from public.products
        where user_id = auth.uid() and stock <= low_stock_threshold
        order by stock, id
        limit 5
      ) product_row
    ), '[]'::jsonb)
  )
  from product_summary ps cross join sale_summary ss;
$$;

create or replace function public.import_products_batch(p_products jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  item jsonb;
  inserted_count integer := 0;
  v_identity text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  for item in select value from jsonb_array_elements(coalesce(p_products, '[]'::jsonb)) loop
    v_identity := lower(
      trim(coalesce(item->>'brand', '')) || '|' ||
      trim(coalesce(item->>'size', '')) || '|' ||
      trim(coalesce(item->>'name', ''))
    );
    if not exists (
      select 1 from public.products
      where user_id = v_user and identity_key = v_identity
    ) then
      insert into public.products (
        user_id, id, brand, size, name, sku, capital_cost, target_profit, stock,
        low_stock_threshold, fee_overrides, created_at, updated_at
      ) values (
        v_user, item->>'id', coalesce(item->>'brand', ''), coalesce(item->>'size', ''), item->>'name',
        coalesce(item->>'sku', ''), coalesce((item->>'capitalCost')::numeric, 0),
        coalesce((item->>'targetProfit')::numeric, 0), coalesce((item->>'stock')::integer, 0),
        coalesce((item->>'lowStockThreshold')::integer, 0), coalesce(item->'feeOverrides', '{}'::jsonb),
        coalesce(nullif(item->>'createdAt', '')::timestamptz, now()),
        coalesce(nullif(item->>'updatedAt', '')::timestamptz, now())
      ) on conflict (user_id, id) do nothing;
      if found then inserted_count := inserted_count + 1; end if;
    end if;
  end loop;
  return inserted_count;
end;
$$;

create or replace function public.create_sale(p_sale jsonb, p_adjust_stock boolean default true)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_product_id text := nullif(p_sale->>'productId', '');
  v_stock integer;
  v_delta integer := 0;
  v_quantity integer := greatest(coalesce((p_sale->>'quantity')::integer, 1), 1);
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  if p_adjust_stock and v_product_id is not null then
    select stock into v_stock
    from public.products
    where user_id = v_user and id = v_product_id
    for update;
    if found then
      v_delta := least(v_stock, v_quantity);
      update public.products set stock = stock - v_delta
      where user_id = v_user and id = v_product_id;
    else
      v_product_id := null;
    end if;
  end if;

  insert into public.sales (
    user_id, id, order_number, sold_at, source, calculation_mode, stock_adjusted,
    stock_delta, product_id, product_name, sku, quantity, unit_selling_price,
    gross_revenue, received_amount, unit_capital_cost, total_capital_cost,
    extra_cost, total_fees, profit, fee_snapshot, notes, created_at, updated_at
  ) values (
    v_user, p_sale->>'id', p_sale->>'orderNumber', (p_sale->>'soldAt')::date,
    p_sale->>'source', p_sale->>'calculationMode', p_adjust_stock and v_delta > 0,
    v_delta, v_product_id, p_sale->>'productName', coalesce(p_sale->>'sku', ''), v_quantity,
    coalesce((p_sale->>'unitSellingPrice')::numeric, 0), coalesce((p_sale->>'grossRevenue')::numeric, 0),
    coalesce((p_sale->>'receivedAmount')::numeric, 0), coalesce((p_sale->>'unitCapitalCost')::numeric, 0),
    coalesce((p_sale->>'totalCapitalCost')::numeric, 0), coalesce((p_sale->>'extraCost')::numeric, 0),
    coalesce((p_sale->>'totalFees')::numeric, 0), coalesce((p_sale->>'profit')::numeric, 0),
    coalesce(p_sale->'feeSnapshot', '[]'::jsonb), coalesce(p_sale->>'notes', ''),
    coalesce(nullif(p_sale->>'createdAt', '')::timestamptz, now()),
    coalesce(nullif(p_sale->>'updatedAt', '')::timestamptz, now())
  );
end;
$$;

create or replace function public.delete_sale(p_sale_id text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  record_to_delete public.sales%rowtype;
begin
  select * into record_to_delete
  from public.sales
  where user_id = v_user and id = p_sale_id
  for update;
  if not found then return; end if;

  if record_to_delete.product_id is not null and record_to_delete.stock_delta > 0 then
    update public.products
    set stock = stock + record_to_delete.stock_delta
    where user_id = v_user and id = record_to_delete.product_id;
  end if;
  delete from public.sales where user_id = v_user and id = p_sale_id;
end;
$$;

create or replace function public.import_sales_batch(p_sales jsonb, p_adjust_stock boolean default false)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item jsonb;
  inserted_count integer := 0;
begin
  for item in select value from jsonb_array_elements(coalesce(p_sales, '[]'::jsonb)) loop
    begin
      perform public.create_sale(item, p_adjust_stock);
      inserted_count := inserted_count + 1;
    exception when unique_violation then
      null;
    end;
  end loop;
  return inserted_count;
end;
$$;

create or replace function public.delete_vial_cost(p_vial_id text)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.vial_costs where user_id = auth.uid() and id = p_vial_id;
$$;

create or replace function public.reset_workspace(p_seed jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  delete from public.sales where user_id = v_user;
  delete from public.decant_recipes where user_id = v_user;
  delete from public.vial_costs where user_id = v_user;
  delete from public.products where user_id = v_user;
  delete from public.fee_rules where user_id = v_user;
  delete from public.workspace_profiles where user_id = v_user;
  delete from public.workspace_states where user_id = v_user;
  perform public.bootstrap_workspace(p_seed);
end;
$$;

grant select, insert, update, delete on public.workspace_states to authenticated;
grant select, insert, update, delete on public.workspace_profiles to authenticated;
grant select, insert, update, delete on public.fee_rules to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.vial_costs to authenticated;
grant select, insert, update, delete on public.decant_recipes to authenticated;
grant select, insert, update, delete on public.sales to authenticated;

revoke all on function public.bootstrap_workspace(jsonb) from public;
revoke all on function public.get_product_summary() from public;
revoke all on function public.update_workspace_settings(jsonb) from public;
revoke all on function public.get_sale_summary() from public;
revoke all on function public.get_fee_summary() from public;
revoke all on function public.list_product_brands(integer) from public;
revoke all on function public.find_import_products(text[], text[], integer) from public;
revoke all on function public.get_dashboard_summary() from public;
revoke all on function public.import_products_batch(jsonb) from public;
revoke all on function public.create_sale(jsonb, boolean) from public;
revoke all on function public.delete_sale(text) from public;
revoke all on function public.import_sales_batch(jsonb, boolean) from public;
revoke all on function public.delete_vial_cost(text) from public;
revoke all on function public.reset_workspace(jsonb) from public;

grant execute on function public.bootstrap_workspace(jsonb) to authenticated;
grant execute on function public.get_product_summary() to authenticated;
grant execute on function public.update_workspace_settings(jsonb) to authenticated;
grant execute on function public.get_sale_summary() to authenticated;
grant execute on function public.get_fee_summary() to authenticated;
grant execute on function public.list_product_brands(integer) to authenticated;
grant execute on function public.find_import_products(text[], text[], integer) to authenticated;
grant execute on function public.get_dashboard_summary() to authenticated;
grant execute on function public.import_products_batch(jsonb) to authenticated;
grant execute on function public.create_sale(jsonb, boolean) to authenticated;
grant execute on function public.delete_sale(text) to authenticated;
grant execute on function public.import_sales_batch(jsonb, boolean) to authenticated;
grant execute on function public.delete_vial_cost(text) to authenticated;
grant execute on function public.reset_workspace(jsonb) to authenticated;
