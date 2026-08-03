import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDashboardPath } from '@/lib/utils/permissions';
import { normalizeEgyptMobile } from '@/lib/utils/helpers';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        mobile: { label: 'Mobile', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.mobile || !credentials?.password) {
          return null;
        }

        const mobile = normalizeEgyptMobile(credentials.mobile as string);
        const password = credentials.password as string;
        console.log('[auth][authorize] mobile=', mobile);

        // Try to use Prisma, but fall back to direct PG queries if Prisma cannot be constructed
        let user: any = null
        try {
          const { prisma } = await import('@/lib/prisma')
          user = await prisma.user.findUnique({
            where: { mobile },
            include: { permissions: true },
          })
          if (user && Array.isArray(user.permissions)) {
            user.permissions = user.permissions.map((p: any) => p.permission)
          }
          console.log('[auth][authorize] found user via prisma=', !!user)
        } catch (e) {
            console.error('[auth][authorize] prisma error:', (e as any)?.message ?? e)
          // Prisma unavailable — use pg fallback
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
              const res = await client.query('SELECT id, mobile, "passwordHash", "nameEN", "nameAR", role, "customerType", status, "forcePasswordReset", locale, avatar FROM "User" WHERE mobile = $1', [mobile])
              if (res.rowCount) {
                user = res.rows[0]
                user.permissions = []
              }
              console.log('[auth][authorize] found user via pg=', !!user)
              // Update last login
              if (user) await client.query('UPDATE "User" SET "lastLoginAt" = now() WHERE id = $1', [user.id])
              await client.end()
            }
          } catch (e2) {
              console.error('[auth][authorize] pg fallback error:', (e2 as any)?.message ?? e2)
            // ignore and continue
          }
        }

        if (!user) return null;

        if (!user) {
          console.log('[auth][authorize] no user found after fallbacks')
          return null
        }
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        console.log('[auth][authorize] password valid=', !!isValidPassword)
        if (!isValidPassword) return null;

        // Check account status
        if (user.status === 'DISABLED') {
          throw new Error('ACCOUNT_DISABLED');
        }
        if (user.status === 'SUSPENDED') {
          throw new Error('ACCOUNT_SUSPENDED');
        }

        // Update last login — try Prisma, otherwise fall back to direct PG query
        try {
          const { prisma } = await import('@/lib/prisma')
          if (prisma && typeof prisma.user?.update === 'function') {
            await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          }
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
              await client.query('UPDATE "User" SET "lastLoginAt" = now() WHERE id = $1', [user.id])
              await client.end()
            }
          } catch (e2) {
            // ignore
          }
        }

        // Dev: when a provider logs in, seed provider listings for all providers (non-production only)
        try {
          if (process.env.NODE_ENV !== 'production' && user.role === 'PROVIDER') {
            const mod = await import('@/lib/dev/seedOnProviderLogin')
            if (mod && typeof mod.seedListingsForProviderUser === 'function') {
              // run async but do not block login response
              mod.seedListingsForProviderUser(user.id).catch((err: any) => console.error('[auth] seedListings error', err))
            }
          }
        } catch (e) {
          console.error('[auth] seed trigger error', (e as any)?.message ?? e)
        }

        return {
          id: user.id,
          mobile: user.mobile,
          nameAR: user.nameAR,
          nameEN: user.nameEN,
          role: user.role,
          customerType: user.customerType,
          status: user.status,
          forcePasswordReset: user.forcePasswordReset,
          locale: user.locale,
          avatar: user.avatar,
          permissions: (user.permissions || []).map((p: any) => (typeof p === 'string' ? p : p.permission)),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.mobile = (user as any).mobile;
        token.nameAR = (user as any).nameAR;
        token.nameEN = (user as any).nameEN;
        token.role = (user as any).role;
        token.customerType = (user as any).customerType;
        token.status = (user as any).status;
        token.forcePasswordReset = (user as any).forcePasswordReset;
        token.locale = (user as any).locale;
        token.avatar = (user as any).avatar;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).mobile = token.mobile;
        (session.user as any).nameAR = token.nameAR;
        (session.user as any).nameEN = token.nameEN;
        (session.user as any).role = token.role;
        (session.user as any).customerType = token.customerType;
        (session.user as any).status = token.status;
        (session.user as any).forcePasswordReset = token.forcePasswordReset;
        (session.user as any).locale = token.locale;
        (session.user as any).avatar = token.avatar;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle role-based redirects
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
});

// Helper to get the current session user with typed properties
export async function getCurrentUser(request?: Request | { cookies?: { get?: (name: string) => { value?: string } | undefined } }) {
  let session: any = null

  try {
    const { getToken } = await import('next-auth/jwt')

    if (request && typeof (request as any).headers?.get === 'function') {
      const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET } as any)
      if (token) {
        session = { user: token as any } as any
      }
    }
  } catch {
    // ignore request-based token fallback failures
  }

  if (!session?.user) {
    try {
      session = await auth().catch(() => null)
    } catch {
      session = null
    }
  }

  if (!session?.user) {
    try {
      const { getToken } = await import('next-auth/jwt')
      const token = await getToken({ req: undefined, secret: process.env.NEXTAUTH_SECRET } as any)
      if (token) {
        session = { user: token as any } as any
      }
    } catch {
      // ignore fallback failures
    }
  }

  if (!session?.user) return null;

  const user = session.user as any;
  return {
    id: user.id as string,
    mobile: user.mobile as string,
    nameAR: user.nameAR as string | null,
    nameEN: user.nameEN as string | null,
    role: (user.role || '').toString().toUpperCase(),
    customerType: user.customerType ? (user.customerType as string).toString().toUpperCase() as any : undefined,
    status: user.status as string,
    forcePasswordReset: Boolean(user.forcePasswordReset),
    locale: user.locale as string,
    avatar: user.avatar as string | null,
    permissions: (user.permissions || []) as string[],
  };
}
