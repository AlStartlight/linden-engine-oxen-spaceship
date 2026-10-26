import { BODIES, resolvePositions, lookAngles, forwardVec } from './solar'

/**
 * ShipFlight — kendali kapal luar angkasa "Cyberpunk" OXen.
 * Rig "Starship" hanya berputar pada sumbu Y (yaw); sikap pitch/roll ada pada
 * child "Ship Attitude", jadi tidak bergantung pada urutan Euler.
 *
 * W / S  : dorong maju / mundur
 * A / D  : belok kiri / kanan (juga panah kiri-kanan)
 * Q / E  : hidung turun / naik
 * Mouse  : arah bebas (yaw + pitch)
 * Shift / Space : boost   ·   C : rem
 * F : pindai (ditangani GalaxySystem)   ·   R : lompat ke target   ·   Tab : ganti target
 */
export default class ShipFlight {
  // --- dapat diubah dari panel Script ---
  maxSpeed = 34
  boostSpeed = 100
  accel = 2.8
  yawRate = 64
  pitchRate = 46
  lookSensitivity = 0.11
  collisionPad = 2.5
  worldRadius = 640
  startTarget = 'bumi'

  private ctx: any = null
  private rig: any = null
  private attitude: any = null
  private engines: any[] = []
  private engineBase: any[] = []
  private exhausts: any[] = []
  private exhaustBase: any[] = []
  private rings: any[] = []
  private ringBase: any[] = []

  private px = 0
  private py = 0
  private pz = 0
  private vx = 0
  private vy = 0
  private vz = 0
  private yaw = 0
  private pitch = 0
  private roll = 0
  private time = 0
  private stateTimer = 0
  private boostFx = 0

  private xformOf(e: any) {
    if (!e) return null
    if (e.transform) return e.transform
    if (typeof e.getTransform === 'function') return e.getTransform()
    return null
  }

  private scaleOf(t: any) {
    return t && t.scale ? [t.scale.x, t.scale.y, t.scale.z] : [1, 1, 1]
  }

  private collect(ids: string[], forms: any[], bases: any[]) {
    if (!this.ctx || !this.ctx.world || !this.ctx.world.entities) return
    for (let i = 0; i < ids.length; i++) {
      const t = this.xformOf(this.ctx.world.entities.get(ids[i]))
      if (!t) continue
      forms.push(t)
      bases.push(this.scaleOf(t))
    }
  }

  onInit(ctx: any) {
    this.ctx = ctx
    this.rig = this.xformOf(ctx.entity)
    this.attitude = this.xformOf(ctx.world.entities.get('ship-pitch'))

    this.collect(['ship-engine-l', 'ship-engine-r'], this.engines, this.engineBase)
    this.collect(['ship-exhaust-l', 'ship-exhaust-r'], this.exhausts, this.exhaustBase)
    this.collect(['ship-ring-l', 'ship-ring-r'], this.rings, this.ringBase)

    if (this.rig) {
      this.px = this.rig.position.x
      this.py = this.rig.position.y
      this.pz = this.rig.position.z
    }
    const start = resolvePositions(0)[this.startTarget] || { x: 0, y: 0, z: 0 }
    const aim = lookAngles({ x: this.px, y: this.py, z: this.pz }, start)
    this.yaw = aim.yaw
    this.pitch = this.clampPitch(aim.pitch)

    ctx.on('ship-warp', (d: any) => this.warpTo(d))
    this.applyTransform()
  }

  private clampPitch(v: number) {
    if (v > 84) return 84
    if (v < -84) return -84
    return v
  }

  private warpTo(d: any) {
    if (!d) return
    this.px = d.x
    this.py = d.y
    this.pz = d.z
    this.yaw = d.yaw
    this.pitch = this.clampPitch(d.pitch)
    this.roll = 0
    this.vx = 0
    this.vy = 0
    this.vz = 0
    this.applyTransform()
  }

