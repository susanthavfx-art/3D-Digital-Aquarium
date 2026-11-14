// Shared Species Definitions:
// 1) Exact 512x512 2D printable coloring sheet templates & silhouette masks
// 2) Exact 1:1 UV-mapped procedural 3D Three.js meshes & swimming vertex animations
// 3) Procedural hand-colored crayon demo textures for starter fishes & sample paper scans

export const SPECIES_LIST = [
  {
    id: 'clownfish',
    name: 'Clownfish',
    sinhala: 'ක්ලවුන් මාළුවා (Clownfish)',
    emoji: '🐠',
    badgeColor: '#ff6b35',
    swimZone: 'mid',
    baseScale: 1.05
  },
  {
    id: 'angelfish',
    name: 'Reef Angelfish',
    sinhala: 'ඒන්ජල් මාළුවා (Angelfish)',
    emoji: '🐟',
    badgeColor: '#00b4d8',
    swimZone: 'mid-high',
    baseScale: 1.12
  },
  {
    id: 'turtle',
    name: 'Sea Turtle',
    sinhala: 'මුහුදු කැස්බෑවා (Sea Turtle)',
    emoji: '🐢',
    badgeColor: '#2ec4b6',
    swimZone: 'high',
    baseScale: 1.25
  },
  {
    id: 'jellyfish',
    name: 'Glowing Jellyfish',
    sinhala: 'ජෙලිෆිෂ් (Jellyfish)',
    emoji: '🪼',
    badgeColor: '#b5179e',
    swimZone: 'float',
    baseScale: 1.08
  },
  {
    id: 'starfish',
    name: 'Sea Star',
    sinhala: 'මුහුදු තරුව (Starfish)',
    emoji: '⭐',
    badgeColor: '#ffbe0b',
    swimZone: 'reef',
    baseScale: 0.92
  }
];

export function getSpeciesMeta(speciesId) {
  return SPECIES_LIST.find((s) => s.id === speciesId) || SPECIES_LIST[0];
}

// ============================================================================
// EXACT PARAMETRIC SILHOUETTE PROFILES IN 512x512 TEMPLATE SPACE
// ============================================================================

function clownfishProfile(tx) {
  // tx in [60, 466], center y = 256
  const xMin = 60;
  const xMax = 466;
  const u = Math.max(0, Math.min(1, (tx - xMin) / (xMax - xMin)));

  let topH = 0;
  let botH = 0;

  if (u < 0.74) {
    // Plump oval body from nose (u=0) to peduncle (u=0.74)
    const bu = u / 0.74;
    const baseOval = Math.sin(Math.pow(bu, 0.72) * Math.PI) * 96 + (1 - Math.abs(bu - 0.5) * 1.4) * 18;
    // Twin dorsal fin humps
    const d1 = bu > 0.24 && bu < 0.62 ? Math.pow(Math.sin(((bu - 0.24) / 0.38) * Math.PI), 0.85) * 42 : 0;
    const d2 = bu > 0.60 && bu < 0.95 ? Math.pow(Math.sin(((bu - 0.60) / 0.35) * Math.PI), 0.85) * 34 : 0;
    // Ventral & anal fins
    const v1 = bu > 0.30 && bu < 0.56 ? Math.pow(Math.sin(((bu - 0.30) / 0.26) * Math.PI), 0.9) * 34 : 0;
    const v2 = bu > 0.62 && bu < 0.94 ? Math.pow(Math.sin(((bu - 0.62) / 0.32) * Math.PI), 0.9) * 30 : 0;

    const peduncleFloor = bu > 0.82 ? 32 * ((bu - 0.82) / 0.18) : 0;
    topH = Math.max(baseOval + Math.max(d1, d2), peduncleFloor);
    botH = Math.max(baseOval * 0.96 + Math.max(v1, v2), peduncleFloor);
  } else {
    // Caudal rounded fan tail from u=0.74 to u=1.0
    const tu = (u - 0.74) / 0.26;
    const fan = 32 + Math.sin(Math.min(1, tu * 0.82) * (Math.PI * 0.5)) * 72;
    const roundTip = tu > 0.72 ? Math.cos(((tu - 0.72) / 0.28) * (Math.PI * 0.5)) : 1.0;
    const h = fan * Math.pow(Math.max(0, roundTip), 0.55);
    topH = h;
    botH = h;
  }
  return { topH, botH, u };
}

function angelfishProfile(tx) {
  // Tall graceful reef angelfish: tx in [66, 462], center y = 256
  const xMin = 66;
  const xMax = 462;
  const u = Math.max(0, Math.min(1, (tx - xMin) / (xMax - xMin)));

  let topH = 0;
  let botH = 0;

  if (u < 0.74) {
    const bu = u / 0.74;
    const body = Math.sin(Math.pow(bu, 0.78) * Math.PI) * 105;
    // Sweeping tall dorsal & anal fins peaking near bu = 0.62
    const dorsalSweep =
      bu > 0.22 && bu < 0.96
        ? Math.pow(Math.sin(((bu - 0.22) / 0.74) * Math.PI), 1.15) * 96
        : 0;
    const analSweep =
      bu > 0.28 && bu < 0.96
        ? Math.pow(Math.sin(((bu - 0.28) / 0.68) * Math.PI), 1.15) * 92
        : 0;
    const waist = bu > 0.84 ? 26 * ((bu - 0.84) / 0.16) : 0;
    topH = Math.max(body + dorsalSweep, waist);
    botH = Math.max(body + analSweep, waist);
  } else {
    const tu = (u - 0.74) / 0.26;
    const spread = 26 + tu * 74;
    // Gently scalloped crescent trailing edge
    const edgeClose = tu > 0.78 ? Math.cos(((tu - 0.78) / 0.22) * (Math.PI * 0.5)) : 1;
    const h = spread * Math.pow(Math.max(0, edgeClose), 0.5);
    topH = h;
    botH = h;
  }
  return { topH, botH, u };
}

