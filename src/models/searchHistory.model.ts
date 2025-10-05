import mongoose, { Schema, Document } from "mongoose";
import connection from "@/lib/db";

export interface ISearchHistory extends Document {
  text: {
    title: string;
    description: string;
    type: string;
  }[];
  enterpriseUserId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SearchHistorySchema: Schema = new Schema(
  {
    text: {
      type: [
        {
          title: { type: String, required: false },
          description: { type: String, required: false },
          type: { type: String, required: false },
        },
      ],
      required: true,
      default: [],
    },
    enterpriseUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Company",
    },
  },
  {
    timestamps: true,
  }
);

// const SearchHistorysModel = connection.enterprise.model<ISearchHistory>(
//   "SearchHistory",
//   SearchHistorySchema
// );

// Create model with fallback to default mongoose connection
let SearchHistorysModel: mongoose.Model<ISearchHistory>;

try {
  const mainConnection = connection.main;
  if (mainConnection) {
    SearchHistorysModel = mainConnection.models.SearchHistory || 
      mainConnection.model<ISearchHistory>("SearchHistory", SearchHistorySchema);
  } else {
    console.warn('⚠️ Main connection not available, using default mongoose connection for SearchHistory');
    SearchHistorysModel = mongoose.models.SearchHistory || 
      mongoose.model<ISearchHistory>("SearchHistory", SearchHistorySchema);
  }
} catch (error) {
  console.error('❌ Error creating SearchHistory model:', error);
  SearchHistorysModel = mongoose.models.SearchHistory || 
    mongoose.model<ISearchHistory>("SearchHistory", SearchHistorySchema);
}

export default SearchHistorysModel;
