
import { GoogleGenAI } from "@google/genai";
import { ScanItem } from "../types";

export const analyzeLogs = async (logs: ScanItem[]) => {
  if (logs.length === 0) return "No logs to analyze.";
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const logSummary = logs.map(l => `${l.timestamp}: ${l.barcode} (${l.status})`).join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an inventory logistics specialist. Analyze these scan logs for any anomalies, speed bottlenecks, or patterns. Be concise. \n\nLogs:\n${logSummary}`,
      config: {
        systemInstruction: "You provide short, technical inventory insights. Format as a small list of bullet points."
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error generating analysis. Please try again later.";
  }
};
