import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'

export async function GET() {
  const auth = await getAuth()
  return NextResponse.json({ success: true, data: auth })
}


