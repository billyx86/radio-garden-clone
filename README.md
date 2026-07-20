# Radio Garden Clone

Mobile-first interactive **3D globe** of live radio stations — a cosmic Radio Garden-style experience.

## Features

- 🌍 Procedural 3D Earth with stars + atmosphere (Three.js / R3F)
- 🟢 Glowing green station markers worldwide
- 👆 Tap a station → fly camera + play live stream
- 🎧 Sticky bottom player (play/pause, volume, favorites)
- 🔍 Search by city / station / country (bottom sheet)
- ❤️ Favorites persisted in `localStorage`
- 🔄 Auto-rotate when idle; reduced-motion aware
- 📱 Full-bleed mobile UI, 44px touch targets, safe-area insets

## Stack

- React 19 + Vite 6 + TypeScript
- `@react-three/fiber` + `@react-three/drei` + `three`
- Tailwind CSS v4
- Zustand (audio + favorites)
- Outfit font

## Quick start

```bash
npm install
npm run dev      # http://0.0.0.0:8080
npm run build
npm run typecheck
```

## Project layout

```
src/
  components/
    Globe.tsx        # R3F canvas, earth, markers, orbit
    Player.tsx       # sticky bottom player
    Search.tsx       # mobile search sheet
    StationList.tsx
    AudioEngine.tsx  # HTMLAudioElement bridge
  data/stations.ts   # ~100 curated HTTPS streams
  store/radio.ts     # zustand store
  lib/geo.ts         # lat/lng → Vector3
  App.tsx
  styles.css         # cosmic design tokens
```

## Design

- Background: deep space blue-black `oklch(0.14 0.02 260)`
- Accent: radio green `oklch(0.82 0.18 145)`
- Glass panels, living green dots on a quiet Earth

## Notes

Some streams may be geo-restricted or temporarily offline. Favorites and volume are saved locally.

Deploy: any static host (Vercel / Netlify / Cloudflare Pages) — `npm run build` outputs to `dist/`.
