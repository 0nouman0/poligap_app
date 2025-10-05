import mongoose, { Schema, Document } from "mongoose";
import connection from "@/lib/db";

export interface IChatMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  messageId: string;
  userQuery: string;
  aiResponse?: string;
  messageType: "user" | "ai";
  toolCalls?: any[];
  extraData?: {
    reasoning_steps?: any[];
    references?: any[];
  };
  images?: string[];
  videos?: string[];
  audio?: any;
  responseAudio?: any;
  streamingError?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "AgentConversation",
    },
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    userQuery: {
      type: String,
      required: true,
    },
    aiResponse: {
      type: String,
      required: false,
    },
    messageType: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    toolCalls: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    extraData: {
      reasoning_steps: [Schema.Types.Mixed],
      references: [Schema.Types.Mixed],
    },
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    audio: {
      type: Schema.Types.Mixed,
      required: false,
    },
    responseAudio: {
      type: Schema.Types.Mixed,
      required: false,
    },
    streamingError: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });

// Create model with fallback to default mongoose connection
let ChatMessageModel: mongoose.Model<IChatMessage>;

try {
  const mainConnection = connection.main;
  if (mainConnection) {
    // Check if model already exists to avoid OverwriteModelError
    ChatMessageModel = mainConnection.models.ChatMessage || 
      mainConnection.model<IChatMessage>("ChatMessage", ChatMessageSchema);
  } else {
    console.warn('⚠️ Main connection not available, using default mongoose connection for ChatMessage');
    ChatMessageModel = mongoose.models.ChatMessage || 
      mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
  }
} catch (error) {
  console.error('❌ Error creating ChatMessage model:', error);
  ChatMessageModel = mongoose.models.ChatMessage || 
    mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
}

export default ChatMessageModel;
