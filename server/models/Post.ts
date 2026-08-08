import mongoose from "mongoose";

const PLATFORMS = [
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
  "facebook_page",
  "linkedin_page",
  "instagram_business",
];

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaUrl: {
      type: String,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
    },

    // Changed from String to Array<String>
    platform: {
      type: [
        {
          type: String,
          enum: PLATFORMS,
        },
      ],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "At least one platform is required.",
      },
    },

    scheduledFor: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "published", "failed", "draft"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model("Post", postSchema);