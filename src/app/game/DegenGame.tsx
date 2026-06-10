"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// ─── Character Definitions ───────────────────────────────────────────────────
const CHARACTERS = [
  { id: "pepe",     name: "Pepe",     emoji: "🐸", color: 0x4caf50, speed: 6.5, jumpPower: 14, texture: "/characters/pepe.png"     },
  { id: "gigachad", name: "Gigachad", emoji: "💪", color: 0xe0b87a, speed: 5.5, jumpPower: 12, texture: "/characters/gigachad.png" },
  { id: "trump",    name: "Trump",    emoji: "🎩", color: 0x1a5fa8, speed: 5.0, jumpPower: 11, texture: "/characters/trump.png"    },
  { id: "troll",    name: "Trollface",emoji: "🧌", color: 0x888888, speed: 7.0, jumpPower: 13, texture: "/characters/troll.png"    },
  { id: "bonk",     name: "Bonk",     emoji: "🐕", color: 0xe8853a, speed: 8.0, jumpPower: 15, texture: "/characters/bonk.png"     },
];

// ─── Constants ───────────────────────────────────────────────────────────────
const GRAVITY       = -28;
const TOWER_WIDTH   = 10;
const PLATFORM_W    = 4.0;
const PLATFORM_H    = 0.35;
const FLOOR_HEIGHT  = 7;        // vertical distance between platform rows
const FLOORS_VISIBLE= 6;        // floors rendered at once
const ENEMY_SPEED   = 1.8;

interface CharDef { id: string; name: string; emoji: string; color: number; speed: number; jumpPower: number; texture: string; }
interface Props { onBack: () => void; }

