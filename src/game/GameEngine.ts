/**
 * Core 3D FPS Game Engine (Three.js WebGL2)
 * Coordinates Scene, Renderer, Forest, Weapons, Zombie AI, Particles, Input, and State
 */
import * as THREE from 'three';
import { GameStatus, PlayerState, WeaponConfig, ZombieEntity, BulletEntity } from './types';
import { WEAPONS } from './weapons';
import { WeaponViewModel } from './proceduralWeapons';
import { ForestEnvironment } from './forestScene';
import { ZombieManager } from './zombieManager';
import { ParticleSystem } from './particles';
import { sound } from './audio';

export class GameEngine {
  public canvasContainer: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  // Game Systems
  public forest: ForestEnvironment;
  public viewModel: WeaponViewModel;
  public zombieManager: ZombieManager;
  public particles: ParticleSystem;

  // Game & Player State
  public status: GameStatus = 'menu';
  public playerState: PlayerState;
  public activeWeapon: WeaponConfig;
  private currentWeaponIdx = 0;

  // Kinematics & Player Movement
  private playerPos = new THREE.Vector3(0, 1.65, 0);
  private playerVelocity = new THREE.Vector3();
  private cameraPitch = 0; // vertical angle
  private cameraYaw = 0; // horizontal angle
  private isPointerLocked = false;
  private lookSensitivity = 1.0;
  private isMoving = false;
  private moveTime = 0;

  // Desktop Keyboard state
  private keys: { [key: string]: boolean } = {};

  // Touch Input State
  private touchMove = new THREE.Vector2(); // x = strafe, y = forward/back
  private isFiringHeld = false;
  private lastFireTime = 0;
  private reloadTimer = 0;

  // Active Projectiles (RPG Rockets, Crossbow Bolts)
  private bullets: BulletEntity[] = [];

  // Frame Loop & Performance
  private frameId = 0;
  private clock = new THREE.Clock();
  private isDestroyed = false;

  // Callbacks to React UI
  public onStateSync?: (state: PlayerState, status: GameStatus, activeWeapon: WeaponConfig, aliveZombies: number) => void;
  public onHeadshotEvent?: (score: number) => void;
  public onWaveClearEvent?: (wave: number, unlockedWeapon: WeaponConfig) => void;
  public onDamageFlash?: () => void;
  public onHealEvent?: (amount: number) => void;

  constructor(container: HTMLElement) {
    this.canvasContainer = container;

    // 1. Renderer Setup with PBR Tone Mapping & Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      180
    );
    this.camera.position.copy(this.playerPos);

    // 3. Scene Setup
    this.scene = new THREE.Scene();

    // 4. Initialize Subsystems
    this.forest = new ForestEnvironment(this.scene, this.camera);
    this.particles = new ParticleSystem(this.scene);
    this.zombieManager = new ZombieManager(this.scene);

    // Attach View Model Weapon to Camera
    this.viewModel = new WeaponViewModel();
    this.camera.add(this.viewModel.group);
    this.scene.add(this.camera);

    // Initial Weapon & Player State
    this.activeWeapon = WEAPONS[0];
    this.playerState = {
      health: 100, // Starts at 100 HP
      maxHealth: 100,
      score: 0,
      kills: 0,
      headshots: 0,
      wave: 1,
      currentWeaponIndex: 0,
      ammoCurrent: this.activeWeapon.magazineSize,
      ammoReserve: this.activeWeapon.ammoCap,
      isReloading: false,
      reloadProgress: 0,
      flashlightOn: true,
      isHit: false,
      lastDamageTime: 0,
    };

    // Bind event listeners
    this.initEventListeners();

