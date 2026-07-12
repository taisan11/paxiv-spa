interface HistoryItem {
  id: string;
  title: string;
  type: "artwork" | "novel" | "follow";
  url: string;
  timestamp: number;
}

const STORAGE_PREFIX = "paxiv_";
const MAX_ITEMS = 1000;

function storageKey(category: string, sub?: string): string {
  return sub ? `${STORAGE_PREFIX}${category}_${sub}` : `${STORAGE_PREFIX}${category}`;
}

function readItems(key: string): HistoryItem[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function writeItems(key: string, items: HistoryItem[], unlimited = false): void {
  localStorage.setItem(key, JSON.stringify(unlimited ? items : items.slice(0, MAX_ITEMS)));
}

export function getHistory(type: "artwork" | "novel"): HistoryItem[] {
  return readItems(storageKey("history", type));
}

export function getBookmarks(type: "artwork" | "novel"): HistoryItem[] {
  return readItems(storageKey("bookmarks", type));
}

export function getFollows(): HistoryItem[] {
  return readItems(storageKey("follows"));
}

export function saveHistory(id: string, title: string, type: "artwork" | "novel", url: string): void {
  const key = storageKey("history", type);
  const items = readItems(key).filter((item) => item.id !== id);
  items.unshift({ id, title, type, url, timestamp: Date.now() });
  writeItems(key, items, isNativeApp());
}

export function toggleBookmark(id: string, title: string, type: "artwork" | "novel", url: string): boolean {
  const key = storageKey("bookmarks", type);
  const items = readItems(key);
  const idx = items.findIndex((b) => b.id === id);
  if (idx >= 0) {
    items.splice(idx, 1);
    writeItems(key, items);
    return false;
  }
  items.unshift({ id, title, type, url, timestamp: Date.now() });
  writeItems(key, items);
  return true;
}

export function isBookmarked(id: string, type: "artwork" | "novel"): boolean {
  const key = storageKey("bookmarks", type);
  const items = readItems(key);
  return items.some((b) => b.id === id);
}

export function toggleFollow(id: string, title: string, url: string): boolean {
  const key = storageKey("follows");
  const items = readItems(key);
  const idx = items.findIndex((f) => f.id === id);
  if (idx >= 0) {
    items.splice(idx, 1);
    writeItems(key, items);
    return false;
  }
  items.unshift({ id, title, type: "follow", url, timestamp: Date.now() });
  writeItems(key, items);
  return true;
}

export function clearSection(section: string): void {
  const keyMap: Record<string, string> = {
    "history-artworks": storageKey("history", "artwork"),
    "history-novel": storageKey("history", "novel"),
    "bookmarks-artworks": storageKey("bookmarks", "artwork"),
    "bookmarks-novel": storageKey("bookmarks", "novel"),
    "follows": storageKey("follows"),
  };
  const key = keyMap[section];
  if (key) localStorage.removeItem(key);
}

export type { HistoryItem };
import { isNativeApp } from "./native";
