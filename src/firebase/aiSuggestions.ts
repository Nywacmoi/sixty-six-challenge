import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config';

const functions = getFunctions(app, 'europe-west1');

// Both mirror generateJournalPrompt's contract from journal.ts: an empty
// result ("" / []) means the Cloud Function gave up (API error, malformed
// response) — the caller is expected to fall back to its own static pool
// rather than treat that as an exception.
export async function generateMealIdea(args: { mealType: string; diet: string }): Promise<string> {
  const call = httpsCallable<{ mealType: string; diet: string }, { idea: string }>(functions, 'generateMealIdea');
  const result = await call(args);
  return result.data.idea;
}

export type AiExercise = { name: string; reps: string };

export async function generateWorkoutSession(args: { splitLabel: string; goal?: string; level?: string }): Promise<AiExercise[]> {
  const call = httpsCallable<typeof args, { exercises: AiExercise[] }>(functions, 'generateWorkoutSession');
  const result = await call(args);
  return Array.isArray(result.data.exercises) ? result.data.exercises : [];
}

export type AiJawlineExercise = { name: string; reps: string; tip: string };

export async function generateJawlineRoutine(args: { sessionLabel: string }): Promise<AiJawlineExercise[]> {
  const call = httpsCallable<typeof args, { exercises: AiJawlineExercise[] }>(functions, 'generateJawlineRoutine');
  const result = await call(args);
  return Array.isArray(result.data.exercises) ? result.data.exercises : [];
}

export async function analyzeProgressPhoto(args: {
  imageBase64: string;
  mimeType: string;
  goal?: string;
  level?: string;
}): Promise<string> {
  const call = httpsCallable<typeof args, { advice: string }>(functions, 'analyzeProgressPhoto');
  const result = await call(args);
  return result.data.advice;
}

export type JawlinePhotoResult = { score: number | null; advice: string };

export async function analyzeJawlinePhoto(args: { imageBase64: string; mimeType: string }): Promise<JawlinePhotoResult> {
  const call = httpsCallable<typeof args, JawlinePhotoResult>(functions, 'analyzeJawlinePhoto');
  const result = await call(args);
  return { score: result.data.score ?? null, advice: result.data.advice ?? '' };
}
