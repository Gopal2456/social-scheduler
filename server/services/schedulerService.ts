import cron from "node-cron";
import { Post } from "../models/Post.js";
import { Account } from "../models/Accounts.js";
import zernio from "../config/zernio.js";
import { ActivityLog } from "../models/ActivityLog.js";

export const initScheduler = () => {
  // Schedule a task to run every minutes
  cron.schedule("* * * * *", async () => {
    console.log("Running scheduled task every minutes");
    try {
      const now = new Date();
      const postsToPublish = await Post.find({
        scheduledTime: { $lte: now },
        status: "scheduled",
        scheduledFor: { $lte: now },
      });

      for (const post of postsToPublish) {
        try {
          const platforms = Array.isArray(post.platform)
            ? post.platform
            : [post.platform];

          const accounts = await Account.find({
            user: post.user,
            platform: { $in: platforms },
            status: "connected",
            zernioAccountId: { $exists: true },
          });

          if (accounts.length === 0) {
            console.warn(
              `No connected zernio accounts found for post ${post._id}`,
            );
            continue;
          }

          const zernioPlatforms = accounts.map((acc) => ({
            tform: acc.platform as any,
            accountId: acc.zernioAccountId,
          }));

          const payload = {
            content: post.content,
            publishNow: true,
            ...(post.mediaUrl
              ? {
                  mediaItems: [
                    { type: post.mediaType || "image", url: post.mediaUrl },
                  ],
                }
              : {}),
            platforms: zernioPlatforms,
          };

          console.log(
            `Publishing post ${post._id} to Zernio with payload: ${post.mediaUrl ? "media included" : "no media"}`,
          );

          const response = await zernio.posts.createPost({
            body: payload,
          });
          const publishedPost = (response.data as any)?.post || response.data;

          if (!publishedPost) {
            throw new Error(`Failed to publish post ${post._id}`);
          }

          console.log(
            `Post ${post._id} published successfully with Zernio post ID: ${publishedPost._id || publishedPost.id}`,
          );
          post.status = "published";
          await post.save();

          await ActivityLog.create({
            user: post.user,
            actionType: "POST_PUBLISHED",
            description: `Post published to ${accounts.map((a) => a.platform).join(", ")}`,
            relatedPost: post._id,
          });
        } catch (error: any) {
          console.error(
            `Failed to publish post ${post._id}:`,
            error?.response?.data || error.message,
          );
          post.status = "failed";
          await post.save();
        }
      }
      if (postsToPublish.length > 0) {
        console.log(
          `Processed ${postsToPublish.length} posts at ${now.toISOString()}.`,
        );
      }
    } catch (error: any) {
      console.error("Error in scheduled task:", error);
    }
  });
  console.log("Scheduler initialized and running every minute.");
};
