import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bike, Store } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Bike className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2 text-balance">
          Despacho Motoboys
        </h1>
        <p className="text-muted-foreground text-lg max-w-md text-pretty">
          Sistema de entregas rápidas conectando restaurantes e motoboys
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-2xl w-full">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Restaurante</CardTitle>
            <CardDescription>
              Solicite motoboys para suas entregas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/auth/login?tipo=restaurante">Entrar</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/signup?tipo=restaurante">Criar conta</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Bike className="h-8 w-8 text-success" />
            </div>
            <CardTitle>Motoboy</CardTitle>
            <CardDescription>
              Aceite corridas e faça entregas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="success" className="w-full">
              <Link href="/auth/login?tipo=motoboy">Entrar</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/signup?tipo=motoboy">Criar conta</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Sistema MVP - Despacho de Entregas
      </p>
    </main>
  )
}
