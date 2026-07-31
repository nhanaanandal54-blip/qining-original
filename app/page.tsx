import HomeClient from "./HomeClient";
import { ensureDatabase, getDatabase, hasDatabase } from "@/lib/database";

async function fetchProfileData() {
  if (!hasDatabase()) {
    return { postCount: 0, chatterCount: 0, photoCount: 0 };
  }
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const [posts, chatters, photos] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM posts WHERE status = 'published'`,
      sql`SELECT COUNT(*)::int AS count FROM chatters WHERE status = 'published'`,
      sql`SELECT COUNT(*)::int AS count FROM photos`,
    ]);
    return {
      postCount: posts[0]?.count ?? 0,
      chatterCount: chatters[0]?.count ?? 0,
      photoCount: photos[0]?.count ?? 0,
    };
  } catch {
    return { postCount: 0, chatterCount: 0, photoCount: 0 };
  }
}

export default async function Home() {
  const { postCount, chatterCount, photoCount } = await fetchProfileData();

  return (
    <HomeClient
      postCount={postCount}
      chatterCount={chatterCount}
      photoCount={photoCount}
    />
  );
}
