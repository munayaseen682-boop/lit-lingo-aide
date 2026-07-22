# Plan: Make LitLingo AI an Installable PWA on Android

## Goal
Transform the existing LitLingo AI web app into a professional, installable Progressive Web App (PWA) for Android phones without changing or removing any current features, AI functionality, design, data, or authentication. This will provide an app icon, app name, splash screen, and an "Install App" option.

## Scope: Manifest-Only Installability
This plan uses **manifest-only PWA support** because the request is for installability (app icon, home screen, splash screen, install prompt). It does **not** add offline support or service workers. The app will still require an internet connection to reach the AI backend, auth, and database — the same behavior as today.

## What Will Change

### 1. Web App Manifest
Create `public/manifest.webmanifest` with:
- `name`: "LitLingo AI"
- `short_name`: "LitLingo" (fits under phone icons)
- `description`: existing app description
- `start_url`: "/"
- `scope`: "/"
- `display`: "standalone" (opens like a native app)
- `background_color`: warm parchment background color
- `theme_color`: deep navy primary color
- `icons`: 192x192, 512x512, and a maskable 512x512 icon for Android adaptive icons

### 2. App Icons
Generate a set of brand icons that match the existing design system (warm parchment, deep navy, serif "L" mark). Place them in `public/`:
- `icon-192x192.png`
- `icon-512x512.png`
- `maskable-icon-512x512.png` (safe-zone padding for Android adaptive shapes)
- `apple-touch-icon-180x180.png` (for iOS home-screen as well)

### 3. Head Metadata Updates
Update `src/routes/__root.tsx` to add in `head().links`:
- `<link rel="manifest" href="/manifest.webmanifest" />`
- `<meta name="theme-color" content="..." />` (added to meta list)
- Apple touch icon link
- Mobile-web-app meta tags (`mobile-web-app-capable`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`)

Replace the default `<link rel="icon" href="/favicon.ico" />` with a new favicon and remove the template `public/favicon.ico`.

### 4. "Install App" UI Button
Add a small, non-intrusive "Install App" button to the authenticated layout (e.g., in the header or user menu). It will:
- Listen for the browser's `beforeinstallprompt` event and capture the prompt.
- Show the button only when installation is possible.
- Call the prompt when clicked.
- Hide the button after the app is installed or if the browser/OS does not support it (iOS Safari will not show it because it uses Share > Add to Home Screen).

This adds UI only; it does not change auth, routing, or feature logic.

### 5. Optional: Dashboard Install Reminder
Add a one-line card or banner on the Dashboard that explains the install option for Android users, with the same guarded behavior. This can be skipped if you prefer to keep the dashboard minimal; I will include it only if you approve.

## What Will NOT Change

- All existing routes, pages, AI features (Analyzer, Linguistics, Quiz, Chat), server functions, and database logic remain untouched.
- Authentication flow (Google + email sign-in) remains unchanged.
- The existing design system (colors, fonts, Tailwind tokens) stays the same; only the brand icon and PWA metadata are added.
- No service worker, no offline caching, no `vite-plugin-pwa` — keeping the build simple and preview-safe.
- No existing files are deleted except the template `public/favicon.ico`.

## Risks and Limitations

1. **No offline support.** The installed app will still require an internet connection. If you want offline access later, that requires a separate service-worker plan.
2. **Browser-dependent install button.** The "Install App" button only appears on browsers that support `beforeinstallprompt` (e.g., Chrome/Edge on Android). On iOS Safari, users must manually use Share > Add to Home Screen.
3. **Splash screen is browser-generated.** Chrome/Android creates the splash screen from the manifest name, background color, theme color, and icons. The exact appearance is controlled by the browser, not by a custom image.
4. **Auth and deep links should still work.** TanStack Start's routing handles auth redirects; the manifest will point to `/` as the start URL. If a user opens the installed app, they will land on the home page and then be redirected by the existing auth logic.
5. **Preview vs. published behavior.** The install prompt will only appear on the published app or a public preview; it may not trigger inside the Lovable editor preview.

## Approval Request
If you approve this plan, I will implement it in this order:
1. Generate brand icons and favicon.
2. Create the manifest.
3. Update `__root.tsx` head metadata.
4. Remove the default `favicon.ico`.
5. Add the Install App button to the authenticated layout.
6. Run a build check to verify nothing is broken.

Reply with **"approve"** or let me know if you want to adjust any part (e.g., add a dashboard reminder, change icon colors, or skip the install button and rely only on the browser's native prompt).