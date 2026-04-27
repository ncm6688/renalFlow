import mongoose from "mongoose";

const labResultSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    bloodTest: {
      creatinine: Number,
      urea: Number,
      hemoglobin: Number,
      rbc: Number,
      egfr: Number,
      potassium: Number,
      // ...
    },
    urineTest: {
      protein: String,
      acr: Number,
      ph: Number,
      glucose: String,
      // ...
    },
    vitals: {
      bloodPressureSystolic: Number,
      bloodPressureDiastolic: Number,
      weight: Number,
    }
  });
  
export const LabResult = mongoose.model('LabResult', labResultSchema);
  