import './components/Avatar';
import './components/Badge';
import './components/Button';
import './components/Column';
import './components/Icon';
import './components/Input';
import './components/Menu';
import './components/MenuGroup';
import './components/MenuItem';
import './components/Modal';
import './components/Popover';
import './components/Row';
import './components/Spinner';
import './components/Text';

// Then, re-export the components and their types
// export { default as Badge } from './components/Badge';
// Add other component exports

type Variant = '' | 'primary' | 'success' | 'danger' | 'warning';
type Size = '' | 'sm' | 'lg';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-badge': {
        variant?: Variant;
        size?: Size;
        children?: any;
      };
    }
  }
}
