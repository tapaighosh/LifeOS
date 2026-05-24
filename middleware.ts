import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/',
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth            (NextAuth routes — public)
     * - api/notifications/morning  (cron endpoint — protected by CRON_SECRET)
     * - api/notifications/night    (cron endpoint — protected by CRON_SECRET)
     * - _next/static        (static files)
     * - _next/image         (image optimisation)
     * - favicon.ico         (favicon)
     * - icons/              (PWA icons)
     * - manifest.json       (PWA manifest — needs to be public)
     * - sw.js, sw-push.js   (service workers — must be publicly accessible)
     * - /                   (login/landing page)
     */
    '/((?!api/auth|api/notifications/morning|api/notifications/night|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|sw-push.js|$).*)',
  ],
};
