import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// window.supabase is loaded from ./vendor/supabase.js
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let liveChannel = null;
let channelReady = false;

function mapRowToFish(row) {
  return {
    id: row.id,
    name: row.name || 'Explorer',
    species: row.species || 'clownfish',
    textureUrl: row.texture_url,
    swimSeed: row.swim_seed || 12345,
    createdAt: row.created_at || new Date().toISOString()
  };
}

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

// Ensure a shared Realtime channel is open for instant broadcasts + Postgres change events
export function initLiveChannel({ onFishAdded, onTankEvent, onStatusChange } = {}) {
  if (liveChannel) return liveChannel;

  liveChannel = supabaseClient.channel('aquarium-live', {
    config: { broadcast: { self: true } }
  });

  if (onFishAdded) {
    // 1) Guaranteed Postgres INSERT stream
    liveChannel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'aquarium_fishes' },
      (payload) => {
        if (payload && payload.new) {
          onFishAdded(mapRowToFish(payload.new));
        }
      }
    );

    // 2) Ultra-low-latency Broadcast stream (<80ms!)
    liveChannel.on('broadcast', { event: 'fish_added' }, ({ payload }) => {
      if (payload && payload.fish) {
        onFishAdded(payload.fish);
      }
    });
  }

  if (onTankEvent) {
    liveChannel.on('broadcast', { event: 'tank_event' }, ({ payload }) => {
      if (payload) onTankEvent(payload);
    });
  }

  liveChannel.subscribe((status) => {
    channelReady = status === 'SUBSCRIBED';
    if (onStatusChange) onStatusChange(channelReady);
  });

  return liveChannel;
}

// Fetch up to 50 recent fishes from Supabase Postgres
export async function fetchInitialFishes() {
  const { data, error } = await supabaseClient
    .from('aquarium_fishes')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    console.warn('Supabase fetch error:', error.message);
    return [];
  }
  return (data || []).map(mapRowToFish);
}

// Upload scanned UV texture PNG to Supabase Storage & insert fish into Postgres
export async function submitFishToSupabase({ name, species, textureDataUrl }) {
  const validSpecies = ['clownfish', 'angelfish', 'jellyfish', 'turtle', 'starfish'];
  const cleanSpecies = validSpecies.includes(species) ? species : 'clownfish';
  const cleanName = String(name || 'Explorer').trim().slice(0, 32) || 'Explorer';

  const blob = dataUrlToBlob(textureDataUrl);
  const rand = Math.random().toString(36).slice(2, 10);
  const filePath = `scans/${Date.now()}-${rand}.png`;

  const { error: uploadErr } = await supabaseClient.storage
    .from('fish-textures')
    .upload(filePath, blob, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    });

  if (uploadErr) {
    throw new Error(`Storage upload failed: ${uploadErr.message}`);
  }

  const { data: pubData } = supabaseClient.storage.from('fish-textures').getPublicUrl(filePath);
  const textureUrl = pubData.publicUrl;

  const { data: row, error: insertErr } = await supabaseClient
    .from('aquarium_fishes')
    .insert({
      name: cleanName,
      species: cleanSpecies,
      texture_url: textureUrl
    })
    .select()
    .single();

  if (insertErr) {
    throw new Error(`Database insert failed: ${insertErr.message}`);
  }

  const fish = mapRowToFish(row);

  // Also send immediate Realtime Broadcast for <80ms splash!
  try {
    const ch = initLiveChannel();
    if (channelReady) {
      await ch.send({
        type: 'broadcast',
        event: 'fish_added',
        payload: { fish }
      });
    }
  } catch (_) {}

  return fish;
}

// Broadcast interactive tank event (shark visit / drop food) from mobile phone!
export async function broadcastTankEvent(action) {
  try {
    const ch = initLiveChannel();
    if (!channelReady) {
      await new Promise((r) => setTimeout(r, 400));
    }
    await ch.send({
      type: 'broadcast',
      event: 'tank_event',
      payload: { action }
    });
  } catch (_) {}
}