// ─────────────────────────────────────────────────────────────────────────────
//  GAME ENGINE
// ─────────────────────────────────────────────────────────────────────────────
class TowerEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private animId = 0;
  private char: CharDef;
  private callbacks: { onScore: (s:number)=>void; onHealth: (h:number)=>void; onFloor: (f:number)=>void; onDead: ()=>void };

  // Player state
  private player!: THREE.Mesh;
  private playerSprite!: THREE.Mesh;
  private velX = 0; velY = 0;
  private onGround = false;
  private facing = 1;

  // Controls
  public keys: Record<string,boolean> = {};
  public joystickX = 0;
  public jumpPressed = false;
  public attackPressed = false;
  private attackCooldown = 0;
  private specialCooldown = 0;

  // World
  private platforms: { mesh: THREE.Mesh; x: number; y: number; w: number }[] = [];
  private enemies: { mesh: THREE.Mesh; label: THREE.Sprite; x: number; y: number; vx: number; hp: number; range: number; originX: number }[] = [];
  private particles: { mesh: THREE.Mesh; vx: number; vy: number; life: number }[] = [];

  // Score / state
  private score = 0;
  private health = 100;
  private currentFloor = 1;
  private highestFloor = 1;
  private dead = false;
  private invincibleTimer = 0;

  // Floor gen
  private generatedUpTo = 0;
  private towerGroup!: THREE.Group;
  private loader = new THREE.TextureLoader();

  constructor(
    container: HTMLDivElement,
    char: CharDef,
    cb: typeof TowerEngine.prototype.callbacks
  ) {
    this.char = char;
    this.callbacks = cb;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearColor(0x0a0014);
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0014, 20, 60);

    // Camera — side view, follows player
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 5, 20);
    this.camera.lookAt(0, 5, 0);

    this.clock = new THREE.Clock();

    // Lights
    const ambient = new THREE.AmbientLight(0x8866bb, 0.8);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffd700, 1.2);
    dir.position.set(5, 20, 10);
    dir.castShadow = true;
    this.scene.add(dir);
    const pt = new THREE.PointLight(0x9933ff, 3, 30);
    pt.position.set(0, 8, 5);
    this.scene.add(pt);

    this.towerGroup = new THREE.Group();
    this.scene.add(this.towerGroup);

    this.buildTowerWalls();
    this.generateFloors(0, 10);
    this.spawnPlayer();
    this.buildBackground();

    window.addEventListener("resize", () => this.onResize(container));
  }

  // ─── Tower walls ──────────────────────────────────────────────────────────
  private buildTowerWalls() {
    const wallMat = new THREE.MeshLambertMaterial({
      color: 0x1a0a3a,
      emissive: 0x110028,
    });
    const wallGeo = new THREE.BoxGeometry(0.6, 200, 3);
    const lWall = new THREE.Mesh(wallGeo, wallMat);
    lWall.position.set(-TOWER_WIDTH / 2 - 0.3, 100, 0);
    const rWall = new THREE.Mesh(wallGeo, wallMat);
    rWall.position.set(TOWER_WIDTH / 2 + 0.3, 100, 0);

    // Neon edge glow strips
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xaa44ff });
    const edgeGeo = new THREE.BoxGeometry(0.08, 200, 0.08);
    const lEdge = new THREE.Mesh(edgeGeo, edgeMat);
    lEdge.position.set(-TOWER_WIDTH / 2, 100, 1.6);
    const rEdge = new THREE.Mesh(edgeGeo, edgeMat);
    rEdge.position.set(TOWER_WIDTH / 2, 100, 1.6);

    this.towerGroup.add(lWall, rWall, lEdge, rEdge);

    // Floor (ground)
    const groundGeo = new THREE.BoxGeometry(TOWER_WIDTH, 0.5, 4);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x220044 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.25, 0);
    ground.receiveShadow = true;
    this.towerGroup.add(ground);
    this.platforms.push({ mesh: ground, x: 0, y: 0, w: TOWER_WIDTH });
  }

  // ─── Generate floors ──────────────────────────────────────────────────────
  private generateFloors(fromFloor: number, toFloor: number) {
    const platMat = new THREE.MeshLambertMaterial({ color: 0x3a1060, emissive: 0x1a0040 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xcc44ff });

    for (let f = Math.max(1, fromFloor); f <= toFloor; f++) {
      const baseY = f * FLOOR_HEIGHT;
      // 2–3 platforms per floor, staggered
      const count = f % 3 === 0 ? 3 : 2;
      const positions = count === 2
        ? [-2.2, 2.2]
        : [-3.2, 0, 3.2];

      positions.forEach((px, i) => {
        const py = baseY + (i % 2) * 1.8;
        const platGeo = new THREE.BoxGeometry(PLATFORM_W, PLATFORM_H, 3);
        const plat = new THREE.Mesh(platGeo, platMat.clone());
        plat.position.set(px, py, 0);
        plat.receiveShadow = true;
        plat.castShadow = true;
        this.towerGroup.add(plat);
        this.platforms.push({ mesh: plat, x: px, y: py, w: PLATFORM_W });

        // Neon top edge
        const edgeGeo = new THREE.BoxGeometry(PLATFORM_W, 0.05, 0.1);
        const edge = new THREE.Mesh(edgeGeo, glowMat.clone());
        (edge.material as THREE.MeshBasicMaterial).color.setHex(0x9966ff);
        edge.position.set(px, py + PLATFORM_H / 2 + 0.025, 1.55);
        this.towerGroup.add(edge);

        // Spawn enemy on some platforms
        if (f > 0 && (i === 0 || count === 3) && Math.random() > 0.35) {
          this.spawnEnemy(px, py + PLATFORM_H / 2 + 0.6, f);
        }
      });

      // Floor number sign
      const canvas = document.createElement("canvas");
      canvas.width = 128; canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.clearRect(0, 0, 128, 64);
      ctx.fillStyle = "#cc88ff";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`FL.${f}`, 64, 32);
      const tex = new THREE.CanvasTexture(canvas);
      const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7 }));
      sign.scale.set(2.5, 1.2, 1);
      sign.position.set(-TOWER_WIDTH / 2 + 1.5, baseY + 0.5, 1.5);
      this.towerGroup.add(sign);
    }
    this.generatedUpTo = toFloor;
  }

  // ─── Spawn player ─────────────────────────────────────────────────────────
  private spawnPlayer() {
    // Invisible physics body
    const geo = new THREE.BoxGeometry(0.8, 1.4, 0.8);
    const mat = new THREE.MeshBasicMaterial({ visible: false });
    this.player = new THREE.Mesh(geo, mat);
    this.player.position.set(0, 1.2, 0);
    this.towerGroup.add(this.player);

    // Visible sprite (billboard)
    const spriteGeo = new THREE.PlaneGeometry(2, 2.5);
    const spriteMat = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });
    this.playerSprite = new THREE.Mesh(spriteGeo, spriteMat);
    this.playerSprite.position.set(0, 0, 0.5);
    this.player.add(this.playerSprite);

    // Load texture
    this.loader.load(
      this.char.texture,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        (this.playerSprite.material as THREE.MeshBasicMaterial).map = tex;
        (this.playerSprite.material as THREE.MeshBasicMaterial).needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback: draw emoji on canvas
        const c = document.createElement("canvas");
        c.width = 128; c.height = 128;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#" + this.char.color.toString(16).padStart(6, "0");
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "70px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.char.emoji, 64, 68);
        const t = new THREE.CanvasTexture(c);
        (this.playerSprite.material as THREE.MeshBasicMaterial).map = t;
        (this.playerSprite.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
    );

    // Shadow circle under player
    const shadowGeo = new THREE.CircleGeometry(0.45, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -0.68, 0);
    this.player.add(shadow);
  }

  // ─── Spawn enemy ─────────────────────────────────────────────────────────
  private spawnEnemy(x: number, y: number, floor: number) {
    const ENEMY_TYPES = [
      { color: 0xff3355, emoji: "💀", name: "FUD Bear" },
      { color: 0xff8800, emoji: "🦐", name: "Shrimp" },
      { color: 0x00ccff, emoji: "🤖", name: "Bot" },
      { color: 0xcc00ff, emoji: "👾", name: "Rugger" },
    ];
    const type = ENEMY_TYPES[(floor + Math.floor(x)) % ENEMY_TYPES.length];
    const hp = Math.min(1 + Math.floor(floor / 3), 5);
    const speed = ENEMY_SPEED * (1 + floor * 0.05);
    const range = 1.5 + Math.random() * 1.5;

    // Body
    const geo = new THREE.BoxGeometry(1, 1.2, 0.8);
    const mat = new THREE.MeshLambertMaterial({ color: type.color, emissive: type.color, emissiveIntensity: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    mesh.castShadow = true;
    this.towerGroup.add(mesh);

    // Emoji label
    const c = document.createElement("canvas");
    c.width = 80; c.height = 80;
    const ctx = c.getContext("2d")!;
    ctx.font = "52px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(type.emoji, 40, 42);
    const tex = new THREE.CanvasTexture(c);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    label.scale.set(1.4, 1.4, 1);
    label.position.set(x, y + 0.7, 0.5);
    this.towerGroup.add(label);

    this.enemies.push({ mesh, label, x, y, vx: speed, hp, range, originX: x });
  }

  // ─── Background ───────────────────────────────────────────────────────────
  private buildBackground() {
    // Distant city silhouette / stars
    for (let i = 0; i < 120; i++) {
      const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.06, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(Math.random() * 0.15 + 0.7, 0.8, 0.8) });
      const star = new THREE.Mesh(geo, mat);
      star.position.set(
        (Math.random() - 0.5) * 40,
        Math.random() * 200,
        -(10 + Math.random() * 20)
      );
      this.scene.add(star);
    }
    // Building silhouettes
    for (let i = 0; i < 10; i++) {
      const h = 15 + Math.random() * 40;
      const w = 2 + Math.random() * 5;
      const geo = new THREE.BoxGeometry(w, h, 1);
      const mat = new THREE.MeshBasicMaterial({ color: 0x0d0022 });
      const b = new THREE.Mesh(geo, mat);
      b.position.set((Math.random() - 0.5) * 50, h / 2 - 5, -15 - Math.random() * 10);
      this.scene.add(b);
    }
  }

  // ─── Main update loop ─────────────────────────────────────────────────────
  start() {
    this.clock.start();
    this.loop();
  }

  private loop() {
    this.animId = requestAnimationFrame(() => this.loop());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.dead) this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  private update(dt: number) {
    this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);

    // ── Input ──
    const moveLeft  = this.keys["ArrowLeft"]  || this.keys["a"] || this.keys["A"] || this.joystickX < -0.2;
    const moveRight = this.keys["ArrowRight"] || this.keys["d"] || this.keys["D"] || this.joystickX > 0.2;
    const jump      = this.keys[" "] || this.keys["ArrowUp"] || this.keys["w"] || this.keys["W"] || this.jumpPressed;
    const attack    = this.keys["z"] || this.keys["Z"] || this.attackPressed;

    const spd = this.char.speed * Math.abs(this.joystickX > 0.2 || this.joystickX < -0.2 ? Math.abs(this.joystickX) : 1);

    if (moveLeft) {
      this.velX = -spd;
      this.facing = -1;
      this.playerSprite.scale.x = -Math.abs(this.playerSprite.scale.x);
    } else if (moveRight) {
      this.velX = spd;
      this.facing = 1;
      this.playerSprite.scale.x = Math.abs(this.playerSprite.scale.x);
    } else {
      this.velX *= 0.75;
    }

    if (jump && this.onGround) {
      this.velY = this.char.jumpPower;
      this.onGround = false;
      this.jumpPressed = false;
      this.spawnJumpParticles();
    }

    if (attack && this.attackCooldown <= 0) {
      this.doAttack();
      this.attackCooldown = 0.35;
      this.attackPressed = false;
    }

    // ── Physics ──
    this.velY += GRAVITY * dt;
    let nx = this.player.position.x + this.velX * dt;
    let ny = this.player.position.y + this.velY * dt;

    // Wall clamp
    const hw = TOWER_WIDTH / 2 - 0.45;
    nx = Math.max(-hw, Math.min(hw, nx));

    // Platform collision
    this.onGround = false;
    const pw = 0.4;
    const ph = 0.7;
    for (const plat of this.platforms) {
      const py = plat.y + PLATFORM_H / 2;
      if (
        this.velY <= 0 &&
        this.player.position.y + ph >= py &&
        ny + ph <= py + 0.5 &&
        nx + pw >= plat.x - plat.w / 2 &&
        nx - pw <= plat.x + plat.w / 2
      ) {
        ny = py - ph;
        this.velY = 0;
        this.onGround = true;
      }
    }

    // Fell off bottom
    if (ny < -3) {
      this.takeDamage(15);
      ny = 1;
      this.velY = 5;
    }

    this.player.position.x = nx;
    this.player.position.y = ny;

    // ── Enemy update ──
    this.updateEnemies(dt);

    // ── Particles ──
    this.updateParticles(dt);

    // ── Camera follows player ──
    const targetY = this.player.position.y + 3;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
    this.camera.lookAt(0, this.camera.position.y - 3, 0);

    // ── Floor tracking ──
    const playerFloor = Math.max(1, Math.floor(this.player.position.y / FLOOR_HEIGHT) + 1);
    if (playerFloor > this.highestFloor) {
      this.highestFloor = playerFloor;
      this.score += playerFloor * 10;
      this.callbacks.onScore(this.score);
    }
    if (playerFloor !== this.currentFloor) {
      this.currentFloor = playerFloor;
      this.callbacks.onFloor(this.currentFloor);
    }

    // ── Generate more floors ahead ──
    if (this.player.position.y > (this.generatedUpTo - 3) * FLOOR_HEIGHT) {
      this.generateFloors(this.generatedUpTo + 1, this.generatedUpTo + 6);
    }

    // ── Despawn old platforms/enemies below camera ──
    const cullY = this.camera.position.y - 20;
    this.platforms = this.platforms.filter(p => {
      if (p.y < cullY && p.y > 2) {
        this.towerGroup.remove(p.mesh);
        return false;
      }
      return true;
    });
  }

  private updateEnemies(dt: number) {
    for (const e of this.enemies) {
      // Patrol
      e.x += e.vx * dt;
      if (Math.abs(e.x - e.originX) > e.range) e.vx *= -1;
      e.mesh.position.x = e.x;
      e.label.position.x = e.x;

      // Face direction
      e.mesh.rotation.y = e.vx > 0 ? 0 : Math.PI;

      // Check collision with player
      if (this.invincibleTimer <= 0) {
        const dx = Math.abs(e.x - this.player.position.x);
        const dy = Math.abs(e.y - this.player.position.y);
        if (dx < 1.0 && dy < 1.2) {
          this.takeDamage(8);
          this.invincibleTimer = 1.2;
        }
      }
    }
  }

  private doAttack() {
    const range = 2.5;
    const px = this.player.position.x;
    const py = this.player.position.y;

    // Visual slash
    this.spawnSlash(px + this.facing * 1.2, py + 0.3);

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = e.x - px;
      const dy = e.y - py;
      if (Math.abs(dy) < 1.5 && Math.abs(dx) < range && Math.sign(dx) === this.facing) {
        e.hp--;
        // Knockback
        e.vx = this.facing * 4;
        e.x += this.facing * 0.5;
        if (e.hp <= 0) {
          this.towerGroup.remove(e.mesh);
          this.towerGroup.remove(e.label);
          this.enemies.splice(i, 1);
          this.score += 50;
          this.callbacks.onScore(this.score);
          this.spawnDeathParticles(e.x, e.y);
        }
      }
    }
  }

  private takeDamage(dmg: number) {
    if (this.invincibleTimer > 0) return;
    this.health = Math.max(0, this.health - dmg);
    this.callbacks.onHealth(this.health);
    this.invincibleTimer = 0.6;
    // Flash red
    const mat = this.playerSprite.material as THREE.MeshBasicMaterial;
    const orig = mat.color.clone();
    mat.color.setHex(0xff0000);
    setTimeout(() => { if (!this.dead) mat.color.copy(orig); }, 200);
    if (this.health <= 0) this.die();
  }

  private die() {
    this.dead = true;
    this.callbacks.onDead();
  }

  // ── Particles ──
  private spawnJumpParticles() {
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.SphereGeometry(0.1, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0xaa44ff });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(this.player.position);
      p.position.y -= 0.6;
      this.towerGroup.add(p);
      this.particles.push({ mesh: p, vx: (Math.random()-0.5)*4, vy: -Math.random()*3, life: 0.4 });
    }
  }

  private spawnSlash(x: number, y: number) {
    const geo = new THREE.PlaneGeometry(2, 0.3);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff88, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    const p = new THREE.Mesh(geo, mat);
    p.position.set(x, y, 0.6);
    p.rotation.z = (Math.random()-0.5) * 0.5;
    this.towerGroup.add(p);
    this.particles.push({ mesh: p, vx: this.facing * 3, vy: 0, life: 0.15 });
  }

  private spawnDeathParticles(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.SphereGeometry(0.15, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(Math.random(), 1, 0.6) });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(x, y, 0);
      this.towerGroup.add(p);
      const ang = (Math.PI * 2 * i) / 12;
      this.particles.push({ mesh: p, vx: Math.cos(ang)*5, vy: Math.sin(ang)*5, life: 0.6 });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.vy -= 10 * dt;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, p.life / 0.6);
      if (p.life <= 0) {
        this.towerGroup.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  private onResize(container: HTMLDivElement) {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode)
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  REACT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DegenGame({ onBack }: Props) {
  const mountRef   = useRef<HTMLDivElement>(null);
  const engineRef  = useRef<TowerEngine | null>(null);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [gameStarted, setGameStarted]   = useState(false);
  const [gameOver, setGameOver]         = useState(false);
  const [score, setScore]     = useState(0);
  const [health, setHealth]   = useState(100);
  const [floor, setFloor]     = useState(1);
  const [joystickPos, setJoystickPos]   = useState({ x: 0, y: 0 });
  const joystickRef   = useRef<HTMLDivElement>(null);
  const joystickActive = useRef(false);
  const joystickOrigin = useRef({ x: 0, y: 0 });

  // ── Keyboard ──
  useEffect(() => {
    if (!gameStarted) return;
    const down = (e: KeyboardEvent) => { if (engineRef.current) engineRef.current.keys[e.key] = true; };
    const up   = (e: KeyboardEvent) => { if (engineRef.current) engineRef.current.keys[e.key] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [gameStarted]);

  // ── Start game ──
  useEffect(() => {
    if (!gameStarted || !mountRef.current || !selectedChar) return;
    const char = CHARACTERS.find(c => c.id === selectedChar)!;
    const engine = new TowerEngine(mountRef.current, char, {
      onScore:  setScore,
      onHealth: setHealth,
      onFloor:  setFloor,
      onDead:   () => setGameOver(true),
    });
    engineRef.current = engine;
    engine.start();
    return () => { engine.destroy(); engineRef.current = null; };
  }, [gameStarted, selectedChar]);

  // ── Joystick handlers ──
  const onJoystickStart = useCallback((cx: number, cy: number) => {
    joystickActive.current = true;
    joystickOrigin.current = { x: cx, y: cy };
  }, []);

  const onJoystickMove = useCallback((cx: number, cy: number) => {
    if (!joystickActive.current) return;
    const dx = cx - joystickOrigin.current.x;
    const dy = cy - joystickOrigin.current.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = 42;
    const clamped = Math.min(dist, maxDist);
    const nx = dist > 0 ? (dx / dist) * clamped : 0;
    const ny = dist > 0 ? (dy / dist) * clamped : 0;
    setJoystickPos({ x: nx, y: ny });
    if (engineRef.current) engineRef.current.joystickX = nx / maxDist;
  }, []);

  const onJoystickEnd = useCallback(() => {
    joystickActive.current = false;
    setJoystickPos({ x: 0, y: 0 });
    if (engineRef.current) engineRef.current.joystickX = 0;
  }, []);

  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    setHealth(100);
    setFloor(1);
    setGameStarted(false);
    setSelectedChar(null);
  };

  // ── Character Select ──
  if (!gameStarted) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0014",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24, position: "relative", overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(120,40,180,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

        <button onClick={onBack} style={{ position: "absolute", top: 20, left: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>← Back</button>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🗼</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 }}>DEGEN TOWER</h1>
          <p style={{ color: "#9966bb", fontSize: 15 }}>Choose your climber — then ascend</p>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 600 }}>
          {CHARACTERS.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelectedChar(c.id); setGameStarted(true); }}
              style={{
                width: 110, height: 130, borderRadius: 16,
                background: selectedChar === c.id ? "rgba(180,80,255,0.25)" : "rgba(255,255,255,0.04)",
                border: `2px solid ${selectedChar === c.id ? "#cc44ff" : "rgba(255,255,255,0.08)"}`,
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.border = "2px solid #cc44ff")}
              onMouseLeave={e => (e.currentTarget.style.border = `2px solid ${selectedChar === c.id ? "#cc44ff" : "rgba(255,255,255,0.08)"}`)}
            >
              <div style={{ fontSize: 44, lineHeight: 1 }}>{c.emoji}</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{c.name}</div>
              <div style={{ color: "#9966bb", fontSize: 11 }}>SPD {c.speed.toFixed(0)} · JMP {c.jumpPower}</div>
            </button>
          ))}
        </div>

        <p style={{ color: "#554466", fontSize: 12, marginTop: 32, textAlign: "center" }}>
          WASD / Arrow Keys to move · SPACE to jump · Z to attack
        </p>
      </div>
    );
  }

  // ── Game Over ──
  if (gameOver) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0014", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 60, marginBottom: 8 }}>💀</div>
          <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, marginBottom: 6 }}>YOU DIED</h2>
          <p style={{ color: "#9966bb", fontSize: 16 }}>Floor {floor} · Score {score.toLocaleString()}</p>
        </div>
        <button onClick={restartGame} style={{
          padding: "14px 40px", borderRadius: 12,
          background: "linear-gradient(135deg, #cc44ff, #6622aa)",
          border: "none", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer",
        }}>Play Again</button>
        <button onClick={onBack} style={{ background: "none", border: "1px solid #333", color: "#666", borderRadius: 10, padding: "10px 28px", cursor: "pointer", fontSize: 14 }}>Back to Menu</button>
      </div>
    );
  }

  // ── Game Running ──
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "#0a0014", overflow: "hidden", touchAction: "none" }}>
      {/* Three.js canvas mount */}
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* HUD */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", pointerEvents: "none", zIndex: 10 }}>
        {/* Health bar */}
        <div style={{ flex: 1, maxWidth: 200 }}>
          <div style={{ fontSize: 10, color: "#cc88ff", fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>HP</div>
          <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 5, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 5,
              width: `${health}%`,
              background: health > 50 ? "linear-gradient(90deg,#22d67a,#44ff88)" : health > 25 ? "linear-gradient(90deg,#ffaa00,#ffcc44)" : "linear-gradient(90deg,#ff3355,#ff6688)",
              transition: "width 0.15s",
            }} />
          </div>
        </div>

        {/* Floor */}
        <div style={{ textAlign: "center", background: "rgba(180,80,255,0.15)", border: "1px solid rgba(180,80,255,0.3)", borderRadius: 8, padding: "4px 12px" }}>
          <div style={{ color: "#cc88ff", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Floor</div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{floor}</div>
        </div>

        {/* Score */}
        <div style={{ textAlign: "right", marginLeft: "auto" }}>
          <div style={{ color: "#f5c842", fontSize: 18, fontWeight: 900 }}>{score.toLocaleString()}</div>
          <div style={{ color: "#9966bb", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Score</div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 20px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 10, pointerEvents: "none" }}>

        {/* LEFT: Joystick */}
        <div
          ref={joystickRef}
          style={{
            width: 110, height: 110,
            borderRadius: "50%",
            background: "rgba(180,80,255,0.1)",
            border: "2px solid rgba(180,80,255,0.25)",
            position: "relative", pointerEvents: "auto",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onTouchStart={e => { const t = e.touches[0]; onJoystickStart(t.clientX, t.clientY); }}
          onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; onJoystickMove(t.clientX, t.clientY); }}
          onTouchEnd={onJoystickEnd}
          onMouseDown={e => onJoystickStart(e.clientX, e.clientY)}
          onMouseMove={e => { if (e.buttons) onJoystickMove(e.clientX, e.clientY); }}
          onMouseUp={onJoystickEnd}
        >
          {/* Knob */}
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, #cc44ff, #6622aa)",
            boxShadow: "0 0 16px rgba(180,80,255,0.5)",
            position: "absolute",
            left: `calc(50% + ${joystickPos.x}px - 22px)`,
            top: `calc(50% + ${joystickPos.y}px - 22px)`,
            transition: joystickActive.current ? "none" : "all 0.15s",
          }} />
        </div>

        {/* RIGHT: Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", pointerEvents: "auto" }}>
          {/* Jump */}
          <button
            style={{
              width: 66, height: 66, borderRadius: "50%",
              background: "linear-gradient(135deg, #f5c842, #e0a820)",
              border: "none", color: "#000", fontWeight: 900, fontSize: 13,
              cursor: "pointer", boxShadow: "0 0 20px rgba(245,200,66,0.4)",
              WebkitTapHighlightColor: "transparent",
            }}
            onTouchStart={e => { e.preventDefault(); if (engineRef.current) { engineRef.current.jumpPressed = true; engineRef.current.keys[" "] = true; } }}
            onTouchEnd={() => { if (engineRef.current) { engineRef.current.jumpPressed = false; engineRef.current.keys[" "] = false; } }}
            onMouseDown={() => { if (engineRef.current) { engineRef.current.jumpPressed = true; engineRef.current.keys[" "] = true; } }}
            onMouseUp={() => { if (engineRef.current) { engineRef.current.jumpPressed = false; engineRef.current.keys[" "] = false; } }}
          >JUMP</button>

          {/* Attack row */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg, #ff3355, #cc1133)",
                border: "none", color: "#fff", fontWeight: 900, fontSize: 11,
                cursor: "pointer", boxShadow: "0 0 16px rgba(255,51,85,0.4)",
                WebkitTapHighlightColor: "transparent",
              }}
              onTouchStart={e => { e.preventDefault(); if (engineRef.current) engineRef.current.attackPressed = true; }}
              onTouchEnd={() => { if (engineRef.current) engineRef.current.attackPressed = false; }}
              onMouseDown={() => { if (engineRef.current) engineRef.current.attackPressed = true; }}
              onMouseUp={() => { if (engineRef.current) engineRef.current.attackPressed = false; }}
            >⚔️</button>
          </div>
        </div>
      </div>

      {/* Back button */}
      <button onClick={onBack} style={{
        position: "absolute", top: 14, left: 14, zIndex: 20,
        background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)",
        color: "#888", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12,
      }}>← Exit</button>
    </div>
  );
}
