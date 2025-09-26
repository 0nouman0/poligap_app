import mongoose, { Schema, Document } from "mongoose";
import connection from "@/lib/db";

export interface IDocumentAnalysis extends Document {
  userId: mongoose.Types.ObjectId | string;
  companyId: mongoose.Types.ObjectId | string;
  documentId: string;
  title?: string;
  complianceStandard?: string; // e.g., ISO27001, SOC2
  score?: number; // 0-100
  metrics?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentAnalysisSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Users" },
    companyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Company" },
    documentId: { type: String, required: true },
    title: { type: String },
    complianceStandard: { type: String },
    score: { type: Number, min: 0, max: 100 },
    metrics: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const DocumentAnalysisModel =
  connection.enterprise.models.DocumentAnalysis ||
  connection.enterprise.model<IDocumentAnalysis>(
    "DocumentAnalysis",
    DocumentAnalysisSchema
  );

export default DocumentAnalysisModel;
