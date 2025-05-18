import ContextProvider from '@/contexts/ContextProvider';
import DefaultTemplate from '@/templates';
import { Route, Router } from '@solidjs/router';

import HomePage from '@/pages/Home';
import NewPost from '@/pages/New/page';
import SpacePage from '@/pages/Space/page';

export default function App() {
  return (
    <ContextProvider>
      <Router root={DefaultTemplate}>
        <Route path="/" component={HomePage} />
        <Route path="/new" component={NewPost} />
        <Route path="/space/:spaceHandle/*" component={SpacePage} />
      </Router>
    </ContextProvider>
  );
}
