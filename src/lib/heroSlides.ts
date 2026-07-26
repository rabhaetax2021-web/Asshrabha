import { prisma } from './prisma'
import fs from 'fs'
import path from 'path'
import { getErrorMessage } from '@/lib/errors'

type SlideType = 'hero' | 'ads' | string

const buildSlideWhere = (type?: SlideType) => {
  if (!type || type === 'hero') {
    return { NOT: { type: { startsWith: 'ads' } } }
  }
  return { type: { startsWith: 'ads' } }
}

export async function getSlides(type?: SlideType) {
  try {
    const where = buildSlideWhere(type)
    const slides = await prisma.slider.findMany({ where, orderBy: { position: 'asc' } })
    return slides || []
  } catch (err: unknown) {
    console.error('[heroSlides] db read error', getErrorMessage(err))
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

export async function saveSlides(slides: Record<string, unknown>[], type?: SlideType) {
  try {
    const where = type === 'ads' ? { type: { startsWith: 'ads' } } : { NOT: { type: { startsWith: 'ads' } } }
    await prisma.slider.deleteMany({ where })
    if (!slides || slides.length === 0) return true
    const seenIds = new Set<string>()
    const data = slides.map((s, idx: number) => {
      const r = s as Record<string, unknown>
      const incomingId = (r['id'] as string) || undefined
      const id = incomingId && !seenIds.has(incomingId) ? incomingId : undefined
      if (incomingId && !id) {
        console.warn('[heroSlides] duplicate slide id detected, regenerating id', incomingId)
      }
      if (id) seenIds.add(id)
      return {
        id,
        image: (r['image'] as string) || null,
        type: (r['type'] as string) || 'custom',
        targetId: (r['targetId'] as string) || null,
        caption: (r['caption'] as string) || null,
        position: typeof r['position'] === 'number' ? (r['position'] as number) : idx,
        visible: typeof r['visible'] === 'boolean' ? (r['visible'] as boolean) : true,
        amount: typeof r['amount'] === 'number' ? (r['amount'] as number) : null,
      }
    })
    await prisma.slider.createMany({ data })
    return true
  } catch (err: unknown) {
    console.error('[heroSlides] db write error', getErrorMessage(err))
    return false
  }
}
