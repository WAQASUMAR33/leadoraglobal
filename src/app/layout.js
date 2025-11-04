import { Inter } from "next/font/google";
import "./globals.css";
import ThemeRegistry from './ThemeRegistry';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Ledora Global",
  description: "Join the future with Ledora Global - Your gateway to exclusive packages, rewards, and e-commerce.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
