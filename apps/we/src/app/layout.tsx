import DefaultTemplate from '@/templates/Default';
import type { Metadata } from 'next';
import ContextProvider from '../contexts';
import './globals.css';

export const metadata: Metadata = {
  title: 'WE',
  description: 'Social media for a new internet',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ContextProvider>
          <DefaultTemplate>{children}</DefaultTemplate>
        </ContextProvider>
      </body>
    </html>
  );
}
