export interface VoiceOption {
  id: string;
  name: string;
  description?: string;
  isCustom?: boolean;
}

export interface VoiceGroup {
  groupName: string;
  voices: VoiceOption[];
}

export const BUILTIN_VOICES: readonly VoiceOption[] = [
  {
    id: "neutral",
    name: "Neutral professional",
    description: "Clear, balanced and objective prose.",
  },
  {
    id: "conversational",
    name: "Conversational",
    description: "Warm, direct and natural tone.",
  },
] as const;

export const INITIAL_VOICE_GROUPS: readonly VoiceGroup[] = [
  {
    groupName: "Default voices",
    voices: [...BUILTIN_VOICES],
  },
  // Phase 4 will inject "Your voices" group here
] as const;
