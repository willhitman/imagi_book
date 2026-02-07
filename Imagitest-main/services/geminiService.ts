import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Story, StoryPage } from "../types";
import { decodeBase64, decodeAudioData } from "../utils/audioUtils";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStoryStructure = async (title: string): Promise<StoryPage[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a children's story titled "${title}". 
    It should be suitable for ages 5-8. 
    Split the story into exactly 8 pages. 
    Each page should have simple, readable text (2-3 sentences max).
    Provide a detailed image prompt for each page that describes a single, beautiful scene for an animation.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
          },
          required: ["text", "imagePrompt"],
        },
      },
    },
  });

  if (response.text) {
    const pages = JSON.parse(response.text) as StoryPage[];
    return pages.map(p => ({ ...p, isGenerating: false }));
  }
  throw new Error("Failed to generate story structure");
};

export const generateAnimatedIllustration = async (prompt: string): Promise<string> => {
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Children's storybook style, vibrant colors, gentle movement, cinematic lighting: ${prompt}`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '1:1'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");

  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("No audio generated");
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioData = decodeBase64(base64Audio);
  return await decodeAudioData(audioData, audioContext);
};

export const getChatResponse = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
    const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: history,
        config: {
            systemInstruction: "You are a friendly, encouraging Reading Buddy for a child. Keep answers short, simple, and encouraging. Explain difficult words simply."
        }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm not sure what to say!";
}