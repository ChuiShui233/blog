import { umamiStatsConfig } from "@/config";

const CACHE_KEY_TOKEN = "umami_share_token";
const CACHE_KEY_STATS = "umami_stats_cache";

interface UmamiShareResponse {
	websiteId: string;
	token: string;
}

interface UmamiStatsResponse {
	pageviews: number;
	visitors: number;
	visits: number;
	bounces: number;
	totaltime: number;
	comparison: {
		pageviews: number;
		visitors: number;
		visits: number;
		bounces: number;
		totaltime: number;
	};
}

interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

function getCached<T>(key: string): T | null {
	if (typeof window === "undefined") return null;
	const item = localStorage.getItem(key);
	if (!item) return null;
	const entry: CacheEntry<T> = JSON.parse(item);
	const now = Date.now();
	const cacheDuration = umamiStatsConfig.cacheDuration || 300000;
	if (now - entry.timestamp > cacheDuration) {
		localStorage.removeItem(key);
		return null;
	}
	return entry.data;
}

function setCached<T>(key: string, data: T) {
	if (typeof window === "undefined") return;
	const entry: CacheEntry<T> = { data, timestamp: Date.now() };
	localStorage.setItem(key, JSON.stringify(entry));
}

async function fetchShareToken(): Promise<string> {
	const cached = getCached<string>(CACHE_KEY_TOKEN);
	if (cached) return cached;

	const { shareId, baseUrl, region } = umamiStatsConfig;
	const apiBase = baseUrl || "https://cloud.umami.is";
	let url: string;
	if (apiBase.includes("cloud.umami.is")) {
		const regionPart = region || "us";
		url = `${apiBase}/analytics/${regionPart}/api/share/${shareId}`;
	} else {
		// 自托管实例，API路径通常为 /api/share/[shareId]
		url = `${apiBase}/api/share/${shareId}`;
	}

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch share token: ${response.status}`);
		}
		const data: UmamiShareResponse = await response.json();
		const token = data.token;
		setCached(CACHE_KEY_TOKEN, token);
		return token;
	} catch (error) {
		console.error("Error fetching Umami share token:", error);
		throw error;
	}
}

async function fetchStats(path: string): Promise<UmamiStatsResponse> {
	const cacheKey = `${CACHE_KEY_STATS}_${path}`;
	const cached = getCached<UmamiStatsResponse>(cacheKey);
	if (cached) return cached;

	const token = await fetchShareToken();
	const { websiteId, baseUrl, region } = umamiStatsConfig;
	const apiBase = baseUrl || "https://cloud.umami.is";
	let url: string;
	if (apiBase.includes("cloud.umami.is")) {
		const regionPart = region || "us";
		url = `${apiBase}/analytics/${regionPart}/api/websites/${websiteId}/stats?startAt=0&endAt=${Date.now()}&unit=hour&timezone=Asia/Hong_Kong&path=eq.${encodeURIComponent(path)}&compare=false`;
	} else {
		// 自托管实例，API路径通常为 /api/websites/[websiteId]/stats
		url = `${apiBase}/api/websites/${websiteId}/stats?startAt=0&endAt=${Date.now()}&unit=hour&timezone=Asia/Hong_Kong&path=eq.${encodeURIComponent(path)}&compare=false`;
	}

	try {
		const response = await fetch(url, {
			headers: {
				"x-umami-share-token": token,
			},
		});
		if (!response.ok) {
			throw new Error(`Failed to fetch stats: ${response.status}`);
		}
		const data: UmamiStatsResponse = await response.json();
		setCached(cacheKey, data);
		return data;
	} catch (error) {
		console.error("Error fetching Umami stats:", error);
		throw error;
	}
}

export async function getPageViews(path: string): Promise<number> {
	if (!umamiStatsConfig.enabled || !umamiStatsConfig.shareId) {
		return 0;
	}
	try {
		const stats = await fetchStats(path);
		return stats.pageviews;
	} catch {
		return 0;
	}
}

export async function getVisitors(path: string): Promise<number> {
	if (!umamiStatsConfig.enabled || !umamiStatsConfig.shareId) {
		return 0;
	}
	try {
		const stats = await fetchStats(path);
		return stats.visitors;
	} catch {
		return 0;
	}
}

export async function getTotalPageViews(): Promise<number> {
	if (!umamiStatsConfig.enabled || !umamiStatsConfig.shareId) {
		return 0;
	}
	try {
		const stats = await fetchStats("/");
		return stats.pageviews;
	} catch {
		return 0;
	}
}

export async function getTotalVisitors(): Promise<number> {
	if (!umamiStatsConfig.enabled || !umamiStatsConfig.shareId) {
		return 0;
	}
	try {
		const stats = await fetchStats("/");
		return stats.visitors;
	} catch {
		return 0;
	}
}