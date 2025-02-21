import styles from './Row.module.scss';
import React from 'react';

function Row(props: {
  children?: any;
  style?: any;
  className?: any;
  id?: string;
  title?: string;
  centerX?: boolean;
  centerY?: boolean;
  spaceBetween?: boolean;
  wrap?: boolean;
  scroll?: boolean;
}): JSX.Element {
  const { children, style, className, id, title, centerX, centerY, spaceBetween, wrap, scroll } = props;

  const classes = [styles.wrapper];
  if (className) classes.unshift(className);
  if (centerX) classes.push(styles.centerX);
  if (centerY) classes.push(styles.centerY);
  if (spaceBetween) classes.push(styles.spaceBetween);
  if (wrap) classes.push(styles.wrap);
  if (scroll) classes.push(styles.scroll);

  return (
    <div className={classes.join(' ')} style={style} id={id} title={title}>
      {children}
    </div>
  );
}

Row.defaultProps = {
  children: null,
  style: null,
  className: false,
  id: null,
  title: null,
  centerX: false,
  centerY: false,
  spaceBetween: false,
  wrap: false,
  scroll: false,
};

export default Row;
