const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const otp = '**{{2}}** is your verification code. For your security, do not share this code.\nExpires in {{3}} minutes.\nCopy code'
  const marketing = 'Hello {{1}}! Enjoy an exclusive offer: {{2}}. Use code {{3}} to get {{4}} off. Shop now: {{5}}'

  await prisma.systemSetting.upsert({
    where: { key: 'TEMPLATE_OTP' },
    update: { value: otp },
    create: { key: 'TEMPLATE_OTP', value: otp, description: 'WhatsApp OTP template' },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'TEMPLATE_Marketing_Msg' },
    update: { value: marketing },
    create: { key: 'TEMPLATE_Marketing_Msg', value: marketing, description: 'WhatsApp Marketing template' },
  })

  console.log('Templates upserted')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
