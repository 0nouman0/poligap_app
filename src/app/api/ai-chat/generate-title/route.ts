import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";
import OpenAI from "openai";

/**
 * Generate a conversation title using Portkey + OpenAI
 * Uses gpt-4o-mini for fast, cost-effective title generation
 */
async function agentTitleGenerator(userPrompt: string): Promise<string> {
  if (!userPrompt || userPrompt.trim().length === 0) {
    return "New Chat";
  }

  try {
    // Initialize OpenAI client with Portkey gateway
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://api.portkey.ai/v1",
      defaultHeaders: {
        "x-portkey-api-key": process.env.PORTKEY_API_KEY || "",
        "x-portkey-provider": "openai",
      },
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a title generator. Generate a concise, descriptive title (max 6 words) for chat conversations. Return ONLY the title, nothing else.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 20,
    });

    const generatedTitle = response.choices[0]?.message?.content?.trim();
    
    if (generatedTitle && generatedTitle.length > 0) {
      // Remove quotes if present
      return generatedTitle.replace(/^["']|["']$/g, "");
    }

    throw new Error("Empty title returned from API");
  } catch (error) {
    console.error("Title generation failed:", error);
    throw error; // Re-throw to handle in route handler
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userPrompt } = await request.json();
    console.log("[Title Gen] Input:", userPrompt);

    if (!userPrompt || userPrompt.trim().length === 0) {
      return createApiResponse({
        success: false,
        error: "Missing or empty userPrompt",
        status: 400,
      });
    }

    const agentTitle = await agentTitleGenerator(userPrompt);
    console.log("[Title Gen] Success:", agentTitle);

    return createApiResponse({
      success: true,
      data: agentTitle,
      status: 200,
    });
  } catch (error) {
    console.error("[Title Gen] Error:", error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate title",
      status: 500,
    });
  }
}
