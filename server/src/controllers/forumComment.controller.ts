import { Request, Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import ForumComment from "../models/forumComment.model";
import ForumPost from "../models/forumPost.model";

export async function listCommentsByPost(req: Request, res: Response) {
  const postId = req.params.id;
  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  const exists = await ForumPost.exists({ _id: postId });
  if (!exists) return res.status(404).json({ message: "Post not found" });

  const comments = await ForumComment.find({ post: postId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate("author", "name email role")
    .lean();

  return res.status(200).json({ comments });
}

export async function createComment(req: AuthedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const postId = req.params.id;
  const { body } = req.body || {};
  if (!body) return res.status(400).json({ message: "body is required" });

  const exists = await ForumPost.exists({ _id: postId });
  if (!exists) return res.status(404).json({ message: "Post not found" });

  const comment = await ForumComment.create({
    post: postId,
    author: userId,
    body: String(body),
  });

  return res.status(201).json({ comment });
}

export async function deleteComment(req: Request, res: Response) {
  const deleted = await ForumComment.findByIdAndDelete(req.params.commentId).lean();
  if (!deleted) return res.status(404).json({ message: "Not found" });
  return res.status(200).json({ message: "Deleted" });
}

