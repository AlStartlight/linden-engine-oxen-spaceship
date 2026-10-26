import { BODIES, ATLAS_KEYS, bodyByKey, resolvePositions, lookAngles } from './solar'

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

/**
 * GalaxySystem — jantung simulasi: orbit planet, rotasi benda langit, sabuk
 * asteroid, cincin Saturnus, target navigasi, pemindaian Atlas, dan lompatan.
 * Ditempel pada entity Matahari (body-sun).
 */
export default class GalaxySystem {
  scanPad = 18
  orbitSpeed = 1
  introSeconds = 9

  private ctx: any = null
  private t = 0
  private bodyEnts: Record<string, any> = {}
  private ringEnt: any = null
  private shipEnt: any = null
  private rocks: any[] = []
  private spinPhase: Record<string, number> = {}
  private positions: Record<string, any> = {}
  private shipPos = { x: 0, y: 0, z: 0 }
  private state: any = { speed: 0, throttle: 0, boost: false, brake: false }
  private scanned: Record<string, boolean> = {}
  private scannedCount = 0
  private targetIdx = 3
  private nearKey = ''
  private toastText = ''
  private toastTimer = 0
  private warpCd = 0
  private complete = false
  private maxStep = 0
  private lastNearKey = ''
  private hudReady = false
  private hudTries = 0
  private hudAcc = 0

  private xformOf(e: any) {
    if (!e) return null
    if (e.transform) return e.transform
    if (typeof e.getTransform === 'function') return e.getTransform()
    return null
  }

  onInit(ctx: any) {
    this.ctx = ctx
    for (let i = 0; i < BODIES.length; i++) {
      const b = BODIES[i]
      const e = ctx.world.entities.get('body-' + b.key)
      if (e) {
        this.bodyEnts[b.key] = e
        const t = this.xformOf(e)
        if (t) this.spinPhase[b.key] = t.rotation.y || 0
      }
    }
    this.ringEnt = ctx.world.entities.get('ring-saturn')
    this.shipEnt = ctx.world.entities.get('ent-ship')

    ctx.world.entities.forEach((e: any) => {
      if (!e || !e.tags || e.tags.indexOf('Asteroid') < 0) return
      const t = this.xformOf(e)
      if (!t) return
      const r = Math.sqrt(t.position.x * t.position.x + t.position.z * t.position.z)
      this.rocks.push({
        ent: e,
        r: r,
        a: Math.atan2(t.position.z, t.position.x),
        w: (Math.PI * 2) / (700 + (r - 174) * 14),
      })
    })

    this.positions = resolvePositions(0)
    this.syncBodies(0)
    this.updateProximity()

    ctx.on('ship-state', (d: any) => {
      if (d) this.state = d
    })

    this.bindHud()
    this.setToast('UPLINK 2099 · PINDAI ' + ATLAS_KEYS.length + ' BENDA LANGIT [F] · LOMPAT [R]', this.introSeconds)
  }

  private ensureHud(step: number) {
    if (this.hudReady || !this.ctx || !this.ctx.ui) return
    this.hudAcc += step
    if (this.hudAcc < 0.2) return
    this.hudAcc = 0
    this.hudTries++
    let ok = false
    try {
      ok = !!this.ctx.ui.query('#hud-speed')
    } catch (err) {
      ok = false
    }
    if (ok) {
      this.hudReady = true
      this.bindHud()
    } else if (this.hudTries > 30) {
      this.hudReady = true
    }
  }

  // ------------------------------------------------------------------ HUD
  private bindHud() {
    const ui = this.ctx && this.ctx.ui
    if (!ui) return
    const bind = (sel: string, fn: () => any) => {
      try {
        ui.bind(sel, () => {
          try {
            const v = fn()
            return v === undefined || v === null ? '' : String(v)
          } catch (err) {
            return ''
          }
        })
      } catch (err) { /* elemen tidak tersedia */ }
    }

    bind('#hud-speed', () => Math.round(this.state.speed || 0))
    bind('#hud-boost', () => (this.state.boost ? 'BOOST' : this.state.brake ? 'REM' : 'KRIUS'))
    bind('#hud-sector', () => this.sectorName())
    bind('#hud-mode', () => (this.complete ? 'ATLAS LENGKAP' : 'JELAJAH'))
    bind('#hud-atlas', () => this.scannedCount + '/' + ATLAS_KEYS.length)
    bind('#hud-scan', () => (this.nearKey ? 'SINKRON' : 'SIAP'))
    bind('#hud-target', () => bodyByKey(BODIES[this.targetIdx].key).name.toUpperCase())
    bind('#hud-dist', () => this.fmtDist(this.targetDistance()))
    bind('#hud-bearing', () => this.bearingArrow())
    bind('#hud-hint', () => this.hintText())
    bind('#hud-toast', () => this.toastText)

    for (let i = 0; i < ATLAS_KEYS.length; i++) {
      const k = ATLAS_KEYS[i]
      bind('#st-' + k, () => (this.scanned[k] ? '◉' : '○'))
    }

    bind('#card-name', () => this.cardBody().name.toUpperCase())
    bind('#card-kind', () => this.cardBody().kind)
    bind('#card-status', () => (this.scanned[this.cardBody().key] ? 'TERCATAT DI ATLAS' : 'BELUM DIPINDAI'))
    bind('#card-dia', () => this.cardBody().dia)
    bind('#card-dist', () => this.cardBody().dist)
    bind('#card-day', () => this.cardBody().day)
    bind('#card-year', () => this.cardBody().year)
    bind('#card-moons', () => this.cardBody().moons)
    bind('#card-fact', () => this.cardBody().fact)
  }

