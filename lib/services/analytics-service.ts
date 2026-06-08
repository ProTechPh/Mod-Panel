import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';
import User from '@/lib/db/models/User';

interface TrendPoint {
  date: string;
  count: number;
}

interface GameDistEntry {
  game: string;
  count: number;
}

export interface TopPerformer {
  username: string;
  fullname: string;
  keysUsed: number;
  totalKeys: number;
  rank: number;
}

interface UserLevelDist {
  owners: number;
  admins: number;
  resellers: number;
  buyers: number;
}

export interface KeyStats {
  total: number;
  active: number;
  expired: number;
  blocked: number;
  unused: number;
}

export interface DashboardAnalytics {
  keyStats: KeyStats;
  keyTrends: TrendPoint[];
  gameDistribution: GameDistEntry[];
  statusDistribution: { status: string; count: number }[];
  userLevelDistribution: UserLevelDist;
  recentActivity: { date: string; created: number; expired: number }[];
  topPerformers: TopPerformer[];
}

type CountEntry = { _id: string; count: number };
type FacetCount = { count: number }[];

interface StatusFacetResult {
  active: FacetCount;
  expired: FacetCount;
  blocked: FacetCount;
  unused: FacetCount;
}

interface ActivityFacetResult {
  created: CountEntry[];
  expired: CountEntry[];
}

interface UserLevelFacetResult {
  owners: FacetCount;
  admins: FacetCount;
  resellers: FacetCount;
  buyers: FacetCount;
}

export async function getDashboardAnalytics(registrator?: string): Promise<DashboardAnalytics> {
  await dbConnect();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filter: Record<string, unknown> = {};
  if (registrator) filter.registrator = registrator;

  const keyTrendsPromise = Key.aggregate<TrendPoint>([
    { $match: { createdAt: { $gte: thirtyDaysAgo }, ...filter } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, _id: 0 } },
  ]);

  const gameDistributionPromise = Key.aggregate<GameDistEntry>([
    { $match: filter },
    { $group: { _id: '$game', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
    { $project: { game: '$_id', count: 1, _id: 0 } },
  ]);

  const statusDistPromise = Key.aggregate<StatusFacetResult>([
    { $match: filter },
    {
      $facet: {
        active: [{ $match: { status: 1, expiredDate: { $gt: now } } }, { $count: 'count' }],
        expired: [{ $match: { expiredDate: { $lt: now } } }, { $count: 'count' }],
        blocked: [{ $match: { status: 0, expiredDate: { $gte: now } } }, { $count: 'count' }],
        unused: [{ $match: { expiredDate: null } }, { $count: 'count' }],
      },
    },
  ]);

  const recentActivityPromise = Key.aggregate<ActivityFacetResult>([
    { $match: { createdAt: { $gte: thirtyDaysAgo }, ...filter } },
    {
      $facet: {
        created: [
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        ],
        expired: [
          { $match: { expiredDate: { $gte: thirtyDaysAgo, $lt: now } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$expiredDate' } }, count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  const userLevelPromise: Promise<UserLevelDist | UserLevelFacetResult[]> = registrator
    ? Promise.resolve({ owners: 0, admins: 0, resellers: 0, buyers: 0 })
    : User.aggregate<UserLevelFacetResult>([
      {
        $facet: {
          owners: [{ $match: { level: 1 } }, { $count: 'count' }],
          admins: [{ $match: { level: 2 } }, { $count: 'count' }],
          resellers: [{ $match: { level: 3 } }, { $count: 'count' }],
          buyers: [{ $match: { level: 4 } }, { $count: 'count' }],
        },
      },
    ]) as Promise<UserLevelFacetResult[]>;

  const topPerformersPromise = Key.aggregate<{ username: string; fullname: string; keysUsed: number; totalKeys: number }>([
    { $match: filter },
    {
      $group: {
        _id: '$registrator',
        keysUsed: { $sum: { $cond: [{ $ne: ['$expiredDate', null] }, 1, 0] } },
        totalKeys: { $sum: 1 },
      },
    },
    { $sort: { keysUsed: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'username',
        as: 'userInfo',
      },
    },
    {
      $project: {
        _id: 0,
        username: '$_id',
        fullname: { $ifNull: [{ $arrayElemAt: ['$userInfo.fullname', 0] }, ''] },
        keysUsed: 1,
        totalKeys: 1,
      },
    },
  ]);

  const [keyTrends, gameDistribution, statusDist, recentActivity, userLevelDist, topPerformersRaw] = await Promise.all([
    keyTrendsPromise,
    gameDistributionPromise,
    statusDistPromise,
    recentActivityPromise,
    userLevelPromise,
    topPerformersPromise,
  ]);

  const topPerformers: TopPerformer[] = topPerformersRaw.map((p, i) => ({
    ...p,
    rank: i + 1,
  }));

  const statusResult: StatusFacetResult = statusDist[0] || { active: [], expired: [], blocked: [], unused: [] };
  const statusDistribution = [
    { status: 'Active', count: statusResult.active?.[0]?.count ?? 0 },
    { status: 'Expired', count: statusResult.expired?.[0]?.count ?? 0 },
    { status: 'Blocked', count: statusResult.blocked?.[0]?.count ?? 0 },
    { status: 'Unused', count: statusResult.unused?.[0]?.count ?? 0 },
  ];

  const activityResult: ActivityFacetResult = recentActivity[0] || { created: [], expired: [] };
  const createdMap = new Map((activityResult.created || []).map((c) => [c._id, c.count]));
  const expiredMap = new Map((activityResult.expired || []).map((e) => [e._id, e.count]));

  const allDates = new Set([...createdMap.keys(), ...expiredMap.keys()]);
  const sortedDates = [...allDates].sort();
  const recentActivityFormatted = sortedDates.map(date => ({
    date,
    created: createdMap.get(date) ?? 0,
    expired: expiredMap.get(date) ?? 0,
  }));

  const isUserLevelFacet = Array.isArray(userLevelDist);
  const ulDist: UserLevelFacetResult = isUserLevelFacet
    ? (userLevelDist as UserLevelFacetResult[])[0] || { owners: [], admins: [], resellers: [], buyers: [] }
    : { owners: [], admins: [], resellers: [], buyers: [] };

  const userLevelResult = isUserLevelFacet ? ulDist : (userLevelDist as UserLevelDist);
  const userLevelDistribution: UserLevelDist = isUserLevelFacet
    ? {
        owners: ulDist.owners?.[0]?.count ?? 0,
        admins: ulDist.admins?.[0]?.count ?? 0,
        resellers: ulDist.resellers?.[0]?.count ?? 0,
        buyers: ulDist.buyers?.[0]?.count ?? 0,
      }
    : (userLevelResult as UserLevelDist);

  const keyStats: KeyStats = {
    total: statusDistribution.reduce((s, e) => s + e.count, 0),
    active: statusDistribution.find(e => e.status === 'Active')?.count ?? 0,
    expired: statusDistribution.find(e => e.status === 'Expired')?.count ?? 0,
    blocked: statusDistribution.find(e => e.status === 'Blocked')?.count ?? 0,
    unused: statusDistribution.find(e => e.status === 'Unused')?.count ?? 0,
  };

  return {
    keyStats,
    keyTrends,
    gameDistribution,
    statusDistribution,
    userLevelDistribution,
    recentActivity: recentActivityFormatted,
    topPerformers,
  };
}