// import { Request, Response } from "express";
// import { AuthRequest } from "../middlewares/authMiddleware.js";
// import { GoogleGenAI, Modality } from "@google/genai";
// import { cloudinary } from "../config/cloudniary.js";
// import { Generation } from "../models/Generation.js";
// import { Post } from "../models/Post.js";
import { GoogleGenAI } from "@google/genai";
import { cloudinary } from "../config/cloudniary.js";
import { Generation } from "../models/Generation.js";
import { Post } from "../models/Post.js";
import { generatePollinationsImage } from "../services/pollinationsService.js";
const uploadBase64ToCloudinary = async (base64Data) => {
    const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64Data}`, {
        folder: "social-scheduler/posts",
        resource_type: "image",
    });
    return result.secure_url;
};
// Generate Post
// POST /api/posts/generate
// export const generatePost = async (
//   req: AuthRequest,
//   res: Response,
// ): Promise<void> => {
//   try {
//     const { prompt, tone, generateImage } = req.body;
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) {
//       res.status(400).json({
//         message: "GEMINI_API_KEY is not set in environment variables",
//       });
//       return;
//     }
//     const ai = new GoogleGenAI({
//       apiKey,
//     });
//     // -----------------------------------------
//     // 1. Generate social media content
//     // -----------------------------------------
//     const textResponse = await ai.models.generateContent({
//       model: "gemini-3.6-flash",
//       contents: `
//         Return ONLY valid JSON.
//         {
//           "content": "",
//           "imagePrompt": ""
//         }
//         Create a social media post.
//         Topic: ${prompt}
//         Tone: ${tone}
//         Requirements:
//         - The content should include relevant hashtags and emojis.
//         - Keep the content engaging and suitable for social media.
//         - imagePrompt should describe a realistic, visually appealing image
//           related to the post.
//         `,
//     });
//     let content = "";
//     let imagePrompt = prompt;
//     try {
//       const data = JSON.parse(textResponse.text || "{}");
//       content = data.content || "";
//       imagePrompt = data.imagePrompt || prompt;
//     } catch {
//       content = textResponse.text || "";
//       imagePrompt = prompt;
//     }
//     // -----------------------------------------
//     // 2. Generate image using Gemini
//     // -----------------------------------------
//     let mediaUrl = "";
//     if (generateImage) {
//       console.log("Generating image with Gemini...");
//       console.log("Image prompt:", imagePrompt);
//       const interaction = await ai.interactions.create({
//         model: "gemini-3.1-flash-image",
//         input: imagePrompt,
//       });
//       const generatedImage = interaction.output_image;
//       if (generatedImage?.data) {
//         console.log("Gemini image generated successfully");
//         const imageBuffer = Buffer.from(
//           generatedImage.data,
//           "base64",
//         );
//         // Upload generated image to Cloudinary
//         const uploadResult = await new Promise<any>(
//           (resolve, reject) => {
//             const stream = cloudinary.uploader.upload_stream(
//               {
//                 folder: "social-scheduler/posts",
//                 resource_type: "image",
//               },
//               (error, result) => {
//                 if (error) {
//                   reject(error);
//                 } else {
//                   resolve(result);
//                 }
//               },
//             );
//             stream.end(imageBuffer);
//           },
//         );
//         mediaUrl = uploadResult.secure_url;
//         console.log("Image uploaded to Cloudinary:");
//         console.log(mediaUrl);
//       } else {
//         console.log("Gemini did not return an image");
//       }
//     }
//     // -----------------------------------------
//     // 3. Save generation to MongoDB
//     // -----------------------------------------
//     const generation = await Generation.create({
//       user: req.user?._id,
//       prompt,
//       content,
//       mediaUrl,
//       mediaType: mediaUrl ? "image" : undefined,
//       tone,
//     });
//     // -----------------------------------------
//     // 4. Send ONE response
//     // -----------------------------------------
//     res.status(200).json({
//       success: true,
//       content,
//       mediaUrl,
//       generation,
//     });
//   } catch (error: any) {
//     console.error("Generate post error:", error);
//     res.status(500).json({
//       success: false,
//       message: error?.message || "Server error",
//       name: error?.name,
//     });
//   }
// };
export const generatePost = async (req, res) => {
    try {
        const { prompt, tone, generateImage } = req.body;
        // ----------------------------------------
        // Gemini API
        // ----------------------------------------
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(400).json({
                success: false,
                message: "GEMINI_API_KEY is not configured",
            });
            return;
        }
        const ai = new GoogleGenAI({
            apiKey,
        });
        // ----------------------------------------
        // Generate text + image prompt
        // ----------------------------------------
        const textResponse = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `
        Return ONLY valid JSON.

        {
          "content": "",
          "imagePrompt": ""
        }

        Create a social media post.

        Topic: ${prompt}
        Tone: ${tone}

        Requirements:

        - Create engaging social media content.
        - Include relevant hashtags.
        - Include appropriate emojis.
        - imagePrompt should describe a realistic,
          visually appealing image related to the post.
        - Do not include text inside the generated image.
        `,
        });
        let content = "";
        let imagePrompt = prompt;
        try {
            const data = JSON.parse(textResponse.text || "{}");
            content = data.content || "";
            imagePrompt = data.imagePrompt || prompt;
        }
        catch {
            content = textResponse.text || "";
            imagePrompt = prompt;
        }
        // ----------------------------------------
        // Generate image
        // ----------------------------------------
        let mediaUrl = "";
        if (generateImage) {
            console.log("Generating image with Pollinations...");
            console.log("Image prompt:", imagePrompt);
            const imageBuffer = await generatePollinationsImage(imagePrompt);
            console.log("Pollinations image generated");
            // --------------------------------------
            // Upload to Cloudinary
            // --------------------------------------
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({
                    folder: "social-scheduler/posts",
                    resource_type: "image",
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                });
                stream.end(imageBuffer);
            });
            mediaUrl = uploadResult.secure_url;
            console.log("Cloudinary URL:", mediaUrl);
        }
        // ----------------------------------------
        // Save generation
        // ----------------------------------------
        const generation = await Generation.create({
            user: req.user?._id,
            prompt,
            content,
            mediaUrl,
            mediaType: mediaUrl ? "image" : undefined,
            tone,
        });
        // ----------------------------------------
        // Send response
        // ----------------------------------------
        res.status(200).json({
            success: true,
            content,
            mediaUrl,
            generation,
        });
    }
    catch (error) {
        console.error("Generate post error:", error);
        res.status(500).json({
            success: false,
            message: error?.message || "Server error",
            name: error?.name,
        });
    }
};
// Get Generations
// GET /api/posts/generate
export const getGenerations = async (req, res) => {
    try {
        const generations = await Generation.find({
            user: req.user?._id,
        }).sort({
            createdAt: -1,
        });
        res.json(generations);
    }
    catch (error) {
        res.status(500).json({
            message: error?.message || "Server error",
        });
    }
};
// Get Posts
// GET /api/posts
export const getPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            user: req.user?._id,
        });
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({
            message: error?.message || "Server error",
        });
    }
};
// Schedule Post
// POST /api/posts/schedule
export const schedulePost = async (req, res) => {
    try {
        console.log("========== SCHEDULE POST START ==========");
        console.log("Request body:", req.body);
        console.log("User:", req.user?._id);
        console.log("Has file:", !!req.file);
        const { content, status, platform, scheduledFor } = req.body;
        let parsedPlatform = platform;
        if (typeof platform === "string") {
            try {
                parsedPlatform = JSON.parse(platform);
            }
            catch {
                parsedPlatform = platform.split(",");
            }
        }
        let mediaUrl = req.body.mediaUrl;
        let mediaType = req.body.mediaType;
        // Upload manually selected file
        if (req.file) {
            console.log("Uploading file to Cloudinary...");
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({
                    folder: "social-scheduler/posts",
                    resource_type: "auto",
                }, (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                });
                stream.end(req.file.buffer);
            });
            mediaUrl = result.secure_url;
            mediaType = result.resource_type === "video" ? "video" : "image";
        }
        const post = await Post.create({
            user: req.user?._id,
            content,
            mediaUrl,
            mediaType,
            platform: parsedPlatform,
            scheduledFor,
            status,
        });
        return res.status(201).json(post);
    }
    catch (error) {
        console.error("Schedule post error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message,
            name: error?.name,
            http_code: error?.http_code,
        });
    }
};
