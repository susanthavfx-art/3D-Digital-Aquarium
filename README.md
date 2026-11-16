# 🐠 3D Digital Aquarium (GitHub Pages + Supabase Edition)

A **100% static, serverless 3D Digital Aquarium** powered by **Three.js** + **Supabase (Postgres, Storage & Realtime)**. Ready to host directly on **GitHub Pages** (`https://<username>.github.io/<repo-name>/`) for free — no Node.js server required!

---

## 🚀 Deploy on GitHub Pages in 2 Minutes!

1. Create a new **Public** repository on GitHub (e.g., `digital-aquarium`).
2. Extract this ZIP file and **upload all files & folders** (`index.html`, `scan.html`, `sheets.html`, `.nojekyll`, `css/`, `js/`, `vendor/`, `coloring-sheets/`) directly into the **root** of the repository.
3. In your GitHub repository, go to:
   - **Settings** → **Pages** (left sidebar)
   - Under **Build and deployment** → **Source**: select **Deploy from a branch**
   - Select Branch: **`main`** and Folder: **`/ (root)`**, then click **Save**!
4. Wait ~60 seconds — your live **HTTPS** URL (`https://<username>.github.io/<repo-name>/`) is ready!

---

## 🌊 Pages

- **`index.html`** — Fullscreen **3D Digital Aquarium** for TV / Projector / Laptop (automatically generates the QR code for your live GitHub Pages URL!)
- **`scan.html`** — **Smartphone Paper Camera Scanner + 3D Orbit & Live Camera AR Preview**
- **`sheets.html`** — **Printable A4 Coloring Sheets** (5 sea creatures with 4 fiducial corner markers + QR code + optional virtual crayon tester)

---

## 🗄️ Connected Supabase Backend

Pre-connected in `js/config.js` to your Supabase project **`digital-aquarium`** (`tjvmncxnnurseyqheblp`):
- **Table:** `public.aquarium_fishes` (with Row Level Security & `supabase_realtime` enabled)
- **Storage Bucket:** `fish-textures` (public read/upload for scanned UV textures)
- Full SQL reference is saved in `supabase-schema.sql`.

---

## 🖼️ Underwater Background Artwork

The tank uses **`assets/underwater-bg.jpg`** as the full-bleed backdrop behind every 3D fish, rock and plant
(`js/aquarium.js` → `loadUnderwaterBackdrop()`):

- The JPG is preloaded in `index.html` and applied as the Three.js `scene.background`, scaled like CSS
  `background-size: cover` — so it is never stretched on TVs, laptops or portrait phones.
- A gradient dome is shown while the artwork downloads (and if the file is ever missing), then cross-fades away.
- `assets/underwater-bg.png` is used automatically as a fallback if the JPG cannot be loaded.
