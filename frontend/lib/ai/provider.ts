// AI Provider Abstraction Layer
// Supports OpenAI, Anthropic (Claude), and Google Gemini

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface AIProvider {
  generateText(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<string>;
  estimateTokens(text: string): number;
}

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = "gpt-4-turbo-preview") {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model;
  }

  async generateText(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: options?.maxTokens || 4000,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 1,
        stop: options?.stopSequences,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

// Anthropic (Claude) Provider
export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = "claude-3-5-sonnet-20241022") {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || "";
    this.model = model;
  }

  async generateText(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    // Separate system messages from other messages
    const systemMessages = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");

    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens || 4000,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 1,
        system: systemMessages || undefined,
        messages: conversationMessages,
        stop_sequences: options?.stopSequences,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Anthropic API error: ${error.error?.message || "Unknown error"}`
      );
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

// Google Gemini Provider
export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = "gemini-2.0-flash-exp") {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || "";
    this.model = model;
  }

  async generateText(
    messages: AIMessage[],
    options?: AIGenerationOptions
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Google API key not configured");
    }

    // Use dynamic import to load the Gemini SDK
    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    // Initialize the Gemini client
    const genAI = new GoogleGenerativeAI(this.apiKey);

    // Separate system messages from conversation messages
    const systemInstruction = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");

    // Convert messages to Gemini format (user/model history)
    const history = messages
      .filter((m) => m.role !== "system")
      .slice(0, -1) // All messages except the last one
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    // Get the last user message
    const lastMessage = messages.filter((m) => m.role !== "system").slice(-1)[0];
    const userMessage = lastMessage?.content || "";

    // Get the model with configuration
    const model = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: systemInstruction || undefined,
      generationConfig: {
        maxOutputTokens: options?.maxTokens || 4000,
        temperature: options?.temperature || 0.7,
        topP: options?.topP || 1,
        stopSequences: options?.stopSequences,
      },
    });

    // Generate content
    let result;
    if (history.length > 0) {
      // Multi-turn conversation
      const chat = model.startChat({ history });
      result = await chat.sendMessage(userMessage);
    } else {
      // Single message generation
      result = await model.generateContent(userMessage);
    }

    const response = result.response;
    return response.text() || "";
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

// Provider Factory
export type AIProviderType = "openai" | "anthropic" | "gemini";

export function createAIProvider(type: AIProviderType): AIProvider {
  switch (type) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    case "gemini":
      return new GeminiProvider();
    default:
      throw new Error(`Unknown AI provider type: ${type}`);
  }
}

// Get the default provider based on environment
export function getDefaultProvider(): AIProvider {
  const providerType = (process.env.AI_PROVIDER || "openai") as AIProviderType;
  return createAIProvider(providerType);
}
