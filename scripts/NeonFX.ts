/**
 * NeonFX — lapisan grafis "cyberpunk 2099" untuk OXen.
 * Script ini tidak mengubah gameplay: ia hanya menyalakan material neon,
 * halo atmosfer planet, kabut, bintang debu, dan lampu ambien duotone.
 * Ditempel pada entitas Chase Camera.
 */
export default class NeonFX {
  private ctx: any = null
  private ready = false
  private failed = false
  private tries = 0
  private acc = 0
  private t = 0
  private items: any[] = []
  private atmos: any[] = []
  private dust: any = null
  private root: any = null

  private atmoGlow: Record<string, string> = {
    'atmo-sun': '#ffb300',
    'atmo-merkurius': '#4d8dff',
    'atmo-venus': '#ff2a6d',
    'atmo-bumi': '#00e5ff',
    'atmo-bulan': '#b967ff',
    'atmo-mars': '#ff2a6d',
    'atmo-jupiter': '#ff2a6d',
    'atmo-saturnus': '#fcee0a',
    'atmo-uranus': '#00e5ff',
    'atmo-neptunus': '#7b2ff7',
    'atmo-pluto': '#ff2a6d',
  }

  onInit(ctx: any) {
    this.ctx = ctx
    this.collect()
  }

  onUpdate(dt: number) {
    if (this.failed || !this.ctx) return
    const step = Math.min(dt > 0 ? dt : 0.016, 0.08)
    this.t += step
    if (!this.ready) {
      this.acc += step
      if (this.acc >= 0.2 && this.tries < 25) {
        this.acc = 0
        this.tries++
        this.collect()
      }
      return
    }
    this.animate(step)
  }

  private collect() {
    if (this.failed || !this.ctx) return
    try {
      const cam = this.ctx.object3D
      if (!cam) return
      let root: any = cam
      while (root && root.parent) root = root.parent
      if (!root) return

      const groups: Record<string, any> = {}
      root.traverse((o: any) => {
        if (!o || !o.userData) return
        const id = o.userData.entityId
        if (id && !groups[id]) groups[id] = o
      })
      const known = Object.keys(groups).length
      if (known < 20) return

      const T = this.ctx.three
      if (T) {
        try {
          if (root.isScene && !this.root) {
            if (T.Color) root.background = new T.Color('#05010f')
            if (T.Fog) root.fog = new T.Fog('#0b0118', 820, 4200)
            if (T.HemisphereLight) {
              const hemi = new T.HemisphereLight('#ff2a6d', '#00e5ff', 0.32)
              hemi.name = '__neon_hemi'
              root.add(hemi)
            }
            this.dust = this.makeDust(T, root)
            this.root = root
          }
        } catch (err) { /* abaikan efek opsional */ }
      }

      const ent = this.ctx.world && this.ctx.world.entities
      if (!ent) return

      ent.forEach((e: any) => {
        if (!e || !groups[e.id]) return
        const group = groups[e.id]
        let mesh: any = group
        if (!mesh.isMesh) {
          mesh = group.getObjectByName ? group.getObjectByName('__mesh__') : null
          if (!mesh) {
            let found: any = null
            if (group.traverse) group.traverse((o: any) => {
              if (!found && o && o.isMesh && o.material) found = o
            })
            mesh = found
          }
        }
        if (!mesh || !mesh.material || !mesh.material.emissive) return
        const m = mesh.material
        const tags: string[] = Array.isArray(e.tags) ? e.tags : []

        // --------------------------- halo atmosfer planet
        if (tags.indexOf('Atmo') >= 0) {
          const glow = this.atmoGlow[e.id] || '#00e5ff'
          m.color.set('#05050c')
          m.emissive.set(glow)
          m.emissiveIntensity = 1.8
          m.transparent = true
          m.opacity = 0.22
          m.depthWrite = false
          m.side = 2
          if (T && typeof T.AdditiveBlending === 'number') m.blending = T.AdditiveBlending
          m.toneMapped = false
          group.renderOrder = 3
          this.atmos.push({ m: m, phase: Math.random() * 6.28 })
          return
        }

        let kind = ''
        let color = ''
        let base = 1
        let x = group.position && typeof group.position.x === 'number' ? group.position.x : 0

        if (tags.indexOf('GridLine') >= 0) {
          kind = 'grid'; color = ''; base = 0.85
        } else if (tags.indexOf('Star') >= 0) {
          kind = 'star'; color = ''; base = 1.7
        } else if (tags.indexOf('OrbitLine') >= 0) {
          kind = 'orbit'; color = ''; base = 0.8
        } else if (tags.indexOf('Nebula') >= 0) {
          kind = 'nebula'; color = ''; base = 0.42
        } else if (tags.indexOf('Ring') >= 0) {
          kind = 'ring'; color = ''; base = 1.25
        } else if (tags.indexOf('HoloSign') >= 0) {
          kind = 'sign'; color = ''; base = 1.7
        } else if (tags.indexOf('ShipPart') >= 0) {
          const look = this.shipStyle(e.id)
          kind = look.kind
          color = look.color
          base = look.base
        } else if (tags.indexOf('Body') >= 0) {
          if (e.id === 'body-sun') { kind = 'sun'; color = '#ff9d00'; base = 1.6 }
          else {
            kind = 'planet'
            const bodyColors: Record<string, string> = {
              'body-merkurius': '#4d8dff',
              'body-venus': '#ff2a6d',
              'body-bumi': '#00e5ff',
              'body-bulan': '#b967ff',
              'body-mars': '#ff2a6d',
              'body-jupiter': '#ff2a6d',
              'body-saturnus': '#fcee0a',
              'body-uranus': '#00e5ff',
              'body-neptunus': '#7b2ff7',
              'body-pluto': '#ff2a6d',
            }
            color = bodyColors[e.id] || '#00e5ff'
            base = 0.30
          }
        }

        if (!kind) return
        if (color) m.emissive.set(color)
        else m.emissive.copy(m.color)
        m.emissiveIntensity = base
        if (kind === 'star' || kind === 'sun' || kind === 'engine' || kind === 'exhaust' ||
            kind === 'thruster' || kind === 'sensor' ||
            kind === 'grid' || kind === 'sign' || kind === 'ring' || kind === 'orbit') {
          m.toneMapped = false
        }
        this.items.push({
          m: m,
          kind: kind,
          base: base,
          phase: Math.random() * 6.28,
          x: x,
          speed: 0.6 + Math.random() * 1.7,
        })
      })

      if (this.items.length < 10) return
      this.ready = true
    } catch (err: any) {
      this.failed = true
      try { if (this.ctx.log) this.ctx.log('NeonFX: ' + (err && err.message ? err.message : err)) } catch (e) { /* noop */ }
    }
  }

