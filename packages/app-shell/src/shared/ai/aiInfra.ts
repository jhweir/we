/**
 * aiInfra — browser-side AI infrastructure for the WE schema editor.
 *
 * Supports two providers:
 * - **Anthropic** — SSE streaming via the Messages API (direct browser access)
 * - **Ollama** — ndjson streaming via the native `/api/chat` endpoint
 *
 * Also manages the split context system: a compact core prompt (~7K tokens)
 * plus on-demand context tools the model calls to load schema sections.
 * Context tools resolve locally in the browser — each returns a pre-compiled
 * section of the schema reference.
 *
 * Isolated from the edit-session store on purpose: this file owns the wire
 * protocol and the prompt surface. The conversation loop, tool resolution,
 * and patch application live in `EditorStore`. Keep it free of Solid and
 * store imports so that boundary stays real.
 */
import { chatSystemPreamble } from '@shared/prompts/chatSystemPrompt';
import type { EntityManifestEntry } from '@we/backend-shared';

// ── Provider configuration ────────────────────────────────────────────────

export type AiProtocol = 'anthropic' | 'ollama';

export interface ProviderConfig {
  protocol: AiProtocol;
  baseUrl: string;
  apiKey: string;
  model: string;
}

// ── System prompt (split context) ─────────────────────────────────────────

/**
 * The compact core system prompt for tool-based AI chat.
 *
 * Contains the chat preamble + rules, routing, entity models, design tokens,
 * and a directory of available context tools (~7K tokens total).
 * Resolved once on first use, then cached.
 */
let corePromptLoad: Promise<string> | undefined;

export function chatCorePrompt(): Promise<string> {
  corePromptLoad ??= import('@we/ai-context').then(({ coreContext }) => chatSystemPreamble + coreContext);
  return corePromptLoad;
}

/**
 * The full monolithic system prompt (kept for backward compatibility).
 * Used when context tools are not available (e.g. Anthropic without tool support).
 */
let fullPromptLoad: Promise<string> | undefined;

export function chatSystemPrompt(): Promise<string> {
  fullPromptLoad ??= import('@we/ai-context').then(({ schemaContext }) => chatSystemPreamble + schemaContext);
  return fullPromptLoad;
}

// ── Context sections (on-demand) ──────────────────────────────────────────

let sectionsLoad: Promise<Record<string, string>> | undefined;

/** Load the context sections map.  Each key matches a context tool name. */
export function loadContextSections(): Promise<Record<string, string>> {
  sectionsLoad ??= import('@we/ai-context').then(({ contextSections }) => contextSections);
  return sectionsLoad;
}

/** A context tool definition — no parameters, returns section text. */
interface ContextToolDef {
  name: string;
  description: string;
  parameters: { type: 'object'; properties: Record<string, never> };
}

let toolDefsLoad: Promise<ContextToolDef[]> | undefined;

/** Load the context tool definitions (provider-neutral format). */
export function loadContextToolDefs(): Promise<ContextToolDef[]> {
  toolDefsLoad ??= import('@we/ai-context').then(({ contextToolDefs }) => [...contextToolDefs] as ContextToolDef[]);
  return toolDefsLoad;
}

// ── Tool definitions ──────────────────────────────────────────────────────

