'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { useAuth } from '../components/auth-provider'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(username, password)
    if (success) {
      router.push('/')
    } else {
      alert('Credenciales inválidas')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full">Iniciar Sesión</Button>
      </form>
    </div>
  )
}

