import { ObjectId } from 'mongoose';

export type UserLevel = 1 | 2 | 3;
export type UserStatus = 1 | 2 | 3;
export type KeyStatus = 0 | 1;
export type MaintenanceStatus = 'on' | 'off';
export type ServerConfigId = '000000000000000000000001';

export interface UserDoc {
  _id: ObjectId;
  username: string;
  email: string;
  fullname: string;
  password: string;
  level: UserLevel;
  saldo: number;
  status: UserStatus;
  uplink: string;
  userIp: string;
  expirationDate: Date;
  loggedIn: number;
  resetLinkToken?: string;
  resetTokenExpiry?: Date;
  banReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyDoc {
  _id: ObjectId;
  game: string;
  userKey: string;
  duration: Duration;
  expiredDate: Date | null;
  maxDevices: number;
  devices: string[];
  status: KeyStatus;
  registrator: string;
  isFreeKey: boolean;
  deviceResetCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralDoc {
  _id: ObjectId;
  code: string;
  referralPlain: string;
  level: UserLevel;
  setSaldo: number;
  usedBy: string;
  createdBy: string;
  accExpiration: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSettingDoc {
  _id: ObjectId;
  gameCode: string;
  gameName: string;
  isEnabled: boolean;
  connectEnabled: boolean;
  freeKeyEnabled: boolean;
  maintenanceMessage: string;
  maintenanceStartedAt: Date | null;
  downloadLink: string;
  modName: string;
  registrator: string;
  announcement: string;
  announcementStatus: 'on' | 'off';
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerConfigDoc {
  _id: ServerConfigId;
  modName: string;
  maintenanceStatus: MaintenanceStatus;
  maintenanceMessage: string;
  maintenanceStartedAt: Date | null;
  announcement: string;
  announcementStatus: 'on' | 'off';
  updatedAt: Date;
}

export interface AppLinkDoc {
  _id: ObjectId;
  appName: string;
  downloadUrl: string;
  createdAt: Date;
}

export interface LibDoc {
  _id: ObjectId;
  fileName: string;
  displayName: string;
  type: 'free' | 'paid';
  ftpUrl: string;
  fileSize: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface LibLogDoc {
  _id: ObjectId;
  libId: ObjectId;
  fileName: string;
  uploadedBy: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  downloadedAt: Date;
}

export interface IpTrackerDoc {
  _id: ObjectId;
  userId: string;
  username: string;
  ipAddress: string;
  generatorIp: string;
  keyId: string | ObjectId;
  createdAt: Date;
  isp: string;
  org: string;
  isBanned: boolean;
  banReason: string;
  isAdClaim: boolean;
}

export interface HistoryDoc {
  _id: ObjectId;
  keyId: string | ObjectId;
  userDo: string;
  info: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  userId: string;
  username: string;
  level: UserLevel;
  iat: number;
  exp: number;
}

export type Duration = number | '1h' | '3h' | 'lifetime';

export const LEVEL_OWNER: UserLevel = 1;
export const LEVEL_ADMIN: UserLevel = 2;
export const LEVEL_RESELLER: UserLevel = 3;

export const STATUS_ACTIVE: UserStatus = 1;
export const STATUS_BANNED: UserStatus = 2;
export const STATUS_EXPIRED: UserStatus = 3;

export const KEY_ACTIVE: KeyStatus = 1;
export const KEY_INACTIVE: KeyStatus = 0;

export const STATIC_WORDS = 'Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E';
export const SERVER_CONFIG_ID = '000000000000000000000001';

