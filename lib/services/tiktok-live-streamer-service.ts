import dbConnect from '@/lib/db/connection';
import TikTokLiveStreamer from '@/lib/db/models/TikTokLiveStreamer';
import Key from '@/lib/db/models/Key';
import { generateKeyString } from '@/lib/utils/device';
import { generateTokenResult } from '@/lib/utils/token';
import User from '@/lib/db/models/User';
import { Logger } from '@/lib/utils';

/**
 * Get all streamers (filterable by registrator)
 */
export async function listStreamers(registrator?: string) {
  await dbConnect();
  const filter = registrator ? { registrator } : {};
  const streamers = await TikTokLiveStreamer.find(filter)
    .sort({ createdAt: -1 })
    .lean();
  return streamers.map(s => ({
    ...s,
    _id: s._id.toString(),
    createdAt: s.createdAt?.toISOString(),
    updatedAt: s.updatedAt?.toISOString(),
    lastLive: s.lastLive?.toISOString(),
  }));
}

/**
 * Get streamer by key
 */
export async function getStreamerByKey(key: string) {
  await dbConnect();
  const streamer = await TikTokLiveStreamer.findOne({ key }).lean();
  if (!streamer) return null;
  return {
    ...streamer,
    _id: streamer._id.toString(),
    createdAt: streamer.createdAt?.toISOString(),
    updatedAt: streamer.updatedAt?.toISOString(),
    lastLive: streamer.lastLive?.toISOString(),
  };
}

/**
 * Generate a new streamer key without details
 */
