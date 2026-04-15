-- Habilita extensão UUID
create extension if not exists "uuid-ossp";

-- Tabela de perfis (vinculada ao auth do Supabase)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  tipo text check (tipo in ('restaurante', 'motoboy')) not null,
  created_at timestamp with time zone default now()
);

-- Tabela de solicitações de entrega
create table if not exists public.delivery_requests (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.profiles(id) not null,
  status text check (status in ('pendente', 'aceito')) default 'pendente',
  accepted_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- Habilita Row Level Security
alter table public.profiles enable row level security;
alter table public.delivery_requests enable row level security;

-- Policies para profiles
drop policy if exists "Usuários podem ver todos os perfis" on public.profiles;
create policy "Usuários podem ver todos os perfis" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "Usuários podem criar próprio perfil" on public.profiles;
create policy "Usuários podem criar próprio perfil" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Usuários podem atualizar próprio perfil" on public.profiles;
create policy "Usuários podem atualizar próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Policies para delivery_requests
drop policy if exists "Usuários autenticados podem ver pedidos" on public.delivery_requests;
create policy "Usuários autenticados podem ver pedidos" on public.delivery_requests
  for select using (auth.role() = 'authenticated');

drop policy if exists "Restaurantes podem criar pedidos" on public.delivery_requests;
create policy "Restaurantes podem criar pedidos" on public.delivery_requests
  for insert with check (auth.uid() = restaurant_id);

drop policy if exists "Motoboys podem aceitar pedidos" on public.delivery_requests;
create policy "Motoboys podem aceitar pedidos" on public.delivery_requests
  for update using (auth.role() = 'authenticated');

-- Habilita Realtime na tabela delivery_requests
alter publication supabase_realtime add table delivery_requests;
