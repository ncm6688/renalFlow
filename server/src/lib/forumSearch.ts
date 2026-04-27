import ForumPost from "../models/forumPost.model";
import { getElasticClient, getElasticIndex } from "./elasticsearch";

type SearchResult = {
  provider: "elasticsearch" | "mongo";
  posts: any[];
};

export async function searchForumPosts(query: string, limit: number, offset = 0): Promise<SearchResult> {
  const provider = (process.env.FORUM_SEARCH_PROVIDER || "").toLowerCase();
  if (provider === "elasticsearch") {
    try {
      const client = getElasticClient();
      const index = getElasticIndex();
      if (!client) throw new Error("Elasticsearch not configured");

      const q = query.trim();
      const escaped = q.replace(/[+\-=&|><!(){}\[\]^"~*?:\\/]/g, "\\$&");
      const esQuery =
        q.length <= 2
          ? {
              query_string: {
                query: `*${escaped}*`,
                fields: ["title^3", "body", "tags^2"],
                analyze_wildcard: true,
              },
            }
          : {
              bool: {
                should: [
                  {
                    multi_match: {
                      query: q,
                      fields: ["title^3", "body", "tags^2"],
                      fuzziness: "AUTO",
                    },
                  },
                  {
                    query_string: {
                      query: `*${escaped}*`,
                      fields: ["title^2", "body", "tags"],
                      analyze_wildcard: true,
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            };

      const resp = await client.search({
        index,
        size: limit + 1,
        from: offset,
        body: {
          query: esQuery,
        },
      });

      const hits =
        (((resp as any).hits?.hits ??
          (resp as any).body?.hits?.hits ??
          (resp as any).response?.hits?.hits) ||
          []) as Array<{ _id: string }>;
      const ids = hits.map((h) => h._id);
      const docs = await ForumPost.find({ _id: { $in: ids } }).lean();
      const byId = new Map(docs.map((d: any) => [String(d._id), d]));
      const posts = ids.map((id) => byId.get(String(id))).filter(Boolean);

      return { provider: "elasticsearch", posts };
    } catch (err) {
      // fall through to mongo (but log so it's debuggable in dev)
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[forumSearch] Elasticsearch unavailable, falling back to Mongo: ${msg}`);
    }
  }

  // Mongo fallback: use regex so substring search works (e.g. "af" in "sdaf...")
  // Keep it minimal: no heavy fuzzy, just case-insensitive contains match.
  const posts = await ForumPost.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { body: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } },
    ],
  })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit + 1)
    .lean();

  return { provider: "mongo", posts };
}

