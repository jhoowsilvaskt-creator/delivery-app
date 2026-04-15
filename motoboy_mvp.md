# 🛵 MVP Despacho de Motoboys

> Stack: Next.js 14 (App Router) + Supabase + Vercel

---

## 1. SQL — Crie as tabelas no Supabase

Acesse **SQL Editor** no painel do Supabase e rode:

```sql
-- Habilita extensão UUID
create extension if not exists "uuid-ossp";

-- Tabela de perfis (vinculada ao auth do Supabase)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  tipo text check (tipo in ('restaurante', 'motoboy')) not null
);

-- Tabela de solicitações de entrega
create table delivery_requests (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references profiles(id) not null,
  status text check (status in ('pendente', 'aceito')) default 'pendente',
  accepted_by uuid references profiles(id),
  created_at timestamp with time zone default now()
);

-- Habilita Row Level Security
alter table profiles enable row level security;
alter table delivery_requests enable row level security;

-- Policies: qualquer usuário autenticado pode ler/escrever
create policy "Usuários autenticados" on profiles
  for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados" on delivery_requests
  for all using (auth.role() = 'authenticated');

-- Habilita Realtime na tabela delivery_requests
alter publication supabase_realtime add table delivery_requests;
```

---

## 2. Estrutura do Projeto

```
/motoboy-mvp
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  ← Login
│   ├── register/page.tsx         ← Cadastro
│   ├── restaurante/page.tsx      ← Painel Restaurante
│   └── motoboy/page.tsx          ← Painel Motoboy
├── components/
│   └── LogoutButton.tsx
├── lib/
│   └── supabase.ts               ← Cliente Supabase
├── .env.local
└── package.json
```

---

## 3. Instalação

```bash
npx create-next-app@latest motoboy-mvp --typescript --app --tailwind
cd motoboy-mvp
npm install @supabase/supabase-js @supabase/ssr
```

---

## 4. Variáveis de Ambiente — `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

> Pegue no painel Supabase → **Project Settings → API**

---

## 5. Código

### `lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)
```

---

### `app/layout.tsx`
```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Despacho Motoboy' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  )
}
```

---

### `app/page.tsx` — Login
```typescript
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const router = useRouter()

  async function login() {
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro('Email ou senha inválidos'); return }

    // Busca o tipo do perfil para redirecionar
    const { data: { user } } = await supabase.auth.getUser()
    const { data: perfil } = await supabase
      .from('profiles')
      .select('tipo')
      .eq('id', user!.id)
      .single()

    router.push(perfil?.tipo === 'restaurante' ? '/restaurante' : '/motoboy')
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">🛵 Despacho</h1>
        <input className="w-full border p-3 rounded mb-3" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border p-3 rounded mb-3" type="password" placeholder="Senha"
          value={senha} onChange={e => setSenha(e.target.value)} />
        {erro && <p className="text-red-500 text-sm mb-2">{erro}</p>}
        <button onClick={login}
          className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">
          Entrar
        </button>
        <p className="text-center mt-4 text-sm">
          Não tem conta?{' '}
          <Link href="/register" className="text-blue-600 underline">Cadastrar</Link>
        </p>
      </div>
    </div>
  )
}
```

---

### `app/register/page.tsx` — Cadastro
```typescript
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [tipo, setTipo] = useState<'restaurante' | 'motoboy'>('restaurante')
  const [erro, setErro] = useState('')
  const router = useRouter()

  async function cadastrar() {
    setErro('')
    // Cria usuário no auth
    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error) { setErro(error.message); return }

    // Cria perfil na tabela profiles
    await supabase.from('profiles').insert({
      id: data.user!.id,
      nome,
      tipo
    })

    router.push(tipo === 'restaurante' ? '/restaurante' : '/motoboy')
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Criar Conta</h1>
        <input className="w-full border p-3 rounded mb-3" placeholder="Nome"
          value={nome} onChange={e => setNome(e.target.value)} />
        <input className="w-full border p-3 rounded mb-3" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border p-3 rounded mb-3" type="password" placeholder="Senha"
          value={senha} onChange={e => setSenha(e.target.value)} />
        <select className="w-full border p-3 rounded mb-4"
          value={tipo} onChange={e => setTipo(e.target.value as any)}>
          <option value="restaurante">Restaurante</option>
          <option value="motoboy">Motoboy</option>
        </select>
        {erro && <p className="text-red-500 text-sm mb-2">{erro}</p>}
        <button onClick={cadastrar}
          className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">
          Cadastrar
        </button>
      </div>
    </div>
  )
}
```

---

### `components/LogoutButton.tsx`
```typescript
'use client'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  async function sair() {
    await supabase.auth.signOut()
    router.push('/')
  }
  return (
    <button onClick={sair} className="text-sm text-gray-500 underline">
      Sair
    </button>
  )
}
```

---

### `app/restaurante/page.tsx` — Painel do Restaurante
```typescript
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LogoutButton from '@/components/LogoutButton'

type Pedido = { id: string; status: string; created_at: string }

