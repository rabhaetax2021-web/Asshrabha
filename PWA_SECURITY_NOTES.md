Compatibility and server header recommendations

Compatibility changes applied in `src/app/globals.css`:
- Reordered `-webkit-backdrop-filter` before `backdrop-filter` in glass/overlay/modal/login-card rules.
- Added `-webkit-user-select`, `-ms-user-select` where relevant.
- Added WebKit scrollbar styles for Safari (`::-webkit-scrollbar` etc.).
- Added `.mask-image` and `.mask-source-type` helper classes that include prefixed properties.
- Ensured `-webkit-text-size-adjust` and `text-size-adjust` are present on `html`.
- Renamed PWA manifest to `public/manifest.webmanifest` and updated metadata reference in `src/app/layout.tsx`.

Server / Performance / Security recommendations (cannot be changed from client-side CSS):

1) Cache busting & cache-control
- Serve static assets with long `Cache-Control: public, max-age=31536000, immutable` for fingerprinted assets (e.g., `/static/js/app.abc123.js`).
- Avoid `Expires` header; prefer `Cache-Control`.

Nginx example:

```
location ~* \.(js|css|png|jpg|jpeg|svg|webp|ico|woff2)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

2) Remove `X-XSS-Protection` header
- Modern browsers no longer need this header; remove it from server/CSP configuration.

3) Replace `X-Frame-Options` with CSP `frame-ancestors`
- Use `Content-Security-Policy: frame-ancestors 'self' https://example.com;` instead of `X-Frame-Options`.

4) Add CSP header for improved security
- Example (adjust as needed):

```
Content-Security-Policy: default-src 'self'; img-src 'self' data:; script-src 'self' 'nonce-...'; frame-ancestors 'self';
```

5) Remove `link[fetchpriority]` and `meta[name=theme-color]` concerns
- `fetchpriority` is not supported in Firefox; it's safe to keep for supporting Chromium browsers. No action required.
- `meta[name=theme-color]` is not supported in Firefox; it's harmless to keep for other browsers.

6) CSS performance notes
- Avoid animating `background-position` or `transform` inside `@keyframes` for large repaints; prefer `transform: translateZ(0)` and opacity/transform-only animations where possible.
- Ensure large static assets are served with proper caching and compression (Brotli/Gzip).

7) Button `type` attribute
- Ensure all `<button>` elements include `type="button"` or `type="submit"` as appropriate. Consider adding a lint rule or a React wrapper component that defaults `type="button"`.

If you want, I can:
- Run a quick search for `<button` occurrences and add `type="button"` where missing in common components.
- Create example Nginx and Cloudflare header configuration snippets to apply on your server.
- Add a small ESLint rule or codemod to enforce button types.

Tell me which of the above you'd like me to perform next.