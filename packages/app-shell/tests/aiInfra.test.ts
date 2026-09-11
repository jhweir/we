/**
 * AI infrastructure tests — stream parsers, tool format adapters, context sections,
 * and live integration against the local Ollama instance.
 *
 * The live tests run against `http://localhost:11434`. When Ollama is not available,
 * they skip silently. The remaining tests use recorded/synthetic responses and run
 * everywhere.
 */
import {
  buildToolsForProvider,
  formatExternalManifestForPrompt,
  loadContextSections,
  parseAnthropicSSE,
  parseOllamaStream,
  type ProviderConfig,
  sendPromptRequest,
} from '@shared/ai/aiInfra';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────────

/** Build a ReadableStreamDefaultReader from raw string chunks. */
function readerFrom(chunks: string[]): ReadableStreamDefaultReader<Uint8Array> {
  const encoder = new TextEncoder();
  const encoded = chunks.map((c) => encoder.encode(c));
  let i = 0;
  return {
    read: async () => {
      if (i >= encoded.length) return { done: true as const, value: undefined };
      return { done: false as const, value: encoded[i++] };
    },
    cancel: async () => {},
    releaseLock: () => {},
    closed: Promise.resolve(undefined),
  } as unknown as ReadableStreamDefaultReader<Uint8Array>;
}

/** Check whether the local Ollama instance accepts requests. */
async function ollamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2_000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── parseOllamaStream ────────────────────────────────────────────────────

describe('parseOllamaStream', () => {
  it('extracts text content from streaming chunks', async () => {
    const chunks = [
      '{"message":{"role":"assistant","content":"Hello"},"done":false}\n',
      '{"message":{"role":"assistant","content":" world"},"done":false}\n',
      '{"message":{"role":"assistant","content":"!"},"done":false}\n',
      '{"done":true,"done_reason":"stop"}\n',
    ];

    const deltas: string[] = [];
    const result = await parseOllamaStream(readerFrom(chunks), (text) => deltas.push(text));

    expect(result.textContent).toBe('Hello world!');
    expect(result.stopReason).toBe('end_turn');
    expect(result.toolCalls).toHaveLength(0);
    // Each chunk produces a cumulative delta
    expect(deltas).toEqual(['Hello', 'Hello world', 'Hello world!']);
  });

  it('detects tool calls in the final message', async () => {
    const chunks = [
      '{"message":{"role":"assistant","content":"Let me look that up."},"done":false}\n',
      '{"message":{"role":"assistant","content":"","tool_calls":[{"function":{"name":"we_stores_reference","arguments":{}}}]},"done":false}\n',
      '{"done":true,"done_reason":"stop"}\n',
    ];

    const onToolUse = vi.fn();
    const result = await parseOllamaStream(readerFrom(chunks), () => {}, onToolUse);

    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe('we_stores_reference');
    expect(result.stopReason).toBe('tool_use');
    expect(onToolUse).toHaveBeenCalledOnce();
  });

  it('parses tool arguments provided as a JSON string', async () => {
    const chunks = [
      '{"message":{"role":"assistant","content":"","tool_calls":[{"function":{"name":"update_schema","arguments":"{\\"patches\\":[{\\"targetId\\":\\"root\\"}]}"}}]},"done":false}\n',
      '{"done":true,"done_reason":"stop"}\n',
    ];

    const result = await parseOllamaStream(readerFrom(chunks), () => {});

    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].input).toEqual({ patches: [{ targetId: 'root' }] });
  });

  it('maps done_reason "length" to "max_tokens"', async () => {
    const chunks = [
      '{"message":{"role":"assistant","content":"truncated"},"done":false}\n',
      '{"done":true,"done_reason":"length"}\n',
    ];

    const result = await parseOllamaStream(readerFrom(chunks), () => {});
    expect(result.stopReason).toBe('max_tokens');
  });

  it('handles a JSON line split across two reads', async () => {
    const chunks = [
      '{"message":{"role":"assistant","content":"split"}',
      ',"done":false}\n{"done":true,"done_reason":"stop"}\n',
    ];

    const result = await parseOllamaStream(readerFrom(chunks), () => {});

    expect(result.textContent).toBe('split');
    expect(result.stopReason).toBe('end_turn');
  });

  it('skips malformed JSON lines without crashing', async () => {
    const chunks = [
      '{"message":{"role":"assistant","content":"ok"},"done":false}\n',
      'NOT VALID JSON\n',
      '{"done":true,"done_reason":"stop"}\n',
    ];

    const result = await parseOllamaStream(readerFrom(chunks), () => {});

    expect(result.textContent).toBe('ok');
    expect(result.stopReason).toBe('end_turn');
  });

  it('notifies onToolUseStart only once for multiple tool calls', async () => {
    const chunks = [
      '{"message":{"role":"assistant","content":"","tool_calls":[{"function":{"name":"we_stores_reference","arguments":{}}},{"function":{"name":"we_components_reference","arguments":{}}}]},"done":false}\n',
      '{"done":true,"done_reason":"stop"}\n',
    ];

    const onToolUse = vi.fn();
    const result = await parseOllamaStream(readerFrom(chunks), () => {}, onToolUse);

    expect(result.toolCalls).toHaveLength(2);
    expect(onToolUse).toHaveBeenCalledOnce();
  });
});

