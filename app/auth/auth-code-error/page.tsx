"use client"

import { AlertCircle, Home, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Error de Autenticación</CardTitle>
          <CardDescription>Hubo un problema al iniciar sesión. Esto puede deberse a:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• El proceso de autenticación fue cancelado</li>
            <li>• Problemas de configuración del proveedor</li>
            <li>• Error temporal del servidor</li>
          </ul>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Link>
            </Button>

            <Button variant="outline" className="w-full bg-transparent" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar de Nuevo
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              Si el problema persiste, intenta usar el modo de prueba o contacta al soporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
