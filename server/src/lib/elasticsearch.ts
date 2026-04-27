import { Client } from "@elastic/elasticsearch";

let cached: Client | null = null;
let ensured = false;

export function getElasticClient(): Client | null {
  const provider = (process.env.FORUM_SEARCH_PROVIDER || "").toLowerCase();
  if (provider !== "elasticsearch") return null;

  const node = process.env.ELASTICSEARCH_NODE;
  if (!node) return null;

  if (!cached) cached = new Client({ node });
  if (!ensured) {
    ensured = true;
    ensureForumIndex(cached).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[forumIndex] Failed to ensure index: ${msg}`);
    });
  }
  return cached;
}

export function getElasticIndex(): string {
  return process.env.ELASTICSEARCH_INDEX || "forum-posts";
}

async function ensureForumIndex(client: Client) {
  const index = getElasticIndex();

  // ES7 client returns { body: boolean } for exists
  const existsResp: any = await client.indices.exists({ index });
  const exists = Boolean(existsResp?.body ?? existsResp);
  if (exists) return;

  await client.indices.create({
    index,
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
      },
      mappings: {
        properties: {
          title: { type: "text" },
          body: { type: "text" },
          tags: { type: "keyword" },
          createdAt: { type: "date" },
        },
      },
    },
  });
  console.log(`[forumIndex] Created Elasticsearch index: ${index}`);
}

