export default function classnames(names: Record<string, boolean>): string {
  const classes = Object.keys(names).filter((name) => names[name]);

  return classes.reduce((acc, name, i) => {
    return acc.concat(i > 0 ? ` ${name}` : name);
  }, '');
}
