import { useEffect, useRef, useState } from 'react';
import styles from './index.module.scss';

export const blockTypes = [
  { type: 'p', label: 'Text', icon: 'text-t' },
  { type: 'h1', label: 'Heading 1', icon: 'text-h-one', md: '#' },
  { type: 'h2', label: 'Heading 2', icon: 'text-h-two', md: '##' },
  { type: 'h3', label: 'Heading 3', icon: 'text-h-three', md: '###' },
];

export default function BlockTypeMenu(props: {
  nodeType: string;
  position: { top: number; left: number };
  selectType: (type: string) => void;
  close: () => void;
}) {
  const { nodeType, position, selectType, close } = props;
  const [focusIndex, setFocusIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);

  function onMenuKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'ArrowUp') setFocusIndex((prev) => (prev > 0 ? prev - 1 : blockTypes.length - 1));
    if (e.key === 'ArrowDown') setFocusIndex((prev) => (prev < blockTypes.length - 1 ? prev + 1 : 0));
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
    // Set the focus index on the current node type
    const index = blockTypes.findIndex((item) => item.type === nodeType);
    setFocusIndex(index >= 0 ? index : 0);

    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) close();
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selection focus when focusIndex state changes
  useEffect(() => {
    const item = document.getElementById(`block-type-menu-${blockTypes[focusIndex]?.type}`);
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
      {blockTypes.map((option, index) => (
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
      ))}
    </div>
  );
}
