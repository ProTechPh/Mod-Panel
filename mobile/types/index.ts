export type UserLevel = 1 | 2 | 3;
export type UserStatus = 1 | 2 | 3;
export type KeyStatus = 0 | 1;
export type MaintenanceStatus = "on" | "off";

export interface AuthUser {
  userId: string;
  username: string;
  level: UserLevel;
  fullname: string;
  saldo: number;
  telegramContact: string;
  telegramId: number | null;
  telegramUsername: string;
}

export interface KeyItem {
  _id: string;
  game: string;
  userKey: string;
  duration: number | "1h" | "6h";
  maxDevices: number;
  devices: string[];
  status: KeyStatus;
  registrator: string;
  expiredDate: string | null;
  createdAt: string;
}

export interface KeyStats {
  total: number;
  active: number;
  expired: number;
  blocked: number;
  unused: number;
}

export interface HistoryEntry {
  _id: string;
  keyId: string;
  userDo: string;
  info: string;
  createdAt: string;
}

export interface GameOption {
  gameCode: string;
  gameName: string;
  registrator: string;
}

export interface ServerConfig {
  maintenanceStatus: string;
  maintenanceMessage: string;
  modName: string;
  telegramChannel: string;
  telegramGroup: string;
}

export interface UserItem {
  _id: string;
  username: string;
  email: string;
  fullname: string;
  level: UserLevel;
  saldo: number;
  status: UserStatus;
  expirationDate: string;
  createdAt: string;
}

export interface GameSettingItem {
  _id: string;
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
  features: {
    esp: boolean;
    item: boolean;
    silentAim: boolean;
    aim: boolean;
    bulletTrack: boolean;
    memory: boolean;
    floating: boolean;
    setting: boolean;
  };
  registrator: string;
}

export interface LibDoc {
  _id: string;
  fileName: string;
  displayName: string;
  ftpUrl: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ReferralItem {
  _id: string;
  referralPlain: string;
  level: UserLevel;
  setSaldo: number;
  usedBy: string[];
  createdBy: string;
  accExpiration: string;
  createdAt: string;
}

export const LEVEL_OWNER: UserLevel = 1;
export const LEVEL_ADMIN: UserLevel = 2;
export const LEVEL_RESELLER: UserLevel = 3;