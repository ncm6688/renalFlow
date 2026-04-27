import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createLabResult, deleteLabResult, listLabResults, updateLabResult } from "../controllers/labResult.controller";

const router = Router();

router.get("/", requireAuth, listLabResults);
router.post("/", requireAuth, createLabResult);
router.put("/:id", requireAuth, updateLabResult);
router.delete("/:id", requireAuth, deleteLabResult);

export default router;

