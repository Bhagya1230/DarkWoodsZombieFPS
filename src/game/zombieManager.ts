/**
 * Procedural Zombie Generation, Wave Spawning, AI Navigation & Animation Manager
 * Features unique multi-part zombie models, glowing eyes, armor variants, and 15 damage per hit
 */
import * as THREE from 'three';
import { ZombieEntity, ZombieArchetype, PickupEntity } from './types';
import { sound } from './audio';

export class ZombieManager {
  public scene: THREE.Scene;
  public zombies: ZombieEntity[] = [];
  public pickups: PickupEntity[] = [];
  private zombieIdCounter = 0;

  // Reusable Materials Palette for Infinite Zombie Variations
  private skinMaterials: THREE.MeshStandardMaterial[] = [];
  private clothMaterials: THREE.MeshStandardMaterial[] = [];
  private armorMaterial: THREE.MeshStandardMaterial;
  private redGlowMaterial: THREE.MeshBasicMaterial;
  private greenGlowMaterial: THREE.MeshBasicMaterial;
  private boneMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Decayed flesh tones
    const skinColors = [0x4a5d4e, 0x55635b, 0x3d4740, 0x6e786b, 0x484252, 0x3a4f41];
    skinColors.forEach((c) => {
      this.skinMaterials.push(
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.85,
          metalness: 0.1,
        })
      );
    });

    // Tattered clothes colors
    const clothColors = [0x1e293b, 0x334155, 0x475569, 0x3b271d, 0x243325, 0x582424, 0x282c34];
    clothColors.forEach((c) => {
      this.clothMaterials.push(
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.9,
          metalness: 0.05,
        })
      );
    });

    this.armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.4,
      metalness: 0.8,
    });

    this.redGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xff1133 });
    this.greenGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x22ff66 });
    this.boneMaterial = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.6 });
  }

  public spawnWave(waveNumber: number) {
    // Clear old dead zombies
    this.cleanupDead();

    // Wave formulas: scales from 6 zombies in Wave 1 up to 42 zombies in Wave 16
    const baseCount = 5;
    const waveCount = Math.min(48, Math.floor(baseCount + waveNumber * 2.4));

    for (let i = 0; i < waveCount; i++) {
      // Pick archetype based on wave progression
      let archetype: ZombieArchetype = 'walker';
      const roll = Math.random();

      if (waveNumber >= 12) {
        if (roll < 0.35) archetype = 'mutant';
        else if (roll < 0.65) archetype = 'brute';
        else if (roll < 0.85) archetype = 'runner';
        else archetype = 'walker';
      } else if (waveNumber >= 8) {
        if (roll < 0.3) archetype = 'brute';
        else if (roll < 0.6) archetype = 'runner';
        else if (roll < 0.8) archetype = 'crawler';
        else archetype = 'walker';
      } else if (waveNumber >= 4) {
        if (roll < 0.35) archetype = 'runner';
        else if (roll < 0.65) archetype = 'crawler';
        else archetype = 'walker';
      } else if (waveNumber >= 2) {
        if (roll < 0.3) archetype = 'runner';
        else archetype = 'walker';
      }

      this.createZombie(archetype, waveNumber);
    }
  }

  private createZombie(archetype: ZombieArchetype, waveNumber: number): ZombieEntity {
    this.zombieIdCounter++;
    const group = new THREE.Group();

    // Randomized skin & cloth materials
    const skinMat = this.skinMaterials[Math.floor(Math.random() * this.skinMaterials.length)];
    const shirtMat = this.clothMaterials[Math.floor(Math.random() * this.clothMaterials.length)];
    const pantsMat = this.clothMaterials[Math.floor(Math.random() * this.clothMaterials.length)];
    const eyeMat = Math.random() > 0.4 ? this.redGlowMaterial : this.greenGlowMaterial;

    // Archetype stat scaling
    let speed = 2.0;
    let maxHealth = 70 + waveNumber * 12;
    let scale = 1.0;
    const isBrute = archetype === 'brute';
    const isMutant = archetype === 'mutant';
    const isRunner = archetype === 'runner';
    const isCrawler = archetype === 'crawler';

    if (isRunner) {
      speed = 4.6 + Math.random() * 0.8;
      maxHealth *= 0.75;
      scale = 0.95;
    } else if (isBrute) {
      speed = 1.6;
      maxHealth *= 2.4;
      scale = 1.35;
    } else if (isMutant) {
      speed = 3.2;
      maxHealth *= 1.8;
      scale = 1.2;
    } else if (isCrawler) {
      speed = 2.4;
      maxHealth *= 0.85;
      scale = 0.85;
    } else {
      speed = 1.8 + Math.random() * 0.7;
    }

    // --- Build Multi-Part Procedural 3D Mesh ---

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.28);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = isCrawler ? 0.25 : 1.15;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // Armor plates for brutes and higher wave walkers
    if (isBrute || (waveNumber >= 6 && Math.random() > 0.5)) {
      const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.45, 0.32), this.armorMaterial);
      chestPlate.position.set(0, 0.05, 0);
      torso.add(chestPlate);

      const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.22), this.armorMaterial);
      shoulderL.position.set(-0.32, 0.25, 0);
      torso.add(shoulderL);
      const shoulderR = shoulderL.clone();
      shoulderR.position.x = 0.32;
      torso.add(shoulderR);
    }

    // 2. Head (with critical hit collider)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.48, 0);
    const headGeo = new THREE.BoxGeometry(0.3, 0.32, 0.3);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Glowing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 0.04, 0.155);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 0.04, 0.155);
    headGroup.add(leftEye, rightEye);

    // Subtle Eye Glow Light
    const eyeLight = new THREE.PointLight(eyeMat === this.redGlowMaterial ? 0xff2244 : 0x22ff66, 0.6, 3.5);
    eyeLight.position.set(0, 0.04, 0.25);
    headGroup.add(eyeLight);

    // Snarl Jaw / Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.05), this.boneMaterial);
    mouth.position.set(0, -0.09, 0.155);
    headGroup.add(mouth);

    torso.add(headGroup);

    // 3. Arms (Pivoted at shoulders)
    const armGeo = new THREE.BoxGeometry(0.14, 0.6, 0.14);
    armGeo.translate(0, -0.25, 0); // pivot at shoulder

    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.32, 0.22, 0);
    leftArm.rotation.x = -Math.PI / 3; // reaching forward menacingly
    torso.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.32, 0.22, 0);
    rightArm.rotation.x = -Math.PI / 3.2;
    torso.add(rightArm);

    // 4. Legs (Pivoted at hips)
    const legGeo = new THREE.BoxGeometry(0.18, 0.75, 0.18);
    legGeo.translate(0, -0.35, 0);

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.15, -0.32, 0);
    torso.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.15, -0.32, 0);
    torso.add(rightLeg);

    if (isCrawler) {
      torso.rotation.x = Math.PI / 2.5;
      leftArm.rotation.x = -Math.PI / 2;
      rightArm.rotation.x = -Math.PI / 2;
      leftLeg.rotation.x = Math.PI / 3;
      rightLeg.rotation.x = Math.PI / 3;
    }

    // Apply scale to overall zombie
    group.scale.set(scale, scale, scale);

    // Spawn randomly in a ring around the forest (32 to 46 units away)
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 32 + Math.random() * 14;
    group.position.set(Math.cos(spawnAngle) * spawnDist, 0, Math.sin(spawnAngle) * spawnDist);

    this.scene.add(group);

    const zombie: ZombieEntity = {
      id: `zombie_${this.zombieIdCounter}`,
      group,
      archetype,
      health: maxHealth,
      maxHealth,
      speed,
      damage: 15, // User requirement: every zombie does 15 damage
      attackRange: isCrawler ? 1.4 : 1.7 * scale,
      attackCooldown: 1.25,
      lastAttackTime: 0,
      state: 'chasing',
      eyeLight,
      headBone: headGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      animTimer: Math.random() * 10,
      animSpeed: isRunner ? 12 : 5.5,
      radius: 0.5 * scale,
    };

    this.zombies.push(zombie);
    return zombie;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    onPlayerHit: (damage: number) => void,
    treeObstacles: { x: number; z: number; radius: number }[],
    onPickupCollected: (type: 'health' | 'ammo', amount: number) => void
  ) {
    const now = performance.now() / 1000;

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (z.state === 'dying') {
        // Fall down death animation
        z.group.rotation.x = THREE.MathUtils.lerp(z.group.rotation.x, Math.PI / 2, delta * 6);
        z.group.position.y = THREE.MathUtils.lerp(z.group.position.y, 0.15, delta * 4);
        continue;
      }

      const dx = playerPos.x - z.group.position.x;
      const dz = playerPos.z - z.group.position.z;
      const dist = Math.hypot(dx, dz);

      // Rotate to face player
      const targetAngle = Math.atan2(dx, dz);
      z.group.rotation.y = THREE.MathUtils.lerp(z.group.rotation.y, targetAngle, delta * 8);

      // Play aggro cry when closing in
      if (dist < 15 && dist > 14 && Math.random() < 0.08) {
        sound.playZombieAggro();
      }

      // Attack if in range
      if (dist <= z.attackRange) {
        z.state = 'attacking';
        if (now - z.lastAttackTime >= z.attackCooldown) {
          z.lastAttackTime = now;
          sound.playZombieGrowl(z.archetype === 'brute' ? 0.7 : 1.2, true);
          onPlayerHit(z.damage); // exactly 15 damage!

          // Claw attack animation swing
          if (z.leftArm && z.rightArm) {
            z.leftArm.rotation.x = -Math.PI / 1.5;
            z.rightArm.rotation.x = -Math.PI / 1.5;
          }
        }
      } else {
        z.state = 'chasing';
        // Move towards player
        const moveDir = new THREE.Vector2(dx / dist, dz / dist);

        // Obstacle avoidance against pine trees and rocks
        for (const obs of treeObstacles) {
          const toObsX = z.group.position.x - obs.x;
          const toObsZ = z.group.position.z - obs.z;
          const obsDist = Math.hypot(toObsX, toObsZ);
          const combinedRadius = z.radius + obs.radius;
          if (obsDist < combinedRadius && obsDist > 0.01) {
            const pushFactor = (combinedRadius - obsDist) / combinedRadius;
            moveDir.x += (toObsX / obsDist) * pushFactor * 1.8;
            moveDir.y += (toObsZ / obsDist) * pushFactor * 1.8;
          }
        }
        moveDir.normalize();

        z.group.position.x += moveDir.x * z.speed * delta;
        z.group.position.z += moveDir.y * z.speed * delta;

        // Limb walk/run animation
        z.animTimer += delta * z.animSpeed;
        const swing = Math.sin(z.animTimer);

        if (z.leftLeg && z.rightLeg) {
          z.leftLeg.rotation.x = swing * 0.65;
          z.rightLeg.rotation.x = -swing * 0.65;
        }
        if (z.leftArm && z.rightArm) {
          z.leftArm.rotation.x = -Math.PI / 3 - swing * 0.45;
          z.rightArm.rotation.x = -Math.PI / 3 + swing * 0.45;
        }
        if (z.headBone) {
          z.headBone.rotation.z = Math.sin(z.animTimer * 0.5) * 0.08;
        }

        // Random guttural growl
        if (Math.random() < 0.003) {
          sound.playZombieGrowl(z.archetype === 'brute' ? 0.75 : 1.1, false);
        }
      }
    }

    // Update Pickups (Hover bobbing, rotation and Player Touch Detection)
    const time = performance.now() / 1000;
    for (let pIdx = this.pickups.length - 1; pIdx >= 0; pIdx--) {
      const p = this.pickups[pIdx];
      p.mesh.rotation.y += delta * 2.8;
      p.mesh.position.y = 0.5 + Math.sin(time * 3 + pIdx) * 0.12;

      const pDist = Math.hypot(playerPos.x - p.mesh.position.x, playerPos.z - p.mesh.position.z);
      if (pDist < 2.2) {
        sound.playPickup();
        onPickupCollected(p.type, p.amount);
        this.scene.remove(p.mesh);
        this.pickups.splice(pIdx, 1);
      }
    }
  }

  public damageZombie(
    zombieId: string,
    damage: number,
    isHeadshot: boolean,
    hitPos: THREE.Vector3,
    onKilled: (zombie: ZombieEntity, isHeadshot: boolean) => void
  ) {
    const z = this.zombies.find((zm) => zm.id === zombieId);
    if (!z || z.state === 'dying') return;

    const actualDamage = isHeadshot ? damage * 2.5 : damage;
    z.health -= actualDamage;
    sound.playZombieHit(isHeadshot);

    // Stagger flinch
    z.group.position.addScaledVector(
      new THREE.Vector3(z.group.position.x - hitPos.x, 0, z.group.position.z - hitPos.z).normalize(),
      0.15
    );

    if (z.health <= 0) {
      z.state = 'dying';
      sound.playZombieDeath();
      if (z.eyeLight) z.eyeLight.intensity = 0;
      onKilled(z, isHeadshot);

      // Chance to spawn pickup
      this.maybeSpawnPickup(z.group.position);

      // Remove after death animation
      setTimeout(() => {
        const idx = this.zombies.findIndex((zm) => zm.id === z.id);
        if (idx !== -1) {
          this.scene.remove(z.group);
          this.zombies.splice(idx, 1);
        }
      }, 2500);
    }
  }

  private maybeSpawnPickup(pos: THREE.Vector3) {
    const roll = Math.random();
    if (roll < 0.35) {
      // Health Kit (+20 HP)
      const group = new THREE.Group();
      // White medical case
      const caseBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.28, 0.22),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.1 })
      );
      // Vivid Green Crosses
      const crossMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.24), crossMat);
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.24), crossMat);
      group.add(caseBox, crossH, crossV);
      group.position.set(pos.x, 0.5, pos.z);

      const light = new THREE.PointLight(0x22c55e, 2.8, 4.5);
      group.add(light);

      this.scene.add(group);
      this.pickups.push({
        id: `pickup_${Math.random()}`,
        type: 'health',
        mesh: group,
        amount: 20, // Prompt requirement: heals 20 HP
        spawnTime: performance.now(),
      });
    } else if (roll < 0.55) {
      // Ammo Crate
      const group = new THREE.Group();
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.22, 0.25),
        new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.5, metalness: 0.4 })
      );
      group.add(box);
      group.position.set(pos.x, 0.35, pos.z);

      const light = new THREE.PointLight(0xeab308, 2.0, 4);
      group.add(light);

      this.scene.add(group);
      this.pickups.push({
        id: `pickup_${Math.random()}`,
        type: 'ammo',
        mesh: group,
        amount: 45,
        spawnTime: performance.now(),
      });
    }
  }

  public getAliveCount(): number {
    return this.zombies.filter((z) => z.state !== 'dying').length;
  }

  private cleanupDead() {
    this.zombies.forEach((z) => {
      this.scene.remove(z.group);
    });
    this.zombies = [];
    this.pickups.forEach((p) => {
      this.scene.remove(p.mesh);
    });
    this.pickups = [];
  }
}
