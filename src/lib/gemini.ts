import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY as string);

export const analyzeInstagramShare = async (sharedText: string, imageUrl: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
      You are an AI assistant for a premium fashion marketplace called FLAUNT.
      Analyze the following Instagram caption and extract product details.
      
      Caption: "${sharedText}"
      Image URL: ${imageUrl}
      
      Return a JSON object strictly matching this structure:
      {
        "title": "Short catchy title",
        "price": number (extract or estimate based on typical Indian market if missing, but set to null if completely unsure),
        "description": "Cleaned up description without excessive hashtags",
        "sizes": ["S", "M"] (array of strings, extract if mentioned),
        "category": "string" (e.g., dress, top, bottom, etc.)
      }
      Do not include any other text, only the raw JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up possible markdown code blocks
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Gemini AI error:', error);
    return null;
  }
};
