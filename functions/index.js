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
