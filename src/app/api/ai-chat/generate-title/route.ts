import { createApiResponse } from "@/lib/apiResponse";
import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function agentTitleGenerator(userPrompt: string) {
  try {
    if (!userPrompt) {
      return "New Chat";
    }

    // Use Gemini AI for title generation (more reliable)
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const prompt = `Generate a very short chat title (max 5 words) for this user message: "${userPrompt}". Return only the title, no quotes or extra text.`;
        const result = await model.generateContent(prompt);
        const title = result.response.text().trim();
        
        return title || `Chat: ${userPrompt.split(' ').slice(0, 3).join(' ')}`;
      } catch (geminiError) {
        console.error("Gemini title generation failed:", geminiError);
        // Fall through to simple title
      }
    }

    // Simple fallback title generation
    const words = userPrompt.split(' ').slice(0, 5).join(' ');
    return `Chat: ${words}${words.length > 30 ? '...' : ''}`;
  } catch (error) {
    console.error("Title generation error:", error);
    const words = userPrompt.split(' ').slice(0, 5).join(' ');
    return `Chat: ${words}${words.length > 30 ? '...' : ''}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userPrompt } = await request.json();
    console.log("generate-title userPrompt =>", userPrompt);

    if (!userPrompt) {
      console.error("Missing userPrompt");
      return createApiResponse({
        success: false,
        error: "Missing userPrompt",
        status: 400,
      });
    }

    const agentTitle = await agentTitleGenerator(userPrompt);
    console.log("Generated title:", agentTitle);

    return createApiResponse({
      success: true,
      data: agentTitle,
      status: 200,
    });
  } catch (error) {
    console.error("Error in agentTitleGenerator:", error);
    return createApiResponse({
      success: false,
      error: "Failed to create conversation title",
      status: 422,
    });
  }
}