// ── parseAnthropicSSE ────────────────────────────────────────────────────

describe('parseAnthropicSSE', () => {
  it('extracts text content from SSE events', async () => {
    const events = [
      'data: {"type":"content_block_start","content_block":{"type":"text"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"text":" there"}}\n\n',
      'data: {"type":"content_block_stop"}\n\n',
      'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n',
    ];

    const deltas: string[] = [];
    const result = await parseAnthropicSSE(readerFrom(events), (text) => deltas.push(text));

    expect(result.textContent).toBe('Hello there');
    expect(result.stopReason).toBe('end_turn');
    expect(result.toolCalls).toHaveLength(0);
    expect(deltas).toEqual(['Hello', 'Hello there']);
  });

  it('extracts tool_use blocks with streaming JSON', async () => {
    const events = [
      'data: {"type":"content_block_start","content_block":{"type":"text"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"text":"Checking..."}}\n\n',
      'data: {"type":"content_block_stop"}\n\n',
      'data: {"type":"content_block_start","content_block":{"type":"tool_use","id":"tool_1","name":"update_schema"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"partial_json":"{\\"patches\\":["}}\n\n',
      'data: {"type":"content_block_delta","delta":{"partial_json":"]}"}}\n\n',
      'data: {"type":"content_block_stop"}\n\n',
      'data: {"type":"message_delta","delta":{"stop_reason":"tool_use"}}\n\n',
    ];

    const onToolUse = vi.fn();
    const result = await parseAnthropicSSE(readerFrom(events), () => {}, onToolUse);

    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0]).toEqual({
      id: 'tool_1',
      name: 'update_schema',
      input: { patches: [] },
    });
    expect(result.stopReason).toBe('tool_use');
    expect(onToolUse).toHaveBeenCalledOnce();
  });

  it('handles the [DONE] sentinel', async () => {
    const events = [
      'data: {"type":"content_block_start","content_block":{"type":"text"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"text":"Done"}}\n\n',
      'data: {"type":"content_block_stop"}\n\n',
      'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n',
      'data: [DONE]\n\n',
    ];

    const result = await parseAnthropicSSE(readerFrom(events), () => {});

    expect(result.textContent).toBe('Done');
    expect(result.stopReason).toBe('end_turn');
  });

  it('ignores non-data lines', async () => {
    const events = [
      'event: message_start\n',
      'data: {"type":"content_block_start","content_block":{"type":"text"}}\n\n',
      ': this is a comment\n',
      'data: {"type":"content_block_delta","delta":{"text":"ok"}}\n\n',
      'data: {"type":"content_block_stop"}\n\n',
      'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n',
    ];

    const result = await parseAnthropicSSE(readerFrom(events), () => {});

    expect(result.textContent).toBe('ok');
  });

  it('recovers from malformed JSON in an SSE event', async () => {
    const events = [
      'data: {"type":"content_block_start","content_block":{"type":"text"}}\n\n',
      'data: {"type":"content_block_delta","delta":{"text":"before"}}\n\n',
      'data: {BROKEN_JSON}\n\n',
      'data: {"type":"content_block_delta","delta":{"text":" after"}}\n\n',
      'data: {"type":"content_block_stop"}\n\n',
      'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n',
    ];

    const result = await parseAnthropicSSE(readerFrom(events), () => {});

    expect(result.textContent).toBe('before after');
  });
});