  onUpdate(dt: number) {
    if (!this.ctx) return
    const step = Math.min(dt > 0 ? dt : 0.016, 0.08)
    this.time += step

    const inp = this.ctx.input
    const move = (inp && inp.getVector('Move')) || { x: 0, y: 0 }
    const turn = (inp && inp.getAxis('Turn')) || 0
    const look = (inp && inp.getVector('Look')) || { x: 0, y: 0 }
    const mx = typeof move.x === 'number' ? move.x : 0
    const my = typeof move.y === 'number' ? move.y : 0
    const lx = typeof look.x === 'number' ? look.x : 0
    const ly = typeof look.y === 'number' ? look.y : 0

    // --- kemudi ---
    this.yaw -= mx * this.yawRate * step
    this.pitch += turn * this.pitchRate * step
    this.yaw -= lx * this.lookSensitivity
    this.pitch -= ly * this.lookSensitivity
    this.pitch = this.clampPitch(this.pitch)
    if (this.yaw > 180) this.yaw -= 360
    if (this.yaw < -180) this.yaw += 360
    const rollTarget = -mx * 26
    this.roll += (rollTarget - this.roll) * Math.min(1, 7 * step)

    // --- dorongan mesin ---
    const boost = inp && (inp.isActionPressed('Sprint') || inp.isActionPressed('Jump'))
    const brake = inp && inp.isActionPressed('Crouch')
    let target = 0
    if (!brake) target = my * (boost && my > 0 ? this.boostSpeed : this.maxSpeed)
    const f = forwardVec(this.yaw, this.pitch)
    const k = 1 - Math.exp(-(brake ? 5.5 : this.accel) * step)
    this.vx += (f.x * target - this.vx) * k
    this.vy += (f.y * target - this.vy) * k
    this.vz += (f.z * target - this.vz) * k

    this.px += this.vx * step
    this.py += this.vy * step
    this.pz += this.vz * step

    this.collide()
    this.boostFx += ((boost && my > 0 ? 1 : 0) - this.boostFx) * Math.min(1, 5 * step)
    this.applyTransform()

    this.stateTimer += step
    if (this.stateTimer >= 0.08) {
      this.stateTimer = 0
      this.ctx.emit('ship-state', {
        speed: Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz),
        throttle: my,
        boost: boost && my > 0,
        brake: !!brake,
        yaw: this.yaw,
        pitch: this.pitch,
        x: this.px,
        y: this.py,
        z: this.pz,
      })
    }
  }

  private collide() {
    const pos = resolvePositions(this.time)
    for (let i = 0; i < BODIES.length; i++) {
      const b = BODIES[i]
      const p = pos[b.key]
      if (!p) continue
      const minD = b.radius + this.collisionPad
      let dx = this.px - p.x
      let dy = this.py - p.y
      let dz = this.pz - p.z
      let d = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (d < 0.0001) { dx = 0; dy = 0; dz = 1; d = 1 }
      if (d < minD) {
        const nx = dx / d
        const ny = dy / d
        const nz = dz / d
        this.px = p.x + nx * minD
        this.py = p.y + ny * minD
        this.pz = p.z + nz * minD
        const vn = this.vx * nx + this.vy * ny + this.vz * nz
        if (vn < 0) {
          this.vx -= vn * nx
          this.vy -= vn * ny
          this.vz -= vn * nz
        }
      }
    }
    const horiz = Math.sqrt(this.px * this.px + this.pz * this.pz)
    if (horiz > this.worldRadius) {
      const s = this.worldRadius / horiz
      this.px *= s
      this.pz *= s
      this.vx *= 0.2
      this.vz *= 0.2
    }
    if (this.py > 300) { this.py = 300; if (this.vy > 0) this.vy = 0 }
    if (this.py < -300) { this.py = -300; if (this.vy < 0) this.vy = 0 }
  }

  private applyTransform() {
    const r = this.rig
    if (r) {
      r.position.x = this.px
      r.position.y = this.py
      r.position.z = this.pz
      r.rotation.y = this.yaw
    }
    const a = this.attitude
    if (a) {
      a.rotation.x = this.pitch
      a.rotation.z = this.roll
    }

    // inti mesin: berdenyut, memanjang saat boost
    const glow = 0.92 + this.boostFx * 0.5 + Math.sin(this.time * 16) * 0.06
    for (let i = 0; i < this.engines.length; i++) {
      const e = this.engines[i]
      const b = this.engineBase[i] || [1, 1, 1]
      e.scale.x = b[0] * glow
      e.scale.y = b[1] * glow
      e.scale.z = b[2] * glow * (1 + this.boostFx * 1.35)
    }

    // semburan plasma
    const flame = 0.72 + this.boostFx * 2.1 + Math.sin(this.time * 22) * 0.1
    for (let i = 0; i < this.exhausts.length; i++) {
      const e = this.exhausts[i]
      const b = this.exhaustBase[i] || [1, 1, 1]
      const widen = 1 + this.boostFx * 0.22
      e.scale.x = b[0] * widen
      e.scale.y = b[1] * flame
      e.scale.z = b[2] * widen
    }

    // cincin thruster: berputar + melebar saat boost
    const pulse = 1 + this.boostFx * 0.18 + Math.sin(this.time * 9) * 0.015
    for (let i = 0; i < this.rings.length; i++) {
      const e = this.rings[i]
      const b = this.ringBase[i] || [1, 1, 1]
      e.scale.x = b[0] * pulse
      e.scale.y = b[1] * pulse
      e.scale.z = b[2] * pulse
      e.rotation.z = this.time * (38 + this.boostFx * 90)
    }
  }
}
