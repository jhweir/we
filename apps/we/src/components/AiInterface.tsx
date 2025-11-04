import { Row } from '@we/components/solid';
import { createEffect, createSignal } from 'solid-js';

import { useAiStore, useTemplateStore } from '@/stores';

// TODO: r="pill" not working yet on Row and Column

export default function AiInterface() {
  const aiStore = useAiStore();
  const templateStore = useTemplateStore();

  const [userInput, setUserInput] = createSignal('');
  const [aiResponse, setAiResponse] = createSignal('');

  async function promptAI(): Promise<void> {
    console.log('Prompting AI with:', userInput());

    const response = await aiStore.handleSchemaPrompt(userInput());
    console.log('AI Response:', response);
    setAiResponse(response ?? 'No response from AI');
  }

  return (
    <Row ax="center" gap="400" styles={{ width: '100%', position: 'absolute', bottom: '40px' }}>
      <Row ay="center" gap="400" bg="ui-200" p="400" r="sm" styles={{ width: '100%', 'max-width': '600px' }}>
        <we-input
          placeholder="Prompt AI with your schema request..."
          value={userInput()}
          onInput={(e: InputEvent) => setUserInput((e.target as HTMLInputElement)?.value)}
          style={{ width: '100%' }}
        />
        <we-button px="400" py="300" r="pill" hover={{ bg: 'success-300' }} onClick={promptAI}>
          Prompt
        </we-button>
      </Row>
      {aiResponse() && (
        <we-text size="500" color="ui-1000">
          AI Response: {aiResponse()}
        </we-text>
      )}
    </Row>
  );
}
