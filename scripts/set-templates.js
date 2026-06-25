const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const otp = 'OTP Code: {{1}}. This is your OTP for {{2}}. The OTP is valid for {{3}} minutes. Call {{4}} if you did not perform this request. For your security, do not share this code.\nExpires in {{3}} minutes.'
  const marketing = 'Hello {{1}}! Enjoy an exclusive offer: {{2}}. Use code {{3}} to get {{4}} off. Shop now: {{5}}'

  await prisma.systemSetting.upsert({
    where: { key: 'otp_en' },
    update: { value: otp },
    create: { key: 'otp_en', value: otp, description: 'WhatsApp OTP template EN' },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'TEMPLATE_Marketing_Msg' },
    update: { value: marketing },
    create: { key: 'TEMPLATE_Marketing_Msg', value: marketing, description: 'WhatsApp Marketing template' },
  })

  console.log('Templates upserted')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
