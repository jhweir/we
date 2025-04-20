import DefaultTemplate from '@/templates/Default';
import type { Metadata } from 'next';
import './globals.css';
import ContextProvider from '../contexts'

export const metadata: Metadata = {
  title: 'WE',
  description: 'We are one',
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