function starfishRadius(theta) {
  // 5-armed sea star centered at (256, 262)
  // Rotate so top arm points straight up (-PI/2)
  const wave = Math.cos(5 * (theta + Math.PI / 2));
  const shaped = Math.pow((wave + 1) * 0.5, 1.35);
  return 88 + shaped * 118;
}

// ============================================================================
// 2D COLORING TEMPLATE RENDERER (FOR PRINTABLE SHEETS & SILHOUETTE MASKS)
// ============================================================================

export function drawCreatureSilhouette(ctx, species, size = 512, mode = 'outline') {
  // mode: 'mask' (solid white on black/transparent), 'outline' (printable black strokes + inner pattern guides)
  const scale = size / 512;
  ctx.save();
  ctx.scale(scale, scale);

  const isMask = mode === 'mask';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (species === 'clownfish' || species === 'angelfish') {
    const profFn = species === 'clownfish' ? clownfishProfile : angelfishProfile;
    const xStart = species === 'clownfish' ? 60 : 66;
    const xEnd = species === 'clownfish' ? 466 : 462;

    ctx.beginPath();
    for (let x = xStart; x <= xEnd; x += 2) {
      const { topH } = profFn(x);
      const y = 256 - topH;
      if (x === xStart) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let x = xEnd; x >= xStart; x -= 2) {
      const { botH } = profFn(x);
      const y = 256 + botH;
      ctx.lineTo(x, y);
    }
    ctx.closePath();

    if (isMask) {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 7;
      ctx.stroke();

      // Internal decorative coloring guides
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 4.2;

      if (species === 'clownfish') {
        // 3 classic wavy clownfish stripes (clipped inside fish body!)
        ctx.save();
        ctx.clip();

        const drawBand = (cx, w, bend) => {
          for (const dx of [-w, w]) {
            ctx.beginPath();
            ctx.moveTo(cx + dx, 70);
            ctx.quadraticCurveTo(cx + dx + bend, 256, cx + dx, 440);
            ctx.stroke();
          }
        };
        drawBand(162, 16, -12);
        drawBand(258, 20, 14);
        drawBand(352, 13, -8);

        // Tail fin rays
        ctx.lineWidth = 2.6;
        for (const angle of [-0.36, -0.18, 0, 0.18, 0.36]) {
          ctx.beginPath();
          ctx.moveTo(368, 256 + angle * 45);
          ctx.lineTo(454, 256 + angle * 195);
          ctx.stroke();
        }
        ctx.restore();

        // Pectoral side fin
        ctx.beginPath();
        ctx.moveTo(188, 266);
        ctx.bezierCurveTo(242, 245, 252, 315, 192, 304);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // Happy mouth & friendly eye
        ctx.beginPath();
        ctx.arc(88, 268, 22, 0.15, 1.15);
        ctx.stroke();

        drawCuteEye(ctx, 114, 226, 17);
      } else {
        // Angelfish vertical reef bands & fin rays
        ctx.save();
        ctx.clip();
        for (const bx of [158, 215, 278, 332]) {
          ctx.beginPath();
          ctx.moveTo(bx + 18, 52);
          ctx.quadraticCurveTo(bx - 16, 256, bx + 18, 460);
          ctx.stroke();
        }
        ctx.lineWidth = 2.5;
        for (const dy of [-55, -28, 0, 28, 55]) {
          ctx.beginPath();
          ctx.moveTo(362, 256 + dy * 0.35);
          ctx.lineTo(450, 256 + dy * 1.25);
          ctx.stroke();
        }
        ctx.restore();

        // Pectoral fin
        ctx.beginPath();
        ctx.moveTo(178, 268);
        ctx.bezierCurveTo(232, 252, 236, 316, 180, 305);
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // Smile & eye
        ctx.beginPath();
        ctx.arc(92, 265, 18, 0.1, 1.1);
        ctx.stroke();
        drawCuteEye(ctx, 118, 232, 16);
      }
    }
  } else if (species === 'turtle') {
    // Sea Turtle (Top-down: head at top, 4 flippers, domed oval carapace shell)
    const drawTurtleParts = (fillStyle, strokeStyle, lineWidth) => {
      const part = (fn) => {
        ctx.beginPath();
        fn();
        ctx.closePath();
        if (fillStyle) {
          ctx.fillStyle = fillStyle;
          ctx.fill();
        }
        if (strokeStyle) {
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };

      // Head
      part(() => {
        ctx.ellipse(256, 94, 38, 48, 0, 0, Math.PI * 2);
      });
      // Front Left Flipper
      part(() => {
        ctx.moveTo(168, 172);
        ctx.bezierCurveTo(96, 138, 38, 182, 46, 234);
        ctx.bezierCurveTo(54, 264, 128, 242, 164, 224);
      });
      // Front Right Flipper
      part(() => {
        ctx.moveTo(344, 172);
        ctx.bezierCurveTo(416, 138, 474, 182, 466, 234);
        ctx.bezierCurveTo(458, 264, 384, 242, 348, 224);
      });
      // Rear Left Flipper
      part(() => {
        ctx.moveTo(182, 366);
        ctx.bezierCurveTo(126, 392, 108, 444, 142, 462);
        ctx.bezierCurveTo(172, 470, 202, 422, 212, 386);
      });
      // Rear Right Flipper
      part(() => {
        ctx.moveTo(330, 366);
        ctx.bezierCurveTo(386, 392, 404, 444, 370, 462);
        ctx.bezierCurveTo(340, 470, 310, 422, 300, 386);
      });
      // Cute little tail
      part(() => {
        ctx.moveTo(244, 396);
        ctx.lineTo(256, 442);
        ctx.lineTo(268, 396);
      });
      // Main Carapace Shell (drawn on top of flipper roots)
      part(() => {
        ctx.ellipse(256, 268, 112, 138, 0, 0, Math.PI * 2);
      });
    };

    if (isMask) {
      drawTurtleParts('#ffffff', '#ffffff', 4);
    } else {
      drawTurtleParts('#ffffff', '#111827', 6.5);

      // Inner shell rim & hexagonal scutes pattern for fun coloring!
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(256, 268, 88, 112, 0, 0, Math.PI * 2);
      ctx.stroke();

      const drawHex = (cx, cy, rx, ry) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + Math.PI / 6;
          const px = cx + Math.cos(a) * rx;
          const py = cy + Math.sin(a) * ry;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      };
      drawHex(256, 208, 32, 28);
      drawHex(256, 268, 34, 30);
      drawHex(256, 328, 32, 28);
      // Connecting spokes to shell rim
      const spokes = [
        [224, 194, 186, 178], [288, 194, 326, 178],
        [222, 254, 170, 248], [290, 254, 342, 248],
        [222, 290, 172, 304], [290, 290, 340, 304],
        [230, 344, 198, 366], [282, 344, 314, 366]
      ];
      ctx.lineWidth = 3.5;
      for (const [x1, y1, x2, y2] of spokes) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      // Eyes on turtle head
      drawCuteEye(ctx, 232, 76, 9);
      drawCuteEye(ctx, 280, 76, 9);
    }
  } else if (species === 'jellyfish') {
    // Glowing Jellyfish: Dome bell (y: 54..248) + 7 wide flowing ribbon tentacles (y: 236..466)
    const tentacleXs = [132, 173, 214, 256, 298, 339, 380];

    const drawTentacles = (fill, stroke, lw) => {
      for (let i = 0; i < tentacleXs.length; i++) {
        const bx = tentacleXs[i];
        const phase = (i % 2 === 0 ? 1 : -1) * 16;
        ctx.beginPath();
        ctx.moveTo(bx - 16, 232);
        ctx.bezierCurveTo(bx - 16 + phase, 305, bx - 14 - phase, 385, bx - 9 + phase * 0.4, 462);
        ctx.arc(bx + phase * 0.4, 462, 9, Math.PI, 0, true);
        ctx.bezierCurveTo(bx + 14 - phase, 385, bx + 16 + phase, 305, bx + 16, 232);
        ctx.closePath();
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lw;
          ctx.stroke();
        }
      }
    };

    const drawBell = (fill, stroke, lw) => {
      ctx.beginPath();
      ctx.moveTo(96, 232);
      ctx.bezierCurveTo(92, 102, 168, 52, 256, 52);
      ctx.bezierCurveTo(344, 52, 420, 102, 416, 232);
      // Scalloped cute bottom edge (6 scallops across 416 -> 96)
      const scallops = 6;
      const step = (416 - 96) / scallops;
      for (let s = 0; s < scallops; s++) {
        const sx1 = 416 - s * step;
        const sx2 = sx1 - step;
        ctx.quadraticCurveTo((sx1 + sx2) * 0.5, 256, sx2, 232);
      }
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
    };

    if (isMask) {
      drawTentacles('#ffffff', '#ffffff', 6);
      drawBell('#ffffff', '#ffffff', 6);
    } else {
      drawTentacles('#ffffff', '#111827', 5.5);
      drawBell('#ffffff', '#111827', 7);

      // Decorative bell segments & spots for kids to color
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 3.2;
      for (const offset of [-85, -35, 35, 85]) {
        ctx.beginPath();
        ctx.moveTo(256 + offset * 0.22, 56);
        ctx.quadraticCurveTo(256 + offset * 1.15, 138, 256 + offset * 1.35, 234);
        ctx.stroke();
      }
      // Cute spots & happy Kawaii face on bell
      for (const [sx, sy, sr] of [[152, 134, 14], [360, 134, 14], [202, 102, 10], [310, 102, 10]]) {
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawCuteEye(ctx, 216, 182, 14);
      drawCuteEye(ctx, 296, 182, 14);
      ctx.beginPath();
      ctx.arc(256, 192, 18, 0.2, Math.PI - 0.2);
      ctx.lineWidth = 4.2;
      ctx.stroke();
    }
  } else if (species === 'starfish') {
    // 5-Pointed Plump Sea Star
    ctx.beginPath();
    const steps = 180;
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      const r = starfishRadius(theta);
      const px = 256 + Math.cos(theta) * r;
      const py = 262 + Math.sin(theta) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    if (isMask) {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 7;
      ctx.stroke();

      // Decorative circles along the 5 arms + happy face
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 3.5;
      for (let arm = 0; arm < 5; arm++) {
        const angle = -Math.PI / 2 + (arm * Math.PI * 2) / 5;
        for (const [dist, rad] of [[95, 12], [134, 10], [168, 7.5]]) {
          ctx.beginPath();
          ctx.arc(256 + Math.cos(angle) * dist, 262 + Math.sin(angle) * dist, rad, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      drawCuteEye(ctx, 230, 248, 13);
      drawCuteEye(ctx, 282, 248, 13);
      ctx.beginPath();
      ctx.arc(256, 266, 20, 0.2, Math.PI - 0.2);
      ctx.lineWidth = 4.2;
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawCuteEye(ctx, x, y, r) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = Math.max(3, r * 0.24);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(x - r * 0.12, y, r * 0.56, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.26, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Re-draw just the clean cute eyes on top of scanned textures if desired
export function drawEyeOverlayOnly(ctx, species, size = 512) {
  const s = size / 512;
  ctx.save();
  ctx.scale(s, s);
  if (species === 'clownfish') drawCuteEye(ctx, 114, 226, 17);
  else if (species === 'angelfish') drawCuteEye(ctx, 118, 232, 16);
  else if (species === 'turtle') {
    drawCuteEye(ctx, 232, 76, 9);
    drawCuteEye(ctx, 280, 76, 9);
  } else if (species === 'jellyfish') {
    drawCuteEye(ctx, 216, 182, 14);
    drawCuteEye(ctx, 296, 182, 14);
  } else if (species === 'starfish') {
    drawCuteEye(ctx, 230, 248, 13);
    drawCuteEye(ctx, 282, 248, 13);
  }
  ctx.restore();
}

// ============================================================================
// 3D PROCEDURAL MESH BUILDER WITH EXACT 1:1 TEMPLATE UV PROJECTION
// ============================================================================

export function buildCreatureMesh(THREE, species, texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const group = new THREE.Group();
  group.userData.species = species;
  group.userData.animParts = {};

  const isJelly = species === 'jellyfish';
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: isJelly ? 0.22 : 0.48,
    metalness: 0.04,
    emissive: isJelly ? new THREE.Color(0x3a1860) : new THREE.Color(0x091826),
    emissiveMap: texture,
    emissiveIntensity: isJelly ? 0.36 : 0.14,
    transparent: isJelly,
    opacity: isJelly ? 0.93 : 1.0,
    side: THREE.DoubleSide
  });

  if (species === 'clownfish' || species === 'angelfish') {
    const profFn = species === 'clownfish' ? clownfishProfile : angelfishProfile;
    const xStart = species === 'clownfish' ? 60 : 66;
    const xEnd = species === 'clownfish' ? 466 : 462;
    const bodyGeom = buildLoftedProfileGeometry(THREE, profFn, xStart, xEnd, {
      nu: 58,
      nv: 28,
      maxThick: species === 'clownfish' ? 0.34 : 0.22
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, mat);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);
    group.userData.animParts.spineMesh = bodyMesh;

    // Two articulated 3D pectoral side fins mapped directly to the template's pectoral fin region!
    const pecGeomL = buildPectoralFinGeometry(THREE, 182, 286, 62, 34, 1);
    const pecGeomR = buildPectoralFinGeometry(THREE, 182, 286, 62, 34, -1);
    const pecL = new THREE.Mesh(pecGeomL, mat);
    const pecR = new THREE.Mesh(pecGeomR, mat);

    const attachX = (256 - 186) / 155;
    const attachY = (256 - 284) / 155;
    const attachZ = species === 'clownfish' ? 0.27 : 0.18;

    pecL.position.set(attachX, attachY, attachZ);
    pecR.position.set(attachX, attachY, -attachZ);
    group.add(pecL, pecR);
    group.userData.animParts.pecL = pecL;
    group.userData.animParts.pecR = pecR;
  } else if (species === 'turtle') {
    // Top-down template -> 3D horizontal swimming turtle (+X forward, +Y up, +-Z left/right)
    // Template: Head at (256, 94), Shell at (256, 268), Flippers at left/right!
    // Map template (tx, ty) -> local 3D: forward X = (268 - ty)/145, lateral Z = (tx - 256)/145
    const shellGeom = buildEllipsoidPatch(THREE, 256, 268, 112, 138, 0.42, -0.16);
    const shellMesh = new THREE.Mesh(shellGeom, mat);
    group.add(shellMesh);

    const headGeom = buildEllipsoidPatch(THREE, 256, 94, 38, 48, 0.20, -0.14);
    const headPivot = new THREE.Group();
    const headOriginX = (268 - 134) / 145;
    headPivot.position.set(headOriginX, 0.02, 0);
    headGeom.translate(-headOriginX, -0.02, 0);
    const headMesh = new THREE.Mesh(headGeom, mat);
    headPivot.add(headMesh);
    group.add(headPivot);

    // 4 Articulated 3D Flippers
    const flFrontL = buildTurtleFlipper(THREE, mat, 164, 198, -118, 22, 34);
    const flFrontR = buildTurtleFlipper(THREE, mat, 348, 198, 118, 22, 34);
    const flRearL = buildTurtleFlipper(THREE, mat, 196, 376, -62, 82, 24);
    const flRearR = buildTurtleFlipper(THREE, mat, 316, 376, 62, 82, 24);

    group.add(flFrontL, flFrontR, flRearL, flRearR);
    group.userData.animParts = { headPivot, flFrontL, flFrontR, flRearL, flRearR };
  } else if (species === 'jellyfish') {
    // 3D Pulsing Dome Bell + 7 Wavy 3D Ribbon Tentacles
    const bellGeom = buildJellyBellGeometry(THREE);
    const bellMesh = new THREE.Mesh(bellGeom, mat);
    group.add(bellMesh);

    const tentacleXs = [132, 173, 214, 256, 298, 339, 380];
    const tentacles = [];
    for (let i = 0; i < tentacleXs.length; i++) {
      const angle = (i / tentacleXs.length) * Math.PI * 2;
      const ringR = i === 3 ? 0.08 : 0.48;
      const tGeom = buildJellyTentacleGeometry(THREE, tentacleXs[i], i);
      const tMesh = new THREE.Mesh(tGeom, mat);
      tMesh.position.set(Math.cos(angle) * ringR, 0.08, Math.sin(angle) * ringR);
      tMesh.rotation.y = -angle + Math.PI * 0.5;
      group.add(tMesh);
      tentacles.push(tMesh);
    }
    group.userData.animParts = { bellMesh, tentacles };
  } else if (species === 'starfish') {
    const starGeom = buildStarfishGeometry(THREE);
    const starMesh = new THREE.Mesh(starGeom, mat);
    group.add(starMesh);
    group.userData.animParts = { starMesh };
  }

  return group;
}

// Helper: Build smooth watertight double-sided lofted 3D fish geometry from 2D profile
function buildLoftedProfileGeometry(THREE, profFn, xStart, xEnd, { nu = 56, nv = 26, maxThick = 0.32 }) {
  const scale = 1 / 155;
  const positions = [];
  const basePositions = [];
  const uvs = [];
  const indices = [];

  // Build front (+Z) and back (-Z) grids sharing perimeter seam cleanly
  const cols = nu + 1;
  const rows = nv + 1;

  const addGrid = (zSign) => {
    const offset = positions.length / 3;
    for (let i = 0; i <= nu; i++) {
      const uNorm = i / nu;
      const tx = xStart + uNorm * (xEnd - xStart);
      const { topH, botH } = profFn(tx);

      // Longitudinal thickness envelope (plump torso, thin fins & tail)
      let xThick = 0.035;
      if (uNorm < 0.75) {
        const bu = uNorm / 0.75;
        xThick = Math.sin(Math.pow(bu, 0.65) * Math.PI) * maxThick + 0.025;
      } else {
        const tu = (uNorm - 0.75) / 0.25;
        xThick = (1 - tu) * 0.055 + 0.014;
      }

      for (let j = 0; j <= nv; j++) {
        const vSym = (j / nv) * 2 - 1; // -1 (top dorsal edge) .. +1 (bottom ventral edge)
        const ty = 256 + (vSym < 0 ? vSym * topH : vSym * botH);

        // Cross-sectional inflation: plump around spine (|vSym| < 0.65), sleek along fin margins
        const cross = Math.sqrt(Math.max(0, 1 - vSym * vSym));
        const coreBoost = Math.exp(-vSym * vSym * 3.2) * 0.65 + 0.35;
        const z = zSign * xThick * cross * coreBoost;

        const px = (256 - tx) * scale; // +X is nose forward!
        const py = (256 - ty) * scale; // +Y is dorsal up!

        positions.push(px, py, z);
        basePositions.push(px, py, z, uNorm);
        uvs.push(tx / 512, 1 - ty / 512);
      }
    }

    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const a = offset + i * rows + j;
        const b = offset + (i + 1) * rows + j;
        const c = offset + (i + 1) * rows + (j + 1);
        const d = offset + i * rows + (j + 1);
        if (zSign > 0) {
          indices.push(a, d, b, b, d, c);
        } else {
          indices.push(a, b, d, b, c, d);
        }
      }
    }
  };

  addGrid(1);
  addGrid(-1);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  geom.userData.basePositions = new Float32Array(basePositions);
  return geom;
}

function buildPectoralFinGeometry(THREE, baseTx, baseTy, lenPx, heightPx, zSide) {
  const nu = 10;
  const nv = 8;
  const positions = [];
  const uvs = [];
  const indices = [];
  const scale = 1 / 155;

  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    const h = Math.sin(Math.pow(u, 0.55) * Math.PI) * heightPx * 0.55 + (1 - u) * 8;
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * 2 - 1;
      const tx = baseTx + u * lenPx;
      const ty = baseTy + v * h;
      const px = -u * lenPx * scale * 0.85;
      const py = -v * h * scale - u * 0.06;
      const pz = zSide * (u * 0.24 + Math.sin(u * Math.PI) * 0.05);
      positions.push(px, py, pz);
      uvs.push(tx / 512, 1 - ty / 512);
    }
  }
  const rows = nv + 1;
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * rows + j;
      const b = (i + 1) * rows + j;
      const c = (i + 1) * rows + (j + 1);
      const d = i * rows + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Sea Turtle 3D domed shell & head builder mapped directly to top-down template
function buildEllipsoidPatch(THREE, cx, cy, rx, ry, topHeight, botDepth) {
  const nTheta = 36;
  const nR = 14;
  const scale = 1 / 145;
  const positions = [];
  const uvs = [];
  const indices = [];

  const buildSide = (yHeight, flip) => {
    const offset = positions.length / 3;
    for (let ir = 0; ir <= nR; ir++) {
      const rNorm = ir / nR;
      const dome = Math.sqrt(Math.max(0, 1 - rNorm * rNorm));
      for (let it = 0; it <= nTheta; it++) {
        const theta = (it / nTheta) * Math.PI * 2;
        const tx = cx + Math.cos(theta) * rx * rNorm;
        const ty = cy + Math.sin(theta) * ry * rNorm;

        const px = (268 - ty) * scale;
        const py = yHeight * dome;
        const pz = (tx - 256) * scale;

        positions.push(px, py, pz);
        uvs.push(tx / 512, 1 - ty / 512);
      }
    }
    const cols = nTheta + 1;
    for (let ir = 0; ir < nR; ir++) {
      for (let it = 0; it < nTheta; it++) {
        const a = offset + ir * cols + it;
        const b = offset + (ir + 1) * cols + it;
        const c = offset + (ir + 1) * cols + (it + 1);
        const d = offset + ir * cols + (it + 1);
        if (!flip) indices.push(a, b, d, b, c, d);
        else indices.push(a, d, b, b, d, c);
      }
    }
  };

  buildSide(topHeight, false);
  buildSide(botDepth, true);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function buildTurtleFlipper(THREE, mat, rootTx, rootTy, tipDx, tipDy, widthPx) {
  const nu = 12;
  const nv = 8;
  const scale = 1 / 145;
  const positions = [];
  const uvs = [];
  const indices = [];

  const rootX = (268 - rootTy) * scale;
  const rootZ = (rootTx - 256) * scale;

  const addSide = (ySign) => {
    const offset = positions.length / 3;
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const w = Math.sin(Math.pow(u, 0.55) * Math.PI) * widthPx + (1 - u) * (widthPx * 0.45);
      // Perpendicular normal in template plane
      const len = Math.hypot(tipDx, tipDy) || 1;
      const nx = -tipDy / len;
      const ny = tipDx / len;

      for (let j = 0; j <= nv; j++) {
        const v = (j / nv) * 2 - 1;
        const tx = rootTx + tipDx * u + nx * v * w;
        const ty = rootTy + tipDy * u + ny * v * w;
        const thick = ySign * 0.055 * (1 - u * 0.7) * Math.sqrt(Math.max(0, 1 - v * v));

        const px = (268 - ty) * scale - rootX;
        const py = thick;
        const pz = (tx - 256) * scale - rootZ;

        positions.push(px, py, pz);
        uvs.push(tx / 512, 1 - ty / 512);
      }
    }
    const rows = nv + 1;
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const a = offset + i * rows + j;
        const b = offset + (i + 1) * rows + j;
        const c = offset + (i + 1) * rows + (j + 1);
        const d = offset + i * rows + (j + 1);
        if (ySign > 0) indices.push(a, b, d, b, c, d);
        else indices.push(a, d, b, b, d, c);
      }
    }
  };

  addSide(1);
  addSide(-1);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  const pivot = new THREE.Group();
  pivot.position.set(rootX, -0.04, rootZ);
  pivot.add(new THREE.Mesh(geom, mat));
  return pivot;
}

