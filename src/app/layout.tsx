
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';

export const metadata: Metadata = {
  metadataBase: new URL('https://corocat.me'),
  title: {
    default: 'Corocat: Your AI Guide to Learning Any Subject',
    template: `%s | Corocat`,
  },
  description: 'Corocat uses AI to create personalized learning courses on any topic. Go from beginner to expert with a structured, easy-to-follow plan.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/cat.png',
    apple: '/cat.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Corocat: Your AI Guide to Learning Any Subject',
    description: 'Corocat uses AI to create personalized learning courses on any topic. Go from beginner to expert with a structured, easy-to-follow plan.',
    url: 'https://corocat.me',
    siteName: 'Corocat',
    images: [
      {
        url: 'https://corocat.me/cat.png', // It's a good practice to create a social sharing image
        width: 100,
        height: 100,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Corocat: Your AI Guide to Learning Any Subject',
    description: 'Corocat uses AI to create personalized learning courses on any topic. Go from beginner to expert with a structured, easy-to-follow plan.',
    images: ['https://corocat.me/cat.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="44c3a21a-d2ed-40c1-9f3b-15ba275cb562"
        ></script>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-HP0G6MC9Q9"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HP0G6MC9Q9');
          `}
        </script>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <FirebaseErrorListener />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
