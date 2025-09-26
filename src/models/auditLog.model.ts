import mongoose, { Schema, Document } from "mongoose";
import connection from "@/lib/db";

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId | string;
  companyId: mongoose.Types.ObjectId | string;
  action: string; // e.g., "search_performed", "document_analyzed"
  entityType?: string; // e.g., "document", "compliance", "search"
  entityId?: string; // arbitrary id
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Company",
    },
    action: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

const AuditLogModel =
  connection.enterprise.models.AuditLog ||
  connection.enterprise.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLogModel;
