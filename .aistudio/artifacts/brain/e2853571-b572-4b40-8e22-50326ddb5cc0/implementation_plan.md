# Dark Woods: 16-Wave First-Person Zombie Survival (PWA)

An ultra-realistic, atmospheric first-person 3D zombie survival game built with Three.js, Web Audio API, and Tailwind CSS. The player navigates a dense midnight forest shrouded in mist with a dynamic flashlight, battling hordes of evolving zombies across 16 progressive waves—upgrading weaponry after each wave from a starter tactical pistol to an explosive RPG. Engineered with tailored iPad and iPhone touch controls (floating movement joystick + touch-drag aiming + dedicated fire trigger) alongside full desktop keyboard/mouse pointer-lock support, a pause menu, and Progressive Web App (PWA) desktop installability.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core design decisions incorporate the user's explicit answers and prompt requirements:

- **Visual Atmosphere**: Dark midnight pine forest with dense volumetric mist, directional moonlight filtering through tree canopies, and a player-mounted flashlight spotlight casting dynamic shadows.
- **Controls (Mobile & iPad)**: Left floating analog joystick for 360° omnidirectional locomotion; right-screen touch drag for fluid camera look and aiming; dedicated on-screen Fire button, quick Reload button, and Sprint toggle. Full desktop mouse pointer-lock (`Click to Look`) and WASD keys are automatically supported when played on desktop.
- **Zombie Diversity**: Evolving horror variants across 16 waves featuring procedural hierarchical anatomy, glowing crimson/toxic eyes, randomized civilian/soldier textures, armored brutes, sprint runners, and distinct pitch-modulated groans and aggressive cries.
- **Combat & Health Mechanics**:
  - Player maximum HP: **100**.
  - Zombie strike damage: Exactly **15 damage** per hit with camera flinch, screen blood vignette, and heartbeat audio.
  - Wave counter (1 to 16) and live Zombies Remaining counter on HUD.
  - Automatic weapon tier upgrade upon conquering each wave.
- **Weapon Arsenal Progression (16 Waves)**:
  1. *Wave 1*: Tactical Pistol (M1911)
  2. *Wave 2*: Dual Magnums (.44 Heavy)
  3. *Wave 3*: Sawed-Off Double-Barrel Shotgun
  4. *Wave 4*: MP5 Tactical Submachine Gun
  5. *Wave 5*: Combat Pump Shotgun (12-Gauge)
  6. *Wave 6*: AK-47 Assault Rifle
  7. *Wave 7*: M4A1 Carbine with Holo Sight
  8. *Wave 8*: P90 Bullpup PDW (50-Round Mag)
  9. *Wave 9*: Tactical Crossbow (High-Velocity Piercing)
  10. *Wave 10*: SPAS-12 Semi-Auto Heavy Shotgun
  11. *Wave 11*: Barrett .50 Cal Sniper Rifle
  12. *Wave 12*: M249 Squad Automatic Weapon (LMG)
  13. *Wave 13*: Dual Machine Pistols (Mac-10 Akimbo)
  14. *Wave 14*: Plasma Flame Projector
  15. *Wave 15*: Minigun (Rotary 6-Barrel Beast)
  16. *Wave 16*: RPG-7 Rocket Launcher (Area-of-Effect Annihilator)
- **PWA & Platform Compliance**: Full PWA manifest, service worker caching, high-resolution icons (192px, 512px, 180px apple-touch-icon), standalone viewport styling, and guided iOS Safari "Add to Home Screen" instructions plus 1-tap Chromium/Android install button.

---

## 1. Overview & Core Concept

### What It Does
Dark Woods drops the player into the center of a dense, dark forest perimeter bounded by rocky ridges and towering pine groves. Zombies emerge from the shadows in 16 intensifying waves. Players must survive by managing stamina, landing precision headshots, and mastering each wave's upgraded weapon.

