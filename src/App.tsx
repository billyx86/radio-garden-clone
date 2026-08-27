import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { Player } from "./components/Player";
import { Search } from "./components/Search";
import { AudioEngine } from "./components/AudioEngine";

/**
 * three.js is by far the heaviest dependency here. The globe is lazy-loaded
 * so the 2D UI (search, player, station list) renders first and the 3D scene
 * streams in behind it (#9).
 */
const GlobeClient = lazy(
  () => import("./components/Globe").then((m) => ({ default: m.GlobeClient })),
);

function GlobeFallback() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 text-radio spin-slow" />
      <p className="text-sm text-muted">Spinning up the globe…</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <AudioEngine />

      <Suspense fallback={<GlobeFallback />}>
        <GlobeClient />
      </Suspense>

      {/* Soft vignette for UI readability */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 100%, oklch(0.1 0.02 260 / 0.55), transparent 70%), linear-gradient(to bottom, oklch(0.1 0.02 260 / 0.45) 0%, transparent 18%, transparent 72%, oklch(0.1 0.02 260 / 0.5) 100%)",
        }}
      />

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 safe-top flex justify-center pt-14">
        <h1 className="pointer-events-none select-none text-center text-[11px] font-medium uppercase tracking-[0.28em] text-muted/80">
          Radio Garden
        </h1>
      </div>

      <Search />
      <Player />
    </div>
  );
}
