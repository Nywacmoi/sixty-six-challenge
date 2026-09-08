export type DiscoveryCategory = { id: string; label: string; emoji: string; query: string };

// Category-based finders rather than a hardcoded list of specific titles —
// naming exact podcasts/books risks going stale or being wrong, whereas a
// good search query stays useful indefinitely.
export const PODCAST_CATEGORIES: DiscoveryCategory[] = [
  { id: 'business', label: 'Business & carrière', emoji: 'briefcase', query: 'meilleur podcast business entrepreneuriat' },
  { id: 'culture', label: 'Culture & société', emoji: 'color-palette', query: 'meilleur podcast culture société' },
  { id: 'crime', label: 'Vrai crime & enquête', emoji: 'search', query: 'meilleur podcast true crime enquête' },
  { id: 'comedy', label: 'Humour', emoji: 'happy', query: 'meilleur podcast humour' },
  { id: 'wellbeing', label: 'Bien-être & psycho', emoji: 'leaf', query: 'meilleur podcast développement personnel psychologie' },
  { id: 'history', label: 'Histoire', emoji: 'library', query: 'meilleur podcast histoire' },
];

export const BOOK_CATEGORIES: DiscoveryCategory[] = [
  { id: 'fiction', label: 'Fiction', emoji: 'book', query: 'meilleurs romans à lire en ce moment' },
  { id: 'dev-perso', label: 'Développement personnel', emoji: 'leaf', query: 'meilleurs livres développement personnel' },
  { id: 'business', label: 'Business', emoji: 'briefcase', query: 'meilleurs livres business entrepreneuriat' },
  { id: 'history', label: 'Histoire', emoji: 'library', query: 'meilleurs livres histoire' },
  { id: 'sci-fi', label: 'Science-fiction', emoji: 'rocket', query: 'meilleurs livres science-fiction' },
  { id: 'biography', label: 'Biographies', emoji: 'person', query: 'meilleures biographies à lire' },
];
