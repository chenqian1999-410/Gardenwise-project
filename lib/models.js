export const aiModels = [
  {
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "DeepSeek via OpenRouter",
    bestFor: "Low-cost text proposal generation",
    supportsVision: false
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI via OpenRouter",
    bestFor: "Balanced report writing and multimodal preview",
    supportsVision: true
  },
  {
    id: "google/gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    provider: "Google via OpenRouter",
    bestFor: "Fast multimodal layout reasoning",
    supportsVision: true
  }
];

export const defaultAiModel = "deepseek/deepseek-v4-flash";
export const defaultImageModel = "google/gemini-3.1-flash-image";

export const imageModels = [
  {
    id: "google/gemini-3.1-flash-image",
    name: "Gemini 3.1 Flash Image",
    provider: "Google via OpenRouter",
    bestFor: "Fast photoreal landscape rendering"
  },
  {
    id: "google/gemini-3-pro-image",
    name: "Gemini 3 Pro Image",
    provider: "Google via OpenRouter",
    bestFor: "Higher quality render refinement"
  },
  {
    id: "google/gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    provider: "Google via OpenRouter",
    bestFor: "Lower-cost image generation"
  }
];

export function getAiModel(modelId) {
  return aiModels.find((model) => model.id === modelId) || aiModels[0];
}
