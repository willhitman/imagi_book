import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  if (!genAI && process.env.API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const getFairyGodmotherMessage = async (context: 'start' | 'win' | 'lose' | 'midgame'): Promise<string> => {
  const ai = getAI();
  if (!ai) return "Magic is fading... (API Key missing)";

  let prompt = "";
  if (context === 'start') {
    prompt = "You are the Fairy Godmother. Give Cinderella a very short, encouraging one-sentence advice about running fast and avoiding obstacles to get to the chariot before midnight.";
  } else if (context === 'win') {
    prompt = "You are the Fairy Godmother. Congratulate Cinderella for reaching the chariot in time in one short, magical sentence.";
  } else if (context === 'lose') {
    prompt = "You are the Fairy Godmother. Comfort Cinderella for getting caught by the guard, but tell her to try again, in one short sentence.";
  } else if (context === 'midgame') {
    prompt = "You are the Fairy Godmother. Cinderella has been running for 30 seconds. The clock is ticking! Give her a quick, urgent one-sentence encouragement to keep running.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Bibbidi-Bobbidi-Boo!";
  } catch (error) {
    console.error("Fairy Godmother is busy:", error);
    return "Bibbidi-Bobbidi-Boo! (Connection Error)";
  }
};