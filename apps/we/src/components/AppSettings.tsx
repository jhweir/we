import { CircleButton, Column, PopoverMenu, Row } from '@we/components/solid';
import { createSignal } from 'solid-js';

import { useTemplateStore, useThemeStore } from '@/stores';

export default function AppSettings() {
  const themeStore = useThemeStore();
  const templateStore = useTemplateStore();
  const [modalOpen, setModalOpen] = createSignal(false);

  return (
    <>
      <CircleButton
        label="App Settings"
        icon="gear"
        onClick={() => setModalOpen(!modalOpen())}
        styles={{ position: 'absolute', bottom: '10px', right: '10px' }}
      />

      {modalOpen() && (
        <we-modal close={() => setModalOpen(false)}>
          <Column gap="600" p="600" ax="center">
            <we-text size="700">App Settings</we-text>

            <Row gap="400" ay="center">
              <we-text>Template:</we-text>
              <PopoverMenu
                options={templateStore.templates}
                selectedOption={templateStore.selectedTemplate}
                onSelect={templateStore.switchTemplate}
              />
            </Row>

            <Row gap="400" ay="center">
              <we-text>Theme:</we-text>
              <PopoverMenu
                options={themeStore.themes}
                selectedOption={themeStore.currentTheme}
                onSelect={themeStore.setCurrentTheme}
              />
            </Row>

            <we-button onClick={templateStore.removeTemplate}>Remove Current Template</we-button>
          </Column>
        </we-modal>
      )}
    </>
  );
}
