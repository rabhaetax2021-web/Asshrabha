import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Temporary no-op middleware to avoid Edge runtime Node API issues.
// This allows authentication flows to run server-side without importing
// Node-only modules into the Edge runtime. Replace with proper Edge
// compatible auth middleware when ready.
export default function middleware(req: NextRequest) {
  // Allow root path to show the PWA install landing page
  return NextResponse.next();
}

function getRoleDashboard(role: string): string {
  switch (role) {
    case 'ROOT_ADMIN':
    case 'SUB_ADMIN':
      return '/admin';
    case 'PROVIDER':
      return '/provider';
    case 'CUSTOMER':
      return '/shop';
    default:
      return '/login';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)',
  ],
};