  private shipStyle(id: string): { kind: string; color: string; base: number } {
    const has = (s: string) => id.indexOf(s) >= 0
    if (id === 'ship-engine-l' || id === 'ship-engine-r') return { kind: 'engine', color: '#00f5ff', base: 2.8 }
    if (id === 'ship-exhaust-l' || id === 'ship-exhaust-r') return { kind: 'exhaust', color: '#ff2a6d', base: 2.4 }
    if (id === 'ship-ring-l' || id === 'ship-ring-r') return { kind: 'thruster', color: '#00f5ff', base: 2.3 }
    if (id === 'ship-sensor') return { kind: 'sensor', color: '#00f5ff', base: 2.6 }
    if (id === 'ship-glow') return { kind: 'trim', color: '#ff2a6d', base: 1.5 }
    if (id === 'ship-taillight') return { kind: 'trim', color: '#ff2a6d', base: 1.9 }
    if (has('intake-glow')) return { kind: 'trim', color: '#ff2a6d', base: 1.4 }
    if (has('wing-edge') || has('canard-edge')) return { kind: 'trim', color: '#00e5ff', base: 2.0 }
    if (has('strip')) return { kind: 'trim', color: '#fcee0a', base: 2.0 }
    if (has('rail')) return { kind: 'trim', color: '#00e5ff', base: 1.6 }
    if (has('fin-edge')) return { kind: 'trim', color: '#ff2a6d', base: 1.8 }
    if (id === 'ship-fin') return { kind: 'trim', color: '#ff2a6d', base: 0.85 }
    if (has('antenna')) return { kind: 'trim', color: '#fcee0a', base: 2.0 }
    if (id === 'ship-cockpit') return { kind: 'trim', color: '#00e5ff', base: 0.32 }
    if (has('canopy')) return { kind: 'trim', color: '#00e5ff', base: 1.9 }
    if (id === 'ship-nose-tip') return { kind: 'trim', color: '#fcee0a', base: 1.7 }
    if (has('nose-strip')) return { kind: 'trim', color: '#00e5ff', base: 1.9 }
    if (id === 'ship-plate-l' || id === 'ship-plate-r') return { kind: 'trim', color: '#9fe9ff', base: 0.35 }
    if (id === 'ship-hull') return { kind: 'hull', color: '#ff2a6d', base: 0.05 }
    if (has('wing') || has('nacelle') || has('canard')) return { kind: 'hull', color: '#00e5ff', base: 0.04 }
    return { kind: 'hull', color: '#00e5ff', base: 0.03 }
  }

