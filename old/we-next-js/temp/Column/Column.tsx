import styles from './Column.module.scss';
import React from 'react';

function Column(props: {
  children?: any;
  style?: any;
  className?: any;
  id?: string;
  title?: string;
  centerX?: boolean;
  centerY?: boolean;
  spaceBetween?: boolean;
  scroll?: boolean;
  draggable?: boolean;
}): JSX.Element {
  const { children, style, className, id, title, centerX, centerY, spaceBetween, scroll, draggable } = props;

  const classes = [styles.wrapper];
  if (className) classes.unshift(className);
  if (centerX) classes.push(styles.centerX);
  if (centerY) classes.push(styles.centerY);
  if (spaceBetween) classes.push(styles.spaceBetween);
  if (scroll) classes.push(styles.scroll);

  return (
    <div className={classes.join(' ')} style={style} id={id} title={title} draggable={draggable}>
      {children}
    </div>
  );
}

Column.defaultProps = {
  children: null,
  style: null,
  className: false,
  id: null,
  title: null,
  centerX: false,
  centerY: false,
  spaceBetween: false,
  scroll: false,
  draggable: false,
};

export default Column;
