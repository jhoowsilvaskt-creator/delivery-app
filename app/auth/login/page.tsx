"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Bike, Store, Loader2, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get("tipo") || "motoboy"
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log("[v0] Login attempt:", { email, authError, user: data?.user?.id })

    if (authError) {
      console.log("[v0] Auth error details:", authError.message, authError.status)
      setError(`Erro: ${authError.message}`)
      setLoading(false)
      return
    }

    // Busca o perfil para verificar o tipo
    const { data: profile } = await supabase
      .from("profiles")
      .select("tipo")
      .single()

    if (profile?.tipo === "restaurante") {
      router.push("/restaurante")
    } else {
      router.push("/motoboy")
    }
  }

  const isRestaurante = tipo === "restaurante"

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link 
            href="/" 
            className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isRestaurante ? 'bg-primary/10' : 'bg-success/10'}`}>
            {isRestaurante ? (
              <Store className="h-8 w-8 text-primary" />
            ) : (
              <Bike className="h-8 w-8 text-success" />
            )}
          </div>
          <CardTitle>Entrar como {isRestaurante ? "Restaurante" : "Motoboy"}</CardTitle>
          <CardDescription>
            Digite suas credenciais para acessar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              variant={isRestaurante ? "default" : "success"}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Não tem uma conta?{" "}
              <Link 
                href={`/auth/signup?tipo=${tipo}`}
                className="text-primary hover:underline"
              >
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
