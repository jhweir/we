import { Route, Router } from '@solidjs/router';

import HomePage from '@/pages/home';
import NewPost from '@/pages/new';
import SpacePage from '@/pages/space';
import StoreProvider from '@/stores/StoreProvider';
import DefaultTemplate from '@/templates/TemplateProvider';

export default function App() {
  return (
    <StoreProvider>
      <Router root={DefaultTemplate}>
        <Route path="/" component={HomePage} />
        <Route path="/new" component={NewPost} />
        <Route path="/space/:spaceHandle/*" component={SpacePage} />
      </Router>
    </StoreProvider>
  );
}