### Target Audience & Device Ergonomics
- **iPad & iPhone users**: Tailored touch layout with generous touch zones, floating thumb movement, right-thumb look tracking, and one-tap fire/reload.
- **Desktop / Laptop players**: Zero-friction pointer lock controls with smooth mouse look and WASD movement.
- **Offline / PWA users**: Can be installed directly to home screens and desktops as a standalone app with full offline gameplay support.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Launch & Start**: Cinematic dark title screen with misty forest backdrop, "Start Survival" CTA, "Install App" button, and controls tutorial modal.
2. **Survival Loop**:
   - Spawns in forest with starter pistol and flashlight.
   - Ambient nocturnal forest sounds (wind, distant rustles, owl, zombie cries).
   - Radar threat indicator pulses as zombies approach from any angle.
   - Shooting spawns muzzle flash, dynamic light burst, bullet tracers, shell casing ejection, and visceral blood impact particles.
   - Taking damage flashes a peripheral blood vignette and drains HP (15 HP per strike).
3. **Wave Clear & Upgrade**:
   - When zombies count hits 0, dramatic wave transition banner appears: "WAVE CLEARED! WEAPON UNLOCKED: [WEAPON NAME]".
   - Gun swaps automatically with inspect animation, audio reload clink, and replenished ammo.
4. **Pause Menu**:
   - Tapping the top-right Pause button (or pressing ESC / P) pauses physics, zombie AI, and animation loop.
   - Displays current Wave, Zombies Defeated, Accuracy, Sensitivity slider, Audio toggle, and "Resume" / "Restart" / "Add to Home Screen" actions.
5. **Game Over & Victory**:
   - Game Over: Death cam collapse with blood curtain, wave reached, zombie kill count, and "Try Again" button.
   - Wave 16 Victory: Sunrise cinematic breaking through the forest with "SURVIVED THE NIGHT" victory screen.

### Visual Identity & Theme
- **Color Palette**:
  - Midnight Canvas: `#05080c` to `#090e17` deep nocturnal atmosphere.
  - Volumetric Fog: `#111827` cool slate mist with light scattering.
  - Flashlight Beam: `#fff7ed` warm tungsten spotlight fading to soft falloff.
  - Blood & Health Accents: `#ef4444` crimson red HP bar, damage flashes, and splatters.
  - Zombie Gaze: Crimson `#dc2626` or Bioluminescent green `#10b981` eyes in the dark.
  - HUD Accents: `#f59e0b` amber ammo counters and `#38bdf8` tactical radar pings.
- **Typography**:
  - Display / Waves: `Plus Jakarta Sans` bold uppercase with tight letter-spacing.
  - HUD Numbers / Ammo / Health: `tabular-nums font-mono` for vertical stability.
- **Audio Soundscape (Procedural Web Audio API)**:
  - Custom procedural audio engine generating 16 unique gunshot sound profiles (snappy 9mm pop, booming 12-gauge blast, rapid AK-47 chug, high-frequency rocket whoosh & bass explosion).
  - Zombie groans, screeching aggro screams on detection, bone-crunching hits, player footsteps, and heartbeat alert when HP < 30.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Procedural Asset Generation vs External 3D Models
- **Chosen Approach**: Procedural 3D multi-part composite models for all 16 weapons, forest scenery (instanced pine trees, ferns, mossy rocks, fog planes), and zombie archetypes, combined with procedural Web Audio synthesis.
- **Why**: Ensures 100% reliability with zero 404 broken model/texture/sound dependencies, instant loading without heavy network asset downloads, and flawless offline PWA capability.
- **Alternatives Considered**: Hosting external `.glb` models and `.wav` files was rejected because external CDNs frequently fail or get blocked in restricted runtimes.

### Decision 2: Dual Input Architecture (Mobile Touch + Desktop Pointer Lock)
- **Chosen Approach**: Auto-detecting input system: on touch devices (iPad/iPhone), displays a responsive floating joystick on the left half and touch-drag look + action buttons on the right. On desktop, shows a "Click to Lock Pointer" overlay for standard WASD + Mouse FPS controls.
- **Why**: Allows one unified codebase to play natively on iPads, iPhones, Macs, and PCs without compromising touch or keyboard/mouse precision.

