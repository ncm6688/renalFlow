import { Request, Response } from "express";
import { Types } from "mongoose";
import { LabResult } from "../models/labResult.model";
import User from "../models/user.model";
import { AuthedRequest } from "../middleware/auth";

export async function createLabResult(req: AuthedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const {
    date,
    egfr,
    creatinine,
    urineProtein,
    urineACR,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    potassium,
    weight,
  } = req.body || {};

  // Minimal MVP validation: accept partial but require at least one metric
  const hasAnyMetric =
    egfr !== undefined ||
    creatinine !== undefined ||
    urineProtein !== undefined ||
    urineACR !== undefined ||
    bloodPressureSystolic !== undefined ||
    bloodPressureDiastolic !== undefined ||
    potassium !== undefined ||
    weight !== undefined;
  if (!hasAnyMetric) {
    return res.status(400).json({ message: "Provide at least one metric" });
  }

  const doc = await LabResult.create({
    user: new Types.ObjectId(userId),
    date: date ? new Date(date) : new Date(),
    urineTest: {
      protein: urineProtein !== undefined ? String(urineProtein) : undefined,
      acr: urineACR !== undefined ? Number(urineACR) : undefined,
    },
    bloodTest: {
      creatinine: creatinine !== undefined ? Number(creatinine) : undefined,
      egfr: egfr !== undefined ? Number(egfr) : undefined,
      potassium: potassium !== undefined ? Number(potassium) : undefined,
    },
    vitals: {
      bloodPressureSystolic: bloodPressureSystolic !== undefined ? Number(bloodPressureSystolic) : undefined,
      bloodPressureDiastolic: bloodPressureDiastolic !== undefined ? Number(bloodPressureDiastolic) : undefined,
      weight: weight !== undefined ? Number(weight) : undefined,
    },
  });

  await User.findByIdAndUpdate(userId, { $push: { labResult: doc._id } });

  return res.status(201).json({ labResult: doc });
}

export async function listLabResults(req: AuthedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  const results = await LabResult.find({ user: userId })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return res.status(200).json({ labResults: results });
}

export async function updateLabResult(req: AuthedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const {
    date,
    egfr,
    creatinine,
    urineProtein,
    urineACR,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    potassium,
    weight,
  } = req.body || {};

  const $set: Record<string, any> = {};
  const $unset: Record<string, "" | 1> = {};

  const setOrUnset = (path: string, value: any) => {
    if (value === undefined) return; // not provided
    if (value === null || value === "") $unset[path] = "";
    else $set[path] = value;
  };

  setOrUnset("date", date ? new Date(date) : date);
  setOrUnset("bloodTest.egfr", egfr !== undefined ? Number(egfr) : egfr);
  setOrUnset("bloodTest.creatinine", creatinine !== undefined ? Number(creatinine) : creatinine);
  setOrUnset("bloodTest.potassium", potassium !== undefined ? Number(potassium) : potassium);
  setOrUnset("urineTest.protein", urineProtein !== undefined ? String(urineProtein) : urineProtein);
  setOrUnset("urineTest.acr", urineACR !== undefined ? Number(urineACR) : urineACR);
  setOrUnset(
    "vitals.bloodPressureSystolic",
    bloodPressureSystolic !== undefined ? Number(bloodPressureSystolic) : bloodPressureSystolic
  );
  setOrUnset(
    "vitals.bloodPressureDiastolic",
    bloodPressureDiastolic !== undefined ? Number(bloodPressureDiastolic) : bloodPressureDiastolic
  );
  setOrUnset("vitals.weight", weight !== undefined ? Number(weight) : weight);

  if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  const updated = await LabResult.findOneAndUpdate(
    { _id: id, user: userId },
    { ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}) },
    { new: true }
  ).lean();

  if (!updated) return res.status(404).json({ message: "Not found" });
  return res.status(200).json({ labResult: updated });
}

export async function deleteLabResult(req: AuthedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

  const deleted = await LabResult.findOneAndDelete({ _id: id, user: userId }).lean();
  if (!deleted) return res.status(404).json({ message: "Not found" });

  await User.findByIdAndUpdate(userId, { $pull: { labResult: new Types.ObjectId(id) } });
  return res.status(200).json({ message: "Deleted" });
}

