import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import {
  SPECIES_LIST,
  getSpeciesMeta,
  buildCreatureMesh,
  animateCreatureMesh,
  generateHandColoredCanvas
} from './creatures.js';
import {
  detectSheetCorners,
  unwarpSheetAndExtractTexture,
  createSimulatedDeskPhoto
} from './vision.js';
import {
  initLiveChannel,
  submitFishToSupabase,
  broadcastTankEvent
} from './supabase-api.js';

const SAMPLE_PALETTES = {
  clownfish: ['#ff5400', '#ff8500', '#ffbd00', '#ffffff'],
  angelfish: ['#00bbf9', '#f15bb5', '#fee440', '#ffffff'],
  turtle: ['#06d6a0', '#118ab2', '#ffd166', '#e9ff70'],
  jellyfish: ['#f72585', '#7209b7', '#4cc9f0', '#fff3b0'],
  starfish: ['#ffbe0b', '#fb5607', '#ff006e', '#ffffff']
};

class PaperScannerApp {
  constructor() {
    this.video = document.getElementById('camera-video');
    this.overlayCanvas = document.getElementById('camera-overlay');
    this.cropCanvas = document.getElementById('crop-editor-canvas');

    this.stream = null;
    this.detectTimer = null;
    this.liveQuad = null;

    this.capturedCanvas = null;
    this.quadCorners = null; // 4 points in capturedCanvas coords [TL, TR, BR, BL]
    this.draggingIdx = -1;

    this.currentSpecies = 'auto';
    this.resolvedSpecies = 'clownfish';
    this.keepCrispInk = true;
    this.uvCanvas = null;

    // 3D & AR Preview state
    this.previewScene = null;
    this.previewCamera = null;
    this.previewRenderer = null;
    this.previewControls = null;
    this.previewCreature = null;
    this.arMode = false;
    this.arVideo = document.getElementById('ar-bg-video');
    this.clock = new THREE.Clock();
    this.gltfLoader = new GLTFLoader();
    this.userTestGltf = null;

    this.initUI();
    this.init3DPreviewStage();
    preloadCustomCreatureAssets(GLTFLoader).then(() => {
      this.checkIncomingVirtualSheet();
      if (this.uvCanvas) this.update3DPreviewMesh();
    });
  }

