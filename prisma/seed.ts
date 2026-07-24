// ─── Asshrabha Marketplace – Database Seed Script ──────────────────────────────
// Run with: npx prisma db seed
// Idempotent — safe to run multiple times.

import { PrismaClient, AdminPermissionType, AccountStatus, UserRole, CustomerType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const { getDemoAccounts } = require('../src/lib/demo-accounts')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Asshrabha database seed...\n')

  const demoUsers = getDemoAccounts()

  // ─── 1. Demo users ────────────────────────────────────────────────────────
  console.log('👤 Creating/updating demo users...')
  const allPermissions = Object.values(AdminPermissionType)

  for (const account of demoUsers) {
    const passwordHash = await bcrypt.hash(account.password, 12)
    const user = await prisma.user.upsert({
      where: { mobile: account.mobile },
      update: {
        passwordHash,
        nameAR: account.nameAR,
        nameEN: account.nameEN,
        role: account.role === 'ROOT_ADMIN' ? UserRole.ROOT_ADMIN : account.role === 'PROVIDER' ? UserRole.PROVIDER : UserRole.CUSTOMER,
        status: account.status === 'APPROVED' ? AccountStatus.APPROVED : AccountStatus.PENDING,
        customerType: account.customerType === 'SHOP' ? CustomerType.SHOP : CustomerType.CUSTOMER,
        forcePasswordReset: false,
        locale: 'ar',
      },
      create: {
        mobile: account.mobile,
        passwordHash,
        nameAR: account.nameAR,
        nameEN: account.nameEN,
        role: account.role === 'ROOT_ADMIN' ? UserRole.ROOT_ADMIN : account.role === 'PROVIDER' ? UserRole.PROVIDER : UserRole.CUSTOMER,
        status: account.status === 'APPROVED' ? AccountStatus.APPROVED : AccountStatus.PENDING,
        customerType: account.customerType === 'SHOP' ? CustomerType.SHOP : CustomerType.CUSTOMER,
        forcePasswordReset: false,
        locale: 'ar',
      },
    })

    if (account.key === 'admin') {
      console.log('💰 Ensuring admin wallet exists...')
      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          pendingBalance: 0,
          availableBalance: 0,
          totalPaid: 0,
          isFrozen: false,
        },
      })

      console.log('🔑 Creating admin permissions...')
      for (const permission of allPermissions) {
        await prisma.adminPermission.upsert({
          where: {
            userId_permission: {
              userId: user.id,
              permission,
            },
          },
          update: {},
          create: {
            userId: user.id,
            permission,
          },
        })
      }
    }

    if (account.key === 'provider') {
      await prisma.providerProfile.upsert({
        where: { userId: user.id },
        update: {
          shopNameAR: account.nameAR,
          shopNameEN: account.nameEN,
          locationAddress: 'Demo provider location',
          isVisible: true,
        },
        create: {
          userId: user.id,
          shopNameAR: account.nameAR,
          shopNameEN: account.nameEN,
          locationAddress: 'Demo provider location',
          isVisible: true,
        },
      })
    }

    console.log(`   ✅ ${account.key} ensured: ${account.mobile}`)
  }

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
      key: 'otp_en',
      value: 'OTP Code: {{1}}. This is your OTP for {{2}}. The OTP is valid for {{3}} minutes. Call {{4}} if you did not perform this request. For your security, do not share this code.\nExpires in {{3}} minutes.',
      description: 'WhatsApp OTP template EN (placeholders: {{1}}=code, {{2}}=app_name, {{3}}=expiry_minutes, {{4}}=support_number)',
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
