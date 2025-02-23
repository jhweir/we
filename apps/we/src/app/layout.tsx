import DefaultTemplate from '@/templates/Default';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WE',
  description: 'We are one',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DefaultTemplate>{children}</DefaultTemplate>
      </body>
    </html>
  );
}
