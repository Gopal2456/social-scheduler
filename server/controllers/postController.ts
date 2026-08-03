import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { GoogleGenAI, Modality } from "@google/genai";
import { cloudinary } from "../config/cloudniary.js";
import axios from "axios";
import { Generation } from "../models/Generation.js";
import { Post } from "../models/Post.js";

// Helper to poll ai
const pollAI = async (response: any, maxRetries: number = 5) => {
  let retries = 0;
  while (retries < maxRetries) {
    if (response.text) {
      return response;
    }
    retries++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Failed to poll AI");
};

const uploadBase64ToCloudinary = async (base64Data: string) => {
  const result = await cloudinary.uploader.upload(
    `data:image/png;base64,${base64Data}`,
    {
      folder: "social-scheduler/posts",
      resource_type: "image",
    },
  );

  return result.secure_url;
};

// Generate Post
// Post /api/posts/generate
export const generatePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
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
      model: "gemini-2.5-flash",
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
    // const textResponse = await ai.models.generateContent({
    //   model: "gemini-2.5-flash",
    //   contents: `Generate a social media post based on the following prompt: "${prompt}". The tone of the post should be "${tone}".
    //   Include relevant hashtags and emojis. The post should be concise, engaging, and suitable for social media platforms.`,
    // });

    let content = "";
    let imagePrompt = prompt;

    try {
      const data = JSON.parse(textResponse.text || "{}");

      content = data.content;
      imagePrompt = data.imagePrompt;
    } catch {
      content = textResponse.text || "";
    }

    // try {
    //   const rawText = textResponse.text || "";
    //   const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    //   const data = jsonMatch
    //     ? JSON.parse(jsonMatch[0])
    //     : { content: rawText, imagePrompt: prompt };
    //   content = data.content || rawText;
    //   imagePrompt = data.imagePrompt;
    // } catch (e) {
    //   content = textResponse.text || "";
    // }

    let mediaUrl = "";

    if (generateImage) {
      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: imagePrompt,
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData,
      );

      if (imagePart?.inlineData?.data) {
        mediaUrl = await uploadBase64ToCloudinary(imagePart.inlineData.data);
      }

      // if (imagePart?.inlineData?.data) {
      //   mediaUrl = `data:image/png;base64,${imagePart.inlineData.data}`;
      // }
    }

    // let mediaUrl = "";
    // if (generateImage) {
    //   try {
    //     const leonardoKey = process.env.LEONARDO_API_KEY;
    //     if (!leonardoKey) {
    //       const leoResponse = await axios.post("");
    //     }
    //   } catch (e) {}
    // }
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

    res.json(generation)

  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

// Get Posts
// GET /api/posts/generate
export const getGenerations = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const generations = await Generation.find({ user: req.user?._id }).sort({
      createdAt: -1,
    });
    res.json(generations);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

// Get posts
// GET /api/posts
export const getPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const posts = await Post.find({ user: req.user?._id });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

// Schedule Post
// POST /api/posts/
export const schedulePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { content, status, platform, scheduledFor } = req.body;

    let parsedPlatform = platform;

    if (typeof platform === "string") {
      try {
        parsedPlatform = JSON.parse(platform);
      } catch {
        parsedPlatform = platform.split(",");
      }
    }

    let mediaUrl: string | undefined = req.body.mediaUrl;
    let mediaType: "image" | "video" | undefined = req.body.mediaType;

    if (req.file) {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "social-scheduler/posts",
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        stream.end(req.file!.buffer);
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

    res.status(201).json(post);
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || "Server error",
    });
  }
};
