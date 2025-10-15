// app/login/page.tsx (or components/LoginForm.tsx)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


export default function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setErrors] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrors('')

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/dashboard')
        router.refresh() // Refresh to update session
        
      } else {
        setErrors(data.message)
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors('An unexpected error occurred');
    } finally {
      setIsLoading(false)
    }
  }

  return (

    <Card className="w-full max-w-md mx-auto bg-gray-100 shadow-none border">
      <CardHeader className="p-2">
        <CardTitle className="text-2xl font-bold text-green-600">Sign In</CardTitle>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full  bg-green-600 rounded-full hover:bg-green-800" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </CardContent>
    </Card>


    // <div className="w-full max-w-md mx-auto p-6">
    //   <div className="mb-6">
    //     <h1 className="text-2xl font-bold">Sign In</h1>
    //   </div>

    // </div>
  )
}