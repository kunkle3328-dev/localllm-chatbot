
import { ChatSession, AppConfig } from '../types';
import { STORAGE_KEYS, DEFAULT_CONFIG } from '../constants';

export const storageService = {
  saveSessions(sessions: ChatSession[]) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  loadSessions(): ChatSession[] {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  // Use AppConfig to match constants and actual state structure
  saveConfig(config: AppConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  },

  // Use AppConfig to match constants and actual state structure
  loadConfig(): AppConfig {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return data ? JSON.parse(data) : DEFAULT_CONFIG;
  }
};
