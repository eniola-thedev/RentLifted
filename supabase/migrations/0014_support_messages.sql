-- Messages from the Contact and Complaints pages. Anyone can send one; only admins can read them.
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'complaint')),
  topic text,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 30),
  reference text check (char_length(reference) <= 120),   -- complaints: property, payment or application it's about
  message text not null check (char_length(message) between 10 and 4000),
  user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);
alter table public.support_messages enable row level security;
create policy "anyone sends messages" on public.support_messages for insert to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = auth.uid()));
create policy "admins read messages" on public.support_messages for select using (public.is_admin());
create policy "admins update messages" on public.support_messages for update using (public.is_admin()) with check (public.is_admin());
create index on public.support_messages (status, created_at desc);
