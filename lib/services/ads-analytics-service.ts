import dbConnect from '@/lib/db/connection';
import IpTracker from '@/lib/db/models/IpTracker';
import Key from '@/lib/db/models/Key';

export interface AdClaimTrend {
  date: string;
  claims: number;
  extensions: number;
}

export interface GameAdStats {
  game: string;
  totalAdClaims: number;
  totalExtensions: number;
  activeKeys: number;
}

export interface TopAdSupporter {
  maskedIp: string;
  totalClaims: number;
  threeHourClaims: number;
  extensions: number;
  lastClaim: string;
}

export interface TopAdPerformer {
  registrator: string;
  totalKeys: number;
  activeKeys: number;
  adClaims: number;
  extensions: number;
  lastActivity: string;
}

export interface DailyRevenue {
  date: string;
  adImpressions: number;
  uniqueIps: number;
}

export interface AdsAnalytics {
  totalAdClaims: number;
  total3hClaims: number;
  totalExtensions: number;
  total3hActive: number;
  adClaimTrends: AdClaimTrend[];
  gameAdStats: GameAdStats[];
  topSupporters: TopAdSupporter[];
  topPerformers: TopAdPerformer[];
  dailyRevenue: DailyRevenue[];
}

export async function getAdsAnalytics(): Promise<AdsAnalytics> {
  await dbConnect();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total counts
  const [totalAdClaims, total3hClaims, totalExtensions] = await Promise.all([
    IpTracker.countDocuments({ isAdClaim: true }),
    IpTracker.countDocuments({ isAdClaim: true }),
    IpTracker.countDocuments({ isAdClaim: true }).then(async () => {
      const extKeys = await Key.find({ isFreeKey: true, duration: '3h' }).lean();
      return extKeys.length;
    }),
  ]);

  // Active 3h free keys
  const total3hActive = await Key.countDocuments({
    isFreeKey: true,
    duration: '3h',
    status: 1,
    expiredDate: { $gt: now },
  });

  // Ad claim trends (last 30 days)
  const adClaimTrends = await IpTracker.aggregate<AdClaimTrend>([
    {
      $match: {
        isAdClaim: true,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        claims: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        claims: 1,
        extensions: { $literal: 0 },
        _id: 0,
      },
    },
  ]);

  // Get extension trends — extensions are ad claims linked to keys with 1h duration added
  // We check keys that got extended (have deviceResetCount > 0 or were extended)
  // Actually, extensions create new IpTracker entries with isAdClaim: true
  // We need to differentiate. Let's join with keys to find extension types
  const extensionTrends = await IpTracker.aggregate<{ date: string; extensions: number }>([
    {
      $match: {
        isAdClaim: true,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $lookup: {
        from: 'keys',
        localField: 'keyId',
        foreignField: '_id',
        as: 'keyInfo',
      },
    },
    {
      $unwind: { path: '$keyInfo', preserveNullAndEmptyArrays: true },
    },
    {
      $match: {
        'keyInfo.duration': '1h', // Extension keys have 1h duration (they extend existing key)
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        extensions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        extensions: 1,
        _id: 0,
      },
    },
  ]);

  // Merge extension data into claim trends
  const extensionMap = new Map(extensionTrends.map(e => [e.date, e.extensions]));
  const mergedTrends = adClaimTrends.map(t => ({
    date: t.date,
    claims: t.claims - (extensionMap.get(t.date) || 0), // claims = total ad claims minus extensions
    extensions: extensionMap.get(t.date) || 0,
  }));

  // Game ad stats
  const gameAdStats = await IpTracker.aggregate<GameAdStats>([
    { $match: { isAdClaim: true } },
    {
      $lookup: {
        from: 'keys',
        localField: 'keyId',
        foreignField: '_id',
        as: 'keyInfo',
      },
    },
    { $unwind: { path: '$keyInfo', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$keyInfo.game',
        totalAdClaims: { $sum: 1 },
        totalExtensions: {
          $sum: {
            $cond: [{ $eq: ['$keyInfo.duration', '1h'] }, 1, 0],
          },
        },
      },
    },
    { $sort: { totalAdClaims: -1 } },
    {
      $project: {
        game: { $ifNull: ['$_id', 'Unknown'] },
        totalAdClaims: 1,
        totalExtensions: 1,
        _id: 0,
      },
    },
  ]);

  // Add active key counts per game
  for (const stat of gameAdStats) {
    if (stat.game !== 'Unknown') {
      stat.activeKeys = await Key.countDocuments({
        game: stat.game,
        isFreeKey: true,
        status: 1,
        expiredDate: { $gt: now },
      });
    } else {
      stat.activeKeys = 0;
    }
  }

  // Top ad supporters (by IP)
  const topSupportersRaw = await IpTracker.aggregate<TopAdSupporter>([
    { $match: { isAdClaim: true, isBanned: false } },
    {
      $lookup: {
        from: 'keys',
        localField: 'keyId',
        foreignField: '_id',
        as: 'keyInfo',
      },
    },
    { $unwind: { path: '$keyInfo', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$ipAddress',
        totalClaims: { $sum: 1 },
        threeHourClaims: {
          $sum: {
            $cond: [{ $ne: ['$keyInfo.duration', '1h'] }, 1, 0],
          },
        },
        extensions: {
          $sum: {
            $cond: [{ $eq: ['$keyInfo.duration', '1h'] }, 1, 0],
          },
        },
        lastClaim: { $max: '$createdAt' },
      },
    },
    { $sort: { totalClaims: -1 } },
    { $limit: 15 },
  ]);

  const topSupporters: TopAdSupporter[] = topSupportersRaw.map(s => ({
    maskedIp: (s as any)._id.replace(/(\d+)\.\d+$/, '$1.xxx'),
    totalClaims: s.totalClaims,
    threeHourClaims: s.threeHourClaims,
    extensions: s.extensions,
    lastClaim: (s as any).lastClaim instanceof Date ? (s as any).lastClaim.toISOString() : String((s as any).lastClaim),
  }));

  // Top performers by IP (end users who claim the most free keys via ads)
  const topPerformersRaw = await IpTracker.aggregate<TopAdPerformer>([
    { $match: { isAdClaim: true, isBanned: false } },
    {
      $lookup: {
        from: 'keys',
        localField: 'keyId',
        foreignField: '_id',
        as: 'keyInfo',
      },
    },
    { $unwind: { path: '$keyInfo', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$ipAddress',
        totalKeys: { $sum: 1 },
        activeKeys: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$keyInfo.status', 1] }, { $gt: ['$keyInfo.expiredDate', now] }] },
              1,
              0,
            ],
          },
        },
        adClaims: {
          $sum: {
            $cond: [{ $ne: ['$keyInfo.duration', '1h'] }, 1, 0],
          },
        },
        extensions: {
          $sum: {
            $cond: [{ $eq: ['$keyInfo.duration', '1h'] }, 1, 0],
          },
        },
        lastActivity: { $max: '$createdAt' },
      },
    },
    { $sort: { totalKeys: -1 } },
    { $limit: 20 },
  ]);

  const topPerformers: TopAdPerformer[] = topPerformersRaw.map(p => ({
    registrator: (p as any)._id.replace(/(\d+)\.\d+$/, '$1.xxx'),
    totalKeys: p.totalKeys,
    activeKeys: p.activeKeys,
    adClaims: p.adClaims,
    extensions: p.extensions,
    lastActivity: (p as any).lastActivity instanceof Date ? (p as any).lastActivity.toISOString() : String((p as any).lastActivity),
  }));

  // Daily ad stats (revenue proxy: ad impressions = ad claims)
  const dailyRevenue = await IpTracker.aggregate<DailyRevenue>([
    {
      $match: {
        isAdClaim: true,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        adImpressions: { $sum: 1 },
        uniqueIps: { $addToSet: '$ipAddress' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        adImpressions: 1,
        uniqueIps: { $size: '$uniqueIps' },
        _id: 0,
      },
    },
  ]);

  // Recalculate actual 3h claims vs extensions
  const actualTotal3h = totalAdClaims - extensionTrends.reduce((sum, e) => sum + e.extensions, 0);
  const actualExtensions = extensionTrends.reduce((sum, e) => sum + e.extensions, 0);

  return {
    totalAdClaims,
    total3hClaims: actualTotal3h,
    totalExtensions: actualExtensions,
    total3hActive,
    adClaimTrends: mergedTrends,
    gameAdStats,
    topSupporters,
    topPerformers,
    dailyRevenue,
  };
}