    // Start Animation Loop
    this.tick = this.tick.bind(this);
    this.frameId = requestAnimationFrame(this.tick);
  }

  private initEventListeners() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Desktop Pointer Lock click handler
    this.renderer.domElement.addEventListener('click', () => {
      if (this.status === 'playing' && !this.isPointerLocked) {
        sound.init();
        this.renderer.domElement.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked && this.status === 'playing') {
        const factor = 0.002 * this.lookSensitivity;
        this.cameraYaw -= e.movementX * factor;
        this.cameraPitch -= e.movementY * factor;
        this.cameraPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraPitch));
      }
    });

    // Desktop Mouse Down to Shoot
    window.addEventListener('mousedown', (e) => {
      if (this.isPointerLocked && this.status === 'playing' && e.button === 0) {
        this.isFiringHeld = true;
        this.tryFire();
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isFiringHeld = false;
      }
    });
  }

  private onResize = () => {
    if (!this.canvasContainer || this.isDestroyed) return;
    const width = this.canvasContainer.clientWidth;
    const height = this.canvasContainer.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'KeyR' && this.status === 'playing') {
      this.startReload();
    }
    if (e.code === 'KeyF' && this.status === 'playing') {
      this.toggleFlashlight();
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (this.status === 'playing') {
        this.setPaused(true);
      } else if (this.status === 'paused') {
        this.setPaused(false);
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  // --- Public Control APIs for Mobile / Touch & UI ---
  public setTouchMove(x: number, y: number) {
    this.touchMove.set(x, y);
  }

  public applyTouchLook(deltaX: number, deltaY: number) {
    if (this.status !== 'playing') return;
    const factor = 0.0035 * this.lookSensitivity;
    this.cameraYaw -= deltaX * factor;
    this.cameraPitch -= deltaY * factor;
    this.cameraPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.cameraPitch));
  }

  public setTouchFiring(isHeld: boolean) {
    this.isFiringHeld = isHeld;
    if (isHeld && this.status === 'playing') {
      this.tryFire();
    }
  }

  public setLookSensitivity(val: number) {
    this.lookSensitivity = Math.max(0.2, Math.min(3.0, val));
  }

  public setPaused(paused: boolean) {
    if (paused && this.status === 'playing') {
      this.status = 'paused';
      if (this.isPointerLocked) {
        document.exitPointerLock?.();
      }
    } else if (!paused && this.status === 'paused') {
      this.status = 'playing';
      sound.resume();
    }
    this.syncState();
  }

  public startGame() {
    sound.init();
    sound.resume();
    this.status = 'playing';
    this.currentWeaponIdx = 0;
    this.activeWeapon = WEAPONS[0];
    this.viewModel.equip(this.activeWeapon.id);

    this.playerState = {
      health: 100, // Starts at 100 HP
      maxHealth: 100,
      score: 0,
      kills: 0,
      headshots: 0,
      wave: 1,
      currentWeaponIndex: 0,
      ammoCurrent: this.activeWeapon.magazineSize,
      ammoReserve: this.activeWeapon.ammoCap,
      isReloading: false,
      reloadProgress: 0,
      flashlightOn: true,
      isHit: false,
      lastDamageTime: 0,
    };

    this.playerPos.set(0, 1.65, 0);
    this.playerVelocity.set(0, 0, 0);
    this.cameraPitch = 0;
    this.cameraYaw = 0;
    this.bullets = [];
    this.particles.clear();

    // Spawn first wave
    this.zombieManager.spawnWave(1);
    sound.playWaveStart();
    this.syncState();
  }

  public restartGame() {
    this.startGame();
  }

  public toggleFlashlight() {
    this.playerState.flashlightOn = !this.playerState.flashlightOn;
    this.forest.toggleFlashlight(this.playerState.flashlightOn);
    this.syncState();
  }

  public startReload() {
    if (this.playerState.isReloading || this.playerState.ammoReserve <= 0) return;
    if (this.playerState.ammoCurrent === this.activeWeapon.magazineSize) return;

    this.playerState.isReloading = true;
    this.reloadTimer = this.activeWeapon.reloadTime;
    sound.playReload();
    this.syncState();
  }

  // --- Weapon Shooting Logic ---
  private tryFire() {
    if (this.status !== 'playing' || this.playerState.isReloading) return;

    const now = performance.now() / 1000;
    const fireInterval = 1 / this.activeWeapon.fireRate;
    if (now - this.lastFireTime < fireInterval) return;

    if (this.playerState.ammoCurrent <= 0) {
      sound.playEmptyClip();
      this.startReload();
      return;
    }

    this.lastFireTime = now;
    this.playerState.ammoCurrent--;

    // Visual & Sound Feedback
    this.viewModel.triggerMuzzleFlash();
    sound.playGunshot(this.activeWeapon.id);

    // Camera kickback
    this.cameraPitch += (Math.random() * 0.008 + 0.005) * (this.activeWeapon.isExplosive ? 2.5 : 1);

    // Direction vector of the shot
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    // Handle Explosive RPG or Crossbow Projectile
    if (this.activeWeapon.isExplosive) {
      this.fireRocket(camDir);
    } else if (this.activeWeapon.pellets) {
      // Shotgun with multiple pellets
      for (let p = 0; p < this.activeWeapon.pellets; p++) {
        this.fireHitscan(camDir, this.activeWeapon.spread);
      }
    } else {
      // Single bullet hitscan
      this.fireHitscan(camDir, this.activeWeapon.spread);
    }

    // Footstep / Shell ejection particle
    this.syncState();
  }

  private fireHitscan(baseDir: THREE.Vector3, spread: number) {
    const shootDir = baseDir.clone();
    if (spread > 0) {
      shootDir.x += (Math.random() - 0.5) * spread;
      shootDir.y += (Math.random() - 0.5) * spread;
      shootDir.z += (Math.random() - 0.5) * spread;
      shootDir.normalize();
    }

    const raycaster = new THREE.Raycaster(this.camera.position, shootDir, 0.5, 90);

    // Gather candidate meshes from living zombies
    const candidateMeshes: { mesh: THREE.Object3D; zombie: ZombieEntity; isHead: boolean }[] = [];
    for (const z of this.zombieManager.zombies) {
      if (z.state === 'dying') continue;
      z.group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const isHead = child.parent === z.headBone || child === z.headBone;
          candidateMeshes.push({ mesh: child, zombie: z, isHead });
        }
      });
    }

    const hitIntersects = raycaster.intersectObjects(
      candidateMeshes.map((c) => c.mesh),
      false
    );

    const muzzleWorldPos = new THREE.Vector3();
    this.viewModel.muzzleFlashMesh.getWorldPosition(muzzleWorldPos);

    if (hitIntersects.length > 0) {
      const hit = hitIntersects[0];
      const match = candidateMeshes.find((c) => c.mesh === hit.object);
      if (match) {
        // Bullet tracer to zombie
        this.particles.createTracer(muzzleWorldPos, hit.point, this.activeWeapon.damage > 70);
        // Blood splatter
        this.particles.emitBlood(hit.point, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0), match.isHead);

        // Apply Damage
        this.zombieManager.damageZombie(
          match.zombie.id,
          this.activeWeapon.damage,
          match.isHead,
          hit.point,
          (killedZombie, isHeadshot) => {
            this.handleZombieKilled(killedZombie, isHeadshot);
          }
        );
      }
    } else {
      // Hit forest floor / trees or tracer out to distance
      const tracerEnd = this.camera.position.clone().addScaledVector(shootDir, 55);
      this.particles.createTracer(muzzleWorldPos, tracerEnd);
    }
  }

  private fireRocket(dir: THREE.Vector3) {
    const startPos = new THREE.Vector3();
    this.viewModel.muzzleFlashMesh.getWorldPosition(startPos);

    // Create Rocket Visual
    const rocketMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d4a2c })
    );
    rocketMesh.quaternion.copy(this.camera.quaternion);
    rocketMesh.rotation.x += Math.PI / 2;
    rocketMesh.position.copy(startPos);
    this.scene.add(rocketMesh);

    const bullet: BulletEntity = {
      position: startPos,
      velocity: dir.clone().multiplyScalar(this.activeWeapon.bulletSpeed),
      damage: this.activeWeapon.damage,
      distanceTraveled: 0,
      maxDistance: 70,
      isExplosive: true,
      explosionRadius: this.activeWeapon.explosionRadius || 8.0,
      mesh: rocketMesh,
    };
    this.bullets.push(bullet);
  }

  private handleZombieKilled(z: ZombieEntity, isHeadshot: boolean) {
    this.playerState.kills++;
    const points = isHeadshot ? 150 : 100;
    this.playerState.score += points;

    if (isHeadshot) {
      this.playerState.headshots++;
      this.onHeadshotEvent?.(points);
    }

    // Check if Wave Cleared
    const aliveRemaining = this.zombieManager.getAliveCount();
    if (aliveRemaining <= 0) {
      this.handleWaveClear();
    }
    this.syncState();
  }

  private handleWaveClear() {
    this.status = 'wave_cleared';
    sound.playWaveClear();

    const currentWave = this.playerState.wave;

    // Check Victory at Wave 16!
    if (currentWave >= 16) {
      this.status = 'victory';
      this.syncState();
      return;
    }

    // Advance to next wave & upgrade weapon!
    const nextWave = currentWave + 1;
    this.playerState.wave = nextWave;

    // Next Weapon Index (0 to 15 corresponding to Waves 1 to 16)
    this.currentWeaponIdx = Math.min(WEAPONS.length - 1, nextWave - 1);
    this.activeWeapon = WEAPONS[this.currentWeaponIdx];
    this.viewModel.equip(this.activeWeapon.id);

    // Replenish ammo & heal bonus (+20 HP)
    this.playerState.health = Math.min(100, this.playerState.health + 20);
    this.playerState.ammoCurrent = this.activeWeapon.magazineSize;
    this.playerState.ammoReserve = this.activeWeapon.ammoCap;
    this.playerState.isReloading = false;

    this.onWaveClearEvent?.(nextWave, this.activeWeapon);
    this.syncState();

    // After celebratory pause, resume and spawn next wave
    setTimeout(() => {
      if (this.status === 'wave_cleared' && !this.isDestroyed) {
        this.status = 'playing';
        this.zombieManager.spawnWave(nextWave);
        sound.playWaveStart();
        this.syncState();
      }
    }, 3800);
  }

  // --- Player Hit by Zombie (Fixed 15 Damage) ---
  private onPlayerHit = (damage: number) => {
    if (this.status !== 'playing') return;

    // Requirement: every zombie does 15 damage
    const actualDamage = 15;
    this.playerState.health = Math.max(0, this.playerState.health - actualDamage);
    this.playerState.isHit = true;
    this.playerState.lastDamageTime = performance.now();

    sound.playPlayerHurt();
    sound.updateHeartbeat(this.playerState.health);
    this.onDamageFlash?.();

    // Camera flinch
    this.cameraPitch += (Math.random() - 0.5) * 0.05;
    this.cameraYaw += (Math.random() - 0.5) * 0.05;

    if (this.playerState.health <= 0) {
      this.status = 'game_over';
      sound.updateHeartbeat(0);
      if (this.isPointerLocked) {
        document.exitPointerLock?.();
      }
    }
    this.syncState();
  };

  private onPickupCollected = (type: 'health' | 'ammo', amount: number) => {
    if (this.status !== 'playing' && this.status !== 'wave_cleared') return;

    if (type === 'health') {
      const prevHealth = this.playerState.health;
      this.playerState.health = Math.min(100, this.playerState.health + amount);
      const actualHealed = this.playerState.health - prevHealth;
      sound.updateHeartbeat(this.playerState.health);
      this.onHealEvent?.(actualHealed);
    } else if (type === 'ammo') {
      this.playerState.ammoReserve = Math.min(
        this.activeWeapon.ammoCap,
        this.playerState.ammoReserve + amount
      );
    }
    this.syncState();
  };

  // --- Main Tick Loop ---
  private tick() {
    if (this.isDestroyed) return;
    this.frameId = requestAnimationFrame(this.tick);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.status === 'playing' || this.status === 'wave_cleared') {
      this.updatePlayerMovement(delta);
      this.updateWeaponsAndBullets(delta);
      this.zombieManager.update(
        delta,
        this.playerPos,
        this.onPlayerHit,
        this.forest.treeObstacles,
        this.onPickupCollected
      );
      this.particles.update(delta);
    }

    // Always render scene
    this.renderer.render(this.scene, this.camera);
  }

  private updatePlayerMovement(delta: number) {
    // 1. Calculate Desired Movement Vector
    const moveVector = new THREE.Vector3();

    // Keyboard (WASD)
    if (this.keys['KeyW']) moveVector.z -= 1;
    if (this.keys['KeyS']) moveVector.z += 1;
    if (this.keys['KeyA']) moveVector.x -= 1;
    if (this.keys['KeyD']) moveVector.x += 1;

    // Touch Virtual Joystick input
    if (this.touchMove.lengthSq() > 0.001) {
      moveVector.x += this.touchMove.x;
      moveVector.z += this.touchMove.y;
    }

    const hasInput = moveVector.lengthSq() > 0.01;
    if (hasInput) {
      moveVector.normalize();
      this.moveTime += delta;
      this.isMoving = true;

      // Footstep sound cadence
      if (Math.sin(this.moveTime * 10) > 0.95 && Math.random() < 0.25) {
        sound.playFootstep();
      }
    } else {
      this.isMoving = false;
    }

    // Apply Camera Yaw to movement
    const yawEuler = new THREE.Euler(0, this.cameraYaw, 0, 'YXZ');
    moveVector.applyEuler(yawEuler);

    const playerSpeed = 5.6; // Meters per second
    this.playerVelocity.copy(moveVector.multiplyScalar(playerSpeed));

    // Update Position
    const nextX = this.playerPos.x + this.playerVelocity.x * delta;
    const nextZ = this.playerPos.z + this.playerVelocity.z * delta;

    // Collision with Trees / Forest Perimeter
    let canMoveX = true;
    let canMoveZ = true;

    // Forest circular boundary (radius 50 units)
    if (Math.hypot(nextX, this.playerPos.z) > 48) canMoveX = false;
    if (Math.hypot(this.playerPos.x, nextZ) > 48) canMoveZ = false;

    // Obstacle collision
    for (const obs of this.forest.treeObstacles) {
      const minDistance = obs.radius + 0.55;
      if (Math.hypot(nextX - obs.x, this.playerPos.z - obs.z) < minDistance) {
        canMoveX = false;
      }
      if (Math.hypot(this.playerPos.x - obs.x, nextZ - obs.z) < minDistance) {
        canMoveZ = false;
      }
    }

    if (canMoveX) this.playerPos.x = nextX;
    if (canMoveZ) this.playerPos.z = nextZ;

    // Apply Camera Transform
    this.camera.position.copy(this.playerPos);
    this.camera.rotation.set(this.cameraPitch, this.cameraYaw, 0, 'YXZ');

    // Update Weapon Viewmodel sway & recoil
    this.viewModel.update(delta, this.isMoving, this.moveTime);
  }

  private updateWeaponsAndBullets(delta: number) {
    // 1. Handle Automatic Weapon Continuous Fire
    if (this.isFiringHeld && this.activeWeapon.isAutomatic && this.status === 'playing') {
      this.tryFire();
    }

    // 2. Handle Reload Timer
    if (this.playerState.isReloading) {
      this.reloadTimer -= delta;
      this.playerState.reloadProgress = 1 - Math.max(0, this.reloadTimer) / this.activeWeapon.reloadTime;

      if (this.reloadTimer <= 0) {
        // Complete reload
        const needed = this.activeWeapon.magazineSize - this.playerState.ammoCurrent;
        const take = Math.min(needed, this.playerState.ammoReserve);
        this.playerState.ammoCurrent += take;
        this.playerState.ammoReserve -= take;
        this.playerState.isReloading = false;
        this.playerState.reloadProgress = 0;
        this.syncState();
      }
    }

    // 3. Update Active Rockets / Projectiles
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const step = b.velocity.clone().multiplyScalar(delta);
      b.position.add(step);
      b.distanceTraveled += step.length();

      if (b.mesh) {
        b.mesh.position.copy(b.position);
      }

      // Check collision with zombies
      let hit = false;
      for (const z of this.zombieManager.zombies) {
        if (z.state === 'dying') continue;
        const distToZombie = b.position.distanceTo(z.group.position);
        if (distToZombie < 1.4) {
          hit = true;
          break;
        }
      }

      // Check collision with ground or max distance
      if (hit || b.position.y <= 0.2 || b.distanceTraveled >= b.maxDistance) {
        // Explode!
        sound.playExplosion();
        this.particles.emitExplosion(b.position, b.explosionRadius || 8.0);

        // AoE Damage to all nearby zombies
        const blastRadius = b.explosionRadius || 8.0;
        for (const z of this.zombieManager.zombies) {
          if (z.state === 'dying') continue;
          const dist = b.position.distanceTo(z.group.position);
          if (dist <= blastRadius) {
            const damageRatio = 1 - dist / blastRadius;
            const blastDmg = b.damage * damageRatio;
            this.zombieManager.damageZombie(z.id, blastDmg, false, b.position, (killedZombie) => {
              this.handleZombieKilled(killedZombie, false);
            });
          }
        }

        // Clean up projectile mesh
        if (b.mesh) {
          this.scene.remove(b.mesh);
          if ('geometry' in b.mesh && (b.mesh as THREE.Mesh).geometry) {
            (b.mesh as THREE.Mesh).geometry.dispose();
          }
        }
        this.bullets.splice(i, 1);
      }
    }
  }

  private syncState() {
    this.onStateSync?.(
      this.playerState,
      this.status,
      this.activeWeapon,
      this.zombieManager.getAliveCount()
    );
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    sound.cleanup();
    this.renderer.dispose();
  }
}