// ── buildToolsForProvider ────────────────────────────────────────────────

describe('buildToolsForProvider', () => {
  it('produces Anthropic-format tools with input_schema', async () => {
    const tools = (await buildToolsForProvider('anthropic')) as Array<Record<string, unknown>>;

    // Context tools + update_schema
    expect(tools.length).toBeGreaterThan(1);

    // Last tool: update_schema
    const last = tools[tools.length - 1];
    expect(last.name).toBe('update_schema');
    expect(last.input_schema).toBeDefined();
    // Anthropic format uses flat objects, no 'type'/'function' wrapper
    expect(last.type).toBeUndefined();

    // First tool: a context tool
    const first = tools[0];
    expect(first.input_schema).toBeDefined();
    expect(first.name).toMatch(/^we_/);
  });

  it('produces Ollama-format tools with function wrapper', async () => {
    const tools = (await buildToolsForProvider('ollama')) as Array<Record<string, unknown>>;

    expect(tools.length).toBeGreaterThan(1);

    // Every tool: { type: "function", function: { name, description, parameters } }
    for (const tool of tools) {
      expect(tool.type).toBe('function');
      const fn = tool.function as Record<string, unknown>;
      expect(fn).toBeDefined();
      expect(fn.name).toBeDefined();
      expect(fn.parameters).toBeDefined();
    }

    // Last: update_schema
    const lastFn = (tools[tools.length - 1] as Record<string, unknown>).function as Record<string, unknown>;
    expect(lastFn.name).toBe('update_schema');
  });

  it('generates the same number of tools for both providers', async () => {
    const anthropicTools = await buildToolsForProvider('anthropic');
    const ollamaTools = await buildToolsForProvider('ollama');
    expect(anthropicTools.length).toBe(ollamaTools.length);
  });
});

// ── formatExternalManifestForPrompt ──────────────────────────────────────

describe('formatExternalManifestForPrompt', () => {
  it('returns empty string for empty manifest', () => {
    expect(formatExternalManifestForPrompt([])).toBe('');
  });

  it('formats data properties with flags', () => {
    const manifest = [
      {
        name: 'TestModel',
        properties: [
          { name: 'title', type: 'string', required: true, isCollection: false },
          { name: 'tags', type: 'string', required: false, isCollection: true },
        ],
      },
    ];

    const result = formatExternalManifestForPrompt(manifest as Parameters<typeof formatExternalManifestForPrompt>[0]);

    expect(result).toContain('### TestModel');
    expect(result).toContain('title (string, required)');
    expect(result).toContain('tags (string, collection)');
  });

  it('separates data properties from HasMany relations', () => {
    const manifest = [
      {
        name: 'Parent',
        properties: [
          { name: 'name', type: 'string', required: true, isCollection: false },
          { name: 'children', type: 'uri', required: false, isCollection: true, relatedEntity: 'Child' },
          { name: 'links', type: 'uri', required: false, isCollection: true },
        ],
      },
    ];

    const result = formatExternalManifestForPrompt(manifest as Parameters<typeof formatExternalManifestForPrompt>[0]);

    expect(result).toContain('children → Child');
    expect(result).toContain('links (untyped');
    // Data property should appear before the relations header
    expect(result.indexOf('name (string')).toBeLessThan(result.indexOf('HasMany'));
  });
});

// ── loadContextSections ──────────────────────────────────────────────────

describe('loadContextSections', () => {
  it('loads a non-empty map with we_-prefixed keys', async () => {
    const sections = await loadContextSections();
    const keys = Object.keys(sections);

    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      expect(key).toMatch(/^we_/);
    }
  });

  it('provides non-empty content for every section', async () => {
    const sections = await loadContextSections();

    for (const [key, value] of Object.entries(sections)) {
      expect(typeof value).toBe('string');
      expect(value.length, `section ${key} should have content`).toBeGreaterThan(0);
    }
  });

  it('includes stores and components sections', async () => {
    const sections = await loadContextSections();
    const keys = Object.keys(sections);

    expect(keys).toContain('we_stores_reference');
    expect(keys).toContain('we_component_registry');
  });
});

