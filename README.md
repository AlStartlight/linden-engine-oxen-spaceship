# OXen // 2099 — Linden Engine Spaceship

> 🚀 Game eksplorasi Tata Surya bertema cyberpunk, **dibuat dengan [Linden Engine](https://lindenengine.com)**.
>
> **Made BY Linden Engine** — © 2026 AlStartlight

Terbangkan kapal luar angkasa OXen menjelajahi Matahari, delapan planet, Bulan, dan Pluto. Pindai setiap benda langit untuk mengisi **Atlas Tata Surya** dengan data nyata (diameter, jarak, rotasi, revolusi, satelit, dan fakta menarik), lompat antar-target navigasi, dan nikmati visual neon "cyberpunk 2099".

## Fitur

- **Simulasi Tata Surya** — orbit planet, rotasi benda langit, sabuk asteroid, dan cincin Saturnus.
- **Penerbangan kapal** — kendali yaw/pitch, boost, rem, dan arah bebas dengan mouse.
- **Atlas & pemindaian** — pindai Matahari, Merkurius, Venus, Bumi, Bulan, Mars, Jupiter, Saturnus, Uranus, Neptunus, dan Pluto.
- **Lompatan (warp)** ke target navigasi yang dipilih.
- **HUD neon** berbasis HTML UI dan efek grafis NeonFX (halo atmosfer, kabut, debu bintang).
- **Kontrol mobile** — joystick dan tombol sentuh THRUST / BOOST / SCAN / WARP / NEXT.

## Kontrol

| Tombol | Aksi |
| --- | --- |
| `W` / `S` | Dorong maju / mundur |
| `A` / `D` (atau panah) | Belok kiri / kanan |
| `Q` / `E` | Hidung turun / naik |
| Mouse | Arah bebas (yaw + pitch) |
| `Shift` / `Space` | Boost |
| `C` | Rem |
| `F` | Pindai benda langit |
| `R` | Lompat (warp) ke target |
| `Tab` | Ganti target navigasi |

Gamepad dan layar sentuh juga didukung.

## Struktur Proyek

```
project.linden.json     Konfigurasi proyek (input actions, scene, export preset)
scenes/Main.lscene      Scene utama (Tata Surya, kapal, kamera, cahaya)
scripts/
  solar.ts              Data Tata Surya bersama
  GalaxySystem.ts       Orbit, asteroid, target navigasi, pemindaian, lompatan
  ShipFlight.ts         Kendali kapal luar angkasa
  NeonFX.ts             Lapisan grafis neon cyberpunk
ui/hud.html             HUD (panel status, atlas, data record, navigasi)
build/web/              Build HTML5 siap main
```

## Menjalankan

**Di Linden Engine:** buka folder ini sebagai proyek di Linden Engine, lalu tekan **Play**.

**Build web:** sajikan folder `build/web/` lewat server statis, misalnya:

```bash
npx serve build/web
# atau
python3 -m http.server -d build/web 8080
```

Lalu buka `http://localhost:8080` di browser yang mendukung WebGPU (Chrome / Edge terbaru).

## Dibuat dengan Linden Engine

Proyek ini dibangun sepenuhnya dengan **Linden Engine** — game engine Entity-Component-System (ECS) berbasis TypeScript dengan renderer WebGPU/WebGL (Three.js) dan fisika Rapier 3D. Scene, script gameplay, HUD, dan build web semuanya dibuat dan diekspor melalui Linden Engine.
