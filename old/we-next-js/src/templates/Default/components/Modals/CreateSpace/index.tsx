import { useAdamContext } from '@/contexts/AdamContext';
import Block from '@/models/Block';
import Space from '@/models/Space';
import CollectionBlock from '@/models/block-types/CollectionBlock';
import ImageBlock from '@/models/block-types/ImageBlock';
import TextBlock from '@/models/block-types/TextBlock';
import { useState } from 'react';

type SpaceVisibility = 'hidden' | 'private' | 'public';

export default function CreateSpaceModal() {
  const { ad4mClient, setActiveModals, setMySpaces } = useAdamContext();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [locations, setLocations] = useState([]);
  const [visibility, setVisibility] = useState<SpaceVisibility>('private');
  const [loading, setLoading] = useState(false);

  function close() {
    setActiveModals((prev) => ({ ...prev, createSpace: false }));
  }

  async function createSpace() {
    if (!ad4mClient) return;
    setLoading(true);

    // Create the perspective for the space
    const spacePerspective = await ad4mClient.perspective.add(name);
    console.log('spacePerspective', spacePerspective);

    // Add models to the perspectives SDNA
    const models = [Space, Block, ImageBlock, TextBlock, CollectionBlock];
    await Promise.all(models.map((model) => spacePerspective.ensureSDNASubjectClass(model)));

    // Create an instance of the space model and save it in the perspective
    const spaceModel = new Space(spacePerspective); // , undefined, undefined
    spaceModel.uuid = spacePerspective.uuid;
    spaceModel.name = name;
    spaceModel.description = description;
    await spaceModel.save();

    console.log('spaceModel', spaceModel);

    // Update AdamContext state with the new space
    setMySpaces((prev) => [...prev, spaceModel]);

    close();
  }

  return (
    <we-modal close={close}>
      <we-column p="600" gap="400" alignX="center">
        <we-text variant="heading">Create a new space</we-text>

        <we-input
          label="Name"
          placeholder="Space name"
          value={name}
          onInput={(e: InputEvent) => setName((e.target as HTMLInputElement)?.value)}
        />

        <we-input
          label="Description"
          placeholder="Space description"
          value={description}
          onInput={(e: InputEvent) => setDescription((e.target as HTMLInputElement)?.value)}
        />

        <we-button variant="primary" disabled={!name} loading={loading} onClick={createSpace}>
          Create
        </we-button>
      </we-column>
    </we-modal>
  );
}
