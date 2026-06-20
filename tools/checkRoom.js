const { PrismaClient } = require('@prisma/client')

async function main() {
  const id = process.argv[2]
  if (!id) {
    console.error('Usage: node checkRoom.js <roomId>')
    process.exit(2)
  }
  const prisma = new PrismaClient()
  try {
    const room = await prisma.chatRoom.findUnique({ where: { id }, include: { participants: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 5 } } })
    if (!room) {
      console.log('NOT FOUND')
    } else {
      console.log('FOUND')
      console.log(JSON.stringify(room, null, 2))
    }
  } catch (e) {
    console.error('ERROR', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
