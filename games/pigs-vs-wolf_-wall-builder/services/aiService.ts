import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const VICTORY_STORIES = [
  "The wall stood tall, strong and stout,\nThe Big Bad Wolf is locked out!",
  "Hooray for the pigs, they are safe inside,\nThe Wolf huffed and puffed, but had to hide!",
  "Bricks and mortar, stacked so high,\nThe Wolf gave up with a heavy sigh.",
  "Safe and sound in their cozy room,\nThe pigs avoided the Wolf's doom!",
  "The wolf blew hard but the wall stayed true,\nThe little pigs are safe, thanks to you!"
];

const DEFEAT_STORIES = [
  "Oh no! The wall came tumbling down,\nThe Wolf is the scariest in town!",
  "The bricks were loose, the wall was thin,\nThe Big Bad Wolf managed to get in!",
  "Run, little pigs, run fast away,\nThe wall didn't save you today!",
  "With a huff and a puff, the wall went crash,\nThe pigs had to make a sudden dash!",
  "The wolf blew once and the wall went splat,\nThe pigs are running in seconds flat!"
];

export const generateEndGameStory = async (didWin: boolean): Promise<string> => {
  const getRandomFallback = () => {
    const stories = didWin ? VICTORY_STORIES : DEFEAT_STORIES;
    return stories[Math.floor(Math.random() * stories.length)];
  };

  if (!apiKey) {
    return getRandomFallback();
  }

  try {
    const prompt = didWin
      ? "Write a short, rhyming, funny victory couplet about 3 little pigs safe behind a strong wall while a wolf fails to blow it down."
      : "Write a short, rhyming, funny defeat couplet about a wolf blowing down a wall and chasing 3 little pigs.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || getRandomFallback();
  } catch (error) {
    console.error("AI Generation failed", error);
    // Gracefully fallback to pre-written stories on error (e.g. 429 Quota Exceeded)
    return getRandomFallback();
  }
};