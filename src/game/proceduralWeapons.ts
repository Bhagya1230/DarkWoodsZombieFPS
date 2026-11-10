/**
 * 3D Procedural Viewmodel Weapons attached to First-Person Camera
 * High-detail composite THREE.Group models with PBR materials
 */
import * as THREE from 'three';
import { WeaponType } from './types';

export class WeaponViewModel {
  public group: THREE.Group;
  public muzzleFlashMesh: THREE.Mesh;
  public muzzleLight: THREE.PointLight;
  private currentWeaponType: WeaponType = 'pistol';
  private weaponMeshes: Map<WeaponType, THREE.Group> = new Map();
  private recoilOffset = new THREE.Vector3();
  private recoilRotation = new THREE.Euler();
  private minigunBarrels: THREE.Group | null = null;
  private swayOffset = new THREE.Vector3();

  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0.24, -0.22, -0.45); // First person right-hand hip position

    // Dynamic Muzzle Flash Light
    this.muzzleLight = new THREE.PointLight(0xffaa33, 0, 8);
    this.muzzleLight.position.set(0, 0.08, -0.4);
    this.group.add(this.muzzleLight);

    // Muzzle Flash Billboard Mesh
    const flashGeo = new THREE.PlaneGeometry(0.18, 0.18);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffeedd,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.position.set(0, 0.08, -0.45);
    this.group.add(this.muzzleFlashMesh);

    this.buildAllWeapons();
    this.equip('pistol');
  }

  private buildAllWeapons() {
    // Shared Materials
    const darkSteel = new THREE.MeshStandardMaterial({
      color: 0x1e242b,
      metalness: 0.85,
      roughness: 0.3,
    });
    const gunMetal = new THREE.MeshStandardMaterial({
      color: 0x333b45,
      metalness: 0.9,
      roughness: 0.25,
    });
    const polymer = new THREE.MeshStandardMaterial({
      color: 0x111317,
      metalness: 0.2,
      roughness: 0.65,
    });
    const wood = new THREE.MeshStandardMaterial({
      color: 0x5c3317,
      metalness: 0.05,
      roughness: 0.75,
    });
    const goldBrass = new THREE.MeshStandardMaterial({
      color: 0xc89d3c,
      metalness: 0.9,
      roughness: 0.2,
    });
    const opticGlass = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
    });
    const holoDot = new THREE.MeshBasicMaterial({
      color: 0xef4444,
    });
    const plasmaGlow = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    // 1. Pistol
    const pistol = new THREE.Group();
    const pSlide = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.048, 0.22), gunMetal);
    pSlide.position.set(0, 0.05, -0.05);
    const pFrame = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.045, 0.18), darkSteel);
    pFrame.position.set(0, 0.02, -0.04);
    const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.11, 0.06), polymer);
    pGrip.position.set(0, -0.05, 0.02);
    pGrip.rotation.x = 0.22;
    const pBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 12), darkSteel);
    pBarrel.rotation.x = Math.PI / 2;
    pBarrel.position.set(0, 0.05, -0.18);
    pistol.add(pSlide, pFrame, pGrip, pBarrel);
    this.weaponMeshes.set('pistol', pistol);

    // 2. Dual Magnums
    const dualMag = new THREE.Group();
    const rightMag = pistol.clone();
    rightMag.scale.set(1.2, 1.2, 1.2);
    rightMag.position.set(0.08, 0, 0);
    const leftMag = rightMag.clone();
    leftMag.position.set(-0.24, -0.02, 0.04);
    dualMag.add(rightMag, leftMag);
    this.weaponMeshes.set('dual_pistols', dualMag);

    // 3. Sawed-off Double Barrel
    const sawedOff = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.26, 12), gunMetal);
    b1.rotation.x = Math.PI / 2;
    b1.position.set(-0.018, 0.04, -0.12);
    const b2 = b1.clone();
    b2.position.set(0.018, 0.04, -0.12);
    const sStock = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.09, 0.16), wood);
    sStock.position.set(0, -0.03, 0.04);
    sStock.rotation.x = 0.35;
    sawedOff.add(b1, b2, sStock);
    this.weaponMeshes.set('sawed_off', sawedOff);

    // 4. MP5 SMG
    const mp5 = new THREE.Group();
    const mp5Body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.32), darkSteel);
    const mp5Barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 12), darkSteel);
    mp5Barrel.rotation.x = Math.PI / 2;
    mp5Barrel.position.set(0, 0.01, -0.22);
    const mp5Grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.05), polymer);
    mp5Grip.position.set(0, -0.07, 0.06);
    mp5Grip.rotation.x = 0.2;
    const mp5Mag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.045), darkSteel);
    mp5Mag.position.set(0, -0.09, -0.04);
    mp5Mag.rotation.x = -0.2;
    mp5.add(mp5Body, mp5Barrel, mp5Grip, mp5Mag);
    this.weaponMeshes.set('smg', mp5);

    // 5. Combat Shotgun 12G
    const shotgun = new THREE.Group();
    const sgBody = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.38), darkSteel);
    const sgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.32, 12), gunMetal);
    sgBarrel.rotation.x = Math.PI / 2;
    sgBarrel.position.set(0, 0.025, -0.32);
    const sgTube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 12), darkSteel);
    sgTube.rotation.x = Math.PI / 2;
    sgTube.position.set(0, -0.01, -0.3);
    const sgPump = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.12, 12), polymer);
    sgPump.rotation.x = Math.PI / 2;
    sgPump.position.set(0, -0.01, -0.28);
    const sgStock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.22), polymer);
    sgStock.position.set(0, -0.04, 0.18);
    shotgun.add(sgBody, sgBarrel, sgTube, sgPump, sgStock);
    this.weaponMeshes.set('shotgun', shotgun);

    // 6. AK-47
    const ak47 = new THREE.Group();
    const akBody = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.075, 0.42), darkSteel);
    const akWood = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.065, 0.18), wood);
    akWood.position.set(0, 0.005, -0.16);
    const akBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.26, 12), gunMetal);
    akBarrel.rotation.x = Math.PI / 2;
    akBarrel.position.set(0, 0.015, -0.36);
    const akCurvedMag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.06), darkSteel);
    akCurvedMag.position.set(0, -0.11, -0.03);
    akCurvedMag.rotation.x = -0.35;
    const akStock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.1, 0.24), wood);
    akStock.position.set(0, -0.03, 0.22);
    akStock.rotation.x = 0.15;
    ak47.add(akBody, akWood, akBarrel, akCurvedMag, akStock);
    this.weaponMeshes.set('rifle_ak', ak47);

    // 7. M4A1 Holo Carbine
    const m4 = new THREE.Group();
    const m4Body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.075, 0.44), darkSteel);
    const m4Barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 12), gunMetal);
    m4Barrel.rotation.x = Math.PI / 2;
    m4Barrel.position.set(0, 0.015, -0.38);
    // Holo Sight
    const holoFrame = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.055, 0.08), polymer);
    holoFrame.position.set(0, 0.07, -0.05);
    const holoLens = new THREE.Mesh(new THREE.PlaneGeometry(0.032, 0.038), opticGlass);
    holoLens.position.set(0, 0.072, -0.05);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 8), holoDot);
    dot.position.set(0, 0.072, -0.05);
    const m4Mag = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.17, 0.06), polymer);
    m4Mag.position.set(0, -0.1, -0.05);
    m4Mag.rotation.x = -0.15;
    m4.add(m4Body, m4Barrel, holoFrame, holoLens, dot, m4Mag);
    this.weaponMeshes.set('carbine', m4);

    // 8. P90
    const p90 = new THREE.Group();
    const p90Body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.42), polymer);
    const p90Mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.025, 0.26), goldBrass);
    p90Mag.position.set(0, 0.08, -0.06);
    const p90Barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.1, 12), darkSteel);
    p90Barrel.rotation.x = Math.PI / 2;
    p90Barrel.position.set(0, 0.02, -0.24);
    p90.add(p90Body, p90Mag, p90Barrel);
    this.weaponMeshes.set('p90', p90);

    // 9. Combat Crossbow
    const crossbow = new THREE.Group();
    const xStock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.46), polymer);
    const limbL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.03), darkSteel);
    limbL.position.set(-0.11, 0.02, -0.18);
    limbL.rotation.y = 0.35;
    const limbR = limbL.clone();
    limbR.position.set(0.11, 0.02, -0.18);
    limbR.rotation.y = -0.35;
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.3, 8), goldBrass);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(0, 0.035, -0.12);
    crossbow.add(xStock, limbL, limbR, bolt);
    this.weaponMeshes.set('crossbow', crossbow);

    // 10. SPAS-12
    const spas = shotgun.clone();
    const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 12, 1, true), darkSteel);
    heatShield.rotation.x = Math.PI / 2;
    heatShield.position.set(0, 0.025, -0.28);
    spas.add(heatShield);
    this.weaponMeshes.set('spas12', spas);

    // 11. Barrett .50 Cal Sniper
    const sniper = new THREE.Group();
    const snBody = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.085, 0.55), darkSteel);
    const snBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.52, 12), gunMetal);
    snBarrel.rotation.x = Math.PI / 2;
    snBarrel.position.set(0, 0.02, -0.5);
    const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.08), gunMetal);
    muzzleBrake.position.set(0, 0.02, -0.76);
    // Sniper Scope
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 16), darkSteel);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.09, -0.08);
    sniper.add(snBody, snBarrel, muzzleBrake, scope);
    this.weaponMeshes.set('sniper', sniper);

    // 12. M249 SAW LMG
    const lmg = new THREE.Group();
    const lmgBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.48), darkSteel);
    const lmgBox = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: 0x2e422c }));
    lmgBox.position.set(-0.06, -0.09, 0.02);
    const lmgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.35, 12), gunMetal);
    lmgBarrel.rotation.x = Math.PI / 2;
    lmgBarrel.position.set(0, 0.02, -0.42);
    lmg.add(lmgBody, lmgBox, lmgBarrel);
    this.weaponMeshes.set('lmg', lmg);

    // 13. Akimbo MAC-10
    const akimboMac = new THREE.Group();
    const mac1 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.22), darkSteel);
    const macMag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.04), darkSteel);
    macMag.position.set(0, -0.08, 0.02);
    const macG = new THREE.Group();
    macG.add(mac1, macMag);
    macG.position.set(0.08, 0, 0);
    const macG2 = macG.clone();
    macG2.position.set(-0.24, -0.02, 0.04);
    akimboMac.add(macG, macG2);
    this.weaponMeshes.set('akimbo_mac', akimboMac);

    // 14. Plasma Flamethrower
    const plasma = new THREE.Group();
    const plBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.42), darkSteel);
    const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.24, 16), plasmaGlow);
    canister.rotation.x = Math.PI / 2;
    canister.position.set(0, -0.08, 0.05);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.018, 0.14, 12), gunMetal);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0.02, -0.26);
    plasma.add(plBody, canister, nozzle);
    this.weaponMeshes.set('flamethrower', plasma);

    // 15. Minigun
    const minigun = new THREE.Group();
    const mgHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.22, 16), darkSteel);
    mgHousing.rotation.x = Math.PI / 2;
    const barrelsGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.45, 8), gunMetal);
      b.rotation.x = Math.PI / 2;
      b.position.set(Math.cos(angle) * 0.04, Math.sin(angle) * 0.04, -0.28);
      barrelsGroup.add(b);
    }
    this.minigunBarrels = barrelsGroup;
    minigun.add(mgHousing, barrelsGroup);
    minigun.position.set(0, -0.05, 0);
    this.weaponMeshes.set('minigun', minigun);

    // 16. RPG-7
    const rpg = new THREE.Group();
    const launchTube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.75, 16), darkSteel);
    launchTube.rotation.x = Math.PI / 2;
    const woodShield = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 16), wood);
    woodShield.rotation.x = Math.PI / 2;
    woodShield.position.set(0, 0, -0.05);
    // Warhead
    const warheadCone = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0x3d4a2c }));
    warheadCone.rotation.x = -Math.PI / 2;
    warheadCone.position.set(0, 0, -0.46);
    const warheadTip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), goldBrass);
    warheadTip.rotation.x = Math.PI / 2;
    warheadTip.position.set(0, 0, -0.58);
    rpg.add(launchTube, woodShield, warheadCone, warheadTip);
    this.weaponMeshes.set('rpg', rpg);

    // Add all to root group
    this.weaponMeshes.forEach((mesh) => {
      mesh.visible = false;
      this.group.add(mesh);
    });
  }

  public equip(type: WeaponType) {
    this.currentWeaponType = type;
    this.weaponMeshes.forEach((mesh, key) => {
      mesh.visible = key === type;
    });

    // Adjust muzzle flash offset depending on weapon length
    if (type === 'sniper' || type === 'rpg') {
      this.muzzleFlashMesh.position.set(0, 0.08, -0.75);
      this.muzzleLight.position.set(0, 0.08, -0.7);
    } else if (type === 'pistol' || type === 'dual_pistols') {
      this.muzzleFlashMesh.position.set(0, 0.07, -0.25);
      this.muzzleLight.position.set(0, 0.07, -0.22);
    } else {
      this.muzzleFlashMesh.position.set(0, 0.08, -0.48);
      this.muzzleLight.position.set(0, 0.08, -0.45);
    }
  }

  public triggerMuzzleFlash() {
    this.muzzleLight.intensity = 5;
    (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 1;
    this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI * 2;

    // Apply kickback recoil
    this.recoilOffset.z = 0.06;
    this.recoilOffset.y = 0.02;
    this.recoilRotation.x = 0.08;
  }

  public update(delta: number, isMoving: boolean, moveTime: number) {
    // Fade out muzzle flash
    if (this.muzzleLight.intensity > 0) {
      this.muzzleLight.intensity = Math.max(0, this.muzzleLight.intensity - delta * 40);
      const mat = this.muzzleFlashMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, mat.opacity - delta * 25);
    }

    // Recover recoil smoothly
    this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), delta * 15);
    this.recoilRotation.x = THREE.MathUtils.lerp(this.recoilRotation.x, 0, delta * 15);

    // Walking / Breathing sway
    if (isMoving) {
      this.swayOffset.x = Math.sin(moveTime * 8) * 0.015;
      this.swayOffset.y = Math.abs(Math.cos(moveTime * 8)) * 0.012;
    } else {
      // Gentle breathing sway
      this.swayOffset.x = Math.sin(moveTime * 2) * 0.003;
      this.swayOffset.y = Math.cos(moveTime * 2) * 0.003;
    }

    // Minigun barrel rotation
    if (this.currentWeaponType === 'minigun' && this.minigunBarrels) {
      this.minigunBarrels.rotation.z += delta * 12;
    }

    // Combine base position with sway and recoil
    this.group.position.set(
      0.24 + this.swayOffset.x + this.recoilOffset.x,
      -0.22 + this.swayOffset.y + this.recoilOffset.y,
      -0.45 + this.recoilOffset.z
    );
    this.group.rotation.x = this.recoilRotation.x;
  }
}
