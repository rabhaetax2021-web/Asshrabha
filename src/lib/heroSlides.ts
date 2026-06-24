import { prisma } from './prisma'
import fs from 'fs'
import path from 'path'
import { getErrorMessage } from '@/lib/errors'

export async function getSlides() {
  try {
    // Always prefer DB result. If DB returns an empty array that's valid (means no slides).
    const slides = await prisma.slider.findMany({ orderBy: { position: 'asc' } })
    return slides || []
  } catch (err: unknown) {
    console.error('[heroSlides] db read error', getErrorMessage(err))
    // If DB is unavailable, fallback to file-based slides for dev / migration
    try {
      const FILE = path.resolve(process.cwd(), 'data', 'hero-slides.json')
      if (!fs.existsSync(FILE)) return []
      const txt = await fs.promises.readFile(FILE, 'utf8')
      return JSON.parse(txt || '[]')
    } catch (e) {
      return []
    }
  }
}

export async function saveSlides(slides: Record<string, unknown>[]) {
  try {
    // Replace existing slides with provided array. Simpler approach: delete all and recreate.
    await prisma.slider.deleteMany()
    if (!slides || slides.length === 0) return true
    const data = slides.map((s, idx: number) => {
      const r = s as Record<string, unknown>
      return {
        id: (r['id'] as string) || undefined,
        image: (r['image'] as string) || null,
        type: (r['type'] as string) || 'custom',
        targetId: (r['targetId'] as string) || null,
        caption: (r['caption'] as string) || null,
        position: typeof r['position'] === 'number' ? (r['position'] as number) : idx,
        visible: typeof r['visible'] === 'boolean' ? (r['visible'] as boolean) : true,
        amount: typeof r['amount'] === 'number' ? (r['amount'] as number) : null,
      }
    })
    // createMany supports providing ids; use it for bulk insert
    await prisma.slider.createMany({ data })
    return true
  } catch (err: unknown) {
    console.error('[heroSlides] db write error', getErrorMessage(err))
    return false
  }
}
