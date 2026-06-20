import { prisma } from './prisma'
import fs from 'fs'
import path from 'path'

export async function getSlides() {
  try {
    // Always prefer DB result. If DB returns an empty array that's valid (means no slides).
    const slides = await prisma.slider.findMany({ orderBy: { position: 'asc' } })
    return slides || []
  } catch (err) {
    console.error('[heroSlides] db read error', err)
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

export async function saveSlides(slides: any[]) {
  try {
    // Replace existing slides with provided array. Simpler approach: delete all and recreate.
    await prisma.slider.deleteMany()
    if (!slides || slides.length === 0) return true
    const data = slides.map((s: any, idx: number) => ({
      id: s.id || undefined,
      image: s.image || null,
      type: s.type || 'custom',
      targetId: s.targetId || null,
      caption: s.caption || null,
      position: typeof s.position === 'number' ? s.position : idx,
      visible: typeof s.visible === 'boolean' ? s.visible : true,
      amount: typeof s.amount === 'number' ? s.amount : null,
    }))
    // createMany supports providing ids; use it for bulk insert
    await prisma.slider.createMany({ data })
    return true
  } catch (err) {
    console.error('[heroSlides] db write error', err)
    return false
  }
}
