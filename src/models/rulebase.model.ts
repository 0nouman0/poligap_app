import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRulebase extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  tags?: string[];
  sourceType: "text" | "file";
  fileName?: string;
  fileContent?: string;
  active: boolean;
  userId?: Types.ObjectId;
  companyId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RulebaseSchema: Schema<IRulebase> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    sourceType: {
      type: String,
      enum: ["text", "file"],
      default: "text",
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileContent: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Add indexes for better query performance
RulebaseSchema.index({ userId: 1, active: 1 });
RulebaseSchema.index({ companyId: 1, active: 1 });
RulebaseSchema.index({ name: "text", description: "text" });

const RulebaseModel = mongoose.models.Rulebase || mongoose.model<IRulebase>("Rulebase", RulebaseSchema);

export default RulebaseModel;
