import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from './components/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Sistema de Gestión de Restaurante',
  description: 'Aplicación para gestionar inventario, ventas y más en un restaurante',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

