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
        url: 'https://corocat.me/cat.png',
        width: 400, // Reduced from 1200
        height: 400, // Reduced from 630 and made square
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
   twitter: {
    card: 'summary', // Changed from 'summary_large_image' to 'summary' for smaller icon
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
        <link rel="icon" href="/favicon.ico" />
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
          data-website-id="20a634ca-a2d2-44c3-8ef4-da69d61af767"
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