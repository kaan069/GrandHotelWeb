/**
 * GrandHotel PMS - Otel Yönetimi Storage
 *
 * Otel bilgileri ve online rezervasyon kanalı ayarlarının
 * localStorage üzerinden CRUD işlemlerini yönetir.
 */

import {
  HotelInfo,
  ReservationChannelSettings,
  ChannelRoomConfig,
  HOTEL_INFO_STORAGE_KEY,
  CHANNEL_SETTINGS_STORAGE_KEY,
} from './constants';

/* ==================== OTEL BİLGİLERİ ==================== */

const DEFAULT_HOTEL_INFO: HotelInfo = {
  name: '',
  address: '',
  images: [],
  updatedAt: '',
};

export const loadHotelInfo = (): HotelInfo => {
  try {
    const saved = localStorage.getItem(HOTEL_INFO_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* varsayılan döndür */ }
  return { ...DEFAULT_HOTEL_INFO };
};

export const saveHotelInfo = (info: HotelInfo): void => {
  localStorage.setItem(HOTEL_INFO_STORAGE_KEY, JSON.stringify(info));
};

/* ==================== KANAL AYARLARI ==================== */

const DEFAULT_CHANNEL_SETTINGS: ReservationChannelSettings = {
  isActive: false,
  roomConfigs: [],
  updatedAt: '',
};

export const loadChannelSettings = (): ReservationChannelSettings => {
  try {
    const saved = localStorage.getItem(CHANNEL_SETTINGS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* varsayılan döndür */ }
  return { ...DEFAULT_CHANNEL_SETTINGS, roomConfigs: [] };
};

export const saveChannelSettings = (settings: ReservationChannelSettings): void => {
  localStorage.setItem(CHANNEL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

export const addChannelRoomConfig = (
  config: Omit<ChannelRoomConfig, 'id' | 'createdAt' | 'updatedAt'>,
): ChannelRoomConfig => {
  const settings = loadChannelSettings();
  const maxId = settings.roomConfigs.reduce((max, c) => Math.max(max, c.id), 0);
  const now = new Date().toISOString();

  const newConfig: ChannelRoomConfig = {
    ...config,
    id: maxId + 1,
    createdAt: now,
    updatedAt: now,
  };

  settings.roomConfigs.push(newConfig);
  settings.updatedAt = now;
  saveChannelSettings(settings);
  return newConfig;
};

export const updateChannelRoomConfig = (
  id: number,
  partial: Partial<Omit<ChannelRoomConfig, 'id' | 'createdAt'>>,
): ChannelRoomConfig | null => {
  const settings = loadChannelSettings();
  const index = settings.roomConfigs.findIndex((c) => c.id === id);
  if (index === -1) return null;

  settings.roomConfigs[index] = {
    ...settings.roomConfigs[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  settings.updatedAt = new Date().toISOString();
  saveChannelSettings(settings);
  return settings.roomConfigs[index];
};

export const deleteChannelRoomConfig = (id: number): void => {
  const settings = loadChannelSettings();
  settings.roomConfigs = settings.roomConfigs.filter((c) => c.id !== id);
  settings.updatedAt = new Date().toISOString();
  saveChannelSettings(settings);
};