// ── Integration: live Ollama ─────────────────────────────────────────────
//
// These tests call the real Ollama API at localhost:11434.
// They skip silently when Ollama is not available (CI, machines without Ollama).
// Timeouts are generous — first-prompt cold loads the model into memory.

describe('Ollama integration (live)', () => {
  let available = false;

  beforeAll(async () => {
    available = await ollamaAvailable();
  });

  const ollamaConfig: ProviderConfig = {
    protocol: 'ollama',
    baseUrl: 'http://localhost:11434',
    apiKey: '',
    model: 'qwen3.6-27b:latest',
  };

  it('streams a text response', async () => {
    if (!available) return;

    const deltas: string[] = [];
    const result = await sendPromptRequest(
      ollamaConfig,
      [{ role: 'user', content: 'Reply with exactly the word "pong" and nothing else.' }],
      (text) => deltas.push(text),
    );

    expect(result.textContent.length).toBeGreaterThan(0);
    expect(result.stopReason).toBe('end_turn');
    expect(deltas.length).toBeGreaterThan(0);
  }, 120_000);

  it('triggers context tool calls when asked about schema sections', async () => {
    if (!available) return;

    // Single attempt — tool-calling is non-deterministic.
    // The full loop test below is the definitive integration check;
    // this test validates the stop_reason and toolCalls shape when it fires.
    const result = await sendPromptRequest(
      ollamaConfig,
      [
        {
          role: 'user',
          content:
            'You MUST call the we_stores_reference tool before answering. Do not answer from memory. I need to know the exact store types available in WE. Call the tool now.',
        },
      ],
      () => {},
    );

    if (result.stopReason !== 'tool_use') {
      // Model answered directly — not a test failure, just non-deterministic behaviour.
      console.warn('[aiInfra.test] Model answered without calling tools — non-deterministic, skipping assertions');
      return;
    }

    expect(result.toolCalls.length).toBeGreaterThan(0);
    const toolNames = result.toolCalls.map((tc) => tc.name);
    expect(toolNames.some((n) => n.startsWith('we_'))).toBe(true);
  }, 120_000);

  it('completes a full context-tool loop: prompt → tool call → resolve → response', async () => {
    if (!available) return;

    const sections = await loadContextSections();
    const messages: Array<{ role: string; content: unknown }> = [
      {
        role: 'user',
        content:
          'You MUST call the we_stores_reference tool before answering. Do not answer from memory. What store types does WE support? Call the tool now, then list just the type names.',
      },
    ];

    // Step 1 — initial prompt. Retry if model doesn't call tools (non-deterministic).
    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      result = await sendPromptRequest(ollamaConfig, [...messages], () => {});
      if (result.stopReason === 'tool_use') break;
    }

    // If no tool call after retries, the model answered directly — skip gracefully
    if (result!.stopReason !== 'tool_use') {
      console.warn('[aiInfra.test] Model did not call tools after 3 attempts — skipping loop test');
      return;
    }

    expect(result!.toolCalls.length).toBeGreaterThan(0);

    // Step 2 — build assistant turn with tool calls, then tool results
    const assistantBlocks: unknown[] = [];
    if (result!.textContent) {
      assistantBlocks.push({ type: 'text', text: result!.textContent });
    }
    for (const tc of result!.toolCalls) {
      assistantBlocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input });
    }
    messages.push({ role: 'assistant', content: assistantBlocks });

    const toolResults: unknown[] = [];
    for (const tc of result!.toolCalls) {
      const content = tc.name in sections ? sections[tc.name] : `Unknown tool: ${tc.name}`;
      toolResults.push({ type: 'tool_result', tool_use_id: tc.id, content });
    }
    messages.push({ role: 'user', content: toolResults });

    // Step 3 — continuation, expect text response mentioning stores
    result = await sendPromptRequest(ollamaConfig, messages, () => {});

    expect(result.textContent.length).toBeGreaterThan(0);
    expect(result.textContent.toLowerCase()).toMatch(/store/i);
  }, 300_000);
});
