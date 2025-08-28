-- Create products table for food items
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null,
  description text,
  price decimal(10, 2) not null check (price >= 0),
  original_price decimal(10, 2) check (original_price >= price),
  quantity integer not null check (quantity >= 0),
  unit text not null, -- 'kg', 'pieces', 'liters', etc.
  expiry_date date,
  pickup_location text not null,
  pickup_instructions text,
  images text[] default '{}',
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.products enable row level security;

-- Allow public read access to available products
create policy "products_select_available"
  on public.products for select
  using (is_available = true);

-- Allow sellers to manage their own products
create policy "products_select_own"
  on public.products for select
  using (auth.uid() = seller_id);

create policy "products_insert_own"
  on public.products for insert
  with check (auth.uid() = seller_id);

create policy "products_update_own"
  on public.products for update
  using (auth.uid() = seller_id);

create policy "products_delete_own"
  on public.products for delete
  using (auth.uid() = seller_id);

-- Create indexes for better performance
create index if not exists products_seller_id_idx on public.products(seller_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_is_available_idx on public.products(is_available);
create index if not exists products_expiry_date_idx on public.products(expiry_date);