// Jellyfish 3D Dome Bell + Flowing Tentacles
function buildJellyBellGeometry(THREE) {
  const nSeg = 40;
  const nRing = 18;
  const positions = [];
  const basePositions = [];
  const uvs = [];
  const indices = [];

  for (let ir = 0; ir <= nRing; ir++) {
    const v = ir / nRing; // 0 = crown top (ty=54), 1 = scalloped rim (ty=238)
    const thetaLat = v * (Math.PI * 0.54);
    const radius = Math.sin(thetaLat) * 0.92;

    for (let is = 0; is <= nSeg; is++) {
      const phi = (is / nSeg) * Math.PI * 2;
      const scallop = v > 0.8 ? Math.sin(phi * 6) * 0.045 * ((v - 0.8) / 0.2) : 0;
      const px = Math.cos(phi) * radius;
      const py = Math.cos(thetaLat) * 0.95 + scallop;
      const pz = Math.sin(phi) * radius;

      // Map smoothly across template bell (tx: 98..414, ty: 54..238)
      const horizMirror = Math.cos(phi); // -1..+1 wraps cleanly front & back!
      const tx = 256 + horizMirror * v * 156;
      const ty = 54 + v * 184;

      positions.push(px, py, pz);
      basePositions.push(px, py, pz, v);
      uvs.push(tx / 512, 1 - ty / 512);
    }
  }

  const cols = nSeg + 1;
  for (let ir = 0; ir < nRing; ir++) {
    for (let is = 0; is < nSeg; is++) {
      const a = ir * cols + is;
      const b = (ir + 1) * cols + is;
      const c = (ir + 1) * cols + (is + 1);
      const d = ir * cols + (is + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  geom.userData.basePositions = new Float32Array(basePositions);
  return geom;
}

function buildJellyTentacleGeometry(THREE, centerTx, index) {
  const nSegY = 20;
  const positions = [];
  const basePositions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= nSegY; i++) {
    const v = i / nSegY; // 0 = top (ty=236), 1 = tip (ty=462)
    const halfW = (1 - v * 0.45) * 0.12;
    const py = -v * 1.55;
    const ty = 236 + v * 226;

    for (let j = 0; j <= 2; j++) {
      const s = j - 1; // -1, 0, +1
      const px = s * halfW;
      const pz = (1 - Math.abs(s)) * 0.03; // slight 3D curvature
      const tx = centerTx + s * 15;
      positions.push(px, py, pz);
      basePositions.push(px, py, pz, v);
      uvs.push(tx / 512, 1 - ty / 512);
    }
  }

  for (let i = 0; i < nSegY; i++) {
    for (let j = 0; j < 2; j++) {
      const a = i * 3 + j;
      const b = (i + 1) * 3 + j;
      const c = (i + 1) * 3 + (j + 1);
      const d = i * 3 + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  geom.userData.basePositions = new Float32Array(basePositions);
  geom.userData.phaseOffset = index * 0.9;
  return geom;
}

// 5-Pointed 3D Sea Star Geometry
function buildStarfishGeometry(THREE) {
  const nTheta = 100;
  const nR = 14;
  const scale = 1 / 160;
  const positions = [];
  const basePositions = [];
  const uvs = [];
  const indices = [];

  const addSide = (zSign) => {
    const offset = positions.length / 3;
    for (let ir = 0; ir <= nR; ir++) {
      const rNorm = ir / nR;
      for (let it = 0; it <= nTheta; it++) {
        const theta = (it / nTheta) * Math.PI * 2;
        const R = starfishRadius(theta);
        const tx = 256 + Math.cos(theta) * R * rNorm;
        const ty = 262 + Math.sin(theta) * R * rNorm;

        // Raised 3D arm spine ridge
        const armRidge = (Math.cos(5 * (theta + Math.PI / 2)) + 1) * 0.5;
        const prof = Math.sqrt(Math.max(0, 1 - rNorm * rNorm));
        const thick = (zSign > 0 ? 0.28 : -0.12) * prof * (0.68 + armRidge * 0.32);

        const px = (tx - 256) * scale;
        const py = (262 - ty) * scale;
        const pz = thick;

        positions.push(px, py, pz);
        basePositions.push(px, py, pz, rNorm);
        uvs.push(tx / 512, 1 - ty / 512);
      }
    }
    const cols = nTheta + 1;
    for (let ir = 0; ir < nR; ir++) {
      for (let it = 0; it < nTheta; it++) {
        const a = offset + ir * cols + it;
        const b = offset + (ir + 1) * cols + it;
        const c = offset + (ir + 1) * cols + (it + 1);
        const d = offset + ir * cols + (it + 1);
        if (zSign > 0) indices.push(a, d, b, b, d, c);
        else indices.push(a, b, d, b, c, d);
      }
    }
  };

  addSide(1);
  addSide(-1);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  geom.userData.basePositions = new Float32Array(basePositions);
  return geom;
}

// ============================================================================
// REALTIME 3D VERTEX & LIMB SWIMMING ANIMATION
// ============================================================================

export function animateCreatureMesh(meshGroup, time, speedBoost = 1.0) {
  const species = meshGroup.userData.species;
  const parts = meshGroup.userData.animParts || {};

  if (species === 'clownfish' || species === 'angelfish') {
    const spine = parts.spineMesh;
    if (spine && spine.geometry.userData.basePositions) {
      const base = spine.geometry.userData.basePositions;
      const pos = spine.geometry.attributes.position;
      const arr = pos.array;
      const freq = (species === 'clownfish' ? 7.2 : 5.6) * speedBoost;
      const amp = species === 'clownfish' ? 0.28 : 0.24;

      for (let i = 0, k = 0; i < base.length; i += 4, k += 3) {
        const bx = base[i];
        const by = base[i + 1];
        const bz = base[i + 2];
        const uNorm = base[i + 3]; // 0 at nose -> 1 at tail tip
        const tailFlex = Math.pow(uNorm, 1.65);
        const wave = Math.sin(time * freq - uNorm * 4.6) * amp * tailFlex;
        arr[k] = bx;
        arr[k + 1] = by;
        arr[k + 2] = bz + wave;
      }
      pos.needsUpdate = true;
    }
    if (parts.pecL && parts.pecR) {
      const flap = Math.sin(time * 9.5 * speedBoost) * 0.42;
      parts.pecL.rotation.y = -0.28 + flap;
      parts.pecR.rotation.y = 0.28 - flap;
    }
  } else if (species === 'turtle') {
    const stroke = Math.sin(time * 3.1 * speedBoost);
    const twist = Math.cos(time * 3.1 * speedBoost);
    if (parts.flFrontL && parts.flFrontR) {
      parts.flFrontL.rotation.x = -stroke * 0.52;
      parts.flFrontL.rotation.z = twist * 0.18;
      parts.flFrontR.rotation.x = stroke * 0.52;
      parts.flFrontR.rotation.z = twist * 0.18;
    }
    if (parts.flRearL && parts.flRearR) {
      parts.flRearL.rotation.y = Math.sin(time * 2.6) * 0.22;
      parts.flRearR.rotation.y = -Math.sin(time * 2.6) * 0.22;
    }
    if (parts.headPivot) {
      parts.headPivot.rotation.z = Math.sin(time * 1.8) * 0.08;
    }
  } else if (species === 'jellyfish') {
    const pulse = Math.sin(time * 2.8 * speedBoost);
    if (parts.bellMesh && parts.bellMesh.geometry.userData.basePositions) {
      const base = parts.bellMesh.geometry.userData.basePositions;
      const pos = parts.bellMesh.geometry.attributes.position;
      const arr = pos.array;
      for (let i = 0, k = 0; i < base.length; i += 4, k += 3) {
        const bx = base[i];
        const by = base[i + 1];
        const bz = base[i + 2];
        const v = base[i + 3];
        const radialScale = 1 + pulse * 0.15 * Math.pow(v, 1.2);
        const yStretch = 1 - pulse * 0.09 * v;
        arr[k] = bx * radialScale;
        arr[k + 1] = by * yStretch;
        arr[k + 2] = bz * radialScale;
      }
      pos.needsUpdate = true;
    }
    if (parts.tentacles) {
      for (const tMesh of parts.tentacles) {
        const base = tMesh.geometry.userData.basePositions;
        const phase = tMesh.geometry.userData.phaseOffset || 0;
        const pos = tMesh.geometry.attributes.position;
        const arr = pos.array;
        for (let i = 0, k = 0; i < base.length; i += 4, k += 3) {
          const bx = base[i];
          const by = base[i + 1];
          const bz = base[i + 2];
          const v = base[i + 3];
          const swayZ = Math.sin(time * 3.0 - v * 4.2 + phase) * 0.22 * v;
          const swayX = Math.cos(time * 2.3 - v * 3.4 + phase) * 0.10 * v;
          arr[k] = bx + swayX;
          arr[k + 1] = by * (1 + pulse * 0.08);
          arr[k + 2] = bz + swayZ;
        }
        pos.needsUpdate = true;
      }
    }
  } else if (species === 'starfish') {
    if (parts.starMesh && parts.starMesh.geometry.userData.basePositions) {
      const base = parts.starMesh.geometry.userData.basePositions;
      const pos = parts.starMesh.geometry.attributes.position;
      const arr = pos.array;
      for (let i = 0, k = 0; i < base.length; i += 4, k += 3) {
        const bx = base[i];
        const by = base[i + 1];
        const bz = base[i + 2];
        const rNorm = base[i + 3];
        const angle = Math.atan2(by, bx);
        const curl = Math.sin(time * 2.4 + angle * 2.5) * 0.12 * Math.pow(rNorm, 1.6);
        arr[k] = bx;
        arr[k + 1] = by;
        arr[k + 2] = bz + curl;
      }
      pos.needsUpdate = true;
    }
  }
}

// ============================================================================
// REALISTIC HAND-COLORED CRAYON TEXTURE GENERATOR (FOR STARTER DEMO & SAMPLES)
// ============================================================================

export function generateHandColoredCanvas(species, palette, includePaperSheet = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (includePaperSheet) {
    ctx.fillStyle = '#fdfcf7';
    ctx.fillRect(0, 0, 512, 512);
  }

  // Create silhouette mask
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = 512;
  maskCanvas.height = 512;
  const mctx = maskCanvas.getContext('2d');
  drawCreatureSilhouette(mctx, species, 512, 'mask');

  // Paint organic hand-drawn crayon strokes!
  const paintCanvas = document.createElement('canvas');
  paintCanvas.width = 512;
  paintCanvas.height = 512;
  const pctx = paintCanvas.getContext('2d');

  // Rich base wash + textured crayon strokes
  const grad = pctx.createLinearGradient(50, 60, 460, 450);
  grad.addColorStop(0, palette[0]);
  grad.addColorStop(0.5, palette[1] || palette[0]);
  grad.addColorStop(1, palette[2] || palette[0]);
  pctx.fillStyle = grad;
  pctx.fillRect(0, 0, 512, 512);

  // Species-specific kid-colored patterns!
  if (species === 'clownfish') {
    // White stripes with dark accents like a real colored Nemo!
    pctx.fillStyle = palette[3] || '#fff8f0';
    for (const [cx, w] of [[162, 17], [258, 21], [352, 14]]) {
      pctx.beginPath();
      pctx.ellipse(cx, 256, w, 190, 0, 0, Math.PI * 2);
      pctx.fill();
    }
  } else if (species === 'turtle') {
    // Colorful shell scutes + green flippers
    pctx.fillStyle = palette[1] || '#52b788';
    pctx.fillRect(0, 0, 512, 512);
    pctx.fillStyle = palette[0];
    pctx.beginPath();
    pctx.ellipse(256, 268, 110, 136, 0, 0, Math.PI * 2);
    pctx.fill();
    pctx.fillStyle = palette[2] || '#ffd166';
    for (const cy of [208, 268, 328]) {
      pctx.beginPath();
      pctx.arc(256, cy, 29, 0, Math.PI * 2);
      pctx.fill();
    }
  } else if (species === 'jellyfish') {
    // Glowing dome + multi-colored tentacles
    const jg = pctx.createLinearGradient(256, 52, 256, 465);
    jg.addColorStop(0, palette[0]);
    jg.addColorStop(0.45, palette[1] || '#f72585');
    jg.addColorStop(1, palette[2] || '#4cc9f0');
    pctx.fillStyle = jg;
    pctx.fillRect(0, 0, 512, 512);
    pctx.fillStyle = palette[3] || '#ffee99';
    for (const [sx, sy, sr] of [[152, 134, 15], [360, 134, 15], [202, 102, 11], [310, 102, 11]]) {
      pctx.beginPath();
      pctx.arc(sx, sy, sr, 0, Math.PI * 2);
      pctx.fill();
    }
  } else if (species === 'starfish') {
    const sg = pctx.createRadialGradient(256, 262, 25, 256, 262, 210);
    sg.addColorStop(0, palette[2] || '#ffe66d');
    sg.addColorStop(0.55, palette[0]);
    sg.addColorStop(1, palette[1] || '#ef476f');
    pctx.fillStyle = sg;
    pctx.fillRect(0, 0, 512, 512);
  }

  // Add realistic crayon grain texture!
  pctx.globalAlpha = 0.22;
  for (let i = 0; i < 650; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    pctx.strokeStyle = i % 3 === 0 ? '#ffffff' : palette[i % palette.length];
    pctx.lineWidth = 2 + Math.random() * 4;
    pctx.beginPath();
    pctx.moveTo(rx, ry);
    pctx.lineTo(rx + 12 + Math.random() * 14, ry - 10 - Math.random() * 12);
    pctx.stroke();
  }
  pctx.globalAlpha = 1;

  if (!includePaperSheet) {
    // Full bleed colors + crisp template ink overlay + cute eyes!
    ctx.drawImage(paintCanvas, 0, 0);
    // Draw outline ink without opaque white fill by drawing outline on temp canvas and multiplying!
    const lineCanvas = document.createElement('canvas');
    lineCanvas.width = 512;
    lineCanvas.height = 512;
    const lctx = lineCanvas.getContext('2d');
    drawCreatureSilhouette(lctx, species, 512, 'outline');
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(lineCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    drawEyeOverlayOnly(ctx, species, 512);
  } else {
    // Simulate a kid coloring inside the silhouette on white paper!
    pctx.globalCompositeOperation = 'destination-in';
    pctx.drawImage(maskCanvas, 0, 0);
    // First draw white paper + outline, then multiply kid's crayon strokes!
    drawCreatureSilhouette(ctx, species, 512, 'outline');
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(paintCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    drawEyeOverlayOnly(ctx, species, 512);
  }

  return canvas;
}
