import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import React, { useState } from 'react';

// Types for poll data
export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type PollData = {
  question: string;
  options: PollOption[];
};

export type SerializedPollNode = Spread<
  {
    type: 'poll';
    version: 1;
    pollData: PollData;
  },
  SerializedLexicalNode
>;

// Poll component UI
function PollComponent({ nodeKey, data }: { nodeKey: NodeKey; data: PollData }): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [localData, setLocalData] = useState<PollData>(data);

  // Functions to update poll data
  const updateQuestion = (question: string) => {
    editor.update(() => {
      const node = $getPollNodeByKey(nodeKey);
      if (node) {
        node.setPollData({
          ...node.getPollData(),
          question,
        });
      }
    });
    setLocalData((prevData) => ({ ...prevData, question }));
  };

  const addOption = () => {
    const newOption = {
      id: Date.now().toString(),
      text: '',
      votes: 0,
    };

    editor.update(() => {
      const node = $getPollNodeByKey(nodeKey);
      if (node) {
        const currentData = node.getPollData();
        node.setPollData({
          ...currentData,
          options: [...currentData.options, newOption],
        });
      }
    });

    setLocalData((prevData) => ({
      ...prevData,
      options: [...prevData.options, newOption],
    }));
  };

  const updateOption = (id: string, text: string) => {
    editor.update(() => {
      const node = $getPollNodeByKey(nodeKey);
      if (node) {
        const currentData = node.getPollData();
        node.setPollData({
          ...currentData,
          options: currentData.options.map((option) => (option.id === id ? { ...option, text } : option)),
        });
      }
    });

    setLocalData((prevData) => ({
      ...prevData,
      options: prevData.options.map((option) => (option.id === id ? { ...option, text } : option)),
    }));
  };

  const vote = (id: string) => {
    editor.update(() => {
      const node = $getPollNodeByKey(nodeKey);
      if (node) {
        const currentData = node.getPollData();
        node.setPollData({
          ...currentData,
          options: currentData.options.map((option) =>
            option.id === id ? { ...option, votes: option.votes + 1 } : option,
          ),
        });
      }
    });

    setLocalData((prevData) => ({
      ...prevData,
      options: prevData.options.map((option) => (option.id === id ? { ...option, votes: option.votes + 1 } : option)),
    }));
  };

  // Render poll UI
  return (
    <div className="poll-block">
      <div className="poll-handle">
        <div className="block-drag-handle" draggable>
          ⋮⋮
        </div>
      </div>

      <div className="poll-content">
        <input
          className="poll-question"
          type="text"
          value={localData.question}
          onChange={(e) => updateQuestion(e.target.value)}
          placeholder="Poll question"
        />

        <div className="poll-options">
          {localData.options.map((option) => (
            <div key={option.id} className="poll-option">
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(option.id, e.target.value)}
                placeholder="Option text"
              />
              <button onClick={() => vote(option.id)} className="vote-button">
                Vote ({option.votes})
              </button>
            </div>
          ))}
        </div>

        <button onClick={addOption} className="add-option-button">
          Add Option
        </button>
      </div>
    </div>
  );
}

// Poll node class
export class PollNode extends DecoratorNode<React.ReactNode> {
  __pollData: PollData;

  static getType(): string {
    return 'poll';
  }

  static clone(node: PollNode): PollNode {
    return new PollNode(node.__pollData, node.__key);
  }

  constructor(pollData: PollData, key?: NodeKey) {
    super(key);
    this.__pollData = pollData;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'poll-node';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.ReactNode {
    return <PollComponent nodeKey={this.__key} data={this.__pollData} />;
  }

  getPollData(): PollData {
    return this.__pollData;
  }

  setPollData(pollData: PollData): void {
    const self = this.getWritable();
    self.__pollData = pollData;
  }

  static importJSON(serializedNode: SerializedPollNode): PollNode {
    const { pollData } = serializedNode;
    return new PollNode(pollData);
  }

  exportJSON(): SerializedPollNode {
    return {
      type: 'poll',
      version: 1,
      pollData: this.__pollData,
    };
  }
}

// Helper functions
export function $createPollNode(pollData: PollData): PollNode {
  return new PollNode(pollData);
}

export function $isPollNode(node: any): node is PollNode {
  return node instanceof PollNode;
}

function $getPollNodeByKey(key: NodeKey): PollNode | null {
  const node = $getNodeByKey(key);
  return $isPollNode(node) ? node : null;
}

// This import is used inside the component but needs to be imported at the file level
import { $getNodeByKey } from 'lexical';