  initUI() {
    // Populate species selector chips for Sample Demo & Override
    const sampleSelect = document.getElementById('sample-species-select');
    const overrideSelect = document.getElementById('species-override-select');
    if (sampleSelect) {
      for (const s of SPECIES_LIST) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.emoji} ${s.name}`;
        sampleSelect.appendChild(opt);
      }
    }
    if (overrideSelect) {
      for (const s of SPECIES_LIST) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.emoji} ${s.name}`;
        overrideSelect.appendChild(opt);
      }
      overrideSelect.addEventListener('change', (e) => {
        this.currentSpecies = e.target.value;
        this.rebuildUVFromCurrentQuad();
      });
    }

    document.getElementById('chk-crisp-ink')?.addEventListener('change', (e) => {
      this.keepCrispInk = e.target.checked;
      this.rebuildUVFromCurrentQuad();
    });

    // Step 1 Buttons
    document.getElementById('btn-start-camera')?.addEventListener('click', () => this.startCamera());
    document.getElementById('btn-stop-camera')?.addEventListener('click', () => this.stopCamera());
    document.getElementById('btn-shutter')?.addEventListener('click', () => this.captureFromVideo());

    document.getElementById('file-upload-input')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) this.loadPhotoFile(file);
    });

    document.getElementById('btn-try-sample')?.addEventListener('click', () => {
      const sp = sampleSelect?.value || 'clownfish';
      this.runSampleDeskDemo(sp);
    });

    // Step 2: Interactive 4-Corner Pin Editor
    this.setupCornerDragEvents();
    document.getElementById('btn-apply-crop')?.addEventListener('click', () => {
      this.rebuildUVFromCurrentQuad();
      this.showStep('step-preview');
    });
    document.getElementById('btn-back-capture')?.addEventListener('click', () => {
      this.showStep('step-capture');
    });

    // Step 3: 3D & AR Preview Controls
    document.getElementById('btn-adjust-corners')?.addEventListener('click', () => {
      this.showStep('step-crop');
      this.renderCropEditor();
    });

    document.getElementById('btn-mode-3d')?.addEventListener('click', () => this.setARMode(false));
    document.getElementById('btn-mode-ar')?.addEventListener('click', () => this.setARMode(true));

    document.getElementById('btn-rescan')?.addEventListener('click', () => {
      this.setARMode(false);
      this.showStep('step-capture');
    });

    document.getElementById('btn-send-aquarium')?.addEventListener('click', () => this.sendToAquarium());

    // Warm up Supabase Realtime broadcast channel on load
    initLiveChannel();

    // Step 4: Post-launch celebration actions
    document.getElementById('btn-scan-another')?.addEventListener('click', () => {
      this.showStep('step-capture');
    });
    document.getElementById('btn-remote-feed')?.addEventListener('click', () => {
      broadcastTankEvent('feed');
    });
    document.getElementById('btn-remote-shark')?.addEventListener('click', () => {
      broadcastTankEvent('shark');
    });
  }

  checkIncomingVirtualSheet() {
    // If user colored a virtual sheet in /sheets and clicked "Send to Scanner", load that desk photo!
    try {
      const raw = localStorage.getItem('quiver_virtual_sheet');
      if (raw) {
        localStorage.removeItem('quiver_virtual_sheet');
        const payload = JSON.parse(raw);
        if (payload && payload.dataUrl) {
          const img = new Image();
          img.onload = () => {
            this.currentSpecies = 'auto';
            this.processCapturedSource(img);
          };
          img.src = payload.dataUrl;
        }
      }
    } catch (_) {}
  }

  showStep(stepId) {
    for (const id of ['step-capture', 'step-crop', 'step-preview', 'step-sent']) {
      document.getElementById(id)?.classList.toggle('hidden', id !== stepId);
    }
    if (stepId === 'step-preview') {
      setTimeout(() => this.resizePreviewStage(), 50);
    }
  }

  // ==========================================================================
  // LIVE CAMERA & AUTOMATIC FIDUCIAL TRACKING
  // ==========================================================================

  async startCamera() {
    try {
      this.stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });
      this.stream = stream;
      this.video.srcObject = stream;
      await this.video.play();

      document.getElementById('camera-live-box')?.classList.remove('hidden');
      document.getElementById('camera-idle-box')?.classList.add('hidden');

      this.detectTimer = setInterval(() => this.runLiveMarkerOverlay(), 140);
    } catch (err) {
      alert('Camera open karanna bari una (HTTPS හෝ Camera permission check karanna). Oyata "Upload Photo" හෝ "Try Sample Paper Photo" පාවිච්චි කරන්නත් පුළුවන්!');
    }
  }

  stopCamera() {
    if (this.detectTimer) {
      clearInterval(this.detectTimer);
      this.detectTimer = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    document.getElementById('camera-live-box')?.classList.add('hidden');
    document.getElementById('camera-idle-box')?.classList.remove('hidden');
  }

  runLiveMarkerOverlay() {
    if (!this.video || this.video.readyState < 2) return;
    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    if (!vw || !vh) return;

    this.overlayCanvas.width = vw;
    this.overlayCanvas.height = vh;
    const ctx = this.overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, vw, vh);

    const quad = detectSheetCorners(this.video);
    this.liveQuad = quad;
    const badge = document.getElementById('live-detect-status');

    if (quad) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = Math.max(4, vw * 0.006);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
      ctx.beginPath();
      ctx.moveTo(quad[0].x, quad[0].y);
      ctx.lineTo(quad[1].x, quad[1].y);
      ctx.lineTo(quad[2].x, quad[2].y);
      ctx.lineTo(quad[3].x, quad[3].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      for (const pt of quad) {
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(8, vw * 0.012), 0, Math.PI * 2);
        ctx.fill();
      }
      if (badge) {
        badge.textContent = '✅ 4 Corner Markers Locked! Tap Capture!';
        badge.classList.add('locked');
      }
    } else if (badge) {
      badge.textContent = '🔍 Align the 4 black corner squares of your sheet...';
      badge.classList.remove('locked');
    }
  }

  captureFromVideo() {
    if (!this.video || !this.video.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = this.video.videoWidth;
    c.height = this.video.videoHeight;
    c.getContext('2d').drawImage(this.video, 0, 0);
    const savedQuad = this.liveQuad ? this.liveQuad.map((p) => ({ ...p })) : null;
    this.stopCamera();
    this.processCapturedSource(c, savedQuad);
  }

  loadPhotoFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        this.currentSpecies = 'auto';
        this.processCapturedSource(img);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  runSampleDeskDemo(species) {
    const palette = SAMPLE_PALETTES[species] || SAMPLE_PALETTES.clownfish;
    const coloredInner = generateHandColoredCanvas(species, palette, true);
    const simulatedPhoto = createSimulatedDeskPhoto(species, coloredInner);
    this.currentSpecies = 'auto';
    this.processCapturedSource(simulatedPhoto);
  }

  // ==========================================================================
  // PROCESS PHOTO -> AUTO FIDUCIAL DETECT OR MANUAL 4-PIN FALLBACK
  // ==========================================================================

  processCapturedSource(source, preDetectedQuad = null) {
    const w = source.videoWidth || source.naturalWidth || source.width;
    const h = source.videoHeight || source.naturalHeight || source.height;
    const maxDim = 1100;
    const scale = Math.min(1, maxDim / Math.max(w, h));

    this.capturedCanvas = document.createElement('canvas');
    this.capturedCanvas.width = Math.round(w * scale);
    this.capturedCanvas.height = Math.round(h * scale);
    this.capturedCanvas.getContext('2d').drawImage(source, 0, 0, this.capturedCanvas.width, this.capturedCanvas.height);

    let detected = null;
    if (preDetectedQuad) {
      detected = preDetectedQuad.map((p) => ({ x: p.x * scale, y: p.y * scale }));
    } else {
      detected = detectSheetCorners(this.capturedCanvas);
    }

    const cw = this.capturedCanvas.width;
    const ch = this.capturedCanvas.height;

    if (detected) {
      this.quadCorners = detected;
      this.rebuildUVFromCurrentQuad();
      const statusChip = document.getElementById('crop-auto-badge');
      if (statusChip) {
        const meta = getSpeciesMeta(this.resolvedSpecies);
        statusChip.textContent = `✅ Auto-Unwarped • ${meta.emoji} ${meta.name} Detected`;
      }
      this.showStep('step-preview');
    } else {
      // Fallback: place 4 draggable corner handles neatly for manual alignment!
      const padX = cw * 0.14;
      const padY = ch * 0.14;
      this.quadCorners = [
        { x: padX, y: padY },
        { x: cw - padX, y: padY },
        { x: cw - padX, y: ch - padY },
        { x: padX, y: ch - padY }
      ];
      this.showStep('step-crop');
      this.renderCropEditor();
    }
  }

  rebuildUVFromCurrentQuad() {
    if (!this.capturedCanvas || !this.quadCorners) return;
    const result = unwarpSheetAndExtractTexture(
      this.capturedCanvas,
      this.quadCorners,
      this.currentSpecies,
      this.keepCrispInk
    );
    this.resolvedSpecies = result.species;
    this.uvCanvas = result.uvCanvas;

    // Sync species dropdown UI
    const overrideSelect = document.getElementById('species-override-select');
    if (overrideSelect) overrideSelect.value = this.resolvedSpecies;

    // Update 2D unwarped thumbnail + original desk photo thumbnail
    const thumb = document.getElementById('unwarped-thumb');
    if (thumb) thumb.src = this.uvCanvas.toDataURL('image/png');
    const srcThumb = document.getElementById('source-photo-thumb');
    if (srcThumb) {
      // Draw captured photo with green detected quad overlay!
      const mini = document.createElement('canvas');
      mini.width = 240;
      mini.height = Math.round((240 * this.capturedCanvas.height) / this.capturedCanvas.width);
      const mctx = mini.getContext('2d');
      mctx.drawImage(this.capturedCanvas, 0, 0, mini.width, mini.height);
      const sx = mini.width / this.capturedCanvas.width;
      const sy = mini.height / this.capturedCanvas.height;
      mctx.strokeStyle = '#10b981';
      mctx.lineWidth = 3;
      mctx.beginPath();
      this.quadCorners.forEach((p, idx) => {
        if (idx === 0) mctx.moveTo(p.x * sx, p.y * sy);
        else mctx.lineTo(p.x * sx, p.y * sy);
      });
      mctx.closePath();
      mctx.stroke();
      srcThumb.src = mini.toDataURL('image/jpeg', 0.85);
    }

    // Update 3D creature mesh in preview stage!
    this.update3DPreviewMesh();
  }

  // ==========================================================================
  // INTERACTIVE 4-CORNER PIN CROP EDITOR
  // ==========================================================================

  setupCornerDragEvents() {
    if (!this.cropCanvas) return;

    const getCanvasCoords = (e) => {
      const rect = this.cropCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * this.capturedCanvas.width,
        y: ((clientY - rect.top) / rect.height) * this.capturedCanvas.height
      };
    };

    const onDown = (e) => {
      if (!this.quadCorners || !this.capturedCanvas) return;
      const pt = getCanvasCoords(e);
      let best = -1;
      let minD = Math.max(45, this.capturedCanvas.width * 0.08);
      this.quadCorners.forEach((c, idx) => {
        const d = Math.hypot(c.x - pt.x, c.y - pt.y);
        if (d < minD) {
          minD = d;
          best = idx;
        }
      });
      if (best >= 0) {
        this.draggingIdx = best;
        e.preventDefault();
      }
    };

    const onMove = (e) => {
      if (this.draggingIdx < 0 || !this.capturedCanvas) return;
      e.preventDefault();
      const pt = getCanvasCoords(e);
      this.quadCorners[this.draggingIdx] = {
        x: Math.max(4, Math.min(this.capturedCanvas.width - 4, pt.x)),
        y: Math.max(4, Math.min(this.capturedCanvas.height - 4, pt.y))
      };
      this.renderCropEditor();
    };

    const onUp = () => {
      this.draggingIdx = -1;
    };

    this.cropCanvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    this.cropCanvas.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }

  renderCropEditor() {
    if (!this.cropCanvas || !this.capturedCanvas || !this.quadCorners) return;
    this.cropCanvas.width = this.capturedCanvas.width;
    this.cropCanvas.height = this.capturedCanvas.height;
    const ctx = this.cropCanvas.getContext('2d');
    ctx.drawImage(this.capturedCanvas, 0, 0);

    // Dim outside quad slightly
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = Math.max(4, this.capturedCanvas.width * 0.006);
    ctx.fillStyle = 'rgba(45, 212, 191, 0.14)';
    ctx.beginPath();
    this.quadCorners.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const labels = ['TL', 'TR', 'BR', 'BL'];
    const r = Math.max(16, this.capturedCanvas.width * 0.025);
    this.quadCorners.forEach((p, idx) => {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(r * 0.85)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[idx], p.x, p.y);
    });
  }

  // ==========================================================================
  // 3D STUDIO & LIVE PHONE CAMERA AR PREVIEW STAGE
  // ==========================================================================

  init3DPreviewStage() {
    const wrap = document.getElementById('preview-3d-stage');
    if (!wrap) return;

    this.previewScene = new THREE.Scene();
    this.previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    this.previewCamera.position.set(0, 0.35, 4.1);

    this.previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.previewRenderer.setClearColor(0x062846, 1);
    wrap.appendChild(this.previewRenderer.domElement);

    this.previewControls = new OrbitControls(this.previewCamera, this.previewRenderer.domElement);
    this.previewControls.enableDamping = true;
    this.previewControls.minDistance = 2.2;
    this.previewControls.maxDistance = 7.5;

    const hemi = new THREE.HemisphereLight(0x88f4ff, 0x0b2545, 1.5);
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(3, 5, 5);
    this.previewScene.add(hemi, dir);

    // Floating magic AR bubbles around creature!
    this.arBubbles = new THREE.Group();
    const bGeom = new THREE.SphereGeometry(0.045, 8, 8);
    const bMat = new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(bGeom, bMat);
      m.position.set((Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2.0);
      m.userData.speed = 0.35 + Math.random() * 0.5;
      this.arBubbles.add(m);
    }
    this.previewScene.add(this.arBubbles);

    window.addEventListener('resize', () => this.resizePreviewStage());
    this.animatePreview();
  }

  resizePreviewStage() {
    const wrap = document.getElementById('preview-3d-stage');
    if (!wrap || !this.previewRenderer) return;
    const w = wrap.clientWidth || 340;
    const h = wrap.clientHeight || 300;
    this.previewCamera.aspect = w / h;
    this.previewCamera.updateProjectionMatrix();
    this.previewRenderer.setSize(w, h);
  }

  update3DPreviewMesh() {
    if (!this.previewScene || !this.uvCanvas) return;
    if (this.previewCreature) {
      this.previewScene.remove(this.previewCreature);
      this.previewCreature = null;
    }

    const tex = new THREE.CanvasTexture(this.uvCanvas);
    this.previewCreature = buildCreatureMesh(THREE, this.resolvedSpecies, tex);
    const meta = getSpeciesMeta(this.resolvedSpecies);
    this.previewCreature.scale.setScalar(meta.baseScale * 0.92);
    this.previewScene.add(this.previewCreature);
  }

  async setARMode(enable) {
    this.arMode = enable;
    document.getElementById('btn-mode-3d')?.classList.toggle('active-tab', !enable);
    document.getElementById('btn-mode-ar')?.classList.toggle('active-tab', enable);

    if (enable) {
      try {
        const arStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        this.arStream = arStream;
        this.arVideo.srcObject = arStream;
        this.arVideo.classList.remove('hidden');
        await this.arVideo.play();
        this.previewRenderer.setClearColor(0x000000, 0); // Transparent WebGL over live rear camera!
      } catch (_) {
        this.arMode = false;
        document.getElementById('btn-mode-3d')?.classList.add('active-tab');
        document.getElementById('btn-mode-ar')?.classList.remove('active-tab');
        alert('AR Camera open karanna camera permission ona. 3D Preview mode eka wada!');
      }
    } else {
      if (this.arStream) {
        this.arStream.getTracks().forEach((t) => t.stop());
        this.arStream = null;
      }
      this.arVideo?.classList.add('hidden');
      this.previewRenderer?.setClearColor(0x062846, 1);
    }
  }

  animatePreview() {
    requestAnimationFrame(() => this.animatePreview());
    if (!this.previewRenderer) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;

    this.previewControls?.update();
    if (this.previewCreature) {
      animateCreatureMesh(this.previewCreature, t, 1.15);
      if (!this.launchingUp) {
        this.previewCreature.position.y = Math.sin(t * 1.8) * 0.1;
      } else {
        this.previewCreature.position.y += dt * 7.5;
      }
    }

    if (this.arBubbles) {
      for (const m of this.arBubbles.children) {
        m.position.y += m.userData.speed * dt;
        if (m.position.y > 1.4) m.position.y = -1.4;
      }
    }

    this.previewRenderer.render(this.previewScene, this.previewCamera);
  }

  // ==========================================================================
  // LAUNCH SCANNED CREATURE INTO THE SHARED 3D DIGITAL AQUARIUM!
  // ==========================================================================

  async sendToAquarium() {
    if (!this.uvCanvas) return;
    const btn = document.getElementById('btn-send-aquarium');
    const nameInput = document.getElementById('artist-name-input');
    const artistName = (nameInput?.value || '').trim() || 'Explorer';

    if (btn) {
      btn.disabled = true;
      btn.textContent = '🌊 Aquarium එකට යවමින්...';
    }

    // Animate creature swimming upward out of phone into the big tank!
    this.launchingUp = true;

    try {
      const textureDataUrl = this.uvCanvas.toDataURL('image/png');
      await submitFishToSupabase({
        name: artistName,
        species: this.resolvedSpecies,
        textureDataUrl
      });

      await new Promise((r) => setTimeout(r, 450));
      this.setARMode(false);
      this.launchingUp = false;
      if (this.previewCreature) this.previewCreature.position.y = 0;

      const meta = getSpeciesMeta(this.resolvedSpecies);
      const sentMsg = document.getElementById('sent-summary-text');
      if (sentMsg) {
        sentMsg.textContent = `${artistName} ගේ ${meta.emoji} ${meta.name} දැන් Supabase Realtime හරහා ලොකු 3D Digital Aquarium තිරයේ පීනනවා!`;
      }
      this.showStep('step-sent');
    } catch (err) {
      console.error('Supabase send error:', err);
      this.launchingUp = false;
      if (this.previewCreature) this.previewCreature.position.y = 0;
      alert('Aquarium ekata yawanna bari una: ' + (err?.message || 'Connection check karanna'));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🚀 Aquarium එකට යවන්න! (Send to Tank)';
      }
    }
  }
}

new PaperScannerApp();
