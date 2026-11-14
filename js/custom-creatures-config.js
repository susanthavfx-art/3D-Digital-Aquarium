// ============================================================================
// CUSTOM 3D CREATURES & COLORING SHEETS CONFIG (.GLB + 512x512 TEMPLATE PNG)
// ============================================================================
// How to replace any built-in creature OR add brand-new creatures from Blender:
//
// 1) UV MAPPING IN BLENDER ("Project from View"):
//    - Side-view creatures (Fish, Seahorse, Shark):
//        Press Numpad 1 (Front Ortho), face creature LEFT (-X), dorsal fin UP (+Z).
//        Edit Mode -> Select All (A) -> U -> "Project from View".
//        Scale/center UVs inside the 0..1 UV square -> UV -> "Export UV Layout" (512x512).
//        Use facingOffsetDegY: 180.
//    - Top-view creatures (Turtle, Stingray):
//        Press Numpad 7 (Top Ortho), point head UP (+Y).
//        Edit Mode -> Select All (A) -> U -> "Project from View".
//        Use facingOffsetDegY: -90.
//
// 2) DROP FILES INTO "models/creatures/":
//    - 3D Model:        models/creatures/<id>.glb          (e.g. clownfish.glb, seahorse.glb)
//    - Coloring Sheet:  models/creatures/<id>_template.png (512x512 black-line outline on white)
//    If those files exist in models/creatures/, the app loads them AUTOMATICALLY!

export const CREATURE_OVERRIDES = {
  clownfish: {
    glbUrl: './models/creatures/clownfish.glb',
    templateUrl: './models/creatures/clownfish_template.png',
    facingOffsetDegY: 180,
    targetSize: 2.1,
    autoSwimWave: true // Adds gentle swimming wave even if .glb has no armature animation!
  },
  angelfish: {
    glbUrl: './models/creatures/angelfish.glb',
    templateUrl: './models/creatures/angelfish_template.png',
    facingOffsetDegY: 180,
    targetSize: 2.2,
    autoSwimWave: true
  },
  turtle: {
    glbUrl: './models/creatures/turtle.glb',
    templateUrl: './models/creatures/turtle_template.png',
    facingOffsetDegY: -90,
    targetSize: 2.4,
    autoSwimWave: true
  },
  jellyfish: {
    glbUrl: './models/creatures/jellyfish.glb',
    templateUrl: './models/creatures/jellyfish_template.png',
    facingOffsetDegY: 0,
    targetSize: 2.1,
    autoSwimWave: true
  },
  starfish: {
    glbUrl: './models/creatures/starfish.glb',
    templateUrl: './models/creatures/starfish_template.png',
    facingOffsetDegY: 0,
    targetSize: 1.8,
    autoSwimWave: true
  },
  seahorse: {
    glbUrl: './models/creatures/seahorse.glb',
    templateUrl: './models/creatures/seahorse_template.png',
    facingOffsetDegY: 180,
    targetSize: 2.0,
    autoSwimWave: true
  }
};

// ----------------------------------------------------------------------------
// ADD BRAND-NEW CREATURE SPECIES HERE!
// Give each new creature a unique codeBits pattern [1, b1, b2, b3, b4, 1]
// so printed sheets are auto-detected by the phone camera!
// ----------------------------------------------------------------------------
export const EXTRA_CUSTOM_SPECIES = [
  // Example: Uncomment after placing dolphin.glb & dolphin_template.png in models/creatures/
  // {
  //   id: 'dolphin',
  //   name: 'Dolphin',
  //   sinhala: 'ඩොල්ෆින් (Dolphin)',
  //   emoji: '🐬',
  //   badgeColor: '#38bdf8',
  //   swimZone: 'high',
  //   baseScale: 1.25,
  //   codeBits: [1, 1, 1, 1, 0, 1],
  //   glbUrl: './models/creatures/dolphin.glb',
  //   templateUrl: './models/creatures/dolphin_template.png',
  //   facingOffsetDegY: 180,
  //   targetSize: 2.5,
  //   autoSwimWave: true
  // }
];
