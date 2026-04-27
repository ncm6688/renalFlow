import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { createPost, deletePost, getPost, listPosts, searchPosts } from "../controllers/forum.controller";
import { createComment, deleteComment, listCommentsByPost } from "../controllers/forumComment.controller";

const router = Router();

router.get("/", listPosts);
router.get("/search", searchPosts);
router.get("/:id", getPost);
router.get("/:id/comments", listCommentsByPost);

router.post("/", requireAuth, createPost);
router.post("/:id/comments", requireAuth, createComment);
router.delete("/:id", requireAuth, requireRole("admin"), deletePost);
router.delete("/:id/comments/:commentId", requireAuth, requireRole("admin"), deleteComment);

export default router;

