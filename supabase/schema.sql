create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  address text unique not null,
  name text,
  school text,
  campus text,
  level text,
  phone text,
  referral_code text,
  referred_by text,
  seller_tier text default 'free',
  points int default 0,
  wallet_balance numeric default 0
);

create table if not exists wallet_auth_nonce (
  address text primary key,
  nonce text not null,
  expires_at timestamptz not null
);

create table if not exists processed_deposits (
  tx_ref text primary key,
  address text not null references profiles(address),
  amount numeric not null,
  created_at timestamptz default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  owner_address text not null references profiles(address),
  name text not null,
  category text not null,
  description text not null,
  lat double precision,
  lon double precision,
  geohash text,
  banner_url text,
  delivery_enabled boolean default true,
  pickup_enabled boolean default true,
  delivery_fee numeric default 0,
  delivery_notes text,
  premium boolean default false
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  category text not null,
  price numeric not null,
  inventory int not null,
  image_url text,
  rating numeric default 0
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  buyer_address text not null references profiles(address),
  store_id uuid not null references stores(id),
  status text not null default 'pending',
  amount numeric not null,
  fee_percent numeric default 0,
  fee_amount numeric default 0,
  vendor_earnings numeric default 0,
  tx_sig text unique,
  paid boolean default false,
  escrow_pin text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists order_items (
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  qty int not null,
  price numeric not null
);

create table if not exists points_log (
  id uuid primary key default gen_random_uuid(),
  address text not null references profiles(address),
  points int not null,
  reason text not null,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  reviewer_address text not null references profiles(address),
  rating int not null,
  content text,
  created_at timestamptz default now()
);

create table if not exists vendor_ratings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  reviewer_address text not null references profiles(address),
  rating int not null,
  created_at timestamptz default now()
);

create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  address text not null references profiles(address),
  product_id uuid not null references products(id),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table stores enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table points_log enable row level security;
alter table wishlists enable row level security;

drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select using (true);

drop policy if exists "profiles_update_self" on profiles;
create policy "profiles_update_self" on profiles for update using (auth.uid() is not null) with check (address = current_setting('request.header.sid'));

drop policy if exists "stores_select" on stores;
create policy "stores_select" on stores for select using (true);

drop policy if exists "stores_modify_owner" on stores;
create policy "stores_modify_owner" on stores for insert with check (owner_address = current_setting('request.header.sid'));

drop policy if exists "stores_update_owner" on stores;
create policy "stores_update_owner" on stores for update using (owner_address = current_setting('request.header.sid')) with check (owner_address = current_setting('request.header.sid'));

drop policy if exists "products_select" on products;
create policy "products_select" on products for select using (true);

drop policy if exists "products_modify_owner" on products;
create policy "products_modify_owner" on products for insert with check (
  exists (select 1 from stores s where s.id = store_id and s.owner_address = current_setting('request.header.sid'))
);

drop policy if exists "products_update_owner" on products;
create policy "products_update_owner" on products for update using (
  exists (select 1 from stores s where s.id = store_id and s.owner_address = current_setting('request.header.sid'))
) with check (
  exists (select 1 from stores s where s.id = store_id and s.owner_address = current_setting('request.header.sid'))
);

drop policy if exists "orders_select_self" on orders;
create policy "orders_select_self" on orders for select using (buyer_address = current_setting('request.header.sid'));

drop policy if exists "orders_insert_self" on orders;
-- Intentionally removed orders_insert_self to prevent clients from forging orders.
-- Order creation MUST be handled by the server (Service Role).

create or replace function enforce_freemium_limits() returns trigger as $$
declare tier text;
declare product_count int;
declare store_count int;
begin
  select seller_tier into tier from profiles where address = current_setting('request.header.sid');
  if tg_table_name = 'stores' then
    select count(*) into store_count from stores where owner_address = current_setting('request.header.sid');
    if tier = 'free' and store_count >= 1 then raise exception 'free tier store limit'; end if;
  end if;
  if tg_table_name = 'products' then
    select count(*) into product_count from products p join stores s on p.store_id = s.id where s.owner_address = current_setting('request.header.sid');
    if tier = 'free' and product_count >= 5 then raise exception 'free tier product limit'; end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists freemium_stores on stores;
create trigger freemium_stores before insert on stores for each row execute procedure enforce_freemium_limits();

drop trigger if exists freemium_products on products;
create trigger freemium_products before insert on products for each row execute procedure enforce_freemium_limits();