  private fmtDist(d: number) {
    if (d > 1000) return (d / 1000).toFixed(1) + 'k u'
    return Math.round(d) + ' u'
  }

  private cardBody() {
    return this.nearKey ? bodyByKey(this.nearKey) : BODIES[this.targetIdx]
  }

  private sectorName() {
    const r = Math.sqrt(this.shipPos.x * this.shipPos.x + this.shipPos.z * this.shipPos.z)
    if (r < 55) return 'KORONA MATAHARI'
    if (r < 110) return 'ZONA DALAM'
    if (r < 170) return 'ZONA TERESTRIAL'
    if (r < 215) return 'SABUK ASTEROID'
    if (r < 300) return 'RAKSASA GAS'
    if (r < 420) return 'RAKSASA ES'
    return 'TEPI TATA SURYA'
  }

  private targetDistance() {
    const p = this.positions[BODIES[this.targetIdx].key]
    if (!p) return 0
    const dx = p.x - this.shipPos.x
    const dy = p.y - this.shipPos.y
    const dz = p.z - this.shipPos.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  private bearingArrow() {
    const p = this.positions[BODIES[this.targetIdx].key]
    if (!p || !this.shipEnt) return '↑'
    const t = this.xformOf(this.shipEnt)
    const yaw = ((t ? t.rotation.y : 0) * Math.PI) / 180
    const fx = -Math.sin(yaw)
    const fz = -Math.cos(yaw)
    const rx = -fz
    const rz = fx
    let dx = p.x - this.shipPos.x
    let dz = p.z - this.shipPos.z
    const len = Math.sqrt(dx * dx + dz * dz) || 1
    dx /= len
    dz /= len
    const side = dx * rx + dz * rz
    const ahead = dx * fx + dz * fz
    let ang = Math.atan2(ahead, side) * R2D
    if (ang < 0) ang += 360
    const arrows = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘']
    return arrows[Math.round(ang / 45) % 8]
  }

  private hintText() {
    if (this.complete) return 'ATLAS LENGKAP · JELAJAH BEBAS'
    if (this.nearKey) return '[F] PINDAI ' + bodyByKey(this.nearKey).name.toUpperCase()
    return '[R] LOMPAT KE ' + bodyByKey(BODIES[this.targetIdx].key).name.toUpperCase() + '   ·   [TAB] GANTI TARGET'
  }

  private setToast(text: string, seconds: number) {
    this.toastText = text
    this.toastTimer = seconds > 0 ? seconds : 3
  }

  // --------------------------------------------------------------- simulasi
  private syncBodies(dt: number) {
    const pos = resolvePositions(this.t)
    this.positions = pos
    for (let i = 0; i < BODIES.length; i++) {
      const b = BODIES[i]
      const t = this.xformOf(this.bodyEnts[b.key])
      const p = pos[b.key]
      if (!t || !p) continue
      t.position.x = p.x
      t.position.y = p.y
      t.position.z = p.z
      if (b.spin) {
        const ph = ((this.spinPhase[b.key] || 0) + b.spin * dt) % 360
        this.spinPhase[b.key] = ph
        t.rotation.y = ph
      }
    }
    const sat = pos['saturnus']
    const ring = this.xformOf(this.ringEnt)
    if (ring && sat) {
      ring.position.x = sat.x
      ring.position.y = sat.y
      ring.position.z = sat.z
    }
  }

  private updateRocks(dt: number) {
    for (let i = 0; i < this.rocks.length; i++) {
      const r = this.rocks[i]
      r.a += r.w * dt
      const t = this.xformOf(r.ent)
      if (!t) continue
      t.position.x = Math.cos(r.a) * r.r
      t.position.z = Math.sin(r.a) * r.r
      t.rotation.y += 22 * dt
    }
  }

  private updateProximity() {
    const st = this.xformOf(this.shipEnt)
    if (st) {
      const nx = st.position.x
      const ny = st.position.y
      const nz = st.position.z
      const d = Math.sqrt((nx - this.shipPos.x) ** 2 + (ny - this.shipPos.y) ** 2 + (nz - this.shipPos.z) ** 2)
      if (d > 0.0001 && d < 40) this.maxStep = Math.max(this.maxStep, d)
      this.shipPos.x = nx
      this.shipPos.y = ny
      this.shipPos.z = nz
    }
    let nearKey = ''
    let nearScore = 2
    for (let i = 0; i < BODIES.length; i++) {
      const b = BODIES[i]
      const p = this.positions[b.key]
      if (!p) continue
      const dx = this.shipPos.x - p.x
      const dy = this.shipPos.y - p.y
      const dz = this.shipPos.z - p.z
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const range = Math.max(b.radius * 1.7 + this.scanPad, 24)
      const score = d / range
      if (score <= 1 && score < nearScore) {
        nearKey = b.key
        nearScore = score
      }
    }
    this.nearKey = nearKey
  }

  private scan(key: string) {
    const b = bodyByKey(key)
    if (this.scanned[key]) {
      this.setToast(b.name.toUpperCase() + ' SUDAH ADA DI ATLAS', 2.4)
      return
    }
    this.scanned[key] = true
    this.scannedCount++
    this.ctx.emit('body-scanned', { key: key, name: b.name, count: this.scannedCount })
    if (this.scannedCount >= ATLAS_KEYS.length) {
      this.complete = true
      this.setToast('ATLAS LENGKAP · SELURUH TATA SURYA TELAH KAMU JELAJAHI', 10)
    } else {
      this.setToast('◉ ' + b.name.toUpperCase() + ' DIPINDAI · ' + this.scannedCount + '/' + ATLAS_KEYS.length, 3.5)
    }
  }

  private warp() {
    if (this.warpCd > 0) return
    const b = BODIES[this.targetIdx]
    const p = this.positions[b.key]
    if (!p) return
    let dx = this.shipPos.x - p.x
    let dz = this.shipPos.z - p.z
    let len = Math.sqrt(dx * dx + dz * dz)
    if (len < 0.001) { dx = 0; dz = 1; len = 1 }
    const radius = b.radius + 13
    const dest = { x: p.x + (dx / len) * radius, y: p.y + b.radius * 0.45 + 4.5, z: p.z + (dz / len) * radius }
    const aim = lookAngles(dest, p)
    this.ctx.emit('ship-warp', { x: dest.x, y: dest.y, z: dest.z, yaw: aim.yaw, pitch: aim.pitch })
    this.warpCd = 0.8
    this.setToast('LOMPAT · ' + b.name.toUpperCase() + ' · TEKAN [F] SAAT DEKAT', 3.5)
  }

  onUpdate(dt: number) {
    if (!this.ctx) return
    const step = Math.min(dt > 0 ? dt : 0.016, 0.08)
    const inp = this.ctx.input
    this.t += step * this.orbitSpeed
    this.syncBodies(step * this.orbitSpeed)
    this.updateRocks(step)
    this.updateProximity()
    this.ensureHud(step)

    if (this.nearKey && this.nearKey !== this.lastNearKey) {
      if (!this.scanned[this.nearKey]) {
        this.setToast('SENSOR MENGUNCI · ' + bodyByKey(this.nearKey).name.toUpperCase() + ' · TEKAN [F] UNTUK PINDAI', 2.4)
      }
    }
    this.lastNearKey = this.nearKey
    if (inp) {
      if (inp.isActionJustPressed('Interact')) {
        if (this.nearKey) this.scan(this.nearKey)
        else this.setToast('TERLALU JAUH · DEKATI OBJEK UNTUK MEMINDAI', 2.6)
      }
      if (inp.isActionJustPressed('TargetNext')) {
        this.targetIdx = (this.targetIdx + 1) % BODIES.length
        this.setToast('TARGET · ' + BODIES[this.targetIdx].name.toUpperCase(), 2)
      }
      if (inp.isActionJustPressed('Warp')) this.warp()
    }

    if (this.warpCd > 0) this.warpCd -= step
    if (this.toastTimer > 0) {
      this.toastTimer -= step
      if (this.toastTimer <= 0) this.toastText = ''
    }
  }
}
