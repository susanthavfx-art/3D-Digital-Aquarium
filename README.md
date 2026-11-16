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

## 🖼️ Parallax Underwater Backdrop

The tank is drawn on top of a **4-layer parallax backdrop** (`js/aquarium.js` → `buildParallaxBackdrop()`),
so it feels like a real underwater environment instead of a flat blue wall:

| Layer | Source | Depth | Behaviour |
|---|---|---|---|
| **Gradient** | painted canvas gradient | far | instant paint + graceful fallback if the photo is missing |
| **Photo** | **`assets/underwater-bg.jpg`** (`.png` fallback) | far | fills the frame like CSS `cover`, fades in when decoded |
| **Midground** | painted rock / kelp / coral silhouettes | mid | slides ~4× more than the photo while orbiting |
| **Foreground** | dark out-of-focus kelp at the edges | near | strongest parallax, frames the tank |

- The backdrop lives in its own `Scene` that is rendered **before** the tank, then the 3D scene is
  rendered on top without clearing — so the artwork can never cover the fish (or be covered by them).
- Layers are children of the camera, so they always fill the frame, and each one slides by
  `distance / virtualDepth` of the camera movement → true parallax with no visible edges.
- Swap the artwork any time by replacing `assets/underwater-bg.jpg` (16:9 works best).
