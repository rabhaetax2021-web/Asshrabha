// ─── Asshrabha Marketplace – Database Seed Script ──────────────────────────────
// Run with: npx prisma db seed
// Idempotent — safe to run multiple times.

import { PrismaClient, AdminPermissionType, AccountStatus, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Asshrabha database seed...\n')

  // ─── 1. Root Admin User ────────────────────────────────────────────────────
  console.log('👤 Creating root admin user...')
  const passwordHash = await bcrypt.hash('2463', 12)

  const admin = await prisma.user.upsert({
    where: { mobile: '01094056919' },
    update: {
      passwordHash,
      nameAR: 'مدير النظام',
      nameEN: 'System Admin',
      role: UserRole.ROOT_ADMIN,
      status: AccountStatus.APPROVED,
      forcePasswordReset: true,
      locale: 'ar',
    },
    create: {
      mobile: '01094056919',
      passwordHash,
      nameAR: 'مدير النظام',
      nameEN: 'System Admin',
      role: UserRole.ROOT_ADMIN,
      status: AccountStatus.APPROVED,
      forcePasswordReset: true,
      locale: 'ar',
    },
  })
  console.log(`   ✅ Admin user created/updated: ${admin.id}`)

  // ─── 2. Admin Wallet ───────────────────────────────────────────────────────
  console.log('💰 Creating admin wallet...')
  const wallet = await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      pendingBalance: 0,
      availableBalance: 0,
      totalPaid: 0,
      isFrozen: false,
    },
  })
  console.log(`   ✅ Admin wallet created/updated: ${wallet.id}`)

  // ─── 3. Admin Permissions (all of them) ────────────────────────────────────
  console.log('🔑 Creating admin permissions...')
  const allPermissions = Object.values(AdminPermissionType)

  for (const permission of allPermissions) {
    await prisma.adminPermission.upsert({
      where: {
        userId_permission: {
          userId: admin.id,
          permission,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        permission,
      },
    })
  }
  console.log(`   ✅ ${allPermissions.length} permissions assigned to admin`)

  // ─── 4. Categories ─────────────────────────────────────────────────────────
  console.log('📂 Creating categories...')
  const categories = [
    { nameAR: 'إلكترونيات', nameEN: 'Electronics', slug: 'electronics', icon: 'smartphone', sortOrder: 1 },
    { nameAR: 'أزياء',       nameEN: 'Fashion',     slug: 'fashion',     icon: 'shirt',      sortOrder: 2 },
    { nameAR: 'جمال',       nameEN: 'Beauty',      slug: 'beauty',      icon: 'sparkles',   sortOrder: 3 },
    { nameAR: 'منزل',       nameEN: 'Home',        slug: 'home',        icon: 'home',       sortOrder: 4 },
    { nameAR: 'رياضة',      nameEN: 'Sports',      slug: 'sports',      icon: 'dumbbell',   sortOrder: 5 },
    { nameAR: 'طعام',       nameEN: 'Food',        slug: 'food',        icon: 'utensils',   sortOrder: 6 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameAR: cat.nameAR,
        nameEN: cat.nameEN,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      create: {
        nameAR: cat.nameAR,
        nameEN: cat.nameEN,
        slug: cat.slug,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    })
    console.log(`   ✅ Category "${cat.nameEN}" (${cat.slug})`)
  }

  // ─── 5. System Settings ────────────────────────────────────────────────────
  console.log('⚙️  Creating system settings...')
  const settings = [
    {
      key: 'requireProviderApproval',
      value: 'true',
      description: 'Require admin approval before a provider account becomes active',
    },
    {
      key: 'requireCustomerApproval',
      value: 'true',
      description: 'Require admin approval before a customer account becomes active',
    },
    {
      key: 'allowProviderRegistration',
      value: 'true',
      description: 'Allow new providers to register on the platform',
    },
    {
      key: 'allowCustomerRegistration',
      value: 'true',
      description: 'Allow new customers to register on the platform',
    },
    {
      key: 'defaultLocale',
      value: 'ar',
      description: 'Default locale for new users',
    },
    {
      key: 'supportedLocales',
      value: 'ar,en',
      description: 'Comma-separated list of supported locales',
    },
    {
      key: 'platformCommission',
      value: '0',
      description: 'Platform commission percentage on each order (0-100)',
    },
    {
      key: 'requirePriceApproval',
      value: 'true',
      description: 'Require admin approval when a provider sets or changes a product price',
    },
    {
      key: 'TEMPLATE_OTP',
      value: '**{{2}}** is your verification code. For your security, do not share this code.\nExpires in {{3}} minutes.\nCopy code',
      description: 'WhatsApp OTP template (placeholders: {{1}}=name, {{2}}=code, {{3}}=expiry minutes)',
    },
    {
      key: 'TEMPLATE_Marketing_Msg',
      value: 'Hello {{1}}! Enjoy an exclusive offer: {{2}}. Use code {{3}} to get {{4}} off. Shop now: {{5}}',
      description: 'WhatsApp marketing template (placeholders: {{1}}..{{5}})',
    },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        description: setting.description,
      },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    })
    console.log(`   ✅ Setting "${setting.key}" = ${setting.value}`)
  }

  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
