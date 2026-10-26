// ---------------------------------------------------------------------------
// Data Tata Surya — dipakai bersama oleh GalaxySystem & ShipFlight
// ---------------------------------------------------------------------------

export interface BodyDef {
  key: string
  name: string
  kind: string
  orbit: number
  angle: number
  period: number
  radius: number
  spin: number
  parent: string
  moons: string
  dia: string
  dist: string
  day: string
  year: string
  fact: string
}

export interface Vec3 { x: number; y: number; z: number }

export const BODIES: BodyDef[] = [
  {
    key: 'sun', name: 'Matahari', kind: 'Bintang Deret Utama G2V',
    orbit: 0, angle: 0, period: 0, radius: 12, spin: 2, parent: '',
    moons: '8 planet', dia: '1.392.700 km', dist: 'Pusat Tata Surya',
    day: '25 hari (ekuator)', year: '225 juta tahun (mengorbit galaksi)',
    fact: 'Menampung 99,86% massa Tata Surya. Suhu intinya sekitar 15 juta °C dan cahayanya butuh 8 menit 20 detik untuk sampai ke Bumi.',
  },
  {
    key: 'merkurius', name: 'Merkurius', kind: 'Planet Terestrial',
    orbit: 70, angle: 20, period: 120, radius: 2.4, spin: 6, parent: '',
    moons: '0 satelit', dia: '4.879 km', dist: '57,9 juta km',
    day: '59 hari Bumi', year: '88 hari Bumi',
    fact: 'Planet terkecil sekaligus tercepat. Suhu permukaannya melompat dari 430 °C di siang hari ke -180 °C di malam hari.',
  },
  {
    key: 'venus', name: 'Venus', kind: 'Planet Terestrial',
    orbit: 96, angle: 130, period: 180, radius: 3.2, spin: 4, parent: '',
    moons: '0 satelit', dia: '12.104 km', dist: '108,2 juta km',
    day: '243 hari Bumi (retrograd)', year: '225 hari Bumi',
    fact: 'Planet terpanas (464 °C) karena efek rumah kaca ekstrem dari awan asam sulfat. Berputar terbalik dibanding planet lain.',
  },
  {
    key: 'bumi', name: 'Bumi', kind: 'Planet Terestrial',
    orbit: 124, angle: 250, period: 240, radius: 3.4, spin: 9, parent: '',
    moons: '1 satelit (Bulan)', dia: '12.742 km', dist: '149,6 juta km',
    day: '23 jam 56 menit', year: '365,25 hari',
    fact: 'Satu-satunya dunia yang diketahui memiliki kehidupan. 71% permukaannya tertutup air dan atmosfernya melindungi dari radiasi.',
  },
  {
    key: 'bulan', name: 'Bulan', kind: 'Satelit Alami Bumi',
    orbit: 10, angle: 40, period: 40, radius: 0.95, spin: 3, parent: 'bumi',
    moons: '—', dia: '3.474 km', dist: '384.400 km dari Bumi',
    day: '27,3 hari Bumi', year: '27,3 hari (mengorbit Bumi)',
    fact: 'Selalu menunjukkan sisi yang sama ke Bumi dan gaya pasangnya menstabilkan kemiringan poros Bumi.',
  },
  {
    key: 'mars', name: 'Mars', kind: 'Planet Terestrial',
    orbit: 156, angle: 320, period: 300, radius: 2.6, spin: 8, parent: '',
    moons: '2 satelit (Phobos, Deimos)', dia: '6.779 km', dist: '227,9 juta km',
    day: '24 jam 37 menit', year: '687 hari Bumi',
    fact: 'Rumah Olympus Mons, gunung api tertinggi di Tata Surya (22 km) — hampir tiga kali tinggi Everest.',
  },
  {
    key: 'jupiter', name: 'Jupiter', kind: 'Raksasa Gas',
    orbit: 220, angle: 60, period: 480, radius: 8.0, spin: 18, parent: '',
    moons: '95 satelit', dia: '139.820 km', dist: '778,5 juta km',
    day: '9 jam 56 menit', year: '11,9 tahun Bumi',
    fact: 'Bintik Merah Besar adalah badai abadi yang ukurannya lebih luas dari Bumi. Massanya 2,5 kali semua planet lain digabung.',
  },
  {
    key: 'saturnus', name: 'Saturnus', kind: 'Raksasa Gas',
    orbit: 272, angle: 200, period: 600, radius: 7.0, spin: 15, parent: '',
    moons: '146 satelit', dia: '116.460 km', dist: '1,43 miliar km',
    day: '10 jam 42 menit', year: '29,5 tahun Bumi',
    fact: 'Kepadatan rata-ratanya lebih ringan dari air. Cincinnya membentang 280.000 km namun hanya setebal beberapa puluh meter.',
  },
  {
    key: 'uranus', name: 'Uranus', kind: 'Raksasa Es',
    orbit: 320, angle: 30, period: 720, radius: 5.0, spin: 12, parent: '',
    moons: '28 satelit', dia: '50.724 km', dist: '2,87 miliar km',
    day: '17 jam 14 menit', year: '84 tahun Bumi',
    fact: 'Porosnya miring 98°, jadi planet ini seperti menggelinding saat mengorbit. Suhu terendahnya -224 °C.',
  },
  {
    key: 'neptunus', name: 'Neptunus', kind: 'Raksasa Es',
    orbit: 362, angle: 150, period: 840, radius: 4.6, spin: 11, parent: '',
    moons: '16 satelit', dia: '49.244 km', dist: '4,5 miliar km',
    day: '16 jam 6 menit', year: '165 tahun Bumi',
    fact: 'Angin tercepat di Tata Surya bertiup hingga 2.100 km/jam. Ditemukan lewat perhitungan matematika sebelum terlihat.',
  },
  {
    key: 'pluto', name: 'Pluto', kind: 'Planet Katai',
    orbit: 404, angle: 280, period: 960, radius: 1.4, spin: 2, parent: '',
    moons: '5 satelit', dia: '2.377 km', dist: '5,9 miliar km',
    day: '6,4 hari Bumi', year: '248 tahun Bumi',
    fact: 'Punya "hati" nitrogen raksasa bernama Tombaugh Regio, terungkap oleh misi New Horizons pada 2015.',
  },
]

