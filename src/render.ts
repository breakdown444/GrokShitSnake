import * as THREE from 'three'
import { STAIN_MS, WORLD_H, WORLD_W, type SnakeGame } from './game.ts'

const MAX_LUMPS = 240
const MAX_BUMPS = 240
const MAX_STAINS = 160
const MAX_STEAM = 140

function asset(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}

function lumpify(mat: THREE.MeshStandardMaterial): void {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      {
        vec3 nrm = objectNormal;
        float n = sin(transformed.x * 6.4 + transformed.y * 4.2) * sin(transformed.z * 5.8);
        float n2 = sin(transformed.x * 11.2 + transformed.z * 8.1);
        transformed += nrm * (n * 0.08 + n2 * 0.03);
      }`,
    )
  }
  mat.customProgramCacheKey = () => 'poop-lumps-v1'
}

function makePlaque(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#16100c'
  g.fillRect(0, 0, 1024, 256)
  g.strokeStyle = '#3dff8a'
  g.lineWidth = 6
  g.strokeRect(18, 18, 988, 220)
  g.fillStyle = '#3dff8a'
  g.font = '700 70px Trebuchet MS, sans-serif'
  g.textAlign = 'center'
  g.fillText('GROKSHITSNAKE', 512, 108)
  g.fillStyle = '#ffd24a'
  g.font = '800 46px Trebuchet MS, sans-serif'
  g.fillText('BETA', 512, 168)
  g.fillStyle = '#8fad9c'
  g.font = '24px Trebuchet MS, sans-serif'
  g.fillText('Trashbird  ·  heart & soul  ·  next stop 1.0', 512, 214)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

type Steam = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  born: number
  life: number
}

export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  private lumps!: THREE.InstancedMesh
  private bumps!: THREE.InstancedMesh
  private stains!: THREE.InstancedMesh
  private food!: THREE.Mesh
  private foodLight!: THREE.PointLight
  private steamPts!: THREE.Points
  private steamPos = new Float32Array(MAX_STEAM * 3)
  private steamAlpha = new Float32Array(MAX_STEAM)
  private steam: Steam[] = []
  private dummy = new THREE.Object3D()
  private color = new THREE.Color()
  private loaded = false
  private camNow = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setClearColor(0x1a1612, 1)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.12
    this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 80)
    this.frameCamera()
    this.scene.fog = new THREE.Fog(0x1a1612, 18, 36)
  }

  async init(): Promise<void> {
    if (this.loaded) return
    const loader = new THREE.TextureLoader()
    const [poopMap, poopNormal, floorMap, stainMap] = await Promise.all([
      loader.loadAsync(asset('textures/poop-albedo.png')),
      loader.loadAsync(asset('textures/poop-normal.png')),
      loader.loadAsync(asset('textures/floor-albedo.png')),
      loader.loadAsync(asset('textures/stain-smear.png')),
    ])
    for (const tex of [poopMap, floorMap, stainMap]) {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
    }
    poopMap.wrapS = poopMap.wrapT = THREE.RepeatWrapping
    poopNormal.wrapS = poopNormal.wrapT = THREE.RepeatWrapping
    poopNormal.colorSpace = THREE.LinearSRGBColorSpace
    floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping
    floorMap.repeat.set(1.05, 1.05)

    this.scene.add(new THREE.HemisphereLight(0xf0e6d4, 0x3a2a1c, 0.72))
    const key = new THREE.DirectionalLight(0xfff3e0, 1.35)
    key.position.set(-6.5, 14, 7)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -14
    key.shadow.camera.right = 14
    key.shadow.camera.top = 10
    key.shadow.camera.bottom = -10
    key.shadow.camera.near = 2
    key.shadow.camera.far = 32
    key.shadow.bias = -0.0008
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(0x88a0c8, 0.35)
    fill.position.set(8, 6, -4)
    this.scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffc48a, 0.5)
    rim.position.set(1.5, 5, -11)
    this.scene.add(rim)

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorMap,
      roughness: 0.92,
      metalness: 0.02,
      color: 0xc8b896,
    })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W + 0.4, WORLD_H + 0.4), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    const railMat = new THREE.MeshStandardMaterial({ color: 0x2a221c, roughness: 0.7, metalness: 0.08 })
    const railH = 0.42
    const mkRail = (w: number, d: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, railH, d), railMat)
      m.position.set(x, railH / 2, z)
      m.castShadow = true
      m.receiveShadow = true
      this.scene.add(m)
    }
    mkRail(WORLD_W + 0.5, 0.22, 0, WORLD_H / 2 + 0.08)
    mkRail(WORLD_W + 0.5, 0.22, 0, -WORLD_H / 2 - 0.08)
    mkRail(0.22, WORLD_H + 0.5, WORLD_W / 2 + 0.08, 0)
    mkRail(0.22, WORLD_H + 0.5, -WORLD_W / 2 - 0.08, 0)

    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(7.4, 1.35),
      new THREE.MeshStandardMaterial({ map: makePlaque(), roughness: 0.62, metalness: 0.12 }),
    )
    plaque.position.set(0, 1.15, WORLD_H / 2 - 0.14)
    plaque.rotation.y = Math.PI
    this.scene.add(plaque)

    const poopMat = new THREE.MeshStandardMaterial({
      map: poopMap,
      normalMap: poopNormal,
      normalScale: new THREE.Vector2(1.15, 1.15),
      roughness: 0.48,
      metalness: 0.04,
    })
    lumpify(poopMat)
    const bumpMat = poopMat.clone()
    lumpify(bumpMat)

    const geo = new THREE.SphereGeometry(1, 22, 16)
    this.lumps = new THREE.InstancedMesh(geo, poopMat, MAX_LUMPS)
    this.lumps.castShadow = true
    this.lumps.receiveShadow = true
    this.lumps.count = 0
    this.lumps.frustumCulled = false
    this.lumps.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_LUMPS * 3).fill(1), 3)
    this.scene.add(this.lumps)

    this.bumps = new THREE.InstancedMesh(geo, bumpMat, MAX_BUMPS)
    this.bumps.castShadow = true
    this.bumps.receiveShadow = true
    this.bumps.count = 0
    this.bumps.frustumCulled = false
    this.bumps.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_BUMPS * 3).fill(1), 3)
    this.scene.add(this.bumps)

    const stainMat = new THREE.MeshBasicMaterial({
      map: stainMap,
      transparent: true,
      depthWrite: false,
      opacity: 1,
      side: THREE.DoubleSide,
    })
    this.stains = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.4, 0.7), stainMat, MAX_STAINS)
    this.stains.count = 0
    this.stains.frustumCulled = false
    this.stains.renderOrder = 1
    this.stains.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_STAINS * 3).fill(1), 3)
    this.scene.add(this.stains)

    const foodMat = new THREE.MeshPhysicalMaterial({
      color: 0xff2d4a,
      roughness: 0.16,
      metalness: 0.05,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
      emissive: new THREE.Color(0x4a0010),
      emissiveIntensity: 0.35,
    })
    this.food = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 18), foodMat)
    this.food.castShadow = true
    this.scene.add(this.food)
    this.foodLight = new THREE.PointLight(0xff4466, 0.9, 4.5)
    this.scene.add(this.foodLight)

    const steamGeo = new THREE.BufferGeometry()
    steamGeo.setAttribute('position', new THREE.BufferAttribute(this.steamPos, 3))
    steamGeo.setAttribute('alpha', new THREE.BufferAttribute(this.steamAlpha, 1))
    const steamMat = new THREE.PointsMaterial({
      color: 0xe8dcc8,
      size: 0.22,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      sizeAttenuation: true,
    })
    this.steamPts = new THREE.Points(steamGeo, steamMat)
    this.steamPts.frustumCulled = false
    this.scene.add(this.steamPts)

    this.loaded = true
  }

  private frameCamera(): void {
    const sway = Math.sin(this.camNow / 2400) * 0.16
    const bob = Math.sin(this.camNow / 1900) * 0.07
    this.camera.up.set(0, 0, 1)
    this.camera.position.set(sway, 15.6 + bob, -7.2)
    this.camera.lookAt(0, 0, 0)
  }

  resize(): void {
    const canvas = this.renderer.domElement
    const parent = canvas.parentElement
    if (!parent) return
    const w = Math.max(1, parent.clientWidth)
    const h = Math.max(1, parent.clientHeight)
    this.camera.aspect = w / h
    this.frameCamera()
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  private syncPoop(game: SnakeGame): void {
    const n = Math.min(game.lumps.length, MAX_LUMPS)
    this.lumps.count = n
    this.bumps.count = n
    for (let i = 0; i < n; i++) {
      const l = game.lumps[i]
      const heading = Math.atan2(l.ty, l.tx)
      const squash = 0.78 + l.seed * 0.16
      const long = 1.12 + l.seed * 0.22
      this.dummy.position.set(l.x, l.r * 0.72, l.y)
      this.dummy.rotation.set(0.18, -heading, l.seed * 0.5)
      this.dummy.scale.set(l.r * long, l.r * squash, l.r * (0.92 + l.seed * 0.2))
      this.dummy.updateMatrix()
      this.lumps.setMatrixAt(i, this.dummy.matrix)
      const shade = 0.82 + l.seed * 0.22 - l.along * 0.012
      this.color.setRGB(shade, shade * 0.92, shade * 0.78)
      this.lumps.setColorAt(i, this.color)

      const side = (l.seed > 0.5 ? 1 : -1) * l.r * (0.28 + l.seed * 0.22)
      const nx = -l.ty
      const ny = l.tx
      this.dummy.position.set(l.x + nx * side, l.r * 0.55, l.y + ny * side)
      this.dummy.scale.set(l.r * 0.62, l.r * 0.5, l.r * 0.7)
      this.dummy.updateMatrix()
      this.bumps.setMatrixAt(i, this.dummy.matrix)
      this.color.setRGB(shade * 0.9, shade * 0.82, shade * 0.68)
      this.bumps.setColorAt(i, this.color)
    }
    this.lumps.instanceMatrix.needsUpdate = true
    this.bumps.instanceMatrix.needsUpdate = true
    if (this.lumps.instanceColor) this.lumps.instanceColor.needsUpdate = true
    if (this.bumps.instanceColor) this.bumps.instanceColor.needsUpdate = true
  }

  private syncStains(game: SnakeGame, now: number): void {
    game.expireStains(now)
    const n = Math.min(game.stains.length, MAX_STAINS)
    this.stains.count = n
    for (let i = 0; i < n; i++) {
      const s = game.stains[i]
      const life = 1 - (now - s.at) / STAIN_MS
      const a = Math.max(0, life) * 0.85
      this.dummy.position.set(s.x, 0.025, s.y)
      this.dummy.rotation.set(-Math.PI / 2, 0, -s.heading + s.seed)
      this.dummy.scale.set(s.scale * (0.9 + (1 - life) * 0.25), s.scale * 0.7, 1)
      this.dummy.updateMatrix()
      this.stains.setMatrixAt(i, this.dummy.matrix)
      this.color.setRGB(a, a, a)
      this.stains.setColorAt(i, this.color)
    }
    this.stains.instanceMatrix.needsUpdate = true
    if (this.stains.instanceColor) this.stains.instanceColor.needsUpdate = true
    const mat = this.stains.material as THREE.MeshBasicMaterial
    mat.opacity = 1
  }

  private tickSteam(game: SnakeGame, now: number, playing: boolean): void {
    if (playing && game.lumps.length && this.steam.length < MAX_STEAM) {
      const l = game.lumps[Math.floor(Math.random() * Math.min(game.lumps.length, 12))]
      this.steam.push({
        x: l.x + (Math.random() - 0.5) * 0.25,
        y: l.r * 1.1,
        z: l.y + (Math.random() - 0.5) * 0.25,
        vx: (Math.random() - 0.5) * 0.15,
        vy: 0.35 + Math.random() * 0.35,
        vz: (Math.random() - 0.5) * 0.15,
        born: now,
        life: 700 + Math.random() * 900,
      })
    }
    for (let i = this.steam.length - 1; i >= 0; i--) {
      const p = this.steam[i]
      if (now - p.born > p.life) {
        this.steam.splice(i, 1)
        continue
      }
      p.x += p.vx * 0.016
      p.y += p.vy * 0.016
      p.z += p.vz * 0.016
      p.vy *= 0.985
    }
    this.steamPos.fill(0)
    this.steamAlpha.fill(0)
    const count = Math.min(this.steam.length, MAX_STEAM)
    for (let i = 0; i < count; i++) {
      const p = this.steam[i]
      this.steamPos[i * 3] = p.x
      this.steamPos[i * 3 + 1] = p.y
      this.steamPos[i * 3 + 2] = p.z
      this.steamAlpha[i] = 1 - (now - p.born) / p.life
    }
    const geo = this.steamPts.geometry
    ;(geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    geo.setDrawRange(0, count)
    const mat = this.steamPts.material as THREE.PointsMaterial
    mat.opacity = 0.2
  }

  sync(game: SnakeGame, now: number, playing: boolean): void {
    if (!this.loaded) return
    this.syncStains(game, now)
    this.syncPoop(game)
    const pulse = 0.26 + Math.sin(now / 180) * 0.02
    this.food.scale.setScalar(pulse / 0.26)
    this.food.position.set(game.food.x, 0.28, game.food.y)
    this.foodLight.position.copy(this.food.position)
    this.foodLight.position.y = 0.7
    this.camNow = now
    this.frameCamera()
    this.tickSteam(game, now, playing)
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }
}
