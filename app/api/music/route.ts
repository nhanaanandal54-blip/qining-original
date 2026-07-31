import { NextRequest, NextResponse } from "next/server";

interface MetingSong {
  name?: string;
  artist?: string;
  url?: string;
  pic?: string;
  lrc?: string;
}

interface SongData {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  lrcUrl: string;
}

const METING_API = "https://api.injahow.cn/meting/";

function songIdFromUrl(url: string, fallback: string) {
  try {
    return new URL(url).searchParams.get("id") || fallback;
  } catch {
    return fallback;
  }
}

async function fetchMeting(type: "playlist" | "song", id: string) {
  const params = new URLSearchParams({ server: "netease", type, id });
  const response = await fetch(`${METING_API}?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? (data as MetingSong[]) : [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playlistId = searchParams.get("id")?.trim() || "";
  const songIds = (searchParams.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!playlistId && songIds.length === 0) {
    return NextResponse.json(
      { error: "需要提供 id（歌单 ID）或 ids（歌曲 ID，逗号分隔）" },
      { status: 400 }
    );
  }

  const requests: Promise<MetingSong[]>[] = [];
  if (playlistId) requests.push(fetchMeting("playlist", playlistId).catch(() => []));
  for (const id of [...new Set(songIds)]) {
    requests.push(fetchMeting("song", id).catch(() => []));
  }

  const tracks = (await Promise.all(requests)).flat();
  const songs = tracks
    .filter((track) => track.url)
    .map((track, index): SongData => {
      const src = String(track.url || "").replace(/^http:\/\//, "https://");
      return {
        id: songIdFromUrl(src, `song-${index}`),
        title: String(track.name || "未知歌曲"),
        artist: String(track.artist || "未知歌手"),
        cover: String(track.pic || "").replace(/^http:\/\//, "https://"),
        src,
        lrcUrl: String(track.lrc || "").replace(/^http:\/\//, "https://"),
      };
    });

  return NextResponse.json(
    Array.from(new Map(songs.map((song) => [song.id, song])).values())
  );
}