export const ATLAS_KEYS: string[] = BODIES.map((b) => b.key)

export function bodyByKey(key: string): BodyDef {
  for (const b of BODIES) if (b.key === key) return b
  return BODIES[0]
}

export function orbitPosition(b: BodyDef, t: number, parentPos?: Vec3): Vec3 {
  if (!b.orbit) return { x: 0, y: 0, z: 0 }
  const a = ((b.angle + (b.period > 0 ? (t / b.period) * 360 : 0)) * Math.PI) / 180
  const px = Math.cos(a) * b.orbit
  const pz = Math.sin(a) * b.orbit
  if (parentPos) return { x: parentPos.x + px, y: parentPos.y, z: parentPos.z + pz }
  return { x: px, y: 0, z: pz }
}

export function resolvePositions(t: number): Record<string, Vec3> {
  const out: Record<string, Vec3> = {}
  for (const b of BODIES) {
    if (b.parent && out[b.parent]) out[b.key] = orbitPosition(b, t, out[b.parent])
    else out[b.key] = orbitPosition(b, t)
  }
  return out
}

export function lookAngles(from: Vec3, to: Vec3): { yaw: number; pitch: number } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dz = to.z - from.z
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
  const fx = dx / len, fy = dy / len, fz = dz / len
  return {
    yaw: (Math.atan2(-fx, -fz) * 180) / Math.PI,
    pitch: (Math.atan2(fy, Math.sqrt(fx * fx + fz * fz)) * 180) / Math.PI,
  }
}

export function forwardVec(yawDeg: number, pitchDeg: number): Vec3 {
  const y = (yawDeg * Math.PI) / 180
  const p = (pitchDeg * Math.PI) / 180
  const cp = Math.cos(p)
  return { x: -Math.sin(y) * cp, y: Math.sin(p), z: -Math.cos(y) * cp }
}

export function dist3(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}
