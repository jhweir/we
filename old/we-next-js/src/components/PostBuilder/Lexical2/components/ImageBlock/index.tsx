import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { $getNodeByKey } from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import { $isImageNode } from '../../nodes/Image';
import styles from './index.module.scss';

interface ImageComponentProps {
  src: string | undefined;
  altText: string | undefined;
  width: number | undefined;
  height: number | undefined;
  nodeKey: string;
}

export default function ImageComponent({ src, altText, width, height, nodeKey }: ImageComponentProps) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [showInputModal, setShowInputModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const inputModalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick(e: React.MouseEvent) {
    if (isSelected) clearSelection();
    else setSelected(true);
    e.stopPropagation();
  }

  function openInputModal(e: React.MouseEvent) {
    e.stopPropagation();
    setShowInputModal(true);
  }

  const closeInputModal = useCallback(() => {
    setShowInputModal(false);
    setImageUrl('');
  }, []);

  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (imageUrl.trim()) {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) node.setSrc(imageUrl);
        });
        closeInputModal();
      }
    },
    [editor, nodeKey, imageUrl, closeInputModal],
  );

  // Close popup when clicking outside
  useEffect(() => {
    if (!showInputModal) return;

    function handleClickOutside(e: MouseEvent) {
      if (inputModalRef.current && !inputModalRef.current.contains(e.target as Node)) closeInputModal();
    }

    // Focus the input when popup opens
    if (inputRef.current) inputRef.current.focus();

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInputModal, closeInputModal]);

  return (
    <div className={styles.wrapper} onClick={handleClick}>
      {src ? (
        <img
          src={src}
          alt={altText}
          style={{ width: width ? `${width}px` : 'auto', height: height ? `${height}px` : 'auto' }}
        />
      ) : (
        <button onClick={openInputModal}>
          <we-icon name="image" size="lg" />
          Add Image
        </button>
      )}

      {showInputModal && (
        <div className={styles.inputModal} ref={inputModalRef}>
          <form onSubmit={handleUrlSubmit}>
            <h4>Add Image URL</h4>
            <input
              ref={inputRef}
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <div className={styles.inputButtons}>
              <button type="button" onClick={closeInputModal}>
                Cancel
              </button>
              <button type="submit">Add</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
