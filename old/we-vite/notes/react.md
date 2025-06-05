# React patterns to follow

## Lazy loading of components to improve intial load time

<!-- import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy loaded components
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
} -->

## Prefetching with lazy loading

<!-- import { lazy, Suspense, useEffect } from 'react';

const ProductDetail = lazy(() => import('./pages/ProductDetail'));

function ProductList({ products }) {
  // Prefetch on hover
  const prefetchProduct = (id) => {
    import('./pages/ProductDetail');
  };

  return (
    <ul>
      {products.map(product => (
        <li
          key={product.id}
          onMouseEnter={() => prefetchProduct(product.id)}
        >
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </li>
      ))}
    </ul>
  );
} -->

## Nested Susupense with fallbacks for async data fetching

<!-- function Profile() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <UserBasicInfo />  {/* Has its own data requirements */}

      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts />  {/* Separate data dependency */}
      </Suspense>

      <Suspense fallback={<FriendsSkeleton />}>
        <UserFriends />  {/* Another separate dependency */}
      </Suspense>
    </Suspense>
  );
} -->

##