### Decision 3: Fixed 15 Damage Math & High-Stakes Combat Pacing
- **Chosen Approach**: Player has 100 HP. Each hit deals 15 damage (6 hits = 90 damage, 7th hit kills). Occasional health medkit crates spawn in the forest or drop from boss zombies to allow recovery.
- **Why**: Adheres strictly to the prompt requirement (`hp should be 100 every zombie does 15 damage`) while maintaining thrilling survival balance.

---

## 4. Technical Architecture & Data Strategy

### System Layout & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Root Application                              │
│                    (PWA Manifest, Service Worker)                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          │                                                   │
┌─────────▼──────────────────────────┐    ┌───────────────────▼──────────────────┐
│      Three.js Game Canvas Engine   │    │            React HUD & UI            │
│  - WebGL2 Renderer & Scene Setup   │    │  - Player Health Bar (100 HP)        │
│  - Dense Pine Forest Generator     │    │  - Current Wave (1–16) & Weapon HUD  │
│  - Flashlight & Volumetric Mist    │    │  - Zombies Remaining Counter         │
│  - 16 Procedural Weapon Models     │    │  - Threat Compass / Radar Indicator  │
│  - Zombie AI & Navigation Manager  │    │  - Damage Vignette & Headshot Toast  │
│  - Web Audio FX Synthesizer        │    │  - Floating Touch Joystick & Buttons │
│  - Particle Systems (Blood/Muzzle) │    │  - Pause Menu & Settings Modal       │
└────────────────────────────────────┘    │  - PWA Install Banner & iOS Modal    │
                                          └──────────────────────────────────────┘
```

### Core State & Data Models

```typescript
// Game State
interface GameState {
  status: 'menu' | 'playing' | 'paused' | 'wave_cleared' | 'game_over' | 'victory';
  health: number; // 100 max, -15 per hit
  maxHealth: 100;
  wave: number; // 1 to 16
  zombiesRemaining: number;
  totalZombiesInWave: number;
  score: number;
  kills: number;
  currentWeaponIndex: number; // 0 to 15
  ammoCurrent: number;
  ammoReserve: number;
  isReloading: boolean;
  activeWeapon: WeaponConfig;
}

// Weapon Definition
interface WeaponConfig {
  name: string;
  type: 'pistol' | 'shotgun' | 'smg' | 'rifle' | 'sniper' | 'lmg' | 'special' | 'explosive';
  damage: number;
  fireRate: number; // shots per sec
  magazineSize: number;
  reloadTime: number;
  range: number;
  spread: number;
  bulletSpeed: number;
  isAutomatic: boolean;
  isExplosive?: boolean;
}

// Zombie Entity
interface ZombieEntity {
  id: string;
  group: THREE.Group;
  archetype: 'crawler' | 'walker' | 'runner' | 'brute' | 'mutant';
  health: number;
  maxHealth: number;
  speed: number;
  damage: 15; // prompt requirement: every zombie does 15 damage
  attackCooldown: number;
  lastAttackTime: number;
  state: 'spawning' | 'chasing' | 'attacking' | 'dying';
  eyeLight?: THREE.PointLight;
}
```

### Interactive State Transitions & Controls Mapping
- **Left Thumb Touch**: Instantiates a dynamic virtual thumbstick (`touchId` tracked, calculating normalized direction vector $\vec{v} = (dx, dy)$ for player velocity).
- **Right Thumb Touch**: Tracks touch movement deltas $(\Delta x, \Delta y)$ applying yaw to player rotation and pitch to camera tilt with smooth sensitivity damping.
- **Fire Button Press**: Discharges active weapon if ammo $> 0$ and not reloading; spawns raycast or projectile, calculates headshot multiplier ($2\times$), applies muzzle kick, sound, and particle burst.
- **Reload Button Press / Empty Clip**: Triggers reload timer with mechanical sound sequence and resets magazine count.
- **Pause Toggle**: Suspends `requestAnimationFrame` loop updates, stops zombie movement and attack timers, and displays pause overlay.
- **PWA Installation Flow**: Listens for `beforeinstallprompt` on Android/Desktop to trigger native install prompt; provides iOS Safari guided instructions sheet with visual step icons.
