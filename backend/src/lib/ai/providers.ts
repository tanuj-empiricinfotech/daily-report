/**
 * AI Provider Registry
 *
 * Modular architecture for AI providers following the Strategy Pattern.
 * Currently supports OpenAI, designed for easy extension to Anthropic, Google, etc.
 *
 * Usage:
 *   const provider = createAIProvider();
 *   const result = await streamText({ model: provider.getModel(), ... });
 */

import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { AIProviderType } from './types';

// Model tier mapping for semantic model selection
const MODEL_TIERS = {
  openai: {
    fast: 'gpt-4o-mini',
    standard: 'gpt-4o',
    powerful: 'gpt-4o',
  },
  anthropic: {
    fast: 'claude-3-haiku-20240307',
    standard: 'claude-3-5-sonnet-20241022',
    powerful: 'claude-3-opus-20240229',
  },
  google: {
    fast: 'gemini-1.5-flash',
    standard: 'gemini-1.5-pro',
    powerful: 'gemini-1.5-pro',
  },
} as const;

export type ModelTier = 'fast' | 'standard' | 'powerful';

/**
 * Abstract interface for AI providers
 * Allows swapping between different AI services without changing business logic
 */
export interface AIProvider {
  readonly type: AIProviderType;
  getModel(tier?: ModelTier): LanguageModel;
  getModelId(tier?: ModelTier): string;
}

/**
 * OpenAI Provider Implementation
 */
class OpenAIProviderImpl implements AIProvider {
  readonly type: AIProviderType = 'openai';
  private provider: OpenAIProvider;

  constructor(apiKey: string) {
    this.provider = createOpenAI({ apiKey });
  }

  getModel(tier: ModelTier = 'standard'): LanguageModel {
    const modelId = this.getModelId(tier);
    return this.provider(modelId);
  }

  getModelId(tier: ModelTier = 'standard'): string {
    return MODEL_TIERS.openai[tier];
  }
}

// Provider registry for managing multiple providers
const providerRegistry = new Map<AIProviderType, AIProvider>();

/**
 * Get or create an AI provider instance
 * Uses singleton pattern per provider type
 */
function getProvider(type: AIProviderType): AIProvider {
  const existing = providerRegistry.get(type);
  if (existing) {
    return existing;
  }

  let provider: AIProvider;

  switch (type) {
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      provider = new OpenAIProviderImpl(apiKey);
      break;
    }
    case 'anthropic':
      throw new Error('Anthropic provider not yet implemented. Install @ai-sdk/anthropic to add support.');
    case 'google':
      throw new Error('Google provider not yet implemented. Install @ai-sdk/google to add support.');
    default:
      throw new Error(`Unknown AI provider type: ${type}`);
  }

  providerRegistry.set(type, provider);
  return provider;
}

/**
 * Create an AI provider using environment configuration
 * Defaults to OpenAI if no provider type is specified
 */
export function createAIProvider(type?: AIProviderType): AIProvider {
  const providerType = type || (process.env.AI_PROVIDER as AIProviderType) || 'openai';
  return getProvider(providerType);
}

/**
 * Get the default configured model for chat
 * Uses the standard tier by default
 */
export function getDefaultModel(tier: ModelTier = 'standard'): LanguageModel {
  const provider = createAIProvider();
  return provider.getModel(tier);
}

/**
 * Clear the provider registry (useful for testing)
 */
export function clearProviderRegistry(): void {
  providerRegistry.clear();
}