/** Tool definition for schema mutations (ID-based patching). */
export const updateSchemaTool = {
  name: 'update_schema',
  description:
    'Apply patches to the current template schema. Each patch targets a node by its id. Exactly one of node, insert, or remove must be provided per patch.',
  input_schema: {
    type: 'object' as const,
    properties: {
      patches: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            targetId: {
              type: 'string' as const,
              description:
                'For node (update): the id of the node to merge into. For insert/remove: the id of the PARENT node whose children/routes array to modify. Use "" for root.',
            },
            node: {
              type: 'object' as const,
              description:
                'Partial node to merge (JSON Merge Patch). Absent keys preserved, null deletes a key. Mutually exclusive with insert/remove.',
            },
            insert: {
              type: 'object' as const,
              properties: {
                children: {
                  type: 'object' as const,
                  properties: {
                    node: { type: 'object' as const, description: 'The new node to insert.' },
                    after: { type: 'string' as const, description: 'ID of sibling to insert after. Omit to append.' },
                    before: { type: 'string' as const, description: 'ID of sibling to insert before.' },
                  },
                  required: ['node'],
                },
                routes: {
                  type: 'object' as const,
                  properties: {
                    node: { type: 'object' as const, description: 'The new route node to insert.' },
                    after: {
                      type: 'string' as const,
                      description: 'ID of sibling route to insert after. Omit to append.',
                    },
                    before: { type: 'string' as const, description: 'ID of sibling route to insert before.' },
                  },
                  required: ['node'],
                },
              },
              description: 'Insert into children or routes array. Mutually exclusive with node/remove.',
            },
            remove: {
              type: 'object' as const,
              properties: {
                children: { type: 'string' as const, description: 'ID of child to remove.' },
                routes: { type: 'string' as const, description: 'ID of route to remove.' },
              },
              description: 'Remove from children or routes array by child ID. Mutually exclusive with node/insert.',
            },
          },
          required: ['targetId'],
        },
      },
    },
    required: ['patches'],
  },
};

/**
 * Format external (non-WE) manifest entries into a human-readable text block.
 * WE models already appear in the schema context so only their names get sent;
 * external models need full property descriptions because the AI has no other
 * knowledge of their structure.
 */
export function formatExternalManifestForPrompt(manifest: EntityManifestEntry[]): string {
  if (!manifest.length) return '';
  const lines: string[] = ['## External Perspective Models', ''];
  for (const entry of manifest) {
    lines.push(`### ${entry.name}`);
    const dataProps = entry.properties.filter((p) => !(p.isCollection && p.type === 'uri'));
    const relations = entry.properties.filter((p) => p.isCollection && p.type === 'uri');
    for (const prop of dataProps) {
      const flags: string[] = [prop.type];
      if (prop.required) flags.push('required');
      if (prop.isCollection) flags.push('collection');
      lines.push(`- ${prop.name} (${flags.join(', ')})`);
    }
    if (relations.length > 0) {
      lines.push('HasMany relations — typed (→ Model) support both include and parent; untyped support parent only:');
      for (const rel of relations) {
        if (rel.relatedEntity) {
          lines.push(`- ${rel.name} → ${rel.relatedEntity} (include or parent)`);
        } else {
          lines.push(`- ${rel.name} (untyped — parent query only, do NOT use with include)`);
        }
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ── Stream result (shared by both providers) ──────────────────────────────

export interface StreamResult {
  textContent: string;
  toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }>;
  stopReason: string;
}

// ── Tool format adapters ──────────────────────────────────────────────────

/**
 * Build the tools array for the request body.
 * Combines context tools + update_schema, formatted for the provider's wire format.
 */
export async function buildToolsForProvider(protocol: AiProtocol): Promise<unknown[]> {
  const contextDefs = await loadContextToolDefs();

  if (protocol === 'anthropic') {
    // Anthropic: { name, description, input_schema }
    const contextTools = contextDefs.map((def) => ({
      name: def.name,
      description: def.description,
      input_schema: def.parameters,
    }));
    return [...contextTools, updateSchemaTool];
  }

  // Ollama: { type: "function", function: { name, description, parameters } }
  const contextTools = contextDefs.map((def) => ({
    type: 'function',
    function: {
      name: def.name,
      description: def.description,
      parameters: def.parameters,
    },
  }));
  const updateSchemaOllama = {
    type: 'function',
    function: {
      name: updateSchemaTool.name,
      description: updateSchemaTool.description,
      parameters: updateSchemaTool.input_schema,
    },
  };
  return [...contextTools, updateSchemaOllama];
}

// ── Anthropic SSE streaming ───────────────────────────────────────────────

/** Parse an Anthropic SSE stream and return extracted text + tool calls + stop reason. */
export async function parseAnthropicSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onTextDelta: (text: string) => void,
  onToolUseStart?: (textSoFar: string) => void,
): Promise<StreamResult> {
  const decoder = new TextDecoder();
  let buffer = '';
  let textContent = '';
  let stopReason = '';

  let currentBlockType: 'text' | 'tool_use' | null = null;
  let currentToolId = '';
  let currentToolName = '';
  let toolInputBuffer = '';
  const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;

      try {
        const event = JSON.parse(data);

        switch (event.type) {
          case 'content_block_start':
            if (event.content_block?.type === 'text') {
              currentBlockType = 'text';
            } else if (event.content_block?.type === 'tool_use') {
              currentBlockType = 'tool_use';
              currentToolId = event.content_block.id ?? '';
              currentToolName = event.content_block.name ?? '';
              toolInputBuffer = '';
              onToolUseStart?.(textContent);
            }
            break;

          case 'content_block_delta':
            if (currentBlockType === 'text' && event.delta?.text) {
              textContent += event.delta.text;
              onTextDelta(textContent);
            } else if (currentBlockType === 'tool_use' && event.delta?.partial_json) {
              toolInputBuffer += event.delta.partial_json;
            }
            break;

          case 'content_block_stop':
            if (currentBlockType === 'tool_use' && currentToolId) {
              try {
                const input = JSON.parse(toolInputBuffer);
                toolCalls.push({ id: currentToolId, name: currentToolName, input });
              } catch {
                console.error('Failed to parse tool input:', toolInputBuffer.slice(0, 200));
              }
            }
            currentBlockType = null;
            break;

          case 'message_delta':
            if (event.delta?.stop_reason) {
              stopReason = event.delta.stop_reason;
            }
            break;
        }
      } catch {
        // Skip malformed SSE events
      }
    }
  }

  return { textContent, toolCalls, stopReason };
}

