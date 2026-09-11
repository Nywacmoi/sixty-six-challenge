import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config';

const functions = getFunctions(app, 'europe-west1');

// Calls the Cloud Function (functions/index.js) which asks Claude for a
// short, personalized journaling question — falls back to a random static
// prompt itself if the API call fails, so this only throws on things like
// "not signed in", never on the AI call failing.
export async function generateJournalPrompt(args: { streak?: number; mood?: string }): Promise<string> {
  const call = httpsCallable<{ streak?: number; mood?: string }, { prompt: string }>(functions, 'generateJournalPrompt');
  const result = await call(args);
  return result.data.prompt;
}
