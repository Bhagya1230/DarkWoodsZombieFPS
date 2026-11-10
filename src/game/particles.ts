/**
 * High-Performance Particle Engine for Blood Splatters, Tracers, Explosions, and Shell Ejections
 */
import * as THREE from 'three';
import { Particle } from './types';

export class ParticleSystem {
  public scene: THREE.Scene;
  private particles: Particle[] = [];
  private pointGeometry: THREE.BufferGeometry;
  private pointMaterial: THREE.PointsMaterial;
  private pointsMesh: THREE.Points;
  private maxParticles = 600;
  private positions: Float32Array;
  private colors: Float32Array;

  // Tracers
  private tracerLines: { line: THREE.Line; life: number; maxLife: number }[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);

    this.pointGeometry = new THREE.BufferGeometry();
    this.pointGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.pointGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.pointMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.pointGeometry, this.pointMaterial);
    this.scene.add(this.pointsMesh);
  }

  public emitBlood(origin: THREE.Vector3, normal: THREE.Vector3, isHeadshot = false) {
    const count = isHeadshot ? 28 : 14;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const spread = isHeadshot ? 0.8 : 0.45;
      const vel = new THREE.Vector3(
        normal.x + (Math.random() - 0.5) * spread,
        normal.y + (Math.random() - 0.2) * spread + 0.3,
        normal.z + (Math.random() - 0.5) * spread
      ).multiplyScalar(2.5 + Math.random() * 3.5);

      const color = isHeadshot
        ? new THREE.Color(0x990000).lerp(new THREE.Color(0xd62828), Math.random())
        : new THREE.Color(0x7a0c0c).lerp(new THREE.Color(0xa81818), Math.random());

      this.particles.push({
        position: origin.clone(),
        velocity: vel,
        color,
        size: isHeadshot ? 0.14 : 0.09,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.3,
        gravity: 12.0,
      });
    }
  }

  public emitExplosion(center: THREE.Vector3, radius: number) {
    const count = 75;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const pitch = (Math.random() - 0.2) * Math.PI;
      const speed = 4 + Math.random() * 10;
      const vel = new THREE.Vector3(
        Math.cos(angle) * Math.cos(pitch) * speed,
        Math.sin(pitch) * speed + 2.5,
        Math.sin(angle) * Math.cos(pitch) * speed
      );

      const color = new THREE.Color(0xff4500).lerp(new THREE.Color(0xffd700), Math.random());

      this.particles.push({
        position: center.clone(),
        velocity: vel,
        color,
        size: 0.24,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.5,
        gravity: 8.0,
      });
    }
  }

  public emitDust(origin: THREE.Vector3, normal: THREE.Vector3) {
    for (let i = 0; i < 6; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const vel = new THREE.Vector3(
        normal.x + (Math.random() - 0.5) * 0.5,
        normal.y + Math.random() * 0.5,
        normal.z + (Math.random() - 0.5) * 0.5
      ).multiplyScalar(1.5 + Math.random() * 2);

      this.particles.push({
        position: origin.clone(),
        velocity: vel,
        color: new THREE.Color(0x8a929a),
        size: 0.08,
        life: 0,
        maxLife: 0.35,
        gravity: 5.0,
      });
    }
  }

  public createTracer(start: THREE.Vector3, end: THREE.Vector3, isHeavy = false) {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({
      color: isHeavy ? 0xffcc33 : 0xffea88,
      transparent: true,
      opacity: 0.85,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracerLines.push({ line, life: 0, maxLife: 0.06 });
  }

  public update(delta: number) {
    // 1. Update Point Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.velocity.y -= p.gravity * delta;
      p.position.addScaledVector(p.velocity, delta);

      // Floor bounce / clamp
      if (p.position.y < 0.05) {
        p.position.y = 0.05;
        p.velocity.y *= -0.3;
        p.velocity.x *= 0.7;
        p.velocity.z *= 0.7;
      }
    }

    // Pack into buffer attributes
    const activeCount = this.particles.length;
    for (let i = 0; i < this.maxParticles; i++) {
      const i3 = i * 3;
      if (i < activeCount) {
        const p = this.particles[i];
        this.positions[i3] = p.position.x;
        this.positions[i3 + 1] = p.position.y;
        this.positions[i3 + 2] = p.position.z;

        this.colors[i3] = p.color.r;
        this.colors[i3 + 1] = p.color.g;
        this.colors[i3 + 2] = p.color.b;
      } else {
        // Place unused offscreen
        this.positions[i3] = 0;
        this.positions[i3 + 1] = -999;
        this.positions[i3 + 2] = 0;
      }
    }

    this.pointGeometry.attributes.position.needsUpdate = true;
    this.pointGeometry.attributes.color.needsUpdate = true;

    // 2. Update Tracers
    for (let i = this.tracerLines.length - 1; i >= 0; i--) {
      const tr = this.tracerLines[i];
      tr.life += delta;
      if (tr.life >= tr.maxLife) {
        this.scene.remove(tr.line);
        tr.line.geometry.dispose();
        (tr.line.material as THREE.Material).dispose();
        this.tracerLines.splice(i, 1);
      }
    }
  }

  public clear() {
    this.particles = [];
    this.tracerLines.forEach((t) => {
      this.scene.remove(t.line);
      t.line.geometry.dispose();
      (t.line.material as THREE.Material).dispose();
    });
    this.tracerLines = [];
  }
}
