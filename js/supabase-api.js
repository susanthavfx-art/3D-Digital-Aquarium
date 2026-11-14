import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { SPECIES_LIST } from './creatures.js';

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
export function initLiveChannel({ onFishAdded, onFishDeleted, onTankCleared, onTankEvent, onStatusChange } = {}) {
  if (liveChannel) return liveChannel;

  liveChannel = supabaseClient.channel('aquarium-live', {
    config: { broadcast: { self: true } }
  });

  if (onFishAdded) {
    liveChannel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'aquarium_fishes' },
      (payload) => {
        if (payload && payload.new) {
          onFishAdded(mapRowToFish(payload.new));
        }
      }
    );

    liveChannel.on('broadcast', { event: 'fish_added' }, ({ payload }) => {
      if (payload && payload.fish) {
        onFishAdded(payload.fish);
      }
    });
  }

  if (onFishDeleted) {
    liveChannel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'aquarium_fishes' },
      (payload) => {
        if (payload?.old?.id) {
          onFishDeleted(payload.old.id);
        }
      }
    );

    liveChannel.on('broadcast', { event: 'fish_deleted' }, ({ payload }) => {
      if (payload?.id) onFishDeleted(payload.id);
    });
  }

  if (onTankCleared) {
    liveChannel.on('broadcast', { event: 'tank_cleared' }, ({ payload }) => {
      onTankCleared(payload || {});
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
  const knownIds = SPECIES_LIST.map((s) => s.id);
  const rawSp = String(species || '').trim().toLowerCase();
  const cleanSpecies =
    knownIds.includes(rawSp) || /^[a-z0-9_-]{1,32}$/.test(rawSp) ? rawSp : 'clownfish';
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

// PIN-protected Reset: Deletes all fishes from Supabase & broadcasts tank_cleared to all screens!
export async function resetAllFishesInSupabase(adminPin, hideDemo = true) {
  const { data, error } = await supabaseClient.rpc('reset_aquarium', {
    admin_pin: String(adminPin || '').trim()
  });

  if (error) {
    throw new Error(error.message || 'Invalid Admin PIN');
  }

  try {
    const ch = initLiveChannel();
    if (channelReady) {
      await ch.send({
        type: 'broadcast',
        event: 'tank_cleared',
        payload: { hideDemo }
      });
    }
  } catch (_) {}

  return data;
}

// PIN-protected Single Fish Delete
export async function deleteSingleFishInSupabase(fishId, adminPin) {
  const { data, error } = await supabaseClient.rpc('delete_aquarium_fish', {
    target_id: fishId,
    admin_pin: String(adminPin || '').trim()
  });

  if (error) {
    throw new Error(error.message || 'Invalid Admin PIN');
  }

  try {
    const ch = initLiveChannel();
    if (channelReady) {
      await ch.send({
        type: 'broadcast',
        event: 'fish_deleted',
        payload: { id: fishId }
      });
    }
  } catch (_) {}

  return data;
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
