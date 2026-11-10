/**
 * Dense Midnight Forest 3D Scene Environment
 * High-power player flashlight/torch beam, moonlight, mist, and pine trees
 */
import * as THREE from 'three';

export class ForestEnvironment {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public treeObstacles: { x: number; z: number; radius: number }[] = [];
  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;
  public torchFill: THREE.PointLight;
  private groundMesh: THREE.Mesh;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;

    // Atmospheric Mist Fog - balanced so trees and zombies are clearly visible
    this.scene.fog = new THREE.FogExp2(0x0c1828, 0.015);

    // Ambient Hemisphere Lighting (Cool midnight sky fill)
    const hemiLight = new THREE.HemisphereLight(0x527299, 0x223528, 1.8);
    this.scene.add(hemiLight);

    // Directional Moonlight breaking through tree branches
    const moonLight = new THREE.DirectionalLight(0xc5dfff, 2.2);
    moonLight.position.set(45, 65, 35);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 10;
    moonLight.shadow.camera.far = 150;
    const shadowDist = 50;
    moonLight.shadow.camera.left = -shadowDist;
    moonLight.shadow.camera.right = shadowDist;
    moonLight.shadow.camera.top = shadowDist;
    moonLight.shadow.camera.bottom = -shadowDist;
    moonLight.shadow.bias = -0.0005;
    this.scene.add(moonLight);

    // --- High-Power Player Flashlight & Forward Illumination ---
    // 1. Primary Spotlight Beam (Attached directly to camera for perfect alignment)
    this.flashlight = new THREE.SpotLight(0xfff3d8, 65, 80, Math.PI / 3.8, 0.35, 1.1);
    this.flashlight.position.set(0.18, -0.12, 0.05);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.bias = -0.0008;

    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -25);
    this.camera.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.camera.add(this.flashlight);

    // 2. High-Intensity Forward Torch Fill Light (Illuminates ground, obstacles, and zombies nearby)
    this.torchFill = new THREE.PointLight(0xffedd5, 4.8, 32, 1.2);
    this.torchFill.position.set(0, 0, -0.3);
    this.camera.add(this.torchFill);

    // Forest Ground
    this.groundMesh = this.createGround();
    this.scene.add(this.groundMesh);

    // Populate Forest Elements
    this.createForestVegetation();
    this.createNaturalPerimeter();
  }

  private createGround(): THREE.Mesh {
    // 2D Procedural Forest Floor Canvas (Soil, Pine Needles, Moss Patches)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Forest earth base (lighter than before for clear flashlight bounce)
    ctx.fillStyle = '#28353d';
    ctx.fillRect(0, 0, 512, 512);

    // Patchy moss and fallen foliage
    for (let i = 0; i < 3500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 3 + 1;
      const greenTint = Math.random() > 0.55;
      ctx.fillStyle = greenTint ? 'rgba(45, 78, 42, 0.55)' : 'rgba(58, 45, 32, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pine needles
    ctx.strokeStyle = 'rgba(75, 58, 38, 0.45)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 700; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10);
      ctx.stroke();
    }

    const groundTex = new THREE.CanvasTexture(canvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(24, 24);
    groundTex.colorSpace = THREE.SRGBColorSpace;

    const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const distFromCenter = Math.hypot(vx, vy);
      if (distFromCenter > 6) {
        const height = Math.sin(vx * 0.15) * Math.cos(vy * 0.15) * 0.45 + (Math.random() - 0.5) * 0.15;
        pos.setZ(i, height);
      }
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.82,
      metalness: 0.08,
      color: 0x5a6d78,
    });

    const mesh = new THREE.Mesh(groundGeo, groundMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createForestVegetation() {
    // 1. Instanced Pine Trees (Trunk + Needles)
    const treeCount = 140;
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.38, 5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4d3326,
      roughness: 0.85,
    });
    const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    trunkInstanced.castShadow = true;
    trunkInstanced.receiveShadow = true;

    const needleGeo = new THREE.ConeGeometry(2.2, 4.5, 7);
    needleGeo.translate(0, 3.6, 0);
    const needleMat = new THREE.MeshStandardMaterial({
      color: 0x24422b,
      roughness: 0.75,
    });
    const needleInstanced = new THREE.InstancedMesh(needleGeo, needleMat, treeCount);
    needleInstanced.castShadow = true;
    needleInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;
    const minCenterRadius = 7.5;
    const maxPlayArea = 48;

    while (placed < treeCount) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minCenterRadius + Math.pow(Math.random(), 0.7) * (maxPlayArea - minCenterRadius);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      let tooClose = false;
      for (const t of this.treeObstacles) {
        if (Math.hypot(t.x - x, t.z - z) < 3.2) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      const scale = 0.8 + Math.random() * 0.55;
      const rotY = Math.random() * Math.PI * 2;

      dummy.position.set(x, 2.5 * scale, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set((Math.random() - 0.5) * 0.05, rotY, (Math.random() - 0.5) * 0.05);
      dummy.updateMatrix();

      trunkInstanced.setMatrixAt(placed, dummy.matrix);
      needleInstanced.setMatrixAt(placed, dummy.matrix);

      const tint = new THREE.Color(0x1a3320).lerp(new THREE.Color(0x2f5a38), Math.random());
      needleInstanced.setColorAt(placed, tint);

      this.treeObstacles.push({ x, z, radius: 0.8 * scale });
      placed++;
    }

    trunkInstanced.instanceMatrix.needsUpdate = true;
    needleInstanced.instanceMatrix.needsUpdate = true;
    if (needleInstanced.instanceColor) needleInstanced.instanceColor.needsUpdate = true;

    this.scene.add(trunkInstanced);
    this.scene.add(needleInstanced);

    // 2. Instanced Mossy Boulders
    const rockCount = 50;
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x3d4b57,
      roughness: 0.85,
      metalness: 0.1,
    });
    const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    rockInstanced.castShadow = true;
    rockInstanced.receiveShadow = true;

    for (let i = 0; i < rockCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 5 + Math.random() * 42;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const s = 0.6 + Math.random() * 0.8;

      dummy.position.set(x, 0.4 * s, z);
      dummy.scale.set(s * 1.3, s * 0.7, s);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      rockInstanced.setMatrixAt(i, dummy.matrix);

      this.treeObstacles.push({ x, z, radius: 1.1 * s });
    }
    rockInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(rockInstanced);
  }

  private createNaturalPerimeter() {
    const perimeterCount = 80;
    const cliffGeo = new THREE.BoxGeometry(6, 12, 6);
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x242e38,
      roughness: 0.9,
    });
    const cliffInstanced = new THREE.InstancedMesh(cliffGeo, cliffMat, perimeterCount);
    const dummy = new THREE.Object3D();

    const perimeterRadius = 54;
    for (let i = 0; i < perimeterCount; i++) {
      const angle = (i / perimeterCount) * Math.PI * 2;
      const dist = perimeterRadius + (Math.random() - 0.5) * 4;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      dummy.position.set(x, 4.5, z);
      dummy.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.8, 1 + Math.random() * 0.5);
      dummy.rotation.set(0, angle + Math.PI / 2, 0);
      dummy.updateMatrix();
      cliffInstanced.setMatrixAt(i, dummy.matrix);

      this.treeObstacles.push({ x, z, radius: 3.5 });
    }
    cliffInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(cliffInstanced);
  }

  public toggleFlashlight(on: boolean) {
    this.flashlight.visible = on;
    this.torchFill.visible = on;
  }
}