  private makeDust(T: any, root: any) {
    if (!T.BufferGeometry || !T.PointsMaterial || !T.Points) return null
    const count = 900
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const palette = [
      [0.0, 0.9, 1.0],
      [1.0, 0.16, 0.43],
      [0.99, 0.93, 0.04],
      [0.73, 0.4, 1.0],
      [1.0, 0.55, 0.0],
    ]
    for (let i = 0; i < count; i++) {
      const r = 700 + Math.random() * 2400
      const a = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 2600
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(a) * r
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c[0]
      col[i * 3 + 1] = c[1]
      col[i * 3 + 2] = c[2]
    }
    const geo = new T.BufferGeometry()
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3))
    const mat = new T.PointsMaterial({
      size: 2.6,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: T.AdditiveBlending,
      toneMapped: false,
    })
    const points = new T.Points(geo, mat)
    points.name = '__neon_dust'
    points.frustumCulled = false
    root.add(points)
    return points
  }

  private animate(step: number) {
    try {
      const t = this.t
      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i]
        const m = it.m
        if (!m) continue
        if (it.kind === 'star') {
          m.emissiveIntensity = it.base * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * it.speed * 2.2 + it.phase)))
        } else if (it.kind === 'sun') {
          m.emissiveIntensity = it.base + 0.35 * Math.sin(t * 0.9)
        } else if (it.kind === 'grid') {
          m.emissiveIntensity = 0.48 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.6 + it.x * 0.012))
        } else if (it.kind === 'engine') {
          m.emissiveIntensity = 2.2 + 0.45 * Math.sin(t * 21 + it.phase)
        } else if (it.kind === 'exhaust') {
          m.emissiveIntensity = 1.9 + 0.7 * Math.sin(t * 17 + it.phase)
        } else if (it.kind === 'thruster') {
          m.emissiveIntensity = it.base * (0.85 + 0.15 * Math.sin(t * 7 + it.phase))
        } else if (it.kind === 'sensor') {
          m.emissiveIntensity = it.base * (0.3 + 0.75 * (0.5 + 0.5 * Math.sin(t * 2.6 + it.phase)))
        } else if (it.kind === 'trim') {
          m.emissiveIntensity = it.base * (0.86 + 0.14 * Math.sin(t * 4.2 + it.phase))
        } else if (it.kind === 'sign') {
          m.emissiveIntensity = 1.2 + 0.7 * (0.5 + 0.5 * Math.sin(t * 1.4 + it.phase))
        } else if (it.kind === 'ring') {
          m.emissiveIntensity = it.base * (0.8 + 0.2 * Math.sin(t * 0.8 + it.phase))
        } else if (it.kind === 'orbit') {
          m.emissiveIntensity = 0.55 + 0.25 * (0.5 + 0.5 * Math.sin(t * 0.7 + it.phase))
        } else if (it.kind === 'nebula') {
          m.emissiveIntensity = it.base * (0.85 + 0.15 * Math.sin(t * 0.25 + it.phase))
        } else if (it.kind === 'planet') {
          m.emissiveIntensity = it.base * (0.9 + 0.1 * Math.sin(t * 0.6 + it.phase))
        }
      }
      for (let i = 0; i < this.atmos.length; i++) {
        const a = this.atmos[i]
        a.m.emissiveIntensity = 1.6 + 0.5 * Math.sin(t * 1.1 + a.phase)
        a.m.opacity = 0.16 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.1 + a.phase))
      }
      if (this.dust && this.dust.rotation) this.dust.rotation.y += step * 0.0035
    } catch (err) {
      this.failed = true
    }
  }
}
