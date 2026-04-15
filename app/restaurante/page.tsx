"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Store, LogOut, Plus, Clock, CheckCircle, Loader2, RefreshCw } from "lucide-react"

interface DeliveryRequest {
  id: string
  status: string
  created_at: string
  accepted_by: string | null
  motoboy_nome?: string
}

interface Profile {
  id: string
  nome: string
  tipo: string
}

export default function RestaurantePanel() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  const fetchDeliveries = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const { data } = await supabase
      .from("delivery_requests")
      .select(`
        id,
        status,
        created_at,
        accepted_by,
        motoboy:profiles!delivery_requests_accepted_by_fkey(nome)
      `)
      .eq("restaurant_id", user.user.id)
      .order("created_at", { ascending: false })

    if (data) {
      const formattedData = data.map((d: { id: string; status: string; created_at: string; accepted_by: string | null; motoboy: { nome: string } | null }) => ({
        ...d,
        motoboy_nome: d.motoboy?.nome
      }))
      setDeliveries(formattedData)
    }
  }, [supabase])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        router.push("/auth/login?tipo=restaurante")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.user.id)
        .single()

      if (profileData?.tipo !== "restaurante") {
        router.push("/motoboy")
        return
      }

      setProfile(profileData)
      await fetchDeliveries()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase, fetchDeliveries])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("delivery_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_requests",
        },
        () => {
          fetchDeliveries()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchDeliveries])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleCreateDelivery = async () => {
    setCreating(true)
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    await supabase.from("delivery_requests").insert({
      restaurant_id: user.user.id,
      status: "pendente",
    })

    await fetchDeliveries()
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pendingCount = deliveries.filter(d => d.status === "pendente").length
  const acceptedCount = deliveries.filter(d => d.status === "aceito").length

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{profile?.nome}</h1>
              <p className="text-xs text-muted-foreground">Painel do Restaurante</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Aguardando</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="h-6 w-6 text-warning" />
                {pendingCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Aceitas</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-success" />
                {acceptedCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Solicitações de Entrega</CardTitle>
              <CardDescription>Gerencie suas solicitações de motoboy</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchDeliveries}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={handleCreateDelivery} disabled={creating}>
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Nova Solicitação
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação ainda</p>
                <p className="text-sm">Clique em &quot;Nova Solicitação&quot; para chamar um motoboy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Solicitação #{delivery.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(delivery.created_at).toLocaleString("pt-BR")}
                      </p>
                      {delivery.motoboy_nome && (
                        <p className="text-xs text-success">
                          Aceito por: {delivery.motoboy_nome}
                        </p>
                      )}
                    </div>
                    <Badge variant={delivery.status === "pendente" ? "warning" : "success"}>
                      {delivery.status === "pendente" ? "Aguardando" : "Aceita"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
