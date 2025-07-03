import { streamText } from 'ai';
import { SYSTEM_PROMPT } from './prompt';
import { getContact } from './tools/getContact';
import { getCrazy } from './tools/getCrazy';
import { getInternship } from './tools/getIntership';
import { getPresentation } from './tools/getPresentation';
import { getProjects } from './tools/getProjects';
import { getResume } from './tools/getResume';
import { getSkills } from './tools/getSkills';
import { getSports } from './tools/getSport';

// Import different AI providers
import { openai } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 30;

function errorHandler(error: unknown) {
  if (error == null) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
}

// Initialize AI providers
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const huggingface = createOpenAI({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  baseURL: 'https://api-inference.huggingface.co/v1/',
});

const together = createOpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: 'https://api.together.xyz/v1',
});

// Function to get the best available model
function getAvailableModel() {
  // Priority order: Groq (fastest free) -> Hugging Face -> Together -> OpenAI (fallback)
  if (process.env.GROQ_API_KEY) {
    return groq('llama-3.3-70b-versatile'); // Fast and free
  }
  
  if (process.env.HUGGINGFACE_API_KEY) {
    return huggingface('microsoft/DialoGPT-medium'); // Free tier available
  }
  
  if (process.env.TOGETHER_API_KEY) {
    return together('meta-llama/Llama-2-7b-chat-hf'); // Free tier available
  }
  
  // Fallback to OpenAI if no other keys are available
  if (process.env.OPENAI_API_KEY) {
    return openai('gpt-4o-mini');
  }
  
  throw new Error('No AI API key configured. Please add GROQ_API_KEY, HUGGINGFACE_API_KEY, TOGETHER_API_KEY, or OPENAI_API_KEY to your .env.local file.');
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('[CHAT-API] Incoming messages:', messages);

    messages.unshift(SYSTEM_PROMPT);

    const tools = {
      getProjects,
      getPresentation,
      getResume,
      getContact,
      getSkills,
      getSports,
      getCrazy,
      getInternship,
    };

    const model = getAvailableModel();

    const result = streamText({
      model,
      messages,
      toolCallStreaming: true,
      tools,
      maxSteps: 2,
    });

    return result.toDataStreamResponse({
      getErrorMessage: errorHandler,
    });
  } catch (err) {
    console.error('Global error:', err);
    const errorMessage = errorHandler(err);
    return new Response(errorMessage, { status: 500 });
  }
}