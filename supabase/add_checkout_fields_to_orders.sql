alter table orders add column if not exists currency text default 'SOL';
alter table orders add column if not exists delivery_method text default 'shipping';
alter table orders add column if not exists delivery_info jsonb default '{}'::jsonb;
alter table orders add column if not exists payment_method text default 'solana';
alter table orders add column if not exists buyer_email text;
