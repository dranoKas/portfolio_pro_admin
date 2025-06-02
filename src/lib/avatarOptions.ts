
// src/lib/avatarOptions.ts

// data-ai-hint values are intentionally simple and distinct for better future image suggestions.
export const AVATAR_OPTIONS = [
  { key: 'man_lineart_01', name: 'Homme - Style Linéaire', url: 'https://placehold.co/100x100.png', 'data-ai-hint': 'man lineart' },
  { key: 'man_comic_01', name: 'Homme - Style BD', url: 'https://placehold.co/100x100.png', 'data-ai-hint': 'man comic' },
  { key: 'man_pencilsketch_01', name: 'Homme - Croquis Crayon', url: 'https://placehold.co/100x100.png', 'data-ai-hint': 'man pencilsketch' },
  { key: 'woman_lineart_01', name: 'Femme - Style Linéaire', url: 'https://placehold.co/100x100.png', 'data-ai-hint': 'woman lineart' },
  { key: 'woman_comic_01', name: 'Femme - Style BD', url: 'https://placehold.co/100x100.png', 'data-ai-hint': 'woman comic' },
  { key: 'woman_pencilsketch_01', name: 'Femme - Croquis Crayon', url: 'https://placehold.co/100x100.png', 'data-ai-hint': 'woman pencilsketch' },
  { key: 'person_doodle_01', name: 'Personne - Style Doodle', url: 'https://placehold.co/100x100.png', 'data-ai-hint': 'person doodle' },
  { key: 'person_artistic_01', name: 'Personne - Style Artistique', url: 'https://placehold.co/100x100.png', 'data-ai-hint': 'person artistic' },
] as const;

export type AvatarKey = typeof AVATAR_OPTIONS[number]['key'];

const FALLBACK_AVATAR_URL = "https://placehold.co/100x100.png";
const FALLBACK_AVATAR_HINT = "avatar drawing";

export const getAvatarDetails = (key: AvatarKey | string | undefined | null): { url: string, hint: string, name: string } => {
  if (!key) {
    const fallbackOption = AVATAR_OPTIONS[0] || { url: FALLBACK_AVATAR_URL, 'data-ai-hint': FALLBACK_AVATAR_HINT, name: "Avatar par défaut", key: "default_fallback" };
    return { url: fallbackOption.url, hint: fallbackOption['data-ai-hint'], name: fallbackOption.name };
  }
  const option = AVATAR_OPTIONS.find(opt => opt.key === key);
  if (option) {
    return { url: option.url, hint: option['data-ai-hint'], name: option.name };
  }
  // Fallback if key is somehow invalid, but still use the first option as a default visual
  const fallbackOption = AVATAR_OPTIONS[0] || { url: FALLBACK_AVATAR_URL, 'data-ai-hint': FALLBACK_AVATAR_HINT, name: "Avatar par défaut", key: "default_fallback" };
  return { url: fallbackOption.url, hint: fallbackOption['data-ai-hint'], name: fallbackOption.name };
};

export const getDefaultAvatarKey = (): AvatarKey => {
  return AVATAR_OPTIONS[0]?.key || 'man_lineart_01'; // Ensure a default key exists
}
