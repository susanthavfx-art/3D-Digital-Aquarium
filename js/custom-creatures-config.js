// ============================================================================
// CUSTOM 3D SEA CREATURES & PRINTABLE SHEET CONFIGURATION
// ============================================================================
// All 5 creatures use custom 3D .glb models + 512x512 _template.png sheets
// located in ./models/creatures/!

export const CREATURE_OVERRIDES = {
  clownfish: {
    glbUrl: './models/creatures/clownfish.glb',
    templateUrl: './models/creatures/clownfish_template.png',
    coloredUrl: './models/creatures/clownfish_colored.png',
    facingOffsetDegY: 0, // Faces RIGHT (+X) on template -> +X forward in tank
    tiltOffsetDegX: 0,
    targetSize: 2.55,
    swimStyle: 'fish',
    autoSwimWave: true
  },
  angelfish: {
    glbUrl: './models/creatures/My_AngleFish.glb',
    templateUrl: './models/creatures/angelfish_template.png',
    coloredUrl: './models/creatures/angelfish_colored.png',
    facingOffsetDegY: 90, // In My_AngleFish.glb nose is +Z, dorsal is +Y -> +90 deg Y aligns nose to +X forward!
    tiltOffsetDegX: 0,
    targetSize: 2.75,
    swimStyle: 'fish',
    autoSwimWave: true
  },
  bluetang: {
    glbUrl: './models/creatures/bluetang.glb',
    templateUrl: './models/creatures/bluetang_template.png',
    coloredUrl: './models/creatures/bluetang_colored.png',
    facingOffsetDegY: 0, // Faces RIGHT (+X) on template -> +X forward in tank
    tiltOffsetDegX: 0,
    targetSize: 2.50,
    swimStyle: 'fish',
    autoSwimWave: true
  },
  seahorse: {
    glbUrl: './models/creatures/seahorse.glb',
    templateUrl: './models/creatures/seahorse_template.png',
    coloredUrl: './models/creatures/seahorse_colored.png',
    facingOffsetDegY: 180, // Faces LEFT (-X) on template -> rotated 180 deg to +X forward
    tiltOffsetDegX: 0,
    targetSize: 2.70,
    swimStyle: 'seahorse',
    autoSwimWave: true
  },
  starfish: {
    glbUrl: './models/creatures/starfish.glb',
    templateUrl: './models/creatures/starfish_template.png',
    coloredUrl: './models/creatures/starfish_colored.png',
    facingOffsetDegY: 0,
    tiltOffsetDegX: 0,
    targetSize: 2.35,
    swimStyle: 'starfish',
    autoSwimWave: true
  }
};

// Want to add a 6th or 7th creature later? Add an entry here!
export const EXTRA_CUSTOM_SPECIES = [];
