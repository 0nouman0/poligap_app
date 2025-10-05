import mongoose, { Schema, Document } from "mongoose";
import connection from "@/lib/db";

export interface IUser extends Document {
  email: string;
  name: string;
  userId: mongoose.Types.ObjectId;
  uniqueId: string;
  country: string;
  dob: string;
  mobile: string;
  profileImage: string;
  profileCreatedOn: string;
  banner: {
    image: string | null;
    color: string;
    type: string;
    yOffset: number;
  };
  about: string;
  status: string;
  designation?: string;
  role?: string;
  memberStatus?: string;
  companyName?: string;
  reportingManager?: {
    name: string;
    email: string;
  } | null;
  createdBy?: {
    name: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    uniqueId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    country: {
      type: String,
      required: false,
    },
    dob: {
      type: String,
      required: false,
    },
    mobile: {
      type: String,
      required: false,
    },
    profileImage: {
      type: String,
      required: false,
    },
    profileCreatedOn: {
      type: String,
      required: false,
    },
    about: {
      type: String,
      required: false,
    },
    banner: {
      image: {
        type: String,
        required: false,
      },
      color: {
        type: String,
        required: false,
      },
      type: {
        type: String,
        required: false,
      },
      yOffset: {
        type: Number,
        required: false,
      },
    },
    designation: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      required: false,
    },
    memberStatus: {
      type: String,
      required: false,
    },
    companyName: {
      type: String,
      required: false,
    },
    reportingManager: {
      name: {
        type: String,
        required: false,
      },
      email: {
        type: String,
        required: false,
      },
    },
    createdBy: {
      name: {
        type: String,
        required: false,
      },
      email: {
        type: String,
        required: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create model with fallback to default mongoose connection
let UserModel: mongoose.Model<IUser>;

try {
  const mainConnection = connection.main;
  if (mainConnection) {
    // Check if model already exists to avoid OverwriteModelError
    UserModel = mainConnection.models.User || mainConnection.model<IUser>("User", UserSchema);
  } else {
    // Fallback to default mongoose connection
    console.warn('⚠️ Main connection not available, using default mongoose connection');
    UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
  }
} catch (error) {
  console.error('❌ Error creating User model:', error);
  // Create with default connection as fallback, check if exists first
  UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
}

export default UserModel;
