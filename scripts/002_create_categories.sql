-- Create categories table for food items
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.categories enable row level security;

-- Allow public read access to categories
create policy "categories_select_all"
  on public.categories for select
  using (true);

-- Only allow authenticated users to manage categories (admin functionality)
create policy "categories_insert_authenticated"
  on public.categories for insert
  with check (auth.role() = 'authenticated');

create policy "categories_update_authenticated"
  on public.categories for update
  using (auth.role() = 'authenticated');

create policy "categories_delete_authenticated"
  on public.categories for delete
  using (auth.role() = 'authenticated');

-- Insert default categories
insert into public.categories (name, description, icon) values
  ('Fruits', 'Fresh fruits and berries', '🍎'),
  ('Vegetables', 'Fresh vegetables and herbs', '🥕'),
  ('Dairy', 'Milk, cheese, yogurt and dairy products', '🥛'),
  ('Bakery', 'Bread, pastries and baked goods', '🍞'),
  ('Meat', 'Fresh meat and poultry', '🥩'),
  ('Seafood', 'Fresh fish and seafood', '🐟'),
  ('Prepared Foods', 'Ready-to-eat meals and dishes', '🍽️'),
  ('Pantry', 'Dry goods, canned items, and pantry staples', '🥫')
on conflict (name) do nothing;