export default function RestaurantePage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    // Busca usuário logado
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (!userId) return

    // Carrega pedidos existentes
    async function carregarPedidos() {
      const { data } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('restaurant_id', userId)
        .order('created_at', { ascending: false })
      setPedidos(data ?? [])
    }
    carregarPedidos()

    // Escuta atualizações em tempo real
    const canal = supabase
      .channel('pedidos-restaurante')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'delivery_requests',
        filter: `restaurant_id=eq.${userId}`
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setPedidos(prev => [payload.new as Pedido, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setPedidos(prev =>
            prev.map(p => p.id === payload.new.id ? payload.new as Pedido : p)
          )
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [userId])

  async function pedirEntregador() {
    if (!userId) return
    setCarregando(true)
    await supabase.from('delivery_requests').insert({
      restaurant_id: userId,
      status: 'pendente'
    })
    setCarregando(false)
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🍽️ Painel do Restaurante</h1>
        <LogoutButton />
      </div>

      <button onClick={pedirEntregador} disabled={carregando}
        className="w-full bg-orange-500 text-white text-xl p-5 rounded-xl font-bold
                   hover:bg-orange-600 disabled:opacity-50 mb-8">
        {carregando ? 'Solicitando...' : '🛵 Pedir Entregador'}
      </button>

      <h2 className="text-lg font-semibold mb-3">Pedidos</h2>
      {pedidos.length === 0 && <p className="text-gray-400">Nenhum pedido ainda.</p>}
      {pedidos.map(p => (
        <div key={p.id} className="bg-white rounded-xl p-4 mb-3 shadow flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">
              {new Date(p.created_at).toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <span className={`font-bold text-lg px-3 py-1 rounded-full ${
            p.status === 'aceito'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {p.status === 'aceito' ? '✅ Aceito' : '⏳ Procurando...'}
          </span>
        </div>
      ))}
    </div>
  )
}
```

---

### `app/motoboy/page.tsx` — Painel do Motoboy
```typescript
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LogoutButton from '@/components/LogoutButton'

type Pedido = { id: string; status: string; created_at: string; restaurant_id: string }

export default function MotoboyPage() {
  const [online, setOnline] = useState(false)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [aceitando, setAceitando] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (!online) { setPedidos([]); return }

    // Carrega pedidos pendentes
    async function carregarPendentes() {
      const { data } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
      setPedidos(data ?? [])
    }
    carregarPendentes()

    // Escuta novos pedidos e atualizações em tempo real
    const canal = supabase
      .channel('pedidos-motoboy')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_requests'
      }, payload => {
        if (payload.new.status === 'pendente') {
          setPedidos(prev => [payload.new as Pedido, ...prev])
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_requests'
      }, payload => {
        // Remove da lista se foi aceito por outro
        if (payload.new.status === 'aceito') {
          setPedidos(prev => prev.filter(p => p.id !== payload.new.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [online])

  async function aceitar(pedidoId: string) {
    if (!userId) return
    setAceitando(pedidoId)
    const { error } = await supabase
      .from('delivery_requests')
      .update({ status: 'aceito', accepted_by: userId })
      .eq('id', pedidoId)
      .eq('status', 'pendente') // Garante que não aceita pedido já aceito

    if (error) alert('Pedido já foi aceito por outro motoboy.')
    setAceitando(null)
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🛵 Painel do Motoboy</h1>
        <LogoutButton />
      </div>

      {/* Botão Online/Offline */}
      <button onClick={() => setOnline(v => !v)}
        className={`w-full text-white text-xl p-5 rounded-xl font-bold mb-8 ${
          online ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'
        }`}>
        {online ? '🟢 Online — Recebendo pedidos' : '⚫ Offline — Clique para ficar online'}
      </button>

      {online && (
        <>
          <h2 className="text-lg font-semibold mb-3">
            Pedidos Pendentes {pedidos.length > 0 && `(${pedidos.length})`}
          </h2>
          {pedidos.length === 0 && (
            <p className="text-gray-400 text-center mt-8">Aguardando pedidos...</p>
          )}
          {pedidos.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-4 mb-3 shadow">
              <p className="text-sm text-gray-400 mb-3">
                Pedido às {new Date(p.created_at).toLocaleTimeString('pt-BR')}
              </p>
              <button onClick={() => aceitar(p.id)} disabled={aceitando === p.id}
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold
                           hover:bg-blue-700 disabled:opacity-50">
                {aceitando === p.id ? 'Aceitando...' : '✅ Aceitar Entrega'}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
```

---

## 6. Deploy no Vercel (Passo a Passo)

```bash
# 1. Suba para um repositório GitHub
git init && git add . && git commit -m "MVP motoboy"
git remote add origin https://github.com/SEU_USER/motoboy-mvp.git
git push -u origin main

# 2. Acesse vercel.com → "New Project" → importe o repo

# 3. Em "Environment Variables", adicione:
#    NEXT_PUBLIC_SUPABASE_URL = sua URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY = sua chave

# 4. Clique em Deploy. Pronto! ✅
```

---

## 7. Testando o Fluxo Completo

| Passo | Ação |
|-------|------|
| 1 | Crie 2 contas: uma como **restaurante**, outra como **motoboy** |
| 2 | Abra 2 abas do browser (ou use aba anônima) |
| 3 | Faça login do restaurante em uma aba, motoboy na outra |
| 4 | No painel do motoboy, clique em **"Ficar Online"** |
| 5 | No painel do restaurante, clique em **"Pedir Entregador"** |
| 6 | O pedido aparece **instantaneamente** no painel do motoboy |
| 7 | Motoboy clica **"Aceitar Entrega"** |
| 8 | O status no painel do restaurante muda para **✅ Aceito** em tempo real |

---

## 8. Melhor lugar para rodar

| Opção | Custo | Recomendação |
|-------|-------|--------------|
| **Vercel** (frontend) | Grátis | ✅ Melhor opção |
| **Supabase** (banco + auth + realtime) | Grátis até 500MB | ✅ Melhor opção |
| **Total** | **R$ 0,00** | 🎉 |

O par **Vercel + Supabase** é o ideal para esse MVP — gratuito, rápido de configurar e escala bem quando precisar.
