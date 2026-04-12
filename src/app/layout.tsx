import type { Metadata } from "next";
import { Cinzel, Source_Sans_3 } from "next/font/google";
import "@/app/globals.css";

const displayFont = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Blackjack Basic Strategy Trainer",
  description: "A focused blackjack basic-strategy training table with immediate corrective feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} font-body`}>
        {children}
      </body>
    </html>
  );
}
