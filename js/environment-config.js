// ============================================================================
// CUSTOM 3D TANK ENVIRONMENT CONFIGURATION (BLENDER / MAYA / C4D .GLB MODELS)
// ============================================================================
// Tank 3D Bounds Reference (Three.js units / meters):
//   X (Left <-> Right) : -14.0  to  +14.0  (Total width ~ 28 units)
//   Y (Floor <-> Top)  :  -5.6 (Sand Floor) to +7.2 (Water Surface)
//   Z (Back <-> Front) :  -8.0 (Back Reef)  to +4.5 (Front Glass; Camera is at Z = +16.2)

export const ENVIRONMENT_CONFIG = {
  // --------------------------------------------------------------------------
  // OPTION 1 (EASIEST): Full Custom Aquarium Scene (.glb)
  // Export your entire underwater floor + rocks + plants + corals from Blender
  // as ONE file named "models/tank.glb". If it exists, it loads automatically
  // and hides the built-in procedural rocks, corals, kelp & sand!
  // --------------------------------------------------------------------------
  fullScene: {
    enabled: true,
    url: './models/tank.glb',

    // Auto-fit scales your Blender scene to fit the tank width (28 units)
    // and places its bottom cleanly at floorY (-5.8). Set false to use raw 1:1 Blender coords!
    autoFitToTank: true,
    targetWidth: 28.0,
    floorY: -5.8,
    offsetZ: -1.2,

    // Manual transform overrides (used when autoFitToTank is false, or as extra fine-tune)
    position: [0, -5.6, -1.2],
    rotationY: 0,
    scale: 1.0,

    // When tank.glb loads successfully, hide the old procedural environment?
    replaceDefaultRocksAndPlants: true,
    replaceDefaultSandFloor: true
  },

  // --------------------------------------------------------------------------
  // OPTION 2: Individual 3D Prop Models (Rocks, Plants, Corals, Castle, etc.)
  // Uncomment or add as many .glb models as you want at custom [x, y, z] spots!
  // --------------------------------------------------------------------------
  showBuiltInSandFloor: true,
  showBuiltInRocksAndCorals: true, // Change to false once you add your own rock/plant props below!
  showBuiltInKelpPlants: true,     // Change to false once you add your own plant props below!

  props: [
    // Example props (uncomment after uploading files into the "models/" folder):
    // { url: './models/rock_large.glb',  position: [-8.5, -5.5, -3.0], scale: 2.0, rotationY: 0.4 },
    // { url: './models/coral_reef.glb',  position: [ 6.5, -5.5, -2.5], scale: 1.8, rotationY: -0.6 },
    // { url: './models/sea_plant.glb',   position: [-4.0, -5.5, -4.5], scale: 1.5, rotationY: 0.0 },
    // { url: './models/sunken_ship.glb', position: [ 0.0, -5.5, -5.0], scale: 2.5, rotationY: 0.25 }
  ]
};
