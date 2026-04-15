import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Erro de autenticação</CardTitle>
          <CardDescription>
            Ocorreu um problema durante a autenticação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O link pode ter expirado ou já foi utilizado. Por favor, tente novamente.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
