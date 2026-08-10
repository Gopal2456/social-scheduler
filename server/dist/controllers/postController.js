import { GoogleGenAI, Modality } from "@google/genai";
import { cloudinary } from "../config/cloudniary.js";
import { Generation } from "../models/Generation.js";
import { Post } from "../models/Post.js";
const uploadBase64ToCloudinary = async (base64Data) => {
    const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64Data}`, {
        folder: "social-scheduler/posts",
        resource_type: "image",
    });
    return result.secure_url;
};
// Generate Post
// Post /api/posts/generate
export const generatePost = async (req, res) => {
    try {
        const { prompt, tone, generateImage } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.LEONARDO_API_KEY;
        if (!apiKey) {
            res
                .status(400)
                .json({ message: "API key is not set in environment variables" });
            return;
        }
        const ai = new GoogleGenAI({ apiKey });
        // Generate text
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

        The content should include hashtags and emojis.
        The imagePrompt should describe a realistic image for the post.
        `,
        });
        let content = "";
        let imagePrompt = prompt;
        try {
            const data = JSON.parse(textResponse.text || "{}");
            content = data.content;
            imagePrompt = data.imagePrompt;
        }
        catch {
            content = textResponse.text || "";
        }
        let mediaUrl = "";
        if (generateImage) {
            const imageResponse = await ai.models.generateContent({
                model: "gemini-3.1-flash-lite-image",
                contents: imagePrompt,
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
            if (imagePart?.inlineData?.data) {
                mediaUrl = await uploadBase64ToCloudinary(imagePart.inlineData.data);
            }
        }
        res.status(200).json({
            success: true,
            content,
            mediaUrl,
        });
        // Save the generated post to the database (optional)
        const generation = await Generation.create({
            user: req.user?._id,
            prompt,
            content,
            mediaUrl,
            mediaType: mediaUrl ? "image" : undefined,
            tone,
        });
        res.json(generation);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// Get Posts
// GET /api/posts/generate
export const getGenerations = async (req, res) => {
    try {
        const generations = await Generation.find({ user: req.user?._id }).sort({
            createdAt: -1,
        });
        res.json(generations);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// Get posts
// GET /api/posts
export const getPosts = async (req, res) => {
    try {
        const posts = await Post.find({ user: req.user?._id });
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
export const schedulePost = async (req, res) => {
    try {
        console.log("========== SCHEDULE POST START ==========");
        console.log("Request body:", req.body);
        console.log("User:", req.user?._id);
        console.log("Has file:", !!req.file);
        const { content, status, platform, scheduledFor } = req.body;
        let parsedPlatform = platform;
        console.log("Raw platform:", platform);
        if (typeof platform === "string") {
            try {
                parsedPlatform = JSON.parse(platform);
                console.log("Platform parsed as JSON:", parsedPlatform);
            }
            catch {
                parsedPlatform = platform.split(",");
                console.log("Platform parsed by split:", parsedPlatform);
            }
        }
        let mediaUrl = req.body.mediaUrl;
        let mediaType = req.body.mediaType;
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
                        console.log("Cloudinary upload success");
                        resolve(result);
                    }
                });
                stream.end(req.file.buffer);
            });
            mediaUrl = result.secure_url;
            mediaType = result.resource_type === "video" ? "video" : "image";
        }
        console.log("Creating MongoDB post...");
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
        return res.status(500).json({
            success: false,
            message: error?.message,
            name: error?.name,
            http_code: error?.http_code,
        });
    }
};
