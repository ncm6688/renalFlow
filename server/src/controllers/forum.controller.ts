import { Request, Response } from "express";
import ForumPost from "../models/forumPost.model";
import { AuthedRequest } from "../middleware/auth";
import { searchForumPosts } from "../lib/forumSearch";
import { getElasticClient, getElasticIndex } from "../lib/elasticsearch";

export async function createPost(req: AuthedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { title, body, tags } = req.body || {};
  if (!title || !body) return res.status(400).json({ message: "title and body are required" });

  const post = await ForumPost.create({
    author: userId,
    title: String(title),
    body: String(body),
    tags: Array.isArray(tags) ? tags.map(String).filter(Boolean).slice(0, 8) : [],
  });

  // Best-effort indexing for fuzzy search; failures should not block posting.
  const es = getElasticClient();
  if (es) {
    es.index({
      index: getElasticIndex(),
      id: post._id.toString(),
      body: { title: post.title, body: post.body, tags: post.tags, createdAt: post.createdAt },
      refresh: "wait_for",
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[forumIndex] Failed to index post ${post._id.toString()}: ${msg}`);
    });
  }

  return res.status(201).json({ post });
}

export async function listPosts(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit ?? 10), 50);
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const skip = (page - 1) * limit;

  const docs = await ForumPost.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .populate("author", "name email role")
    .lean();

  const hasMore = docs.length > limit;
  const posts = hasMore ? docs.slice(0, limit) : docs;
  return res.status(200).json({ posts, page, limit, hasMore });
}

export async function getPost(req: Request, res: Response) {
  const post = await ForumPost.findById(req.params.id).populate("author", "name email role").lean();
  if (!post) return res.status(404).json({ message: "Not found" });
  return res.status(200).json({ post });
}

export async function deletePost(req: Request, res: Response) {
  const deleted = await ForumPost.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return res.status(404).json({ message: "Not found" });
  return res.status(200).json({ message: "Deleted" });
}

export async function searchPosts(req: Request, res: Response) {
  const q = String(req.query.q ?? "").trim();
  if (!q) return res.status(400).json({ message: "q is required" });
  const limit = Math.min(Number(req.query.limit ?? 10), 50);
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const offset = (page - 1) * limit;

  const result = await searchForumPosts(q, limit, offset);
  const hasMore = result.posts.length > limit;
  const posts = hasMore ? result.posts.slice(0, limit) : result.posts;
  return res.status(200).json({ provider: result.provider, posts, page, limit, hasMore });
}

