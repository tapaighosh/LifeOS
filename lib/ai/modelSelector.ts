import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

type AIProvider = 'claude' | 'gemini' | 'rule-based';

export async function selectModel(): Promise<AIProvider> {
  const provider = process.env.AI_PROVIDER as AIProvider || 'claude';
  return provider;
}

export async function generateAIPlan(context: any, provider: AIProvider) {
  if (provider === 'claude') {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('No Anthropic API key, falling back to rule-based');
      return null;
    }
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    // In a real implementation, we would pass the prompt here
    // For this boilerplate, we'll just mock a failure so it falls back to rule-based
    // or simulate a simple response
    try {
      /*
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.3,
        system: "You are a personal scheduling assistant returning valid JSON.",
        messages: [{ role: 'user', content: JSON.stringify(context) }]
      });
      return JSON.parse(response.content[0].text);
      */
      return null; // Force fallback to rule-based for testing, adjust as needed.
    } catch (e) {
      console.error('Claude API Error', e);
      return null;
    }
  } else if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('No Gemini API key, falling back to rule-based');
      return null;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
      // Same mock failure
      return null;
    } catch(e) {
      console.error('Gemini API Error', e);
      return null;
    }
  }
  
  return null;
}
