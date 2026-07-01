'use server';

import { signIn, signOut } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS, OTP_EXPIRY_MINUTES, OTP_LENGTH } from '@/lib/utils/constants';
import { generateOTP } from '@/lib/utils/helpers';
import type { ApiResponse } from '@/types';
import { getErrorMessage } from '@/lib/errors'
import { isAdmin } from '@/lib/utils/permissions'

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(
  mobile: string,
  password: string
): Promise<ApiResponse<{ redirectTo: string }>> {
  try {
    // Pre-validate credentials by reading the stored password hash
    // Use Prisma when available, otherwise fall back to direct PG query
    let storedHash: string | null = null
    try {
      const { prisma } = await import('@/lib/prisma')
      const u = await prisma.user.findUnique({ where: { mobile }, select: { passwordHash: true } })
      if (u) storedHash = u.passwordHash as string | null
    } catch (e) {
      try {
        const { Client } = await import('pg')
        const p = await import('path')
        const fs = await import('fs')
        let databaseUrl = process.env.DATABASE_URL
        const envPath = p.resolve(process.cwd(), '.env')
        if (!databaseUrl && fs.existsSync(envPath)) {
          const txt = fs.readFileSync(envPath, 'utf8')
          for (const line of txt.split(/\r?\n/)) {
            const m = line.match(/^DATABASE_URL\s*=\s*(?:"([^"]+)"|'([^']+)'|(.*))$/)
            if (m) { databaseUrl = m[1] || m[2] || m[3]; break }
          }
        }
        if (databaseUrl) {
          const client = new Client({ connectionString: databaseUrl })
          await client.connect()
          const res = await client.query('SELECT "passwordHash" FROM "User" WHERE mobile = $1', [mobile])
          if (res.rowCount) storedHash = res.rows[0].passwordHash
          await client.end()
        }
      } catch (e2) {
        // ignore
      }
    }

    // If no stored hash found or password mismatch, return invalid credentials
    if (!storedHash) {
      return { success: false, error: 'INVALID_CREDENTIALS' }
    }
    const ok = await bcrypt.compare(password, storedHash)
    if (!ok) return { success: false, error: 'INVALID_CREDENTIALS' }

    // At this point credentials are valid — proceed to sign in via NextAuth
    const result = await signIn('credentials', {
      mobile,
      password,
      redirect: false,
    });

    // Get user to determine redirect. Use Prisma when available, otherwise use PG fallback.
    type MinimalUser = { id?: string; role?: string; status?: string; forcePasswordReset?: boolean }
    let user: MinimalUser | null = null
    try {
      const { prisma } = await import('@/lib/prisma')
      user = await prisma.user.findUnique({
          where: { mobile },
          select: { id: true, role: true, status: true, forcePasswordReset: true },
        })
    } catch (e) {
      try {
        const { Client } = await import('pg')
        const p = await import('path')
        const fs = await import('fs')
        let databaseUrl = process.env.DATABASE_URL
        const envPath = p.resolve(process.cwd(), '.env')
        if (!databaseUrl && fs.existsSync(envPath)) {
          const txt = fs.readFileSync(envPath, 'utf8')
          for (const line of txt.split(/\r?\n/)) {
            const m = line.match(/^DATABASE_URL\s*=\s*(?:"([^"]+)"|'([^']+)'|(.*))$/)
            if (m) { databaseUrl = m[1] || m[2] || m[3]; break }
          }
        }
        if (databaseUrl) {
          const client = new Client({ connectionString: databaseUrl })
          await client.connect()
          const res = await client.query('SELECT id, role, status, "forcePasswordReset" FROM "User" WHERE mobile = $1', [mobile])
          if (res.rowCount) user = res.rows[0]
          await client.end()
        }
      } catch (e2) {
        // ignore
      }
    }

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (user.forcePasswordReset) {
      const uid = user.id
      return { success: true, data: { redirectTo: `/reset-password?userId=${uid}` } };
    }

    if (user.status === 'PENDING') {
      return { success: true, data: { redirectTo: '/pending' } };
    }

    let redirectTo = '/shop';
    if (isAdmin(user.role as any)) redirectTo = '/admin';
    else if (user.role === 'PROVIDER') redirectTo = '/provider';

    return { success: true, data: { redirectTo } };
  } catch (error: unknown) {
    const m = getErrorMessage(error)
    if (m === 'ACCOUNT_DISABLED') {
      return { success: false, error: 'ACCOUNT_DISABLED' };
    }
    if (m === 'ACCOUNT_SUSPENDED') {
      return { success: false, error: 'ACCOUNT_SUSPENDED' };
    }
    return { success: false, error: 'INVALID_CREDENTIALS' };
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerAction(data: {
  mobile: string;
  password: string;
  nameAR: string;
  nameEN: string;
  role: 'CUSTOMER' | 'PROVIDER';
  customerType?: 'SHOP' | 'CUSTOMER';
  shopNameAR?: string;
  shopNameEN?: string;
  locationAddress?: string;
  locationId?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  locationUrl?: string;
  avatar?: string;
  logo?: string;
  banner?: string;
}): Promise<ApiResponse<{ userId: string }>> {
  try {
    // Check if mobile already exists
    const existing = await prisma.user.findUnique({
      where: { mobile: data.mobile },
    });

    if (existing) {
      return { success: false, error: 'MOBILE_EXISTS' };
    }

    // Check registration settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['allowProviderRegistration', 'allowCustomerRegistration'],
        },
      },
    });

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    if (data.role === 'PROVIDER' && settingsMap.allowProviderRegistration !== 'true') {
      return { success: false, error: 'REGISTRATION_DISABLED' };
    }

    if (data.role === 'CUSTOMER' && settingsMap.allowCustomerRegistration !== 'true') {
      return { success: false, error: 'REGISTRATION_DISABLED' };
    }

    // Require both governorate (locationId) and address line for customer registrations
    if (data.role === 'CUSTOMER' && (!data.locationId || !data.locationAddress || !String(data.locationAddress).trim())) {
      return { success: false, error: 'MISSING_LOCATION' };
    }

    // Require location for providers as well (address line is mandatory)
    if (data.role === 'PROVIDER' && (!data.locationAddress || !String(data.locationAddress).trim())) {
      return { success: false, error: 'MISSING_LOCATION' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    // Create user + related records in transaction and return OTP
    const userWithOtp = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          mobile: data.mobile,
          passwordHash,
          nameAR: data.nameAR,
          nameEN: data.nameEN,
          role: data.role,
          avatar: data.avatar || undefined,
          customerType: data.customerType,
          status: 'PENDING',
          locale: 'ar',
        },
      });

      // Create wallet
      await tx.wallet.create({
        data: {
          userId: newUser.id,
        },
      });

      // Create provider profile if provider
      if (data.role === 'PROVIDER') {
        await tx.providerProfile.create({
          data: {
            userId: newUser.id,
            shopNameAR: data.shopNameAR || data.nameAR,
            shopNameEN: data.shopNameEN || data.nameEN,
            logo: data.logo || data.avatar || undefined,
            banner: data.banner || undefined,
            locationAddress: data.locationAddress,
            locationLat: data.locationLat ?? null,
            locationLng: data.locationLng ?? null,
            locationId: data.locationId || null,
            locationUrl: data.locationUrl || null,
          },
        });
      }
      // Create address for customer if provided
        if (data.role === 'CUSTOMER' && (data.locationAddress || data.locationId)) {
          let cityName = '';
          if (data.locationId) {
            const loc = await tx.location.findUnique({ where: { id: data.locationId } });
            if (loc) cityName = loc.nameAR || loc.nameEN || '';
          }
          await tx.address.create({
            data: {
              userId: newUser.id,
              label: 'Home',
              fullName: data.nameEN || data.nameAR || '',
              mobile: data.mobile,
              addressLine: data.locationAddress || '',
              city: cityName,
              locationId: data.locationId || null,
              lat: data.locationLat ?? null,
              lng: data.locationLng ?? null,
              locationUrl: data.locationUrl || null,
              isDefault: true,
            },
          });
        }

      // Generate OTP
      const otpCode = generateOTP(OTP_LENGTH);
      await tx.oTPCode.create({
        data: {
          userId: newUser.id,
          code: otpCode,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        },
      });

      // Fetch OTP template (same as Meta WhatsApp template)
      let templateEN = 'OTP Code: {{1}}. This is your OTP for {{2}}. The OTP is valid for {{3}} minutes. Call {{4}} if you did not perform this request. For your security, do not share this code.\nExpires in {{3}} minutes.';
      const templateAR = 'رمز التحقق الخاص بك هو: {{1}}';
      try {
        const template = await tx.systemSetting.findUnique({
          where: { key: 'otp_en' },
        });
        if (template?.value) {
          // Use the same template for in-app notification as Meta WhatsApp
          templateEN = template.value;
          // Arabic template can be customized separately if needed
        }
      } catch (e) {
        // Use defaults if template lookup fails
      }

      // Replace placeholders with actual values (same as WhatsApp API)
      // {{1}} = OTP code, {{2}} = app name, {{3}} = expiry minutes, {{4}} = support number
      const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Asshrabha';
      const supportNumber = process.env.SUPPORT_PHONE || '123-456-7890';
      const bodyEN = String(templateEN)
        .replace(/{{1}}/g, otpCode)
        .replace(/{{2}}/g, appName)
        .replace(/{{3}}/g, String(OTP_EXPIRY_MINUTES))
        .replace(/{{4}}/g, supportNumber);
      
      const bodyAR = String(templateAR)
        .replace(/{{1}}/g, otpCode);

      // Create in-app notification with OTP (using same template as Meta)
      await tx.notification.create({
        data: {
          userId: newUser.id,
          type: 'OTP_CODE',
          titleAR: 'رمز التحقق',
          titleEN: 'Verification Code',
          bodyAR,
          bodyEN,
          data: { code: otpCode },
        },
      });

      return { user: newUser, otp: otpCode };
    });
    // Send OTP via WhatsApp Cloud (Meta) directly (non-blocking)
    try {
      const token = process.env.WHATSAPP_META_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
      const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || 'en_US';

      if (process.env.WHATSAPP_PROVIDER === 'meta' && token && phoneId) {
        // normalize phone
        let cleaned = String(data.mobile).replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = '20' + cleaned.substring(1);
        else if (!cleaned.startsWith('20') && !cleaned.startsWith('+')) {
          if (cleaned.length === 10) cleaned = '20' + cleaned;
        }
        if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;

        const bodyText = (await (async () => {
          try {
            const t = await prisma.systemSetting.findUnique({ where: { key: 'otp_en' } });
            return String(t?.value || `OTP Code: {{1}}`).replace(/{{1}}/g, userWithOtp.otp).replace(/{{2}}/g, process.env.NEXT_PUBLIC_APP_NAME || 'Asshrabha').replace(/{{3}}/g, String(OTP_EXPIRY_MINUTES)).replace(/{{4}}/g, process.env.SUPPORT_PHONE || '');
          } catch (e) {
            return `رمز التحقق الخاص بك هو ${userWithOtp.otp}`;
          }
        }))();

        let payload: any;
        if (templateName) {
          payload = {
            messaging_product: 'whatsapp',
            to: cleaned,
            type: 'template',
            template: {
              name: templateName,
              language: { code: templateLanguage },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: userWithOtp.otp },
                    { type: 'text', text: process.env.NEXT_PUBLIC_APP_NAME || 'Asshrabha' },
                    { type: 'text', text: String(OTP_EXPIRY_MINUTES) },
                    { type: 'text', text: process.env.SUPPORT_PHONE || '' },
                  ],
                },
                {
                  type: 'button',
                  sub_type: 'url',
                  index: '0',
                  parameters: [
                    {
                      type: 'text',
                      text: userWithOtp.otp,
                    },
                  ],
                },
              ],
            },
          };
        } else {
          payload = { messaging_product: 'whatsapp', to: cleaned, type: 'text', text: { body: bodyText } };
        }

        const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const respText = await res.text();
        console.log('[Registration] WhatsApp send status:', res.status, 'body:', respText);
      } else {
        console.warn('[Registration] WhatsApp meta not configured, skipping send');
      }
    } catch (e) {
      console.error('Failed to send WhatsApp OTP during registration:', e);
    }

    return { success: true, data: { userId: userWithOtp.user.id } };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'REGISTRATION_FAILED' };
  }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyOTPAction(
  userId: string,
  code: string
): Promise<ApiResponse> {
  try {
    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        userId,
        code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return { success: false, error: 'INVALID_OTP' };
    }

    await prisma.$transaction(async (tx) => {
      // Mark OTP as verified
      await tx.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      // Check if auto-approval is enabled
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const approvalKey =
        user?.role === 'PROVIDER'
          ? 'requireProviderApproval'
          : 'requireCustomerApproval';

      const setting = await tx.systemSetting.findUnique({
        where: { key: approvalKey },
      });

      const requiresApproval = setting?.value === 'true';

      if (!requiresApproval) {
        // Auto-approve
        await tx.user.update({
          where: { id: userId },
          data: { status: 'APPROVED' },
        });

        // If provider, make profile visible immediately when auto-approved
        const u = await tx.user.findUnique({ where: { id: userId }, select: { role: true } })
        if (u?.role === 'PROVIDER') {
          await tx.providerProfile.updateMany({ where: { userId }, data: { isVisible: true } })
        }
      }

      // Notify admins about new registration
      const admins = await tx.user.findMany({
        where: {
          role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] },
          status: 'APPROVED',
        },
        select: { id: true },
      });

      await tx.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'SYSTEM' as const,
          titleAR: 'تسجيل جديد',
          titleEN: 'New Registration',
          bodyAR: `تسجيل حساب جديد بانتظار الموافقة`,
          bodyEN: `New account registration pending approval`,
          data: { userId, type: 'new_registration' },
        })),
      });
    });

    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, error: 'VERIFICATION_FAILED' };
  }
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export async function resendOTPAction(userId: string): Promise<ApiResponse> {
  try {
    const otpCode = generateOTP(OTP_LENGTH);

    // Get user mobile and name for WhatsApp and template
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { mobile: true, nameEN: true, nameAR: true } 
    });
    if (!user) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    await prisma.$transaction(async (tx) => {
      // Invalidate old OTPs
      await tx.oTPCode.updateMany({
        where: { userId, verified: false },
        data: { expiresAt: new Date() },
      });

      // Create new OTP
      await tx.oTPCode.create({
        data: {
          userId,
          code: otpCode,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        },
      });

      // Fetch OTP template (same as Meta WhatsApp template)
      let templateEN = 'OTP Code: {{1}}. This is your OTP for {{2}}. The OTP is valid for {{3}} minutes. Call {{4}} if you did not perform this request. For your security, do not share this code.\nExpires in {{3}} minutes.';
      const templateAR = 'رمز التحقق الخاص بك هو: {{1}}';
      try {
        const template = await tx.systemSetting.findUnique({
          where: { key: 'otp_en' },
        });
        if (template?.value) {
          // Use the same template for in-app notification as Meta WhatsApp
          templateEN = template.value;
          // Arabic template can be customized separately if needed
        }
      } catch (e) {
        // Use defaults if template lookup fails
      }

      // Replace placeholders with actual values (same as WhatsApp API)
      // {{1}} = OTP code, {{2}} = app name, {{3}} = expiry minutes, {{4}} = support number
      const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Asshrabha';
      const supportNumber = process.env.SUPPORT_PHONE || '123-456-7890';
      const bodyEN = String(templateEN)
        .replace(/{{1}}/g, otpCode)
        .replace(/{{2}}/g, appName)
        .replace(/{{3}}/g, String(OTP_EXPIRY_MINUTES))
        .replace(/{{4}}/g, supportNumber);
      
      const bodyAR = String(templateAR)
        .replace(/{{1}}/g, otpCode);

      // Create notification (using same template as Meta)
      await tx.notification.create({
        data: {
          userId,
          type: 'OTP_CODE',
          titleAR: 'رمز التحقق',
          titleEN: 'Verification Code',
          bodyAR,
          bodyEN,
          data: { code: otpCode },
        },
      });
    });

    // Send OTP via WhatsApp API (non-blocking)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/whatsapp-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, mobile: user.mobile }),
      });
    } catch (e) {
      console.error('Failed to send WhatsApp OTP on resend:', e);
      // Don't block resend if WhatsApp send fails
    }

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Resend OTP error:', error);
    return { success: false, error: 'RESEND_FAILED' };
  }
}

// ─── Change Password ──────────────────────────────────────────────────────────

export async function changePasswordAction(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'INVALID_CURRENT_PASSWORD' };
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        forcePasswordReset: false,
      },
    });

    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'PASSWORD_CHANGE_FAILED' };
  }
}

// ─── Force Reset Password (first login) ──────────────────────────────────────

export async function forceResetPasswordAction(
  userId: string,
  newPassword: string
): Promise<ApiResponse> {
  try {
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        forcePasswordReset: false,
      },
    });

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    console.error('Force reset password error:', error);
    return { success: false, error: 'PASSWORD_RESET_FAILED' };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
}
