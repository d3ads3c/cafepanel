import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const FILE_PATH = path.join(DATA_DIR, 'love-modal.json')

export async function GET() {
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf8')
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ acknowledged: false })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const acknowledged = Boolean(body?.acknowledged)
    const result = body?.result === undefined ? (acknowledged ? true : false) : body.result
    const data = { acknowledged, result }
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), 'utf8')
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
