/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      console.warn("GEMINI_API_KEY is not defined. AI functions will run in adaptive simulation mode.");
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiInstance;
}

/**
 * AI Tutor chat completion.
 */
export async function getAITutorResponse(
  lessonContent: string, 
  lessonTitle: string, 
  userMessage: string, 
  history: { role: "user" | "model"; text: string }[]
): Promise<string> {
  const ai = getAI();
  if (!ai) {
    // Elegant fallback simulation
    return `[Local AI Simulation Mode] This is a context-rich helpful answer. You asked: "${userMessage}".\n\nBased on the lesson "${lessonTitle}", here is a detailed breakdown: Machine Learning models function through optimization algorithms such as gradient descent to reduce the Loss function. Linear regression seeks the coefficients that minimize the Sum of Squared Errors. Feel free to ask more specific questions or configure a real Gemini API key in the Secrets menu to see live dynamic AI replies!`;
  }

  try {
    const formattedHistory = history.map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    const systemInstruction = `You are a helpful, expert AI tutor in an Educational LMS.
The current lesson is titled: "${lessonTitle}".
Here is the lesson content for context:
---
${lessonContent}
---
Answer the student's questions accurately, politely, and constructively, focusing on the provided context. Use formatted Markdown with bold key terms, simple code snippets if relevant, and clear structures.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "I was unable to formulate a response. Please try again.";
  } catch (error: any) {
    console.error("Error in AI Tutor SDK call:", error);
    return `Error from AI Tutor: ${error.message || "An unexpected error occurred while communicating with Gemini."}`;
  }
}

/**
 * AI Quiz generator.
 */
export async function generateAIQuiz(lessonTitle: string, lessonContent: string): Promise<any[]> {
  const ai = getAI();
  if (!ai) {
    // Beautiful default fallback questions
    return [
      {
        id: "gen-q-1",
        text: `Based on "${lessonTitle}", what is the primary optimization technique used to converge weights?`,
        type: "multiple-choice",
        options: ["Gradient Descent", "Random Weight Inversion", "Dijkstra Algorithm", "Recursion Tree"],
        correctAnswer: "Gradient Descent"
      },
      {
        id: "gen-q-2",
        text: "True or False: Deep Learning neural networks bypass the need for any loss function evaluation.",
        type: "true-false",
        options: ["True", "False"],
        correctAnswer: "False"
      },
      {
        id: "gen-q-3",
        text: "Fill in the blank: The goal of Machine Learning is to generalize patterns from ______ data.",
        type: "fill-blank",
        options: [],
        correctAnswer: "training"
      }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a 3-question comprehension check quiz based on the lesson "${lessonTitle}". Lesson content: "${lessonContent}"`,
      config: {
        systemInstruction: "You are an AI Quiz Generator for an LMS. Produce exactly 3 highly relevant questions: one multiple-choice, one true-false, and one fill-in-the-blank. Return the result in structured JSON adhering to the specified schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The quiz question text." },
              type: { type: Type.STRING, enum: ["multiple-choice", "true-false", "fill-blank"] },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Array of 4 options for multiple-choice, ['True', 'False'] for true-false, or empty for fill-blank." 
              },
              correctAnswer: { type: Type.STRING, description: "The exact matching correct answer. For fill-blank, keep it short (1-2 words, lowercase)." }
            },
            required: ["text", "type", "options", "correctAnswer"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    const parsed = JSON.parse(jsonText.trim());
    return parsed.map((q: any, idx: number) => ({
      id: `gen-q-${idx}-${Date.now()}`,
      ...q
    }));
  } catch (error) {
    console.error("Error in AI Quiz Generator:", error);
    // Return high-quality local fallback on error rather than breaking
    return [
      {
        id: "fallback-q-1",
        text: `What is the main objective discussed in the lesson "${lessonTitle}"?`,
        type: "multiple-choice",
        options: ["Generalization and model fit", "Infinite database recursion", "Graphic layout design", "Hardware manufacturing"],
        correctAnswer: "Generalization and model fit"
      }
    ];
  }
}

/**
 * AI Course recommendation.
 */
export async function getAICourseRecommendation(
  userProfile: { name: string; enrolledCourses: string[]; completedCourses: string[] },
  availableCourses: { id: string; title: string; category: string; description: string }[],
  userInterests: string
): Promise<{ recommendationText: string; recommendedCourseIds: string[] }> {
  const ai = getAI();
  const availableStr = availableCourses.map(c => `ID: ${c.id}, Title: ${c.title}, Category: ${c.category}, Description: ${c.description}`).join("\n");

  if (!ai) {
    // Return high-quality static recommendations
    const matchingIds = availableCourses
      .filter(c => c.category.toLowerCase().includes(userInterests.toLowerCase()) || userInterests.toLowerCase().includes(c.category.toLowerCase()))
      .map(c => c.id);
    
    const fallbackId = matchingIds.length > 0 ? matchingIds[0] : (availableCourses[0]?.id || "");
    return {
      recommendationText: `Based on your profile (Active: ${userProfile.enrolledCourses.join(", ") || "None"}) and your expressed interest in "${userInterests}", I highly recommend that you explore **${availableCourses.find(c => c.id === fallbackId)?.title || "our courses"}**. This syllabus aligns with your career objectives by introducing foundational architectures and hands-on laboratory exercises.`,
      recommendedCourseIds: [fallbackId]
    };
  }

  try {
    const prompt = `Student Name: ${userProfile.name}
Enrolled Courses: ${userProfile.enrolledCourses.join(", ") || "None"}
Completed Courses: ${userProfile.completedCourses.join(", ") || "None"}
Expressed Interests/Goals: "${userInterests}"

Available Course Catalog:
${availableStr}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an AI Education Advisor. Based on the student's current portfolio and interests, write a brief, encouraging recommendation paragraph (max 3 sentences) in Markdown explaining why your recommended courses fit them. Return your response in JSON format matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendationText: { type: Type.STRING, description: "A detailed but concise student recommendation in Markdown." },
            recommendedCourseIds: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Array of matching course IDs recommended from the catalog (max 2)."
            }
          },
          required: ["recommendationText", "recommendedCourseIds"]
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error("Error in AI Course Recommendation:", error);
    return {
      recommendationText: "I was unable to consult the AI advisor model at this moment. However, we suggest exploring courses in **Artificial Intelligence** or **Web Development** depending on your career milestones.",
      recommendedCourseIds: [availableCourses[0]?.id || ""]
    };
  }
}