export async function generateStreamerKey(registrator: string): Promise<{ success: boolean; key?: string; error?: string }> {
  let generatedKey = '';

  try {
    await dbConnect();
    
    // Generate a unique license key
    generatedKey = `TL-${generateKeyString(12)}`;
    const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Create the matching key record so the public register page and cron jobs
    // resolve the same source of truth.
    await Key.create({
      game: 'TIKTOK-LIVE',
      userKey: generatedKey,
      duration: 7,
      maxDevices: 1,
      devices: [],
      status: 1,
      registrator,
      isFreeKey: false,
      expiredDate: defaultExpiry,
    });
    
    // Create a placeholder streamer profile
    const streamer = await TikTokLiveStreamer.create({
      key: generatedKey,
      registrator,
      tiktokUsername: 'Pending...',
      streamerName: 'New Streamer',
      contact: 'N/A',
      status: 'pending',
    });
    
    return { success: true, key: streamer.key };
  } catch (error) {
    if (generatedKey) {
      await Key.deleteOne({ userKey: generatedKey }).catch(() => undefined);
      await TikTokLiveStreamer.deleteOne({ key: generatedKey }).catch(() => undefined);
    }
    Logger.error('Key generation error', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Failed to generate key' };
  }
}

/**
 * Register a new streamer with their key
 */
export async function registerStreamer(key: string, data: {
  tiktokUsername: string;
  streamerName: string;
  contact: string;
  registrator: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    
    // The panel generates a placeholder streamer record, so registration should
    // update that existing record instead of looking for a separate Key doc.
    const existingStreamer = await TikTokLiveStreamer.findOne({
      key,
      registrator: data.registrator,
    });

    if (!existingStreamer) {
      return { success: false, error: 'Key not found or does not belong to this admin' };
    }

    if (existingStreamer.tiktokUsername !== 'Pending...' && existingStreamer.streamerName !== 'New Streamer') {
      return { success: false, error: 'This key is already registered for a live streamer' };
    }

    existingStreamer.tiktokUsername = data.tiktokUsername;
    existingStreamer.streamerName = data.streamerName;
    existingStreamer.contact = data.contact;
    existingStreamer.status = 'active';
    existingStreamer.updatedAt = new Date();

    await existingStreamer.save();

    return { success: true, ...existingStreamer.toObject() };
  } catch (error) {
    Logger.error('Streamer registration error', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Failed to register streamer' };
  }
}

/**
 * Update streamer profile
 */
export async function updateStreamer(
  streamerId: string,
  data: Partial<{
    tiktokUsername: string;
    streamerName: string;
    contact: string;
    status: 'pending' | 'active' | 'inactive' | 'expired';
    autoExtendEnabled: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const streamer = await TikTokLiveStreamer.findById(streamerId).lean();
    if (!streamer) {
      return { success: false, error: 'Streamer not found' };
    }
    
    await TikTokLiveStreamer.findByIdAndUpdate(streamerId, { ...data, updatedAt: new Date() });
    return { success: true };
  } catch (error) {
    Logger.error('Streamer update error', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Failed to update streamer' };
  }
}

/**
 * Start live session (auto-extend key if enabled)
 */
export async function startLiveSession(
  streamerId: string
): Promise<{ success: boolean; error?: string; extended?: boolean }> {
  try {
    await dbConnect();
    const streamer = await TikTokLiveStreamer.findById(streamerId);
    if (!streamer) {
      return { success: false, error: 'Streamer not found' };
    }

    // Prevent duplicate live sessions
    if (streamer.status === 'active') {
      return { success: false, error: 'Streamer is already live. End the current session first.' };
    }

    // Check key expiry before allowing live
    const keyData = await Key.findOne({ userKey: streamer.key }).lean();
    if (!keyData) {
      return { success: false, error: 'License key not found' };
    }
    if (keyData.expiredDate && new Date(keyData.expiredDate) < new Date()) {
      return { success: false, error: 'License key has expired. Extend the key first.' };
    }

    const now = new Date();
    streamer.status = 'active';
    streamer.lastLive = now;
    streamer.lastLiveDuration = 0;
    await streamer.save();

    // Auto extend if enabled
    let extended = false;
    if (streamer.autoExtendEnabled) {
      const result = await extendKeyForStreamer(streamer.key, 7);
      extended = result.success;
    }

    return { success: true, extended };
  } catch (error) {
    Logger.error('Live session error', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Failed to start live session' };
  }
}

/**
 * End live session and update duration
 */
export async function endLiveSession(
  streamerId: string,
  durationMinutes: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const streamer = await TikTokLiveStreamer.findById(streamerId);
    if (!streamer) {
      return { success: false, error: 'Streamer not found' };
    }

    if (streamer.status !== 'active') {
      return { success: false, error: 'No active live session to end' };
    }

    streamer.liveDuration = (streamer.liveDuration || 0) + durationMinutes;
    streamer.lastLiveDuration = durationMinutes;
    streamer.status = 'inactive';
    streamer.updatedAt = new Date();
    await streamer.save();

    return { success: true };
  } catch (error) {
    Logger.error('End live session error', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Failed to end live session' };
  }
}

/**
 * Extend streamer's key by specified days
 */
export async function extendKeyForStreamer(
  key: string,
  days: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    
    // Find the key
    const existingKey = await Key.findOne({ userKey: key }).lean();
    if (!existingKey) {
      return { success: false, error: 'Key not found' };
    }
    
    // Calculate new expiry
    const currentExpiry = existingKey.expiredDate ? new Date(existingKey.expiredDate) : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + days);
    
    // Update key expiry
    await Key.findByIdAndUpdate(existingKey._id, {
      expiredDate: newExpiry,
      status: 1, // Active
    });
    
    // Update streamer status
    await TikTokLiveStreamer.findOneAndUpdate({ key }, { status: 'active' }, { new: true });
    
    return { success: true };
  } catch (error) {
    Logger.error('Key extension error', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Failed to extend key' };
  }
}

/**
 * Get streamer with their key expiry info
 */
export async function getStreamerWithExpiry(key: string) {
  await dbConnect();
  const streamer = await TikTokLiveStreamer.findOne({ key }).lean();
  if (!streamer) return null;
  
  const keyData = await Key.findOne({ userKey: key }).lean();
  if (!keyData) return null;
  
  return {
    ...streamer,
    _id: streamer._id.toString(),
    key: keyData,
    createdAt: streamer.createdAt?.toISOString(),
    updatedAt: streamer.updatedAt?.toISOString(),
    lastLive: streamer.lastLive?.toISOString(),
  };
}

/**
 * Delete streamer and their associated key
 */
export async function deleteStreamer(streamerId: string) {
  await dbConnect();
  const streamer = await TikTokLiveStreamer.findById(streamerId);
  if (!streamer) return false;

  // Clean up the associated Key document
  await Key.deleteOne({ userKey: streamer.key }).catch(() => undefined);

  const result = await TikTokLiveStreamer.deleteOne({ _id: streamerId });
  return result.deletedCount > 0;
}

/**
 * Authenticate a streamer by their license key.
 * Returns the streamer profile if the key exists and is valid.
 */
export async function authenticateStreamer(key: string) {
  await dbConnect();
  const streamer = await TikTokLiveStreamer.findOne({ key }).lean();
  if (!streamer) return null;

  // Also check the Key collection for expiry
  const keyData = await Key.findOne({ userKey: key }).lean();
  if (!keyData) return null;

  const isExpired = keyData.expiredDate && new Date(keyData.expiredDate) < new Date();

  return {
    _id: streamer._id.toString(),
    key: streamer.key,
    tiktokUsername: streamer.tiktokUsername,
    streamerName: streamer.streamerName,
    contact: streamer.contact,
    status: isExpired ? 'expired' : streamer.status,
    liveDuration: streamer.liveDuration,
    lastLive: streamer.lastLive?.toISOString() || null,
    lastLiveDuration: streamer.lastLiveDuration,
    autoExtendEnabled: streamer.autoExtendEnabled,
    registrator: streamer.registrator,
    createdAt: streamer.createdAt?.toISOString(),
    updatedAt: streamer.updatedAt?.toISOString(),
    keyExpiry: keyData.expiredDate?.toISOString() || null,
    keyStatus: keyData.status,
  };
}

/**
 * Get full streamer profile with key expiry info
 */
export async function getStreamerProfile(key: string) {
  return authenticateStreamer(key);
}

/**
 * Update streamer's own profile (limited fields)
 */
export async function updateStreamerProfile(
  key: string,
  data: { streamerName?: string; contact?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const streamer = await TikTokLiveStreamer.findOne({ key });
    if (!streamer) {
      return { success: false, error: 'Streamer not found' };
    }

    if (data.streamerName) streamer.streamerName = data.streamerName;
    if (data.contact) streamer.contact = data.contact;
    streamer.updatedAt = new Date();
    await streamer.save();

    return { success: true };
  } catch (error) {
    Logger.error('Streamer profile update error', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Streamer starts their own live session
 */
export async function streamerStartLive(key: string): Promise<{ success: boolean; error?: string; extended?: boolean }> {
  try {
    await dbConnect();
    const streamer = await TikTokLiveStreamer.findOne({ key });
    if (!streamer) {
      return { success: false, error: 'Streamer not found' };
    }

    // Prevent duplicate live sessions
    if (streamer.status === 'active') {
      return { success: false, error: 'You are already live. End your current session first.' };
    }

    // Check key expiry before allowing live
    const keyData = await Key.findOne({ userKey: key }).lean();
    if (!keyData) {
      return { success: false, error: 'License key not found' };
    }
    if (keyData.expiredDate && new Date(keyData.expiredDate) < new Date()) {
      return { success: false, error: 'Your license key has expired. Please contact your admin to renew.' };
    }

    const now = new Date();
    streamer.status = 'active';
    streamer.lastLive = now;
    streamer.lastLiveDuration = 0;
    await streamer.save();

    let extended = false;
    if (streamer.autoExtendEnabled) {
      const result = await extendKeyForStreamer(key, 7);
      extended = result.success;
    }

    return { success: true, extended };
  } catch (error) {
    Logger.error('Streamer start live error', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Failed to start live session' };
  }
}

/**
 * Streamer ends their own live session
 */
export async function streamerEndLive(key: string, durationMinutes: number): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const streamer = await TikTokLiveStreamer.findOne({ key });
    if (!streamer) {
      return { success: false, error: 'Streamer not found' };
    }

    if (streamer.status !== 'active') {
      return { success: false, error: 'No active live session to end' };
    }

    streamer.liveDuration = (streamer.liveDuration || 0) + durationMinutes;
    streamer.lastLiveDuration = durationMinutes;
    streamer.status = 'inactive';
    streamer.updatedAt = new Date();
    await streamer.save();

    return { success: true };
  } catch (error) {
    Logger.error('Streamer end live error', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'Failed to end live session' };
  }
}
