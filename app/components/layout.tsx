import Link from 'next/link'
import { Button } from "@/app/components/ui/button"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sistema de Gestión de Restaurante</h1>
          <Link href="/">
            <Button variant="secondary">Volver al Menú Principal</Button>
          </Link>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-muted p-4 text-center">
        <p>&copy; 2023 Tu Restaurante. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

