/**
 * Types and interfaces for Dark Woods: 16-Wave Zombie FPS
 */
import * as THREE from 'three';

export type GameStatus =
  | 'menu'
  | 'playing'
  | 'paused'
  | 'wave_cleared'
  | 'game_over'
  | 'victory';

export type WeaponType =
  | 'pistol'
  | 'dual_pistols'
  | 'sawed_off'
  | 'smg'
  | 'shotgun'
  | 'rifle_ak'
  | 'carbine'
  | 'p90'
  | 'crossbow'
  | 'spas12'
  | 'sniper'
  | 'lmg'
  | 'akimbo_mac'
  | 'flamethrower'
  | 'minigun'
  | 'rpg';

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  wave: number; // Wave unlocked (1 to 16)
  damage: number;
  fireRate: number; // shots per second
  magazineSize: number;
  reloadTime: number; // seconds
  pellets?: number; // for shotguns
  spread: number;
  bulletSpeed: number;
  isAutomatic: boolean;
  isExplosive?: boolean;
  explosionRadius?: number;
  ammoCap: number; // max reserve ammo
  description: string;
}

export type ZombieArchetype = 'walker' | 'crawler' | 'runner' | 'brute' | 'mutant';

export interface ZombieEntity {
  id: string;
  group: THREE.Group;
  archetype: ZombieArchetype;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number; // User requirement: exactly 15 damage per hit
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  state: 'spawning' | 'chasing' | 'attacking' | 'dying';
  eyeLight?: THREE.PointLight;
  headBone?: THREE.Object3D;
  leftArm?: THREE.Object3D;
  rightArm?: THREE.Object3D;
  leftLeg?: THREE.Object3D;
  rightLeg?: THREE.Object3D;
  animTimer: number;
  animSpeed: number;
  radius: number;
}

export interface PlayerState {
  health: number; // starts at 100, max 100
  maxHealth: 100;
  score: number;
  kills: number;
  headshots: number;
  wave: number; // 1 to 16
  currentWeaponIndex: number;
  ammoCurrent: number;
  ammoReserve: number;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  flashlightOn: boolean;
  isHit: boolean;
  lastDamageTime: number;
}

export interface PickupEntity {
  id: string;
  type: 'health' | 'ammo';
  mesh: THREE.Group;
  amount: number;
  spawnTime: number;
}

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  gravity: number;
}

export interface BulletEntity {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;
  isExplosive?: boolean;
  explosionRadius?: number;
  mesh?: THREE.Object3D;
}
