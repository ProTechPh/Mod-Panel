import { ObjectId } from 'mongoose';

export type UserLevel = 1 | 2 | 3;
export type UserStatus = 1 | 2 | 3;
export type KeyStatus = 0 | 1;
export type MaintenanceStatus = 'on' | 'off';
export type ServerConfigId = '000000000000000000000001';

export interface Features {
  esp: boolean;
  item: boolean;
  silentAim: boolean;
  aim: boolean;
  bulletTrack: boolean;
  memory: boolean;
  floating: boolean;
  setting: boolean;
}

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
  telegramContact: string;
  telegramId?: number | null;
  telegramUsername?: string;
  expirationDate: Date;
  loggedIn: number;
  resetLinkToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyDoc {
  _id: ObjectId;
  game: string;
  userKey: string;
  duration: number | '1h' | '6h';
  expiredDate: Date | null;
  maxDevices: number;
  devices: string[];
  status: KeyStatus;
  registrator: string;
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
  downloadLink: string;
  floatingTextStatus: string;
  floatingText: string;
  modName: string;
  telegramChannel: string;
  telegramGroup: string;
  features: Features;
  registrator: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerConfigDoc {
  _id: ServerConfigId;
  modName: string;
  maintenanceStatus: MaintenanceStatus;
  maintenanceMessage: string;
  telegramChannel: string;
  telegramGroup: string;
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
  ftpUrl: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface IpTrackerDoc {
  _id: ObjectId;
  userId: string;
  ipAddress: string;
  generatorIp: string;
  keyId: string | ObjectId;
  createdAt: Date;
  isp: string;
  org: string;
  isVpn: boolean;
  isProxy: boolean;
  isBanned: boolean;
  banReason: string;
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

export type Duration = number | '1h' | '6h';

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