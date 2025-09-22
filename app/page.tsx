// app/login/page.tsx
import { Suspense } from 'react'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <LoginForm />
    </Suspense>
  )
}
