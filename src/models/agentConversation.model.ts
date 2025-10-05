import mongoose, { Schema, Document } from "mongoose";
import connection from "@/lib/db";

export interface IAgentConversation extends Document {
  chatName: string;
  companyId: mongoose.Types.ObjectId;
  enterpriseUserId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  summary: string;
  status: "active" | "inactive" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const AgentConversationSchema: Schema = new Schema(
  {
    chatName: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    enterpriseUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "AiAgent",
    },
    summary: {
      type: String,
      required: false,
      default: "This is a summary of the conversation",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Create model with fallback to default mongoose connection
let AgentConversationModel: mongoose.Model<IAgentConversation>;

try {
  const mainConnection = connection.main;
  if (mainConnection) {
    // Check if model already exists to avoid OverwriteModelError
    AgentConversationModel = mainConnection.models.AgentConversation || 
      mainConnection.model<IAgentConversation>("AgentConversation", AgentConversationSchema);
  } else {
    // Fallback to default mongoose connection
    console.warn('⚠️ Main connection not available, using default mongoose connection for AgentConversation');
    AgentConversationModel = mongoose.models.AgentConversation || 
      mongoose.model<IAgentConversation>("AgentConversation", AgentConversationSchema);
  }
} catch (error) {
  console.error('❌ Error creating AgentConversation model:', error);
  // Create with default connection as fallback, check if exists first
  AgentConversationModel = mongoose.models.AgentConversation || 
    mongoose.model<IAgentConversation>("AgentConversation", AgentConversationSchema);
}

export default AgentConversationModel;
