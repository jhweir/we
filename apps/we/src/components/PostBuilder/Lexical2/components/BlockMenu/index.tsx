import { useEffect, useRef, useState } from 'react';
import styles from './index.module.scss';

const p = { type: 'p', label: 'Text', icon: 'text-t', md: '' };
const h1 = { type: 'h1', label: 'Heading 1', icon: 'text-h-one', md: '#' };
const h2 = { type: 'h2', label: 'Heading 2', icon: 'text-h-two', md: '##' };
const h3 = { type: 'h3', label: 'Heading 3', icon: 'text-h-three', md: '###' };
const quote = { type: 'quote', label: 'Quote', icon: 'quotes', md: '>' };
const ul = { type: 'ul', label: 'Bullet List', icon: 'list-bullets', md: '-' };
const ol = { type: 'ol', label: 'Number List', icon: 'list-numbers', md: '1.' };
const cl = { type: 'cl', label: 'Check List', icon: 'list-checks', md: '[]' };
const image = { type: 'image', label: 'Image', icon: 'image', md: '!' };
const audio = { type: 'audio', label: 'Audio', icon: 'speaker-high', md: '!!' };
const video = { type: 'video', label: 'Video', icon: 'video-camera', md: '!!!' };

const suggestedBlocks = [ul, h1, p];
const basicBlocks = [p, h1, h2, h3, quote, ul, ol]; // cl
const mediaBlocks = [image, audio, video];

function MenuItem(
  option: { type: string; label: string; icon: string; md: string },
  index: number,
  focusIndex: number,
  setFocusIndex: (index: number) => void,
  onOptionClick: (e: React.MouseEvent, type: string) => void,
  onOptionKeyDown: (e: React.KeyboardEvent, type: string) => void,
) {
  return (
    <button
      key={option.type}
      id={`block-type-menu-${option.type}`}
      className={`${styles.menuItem} ${focusIndex === index ? styles.focused : ''}`}
      role="menuitem"
      tabIndex={index === focusIndex ? 0 : -1}
      onMouseEnter={() => setFocusIndex(index)}
      onClick={(e) => onOptionClick(e, option.type)}
      onKeyDown={(e) => onOptionKeyDown(e, option.type)}
    >
      <we-row>
        <we-icon name={option.icon} weight="bold" color="ui-300" size="sm" style={{ marginRight: '10px' }} />
        {option.label}
      </we-row>
      <span className={styles.md}>{option.md}</span>
    </button>
  );
}

export default function BlockTypeMenu(props: {
  nodeType: string;
  position: { top: number; left: number };
  selectType: (type: string) => void;
  close: () => void;
}) {
  const { nodeType, position, selectType, close } = props;
  const [focusIndex, setFocusIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const allBlocks = [...suggestedBlocks, ...basicBlocks, ...mediaBlocks];

  function onMenuKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'ArrowUp') setFocusIndex((prev) => (prev > 0 ? prev - 1 : allBlocks.length - 1));
    if (e.key === 'ArrowDown') setFocusIndex((prev) => (prev < allBlocks.length - 1 ? prev + 1 : 0));
    if (['Backspace', 'Delete', 'Escape'].includes(e.key)) close();
  }

  function onOptionKeyDown(e: React.KeyboardEvent, type: string) {
    if (['Enter', ' '].includes(e.key)) {
      e.preventDefault();
      selectType(type);
      close();
    }
  }

  function onOptionClick(e: React.MouseEvent, type: string) {
    e.stopPropagation();
    selectType(type);
    close();
  }

  // Initialise focus and set up click outside listener
  useEffect(() => {
    menuRef.current?.focus();
    // todo: if node type is text & content is empty, set the focus on the first suggested item
    // Set the focus index on the current node type
    const index = allBlocks.findIndex((item) => item.type === nodeType);
    setFocusIndex(index >= 0 ? index : 0);

    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) close();
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selection focus when focusIndex state changes
  useEffect(() => {
    const item = document.getElementById(`block-type-menu-${allBlocks[focusIndex]?.type}`);
    if (item) item.focus();
  }, [focusIndex]);

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      role="menu"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onKeyDown={onMenuKeyDown}
    >
      {/* <span className={styles.categoryTitle}>SUGGESTED</span>
      {suggestedBlocks.map((option, index) =>
        MenuItem(option, index, focusIndex, setFocusIndex, onOptionClick, onOptionKeyDown),
      )}

      <div className={styles.divider} /> */}

      <span className={styles.categoryTitle}>BASIC BLOCKS</span>
      {basicBlocks.map((option, index) =>
        MenuItem(option, index + suggestedBlocks.length, focusIndex, setFocusIndex, onOptionClick, onOptionKeyDown),
      )}

      <div className={styles.divider} />

      <span className={styles.categoryTitle}>MEDIA BLOCKS</span>
      {mediaBlocks.map((option, index) =>
        MenuItem(
          option,
          index + suggestedBlocks.length + basicBlocks.length,
          focusIndex,
          setFocusIndex,
          onOptionClick,
          onOptionKeyDown,
        ),
      )}
    </div>
  );
}
