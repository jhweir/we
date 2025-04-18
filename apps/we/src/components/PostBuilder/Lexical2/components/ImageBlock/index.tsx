import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useCallback } from 'react';
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

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isSelected) clearSelection();
      else setSelected(true);
      e.stopPropagation();
    },
    [isSelected, setSelected, clearSelection],
  );

  return (
    <div className={styles.wrapper} onClick={handleClick}>
      {src ? (
        <img
          src={src}
          alt={altText}
          style={{
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
          }}
        />
      ) : (
        <button>
          <we-icon name="image" size="lg" />
          Add Image
        </button>
      )}
    </div>
  );
}
