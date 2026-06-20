import { prisma } from '@/lib/prisma'

export async function createChatRoom(subject?: string) {
  return await prisma.chatRoom.create({ data: { subject } })
}

export async function sendMessage(chatRoomId: string, senderId: string, content: string) {
  return await prisma.chatMessage.create({ data: { chatRoomId, senderId, content } })
}
