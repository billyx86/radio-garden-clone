# Radio Garden Clone

Mobile-first **3D globe** of live radio stations — a cosmic Radio Garden-style experience.

**Repo:** https://github.com/billyx86/radio-garden-clone

## Features

- Procedural 3D Earth with stars + atmosphere (Three.js / React Three Fiber)
- ~80 glowing green station markers worldwide
- Tap a station → camera flies in + live stream plays
- Sticky bottom player (play/pause, volume, favorites)
- Search by city / station / country (mobile bottom sheet)
- Favorites + volume persisted in `localStorage`
- Auto-rotate when idle; respects `prefers-reduced-motion`
- Full-bleed mobile UI, 44px touch targets, safe-area insets
- HLS (`.m3u8`) + direct MP3/AAC streams via `hls.js`

## Quick start

```bash
git clone https://github.com/billyx86/radio-garden-clone.git
cd radio-garden-clone
npm install
npm run dev
```

Then open the app (dev server binds all interfaces on port 8080).

```bash
npm run build    # production build → dist/
npm run typecheck
```

## Stack

| Layer | Tech |
|-------|------|
| UI | React 19, Tailwind CSS v4, Outfit font |
| 3D | three, @react-three/fiber v9, @react-three/drei |
| State | zustand (persisted favorites/volume) |
| Audio | HTMLAudioElement + hls.js |
| Build | Vite 6, TypeScript |

## Design

- Background: deep space blue-black
- Accent: radio green (living station dots)
- Glass player chrome floating over the globe
- One signature moment: green lights on a quiet Earth

## Project layout

```
src/
  components/
    Globe.tsx         # Earth, markers, orbit, camera fly-to
    Player.tsx        # Sticky bottom player
    Search.tsx        # Mobile search sheet
    StationList.tsx
    AudioEngine.tsx   # Stream attach (mp3/aac/HLS)
  data/stations.ts    # Curated worldwide stations
  store/radio.ts
  lib/geo.ts          # lat/lng → Vector3
  App.tsx
  styles.css          # Cosmic design tokens
```

## Notes

Some streams may be geo-restricted or temporarily offline — try another city.
Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages).