// ── Ollama ndjson streaming ───────────────────────────────────────────────

/** Parse an Ollama ndjson stream and return extracted text + tool calls + stop reason. */
export async function parseOllamaStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onTextDelta: (text: string) => void,
  onToolUseStart?: (textSoFar: string) => void,
): Promise<StreamResult> {
  const decoder = new TextDecoder();
  let buffer = '';
  let textContent = '';
  let stopReason = '';
  const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
  let toolUseNotified = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const chunk = JSON.parse(line);

        // Text content delta
        if (chunk.message?.content) {
          textContent += chunk.message.content;
          onTextDelta(textContent);
        }

        // Tool calls (appear in the final message when done: true)
        if (chunk.message?.tool_calls?.length) {
          if (!toolUseNotified) {
            onToolUseStart?.(textContent);
            toolUseNotified = true;
          }
          for (const tc of chunk.message.tool_calls) {
            const fn = tc.function;
            if (!fn?.name) continue;
            // Ollama returns arguments as parsed objects, not JSON strings
            const input = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : (fn.arguments ?? {});
            toolCalls.push({
              id: `ollama_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              name: fn.name,
              input,
            });
          }
        }

        // Stream done — determine stop reason
        if (chunk.done) {
          if (toolCalls.length > 0) {
            stopReason = 'tool_use';
          } else {
            stopReason = chunk.done_reason === 'length' ? 'max_tokens' : 'end_turn';
          }
        }
      } catch {
        // Skip malformed ndjson lines
      }
    }
  }

  return { textContent, toolCalls, stopReason };
}

// ── Provider dispatch ─────────────────────────────────────────────────────

/**
 * Send a prompt request to the configured provider.
 *
 * Uses the split context system: the system prompt contains only the core
 * context (~7K tokens) plus tool definitions for on-demand sections.
 * The caller (EditorStore) resolves context tool calls from the local
 * section map and sends results back in the conversation loop.
 */
export async function sendPromptRequest(
  config: ProviderConfig,
  messages: Array<{ role: string; content: unknown }>,
  onTextDelta: (text: string) => void,
  onToolUseStart?: (textSoFar: string) => void,
): Promise<StreamResult> {
  if (config.protocol === 'anthropic') {
    return sendAnthropicRequest(config, messages, onTextDelta, onToolUseStart);
  }
  return sendOllamaRequest(config, messages, onTextDelta, onToolUseStart);
}

async function sendAnthropicRequest(
  config: ProviderConfig,
  messages: Array<{ role: string; content: unknown }>,
  onTextDelta: (text: string) => void,
  onToolUseStart?: (textSoFar: string) => void,
): Promise<StreamResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    console.error('[aiInfra] Anthropic request timed out after 90s — aborting');
    controller.abort();
  }, 90_000);

  try {
    const tools = await buildToolsForProvider('anthropic');
    const systemPrompt = await chatCorePrompt();

    const response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 16384,
        stream: true,
        tools,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    return await parseAnthropicSSE(reader, onTextDelta, onToolUseStart);
  } finally {
    clearTimeout(timeout);
  }
}

async function sendOllamaRequest(
  config: ProviderConfig,
  messages: Array<{ role: string; content: unknown }>,
  onTextDelta: (text: string) => void,
  onToolUseStart?: (textSoFar: string) => void,
): Promise<StreamResult> {
  const controller = new AbortController();
  // Ollama can run slow on first prompt — allow 180s
  const timeout = setTimeout(() => {
    console.error('[aiInfra] Ollama request timed out after 180s — aborting');
    controller.abort();
  }, 180_000);

  try {
    const tools = await buildToolsForProvider('ollama');
    const systemPrompt = await chatCorePrompt();

    // Ollama native /api/chat — honours num_ctx, native tools
    const baseUrl = config.baseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '');

    // Build Ollama wire messages: system + conversation turns
    const wireMessages: Array<{ role: string; content: string; tool_calls?: unknown[] }> = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of messages) {
      wireMessages.push(toOllamaWireMessage(msg));
    }

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: wireMessages,
        stream: true,
        tools,
        options: {
          num_ctx: 131072,
        },
        // Disable thinking mode for models that default to it (e.g. Qwen3.x)
        think: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Ollama API error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    return await parseOllamaStream(reader, onTextDelta, onToolUseStart);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Convert an Anthropic-shaped message to an Ollama wire message.
 *
 * Anthropic uses structured content blocks ({ type: "text", text } and
 * { type: "tool_use", id, name, input } and { type: "tool_result", ... }).
 * Ollama uses flat { role, content } with tool_calls and tool results
 * expressed differently.
 */
function toOllamaWireMessage(msg: { role: string; content: unknown }): {
  role: string;
  content: string;
  tool_calls?: unknown[];
} {
  const { role, content } = msg;

  // Simple string content
  if (typeof content === 'string') {
    return { role, content };
  }

  // Array of content blocks (Anthropic format)
  if (Array.isArray(content)) {
    const textParts: string[] = [];
    const toolCalls: unknown[] = [];
    const toolResults: Array<{ role: string; content: string }> = [];

    for (const block of content) {
      if (block.type === 'text') {
        textParts.push(block.text);
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          function: {
            name: block.name,
            arguments: block.input,
          },
        });
      } else if (block.type === 'tool_result') {
        // Tool results become separate "tool" role messages in Ollama.
        // For now, accumulate — the caller must handle multi-message expansion.
        toolResults.push({
          role: 'tool',
          content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
        });
      }
    }

    // If this message contains tool_results, return the first one.
    // (The EditorStore builds tool results as user messages with content arrays.)
    if (toolResults.length > 0 && role === 'user') {
      return toolResults[0];
    }

    const result: { role: string; content: string; tool_calls?: unknown[] } = {
      role,
      content: textParts.join('\n'),
    };
    if (toolCalls.length > 0) {
      result.tool_calls = toolCalls;
    }
    return result;
  }

  // Fallback
  return { role, content: typeof content === 'object' ? JSON.stringify(content) : String(content) };
}

// ── Legacy compatibility ──────────────────────────────────────────────────

/**
 * Send a request to Claude using the full monolithic context.
 *
 * @deprecated Use `sendPromptRequest` with a ProviderConfig instead.
 * Kept for backward compatibility during migration — the EditorStore
 * switches to the new function when a provider config exists.
 */
export async function sendClaudeRequest(
  apiKey: string,
  claudeMessages: Array<{ role: string; content: unknown }>,
  onTextDelta: (text: string) => void,
  onToolUseStart?: (textSoFar: string) => void,
): Promise<StreamResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    console.error('[aiInfra] Request timed out after 90s — aborting');
    controller.abort();
  }, 90_000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 16384,
        stream: true,
        tools: [updateSchemaTool],
        system: [
          {
            type: 'text',
            text: await chatSystemPrompt(),
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: claudeMessages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Claude API error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    return await parseAnthropicSSE(reader, onTextDelta, onToolUseStart);
  } finally {
    clearTimeout(timeout);
  }
}
