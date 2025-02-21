'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const Elements = dynamic(() => import('@we/elements').then(() => () => null), { ssr: false });

export default function Navbar() {
  return (
    <div>
      <Elements />
      <p>Navbar</p>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/posts/1">Post 1</Link>
      <Link href="/posts/2">Post 2</Link>
    </div>
  );
}
