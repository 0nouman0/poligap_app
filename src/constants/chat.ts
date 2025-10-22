// AI Models supported via Portkey routing
// These models are routed through different providers (OpenAI, Groq, AWS Bedrock, OpenRouter)
export const LlmsList = [
  // OpenAI Models
  {
    modelName: "GPT-4o",
    modelId: "gpt-4o",
    shortName: "GPT-4o",
    modelIcon: "/assets/icons/model-icons/openai.svg",
    provider: "openai",
  },
  {
    modelName: "GPT-4o Mini",
    modelId: "gpt-4o-mini",
    shortName: "GPT-4o Mini",
    modelIcon: "/assets/icons/model-icons/openai.svg",
    provider: "openai",
  },
  // Groq Models (Fast inference)
  {
    modelName: "Llama 3.3 70B",
    modelId: "llama-3.3-70b-versatile",
    shortName: "Llama 3.3",
    modelIcon: "/assets/icons/model-icons/groq.svg",
    provider: "groq",
  },
  // AWS Bedrock Models
  {
    modelName: "Claude 3.5 Sonnet",
    modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    shortName: "Claude 3.5",
    modelIcon: "/assets/icons/model-icons/claude.svg",
    provider: "aws",
  },
  // OpenRouter Models
  {
    modelName: "Claude 3.5 Sonnet (OR)",
    modelId: "anthropic/claude-3.5-sonnet",
    shortName: "Claude 3.5 OR",
    modelIcon: "/assets/icons/model-icons/claude.svg",
    provider: "openrouter",
  },
  // Auto-routing option (let Portkey decide)
  {
    modelName: "Auto (Portkey)",
    modelId: "auto",
    shortName: "Auto",
    modelIcon: "/assets/icons/model-icons/portkey.svg",
    provider: "auto",
  },
];

export const LanguagesList = [
  { code: "ar", name: "Arabic" },
  { code: "as", name: "Assamese" },
  { code: "bn", name: "Bengali" },
  { code: "ceb", name: "Cebuano" },
  { code: "zh", name: "Chinese" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "gu", name: "Gujarati" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hu", name: "Hungarian" },
  { code: "id", name: "Indonesian" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "kn", name: "Kannada" },
  { code: "ko", name: "Korean" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mr", name: "Marathi" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "or", name: "Odia" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "pa", name: "Punjabi" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sa", name: "Sanskrit" },
  { code: "es", name: "Spanish" },
  { code: "sv", name: "Swedish" },
  { code: "tl", name: "Tagalog" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "vi", name: "Vietnamese" },
];

export const GLOBAL_AGENT_META_DATA = {
  agentName: "Global Chat",
  agnoId: "Global_chat",
  description:
    "Try Kroolo's global chat to ask any specific question or search for anything.",
  agentAvatar: "/assets/icons/ChatWithProjectAI.svg",
  referenceName: "Global Chat",
};
