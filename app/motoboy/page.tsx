"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bike, LogOut, Clock, CheckCircle, Loader2, RefreshCw, MapPin } from "lucide-react"

interface DeliveryRequest {
  id: string
  status: string
  created_at: string
  restaurant_id: string
  accepted_by: string | null
  restaurant_nome?: string
}

interface Profile {
  id: string
  nome: string
  tipo: string
}

export default function MotoboyPanel() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pendingDeliveries, setPendingDeliveries] = useState<DeliveryRequest[]>([])
  const [myDeliveries, setMyDeliveries] = useState<DeliveryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchDeliveries = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    // Busca solicitações pendentes
    const { data: pending } = await supabase
      .from("delivery_requests")
      .select(`
        id,
        status,
        created_at,
        restaurant_id,
        accepted_by,
        restaurant:profiles!delivery_requests_restaurant_id_fkey(nome)
      `)
      .eq("status", "pendente")
      .order("created_at", { ascending: false })

    if (pending) {
      const formattedPending = pending.map((d: { id: string; status: string; created_at: string; restaurant_id: string; accepted_by: string | null; restaurant: { nome: string } | null }) => ({
        ...d,
        restaurant_nome: d.restaurant?.nome
      }))
      setPendingDeliveries(formattedPending)
    }

    // Busca minhas entregas aceitas
    const { data: mine } = await supabase
      .from("delivery_requests")
      .select(`
        id,
        status,
        created_at,
        restaurant_id,
        accepted_by,
        restaurant:profiles!delivery_requests_restaurant_id_fkey(nome)
      `)
      .eq("accepted_by", user.user.id)
      .order("created_at", { ascending: false })

    if (mine) {
      const formattedMine = mine.map((d: { id: string; status: string; created_at: string; restaurant_id: string; accepted_by: string | null; restaurant: { nome: string } | null }) => ({
        ...d,
        restaurant_nome: d.restaurant?.nome
      }))
      setMyDeliveries(formattedMine)
    }
  }, [supabase])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        router.push("/auth/login?tipo=motoboy")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.user.id)
        .single()

      if (profileData?.tipo !== "motoboy") {
        router.push("/restaurante")
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
      .channel("motoboy_delivery_changes")
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

  const handleAcceptDelivery = async (deliveryId: string) => {
    setAcceptingId(deliveryId)
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    await supabase
      .from("delivery_requests")
      .update({
        status: "aceito",
        accepted_by: user.user.id,
      })
      .eq("id", deliveryId)
      .eq("status", "pendente") // Garantir que ainda está pendente

    await fetchDeliveries()
    setAcceptingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-success" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <Bike className="h-5 w-5 text-success" />
            </div>
            <div>
              <h1 className="font-semibold">{profile?.nome}</h1>
              <p className="text-xs text-muted-foreground">Painel do Motoboy</p>
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
              <CardDescription>Disponíveis</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="h-6 w-6 text-warning" />
                {pendingDeliveries.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Minhas Entregas</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-success" />
                {myDeliveries.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Entregas Disponíveis</CardTitle>
              <CardDescription>Aceite uma entrega para começar</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchDeliveries}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {pendingDeliveries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma entrega disponível</p>
                <p className="text-sm">Aguarde novas solicitações de restaurantes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{delivery.restaurant_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(delivery.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAcceptDelivery(delivery.id)}
                      disabled={acceptingId === delivery.id}
                    >
                      {acceptingId === delivery.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Aceitar"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {myDeliveries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Minhas Entregas</CardTitle>
              <CardDescription>Entregas que você aceitou</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{delivery.restaurant_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(delivery.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="success">Aceita</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
