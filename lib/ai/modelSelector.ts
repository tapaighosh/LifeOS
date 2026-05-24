import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIServiceError } from '@/lib/errors';

type ProviderConfig = 'claude' | 'gemini' | 'claude-dev' | 'gemini-dev';

export async function generateContent(systemPrompt: string, userPrompt: string, temperature: number = 0.3): Promise<string> {
  const provider = (process.env.AI_PROVIDER as ProviderConfig) || 'claude';
  
  try {
    return await tryGenerate(provider, systemPrompt, userPrompt, temperature);
  } catch (error: any) {
    console.error(`[AI] Primary provider ${provider} failed:`, error);
    
    // Fallback logic
    const fallbackProvider = provider.includes('claude') ? 'gemini' : 'claude';
    try {
      console.log(`[AI] Attempting fallback to ${fallbackProvider}`);
      return await tryGenerate(fallbackProvider as ProviderConfig, systemPrompt, userPrompt, temperature);
    } catch (fallbackError: any) {
      console.error(`[AI] Fallback provider ${fallbackProvider} also failed:`, fallbackError);
      throw new AIServiceError('All AI providers failed', 'all', true);
    }
  }
}

async function tryGenerate(provider: ProviderConfig, systemPrompt: string, userPrompt: string, temperature: number): Promise<string> {
  if (provider.includes('claude')) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = provider === 'claude-dev' ? 'claude-3-haiku-20240307' : 'claude-3-5-sonnet-20241022';
    
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 2000,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    
    return msg.content.map(c => ('text' in c ? c.text : '')).join('');
  } else {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const modelName = provider === 'gemini-dev' ? 'gemini-1.5-flash' : 'gemini-2.0-flash'; // Or 2.5 flash
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemPrompt 
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature }
    });
    
    return result.response.text();
  }
}
