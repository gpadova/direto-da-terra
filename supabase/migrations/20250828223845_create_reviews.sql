-- Create reviews table for buyer feedback
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(order_id, reviewer_id)
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Allow public read access to reviews
create policy "reviews_select_all"
  on public.reviews for select
  using (true);

-- Allow reviewers to create and update their own reviews
create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "reviews_update_own"
  on public.reviews for update
  using (auth.uid() = reviewer_id);

-- Create indexes for better performance
create index if not exists reviews_reviewed_id_idx on public.reviews(reviewed_id);
create index if not exists reviews_order_id_idx on public.reviews(order_id);
create index if not exists reviews_rating_idx on public.reviews(rating);
