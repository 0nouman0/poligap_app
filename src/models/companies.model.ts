import mongoose, { Schema, Document } from "mongoose";
import connection from "@/lib/db";

export interface ICompany extends Document {
  name: string;
  companyId: mongoose.Types.ObjectId;
  enableKnowledgeBase: boolean;
  media: [
    {
      type: mongoose.Types.ObjectId;
      ref: "Media";
    }
  ];
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    enableKnowledgeBase: {
      type: Boolean,
      default: false,
    },
    media: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Media",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create model with fallback to default mongoose connection
let CompanyModel: mongoose.Model<ICompany>;

try {
  const mainConnection = connection.main;
  if (mainConnection) {
    CompanyModel = mainConnection.model<ICompany>("Company", CompanySchema);
  } else {
    console.warn('⚠️ Main connection not available, using default mongoose connection for Company');
    CompanyModel = mongoose.model<ICompany>("Company", CompanySchema);
  }
} catch (error) {
  console.error('❌ Error creating Company model:', error);
  CompanyModel = mongoose.model<ICompany>("Company", CompanySchema);
}

export default CompanyModel;
