import ContextProvider from '@/contexts/ContextProvider';
import DefaultTemplate from '@/templates/TemplateProvider';
import { Route, Router } from '@solidjs/router';

import HomePage from '@/pages/home';
import NewPost from '@/pages/new';
import SpacePage from '@/pages/space';

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

// Todo:
// Hybrid Approach (Recommended):

// Centralize fetching logic in the context/store but trigger fetches in components.
// Combines the benefits of both approaches and keeps the app modular and maintainable.

// Constraints: (no longer relevant with new approach above... - space page triggers space data fetch)
// + Context has access to the router (not needed...)
// + Default template has access to the context & the router

// export default function App() {
//   return (
//     <Router>
//       <Route
//         path="/*"
//         component={() => (
//           <ContextProvider>
//             <DefaultTemplate>
//               <Route path="/" component={HomePage} />
//               <Route path="/new" component={NewPost} />
//               <Route path="/space/:spaceHandle/*" component={SpacePage} />
//             </DefaultTemplate>
//           </ContextProvider>
//         )}
//       />
//     </Router>
//   );
// }

// // working approach

// function AppWrapper(props: { children?: any }) {
//   return (
//     <ContextProvider>
//       <DefaultTemplate>{props.children}</DefaultTemplate>
//     </ContextProvider>
//   );
// }

// function NotFoundPage() {
//   return <p>Not found!!!!</p>;
// }

// export default function App() {
//   return (
//     <Router>
//       <Route path="/*" component={AppWrapper}>
//         <Route path="/" component={HomePage} />
//         <Route path="/new" component={NewPost} />
//         <Route path="/space/:spaceHandle/*" component={SpacePage} />
//         <Route path="*" component={NotFoundPage} />
//       </Route>
//     </Router>
//   );
// }

// // Doesn't work because ContextProvider & DefaultTemplate are not directly rendered by the parent route and this arn't in the router context
// export default function App() {
//   return (
//     <Router>
//       <Route path="/*">
//         <ContextProvider>
//           <DefaultTemplate>
//             <Route path="/" component={HomePage} />
//             <Route path="/new" component={NewPost} />
//             <Route path="/space/:spaceHandle/*" component={SpacePage} />
//             <Route path="*" component={NotFoundPage} />
//           </DefaultTemplate>
//         </ContextProvider>
//       </Route>
//     </Router>
//   );
// }
