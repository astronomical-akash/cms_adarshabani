import { GoogleGenAI, Type } from "@google/genai";
import { BloomsLevel } from '../types';

// Declare process to satisfy TypeScript compiler since it's injected by Vite during build
declare var process: {
  env: {
    API_KEY: string;
  };
};

// Initialize Gemini API client
// The API key is injected at build time by Vite
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Analyze a text description (and optional image) to suggest classification
export const analyzeContentForClassification = async (
  filename: string,
  description: string,
  base64Image?: string,
  mimeType?: string
) => {
  const model = "gemini-2.5-flash";

  const prompt = `
    You are an educational content specialist for the "Adarshabani" institute.
    Analyze the following content metadata to classify it into the institute's hierarchy.
    
    File Name: ${filename}
    Description: ${description}
    
    The output should suggest:
    1. A likely Subject (e.g., Mathematics, Science, English)
    2. A likely Chapter
    3. A likely Topic (a subdivision of a chapter)
    4. A likely Subtopic (a specific concept within the topic)
    5. The most appropriate Level based on the complexity implied:
       - "Level 0 (Readiness)": For prerequisites, basic definitions, or readiness material.
       - "Level 1 (Remember & Understand)": For material focusing on recall, explaining ideas, or basic comprehension.
       - "Level 2 (Apply & Analyze)": For material focusing on application, derivation, analysis, or complex problem solving.
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (base64Image && mimeType) {
    parts.push({
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            chapter: { type: Type.STRING },
            topic: { type: Type.STRING },
            subtopic: { type: Type.STRING },
            bloomsLevel: { 
              type: Type.STRING, 
              enum: [
                "Level 0 (Readiness)", 
                "Level 1 (Remember & Understand)", 
                "Level 2 (Apply & Analyze)"
              ] 
            },
            summary: { type: Type.STRING, description: "A brief 1-sentence summary of the content." }
          },
          required: ["subject", "chapter", "topic", "subtopic", "bloomsLevel", "summary"]
        }
      }
    });

    if (!response.text) {
        throw new Error("No response text received from Gemini");
    }

    // Sanitize the output - Gemini might wrap JSON in markdown code blocks
    const cleanText = response.text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini classification failed:", error);
    return null;
  }
};

// Generate a gap analysis report based on matrix data
export const generateGapAnalysis = async (
  subject: string,
  className: string,
  coverageStats: any
) => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    I have a content matrix for ${className} - ${subject}.
    The levels are:
    - Level 0: Readiness
    - Level 1: Remember & Understand
    - Level 2: Derive, Apply & Analyze

    Here is the coverage data (number of materials per level):
    ${JSON.stringify(coverageStats, null, 2)}
    
    Please provide a brief, strategic advice report (3 bullet points) on what materials we are missing and what we should focus on creating next to ensure a balanced curriculum.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Analysis generated but text was empty.";
  } catch (error) {
    console.error("Gemini gap analysis failed:", error);
    return "Could not generate analysis at this time.";
  }
};