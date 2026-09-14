const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const Anthropic = require('@anthropic-ai/sdk');

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');

// Kept short and warm on purpose — a journaling app doesn't need essay
// prompts, just enough of a nudge to get someone writing. If the API call
// fails for any reason, a random static prompt keeps the feature working
// rather than showing an error where a question should be.
const FALLBACK_PROMPTS = [
  "Qu'est-ce qui t'a fait sourire aujourd'hui ?",
  'Quelle petite victoire as-tu eue aujourd\'hui, même minime ?',
  "Qu'est-ce que tu as appris sur toi-même récemment ?",
  "De quoi es-tu reconnaissant·e en ce moment ?",
  "Qu'est-ce qui t'a coûté le plus d'énergie aujourd'hui ?",
  'Si demain se passait parfaitement, à quoi ressemblerait-elle ?',
];

function randomFallback() {
  return FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
}

exports.generateJournalPrompt = onCall(
  { secrets: [anthropicApiKey], region: 'europe-west1', cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Connecte-toi pour obtenir un prompt personnalisé.');
    }

    const streak = typeof request.data?.streak === 'number' ? request.data.streak : undefined;
    const mood = typeof request.data?.mood === 'string' ? request.data.mood.slice(0, 40) : undefined;

    const client = new Anthropic({ apiKey: anthropicApiKey.value() });

    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: [
              "Tu génères UNE seule question de journaling en français, courte (une phrase, 20 mots maximum), chaleureuse et introspective, pour l'app de suivi d'habitudes \"Défi 99\".",
              streak ? `La personne est sur une série de ${streak} jour(s) consécutifs.` : null,
              mood ? `Son humeur aujourd'hui : ${mood}.` : null,
              'Réponds UNIQUEMENT avec la question elle-même, sans guillemets, sans préambule, sans numérotation.',
            ]
              .filter(Boolean)
              .join(' '),
          },
        ],
      });

      const text = message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('')
        .trim();

      return { prompt: text || randomFallback() };
    } catch (error) {
      console.error('generateJournalPrompt failed', error);
      return { prompt: randomFallback() };
    }
  }
);

const DIET_LABELS = { omnivore: 'sans restriction', vegetarien: 'végétarien', vegan: 'vegan' };
const MEAL_TYPE_LABELS = { breakfast: 'petit-déjeuner', lunch: 'déjeuner', dinner: 'dîner', snack: 'collation' };

// Client falls back to its own static pool (data/mealIdeas.ts) if this
// returns an empty idea, so an empty string is a safe "give up" signal —
// no need for the function itself to pick a fallback here.
exports.generateMealIdea = onCall({ secrets: [anthropicApiKey], region: 'europe-west1', cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Connecte-toi pour obtenir une suggestion personnalisée.');
  }

  const mealType = typeof request.data?.mealType === 'string' ? request.data.mealType : 'lunch';
  const diet = typeof request.data?.diet === 'string' ? request.data.diet : 'omnivore';
  const mealLabel = MEAL_TYPE_LABELS[mealType] || 'repas';
  const dietLabel = DIET_LABELS[diet] || 'sans restriction';

  const client = new Anthropic({ apiKey: anthropicApiKey.value() });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [
        {
          role: 'user',
          content: `Propose UNE seule idée de ${mealLabel} en français, régime ${dietLabel}, équilibrée et simple à préparer. Une phrase courte listant le plat et ses composants principaux, sans préambule, sans guillemets, sans numérotation.`,
        },
      ],
    });

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    return { idea: text };
  } catch (error) {
    console.error('generateMealIdea failed', error);
    return { idea: '' };
  }
});

// Same "empty = give up, client falls back to its own static variants"
// contract. Exercises are structured (not free text) since the client
// renders them as a real list with rep counts — a malformed or missing
// JSON array degrades to the client's existing curated split, never to a
// broken screen.
exports.generateWorkoutSession = onCall({ secrets: [anthropicApiKey], region: 'europe-west1', cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Connecte-toi pour obtenir une séance personnalisée.');
  }

  const splitLabel = typeof request.data?.splitLabel === 'string' ? request.data.splitLabel.slice(0, 60) : 'Full Body';
  const goal = typeof request.data?.goal === 'string' ? request.data.goal.slice(0, 40) : undefined;
  const level = typeof request.data?.level === 'string' ? request.data.level.slice(0, 40) : undefined;

  const client = new Anthropic({ apiKey: anthropicApiKey.value() });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            `Génère une séance de musculation en français pour le groupe musculaire "${splitLabel}".`,
            level ? `Niveau : ${level}.` : null,
            goal ? `Objectif : ${goal}.` : null,
            'Réponds UNIQUEMENT avec un tableau JSON de 4 à 5 exercices, sans aucun texte avant ou après, sans balises markdown. Chaque élément au format exact {"name": "Nom de l\'exercice", "reps": "4x10"} — "reps" peut aussi être "3x max" ou une durée comme "20 min" pour du cardio.',
          ]
            .filter(Boolean)
            .join(' '),
        },
      ],
    });

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    let exercises = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        exercises = parsed
          .filter((e) => e && typeof e.name === 'string' && typeof e.reps === 'string')
          .slice(0, 6)
          .map((e) => ({ name: e.name.slice(0, 60), reps: e.reps.slice(0, 20) }));
      }
    } catch (parseError) {
      console.error('generateWorkoutSession: could not parse JSON', text);
    }

    return { exercises };
  } catch (error) {
    console.error('generateWorkoutSession failed', error);
    return { exercises: [] };
  }
});
