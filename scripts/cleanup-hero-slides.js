const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function main() {
  const prisma = new PrismaClient()
  try {
    const slides = await prisma.slider.findMany()
    const publicRoot = path.resolve(process.cwd(), 'public')
    const uploadsDir = path.join(publicRoot, 'uploads')
    const missing = []
    for (const s of slides) {
      if (!s.image) continue
      // normalize image path
      let img = s.image
      if (!img.startsWith('/')) {
        const idx = img.indexOf('/uploads/')
        if (idx >= 0) img = img.slice(idx)
      }
      const filePath = path.join(publicRoot, img.replace(/\//g, path.sep))
      if (!fs.existsSync(filePath)) missing.push({ id: s.id, image: s.image })
    }

    if (missing.length === 0) {
      console.log('No missing hero slide images found')
      return
    }

    console.log('Slides with missing images:')
    missing.forEach(m => console.log(m))

    // ask user to confirm deletion via env var
    if (process.env.DELETE_MISSING === '1') {
      for (const m of missing) {
        console.log('Deleting slide', m.id)
        await prisma.slider.delete({ where: { id: m.id } })
      }
      console.log('Deleted missing slides')
    } else {
      console.log('To delete them, re-run with DELETE_MISSING=1 node scripts/cleanup-hero-slides.js')
    }
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
