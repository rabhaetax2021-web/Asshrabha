const { PrismaClient } = require('@prisma/client')
;(async () => {
  const prisma = new PrismaClient()
  try {
    console.log('Creating test admin and provider...')
    // create admin
    const admin = await prisma.user.create({ data: { mobile: '999000', passwordHash: 'x', nameEN: 'Admin', nameAR: 'Admin', role: 'ROOT_ADMIN', status: 'APPROVED', locale: 'en' } })
    // create provider user
    const providerUser = await prisma.user.create({ data: { mobile: '888000', passwordHash: 'x', nameEN: 'Prov', nameAR: 'Prov', role: 'PROVIDER', status: 'PENDING', locale: 'en' } })
    const profile = await prisma.providerProfile.create({ data: { userId: providerUser.id, shopNameEN: 'Test Shop', shopNameAR: 'متجر اختبار', isVisible: false } })

    console.log('Before approval, provider isVisible =', profile.isVisible)

    // Simulate admin approval (same effects as approveProvider)
    await prisma.providerProfile.update({ where: { id: profile.id }, data: { isVisible: true } })
    await prisma.user.update({ where: { id: providerUser.id }, data: { status: 'APPROVED' } })
    await prisma.notification.create({ data: { userId: providerUser.id, type: 'ACCOUNT_APPROVED', titleEN: 'Approved', titleAR: 'تمت الموافقة', bodyEN: 'Your account approved' } })
    await prisma.auditLog.create({ data: { userId: admin.id, action: 'APPROVE_PROVIDER', entity: 'ProviderProfile', entityId: profile.id } })

    const updated = await prisma.providerProfile.findUnique({ where: { id: profile.id } })
    console.log('After approval, provider isVisible =', updated.isVisible)

    // cleanup
    await prisma.auditLog.deleteMany({ where: { entityId: profile.id } })
    await prisma.notification.deleteMany({ where: { userId: providerUser.id } })
    await prisma.providerProfile.deleteMany({ where: { id: profile.id } })
    await prisma.user.deleteMany({ where: { id: providerUser.id } })
    await prisma.user.deleteMany({ where: { id: admin.id } })

    console.log('Simulation complete')
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
})()
