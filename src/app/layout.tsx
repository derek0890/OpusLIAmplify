import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { getBrandingAccentColor } from "@/lib/actions/branding";
import { contrastForeground } from "@/lib/color";
import { APP_NAME } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Opus Technologies employee advocacy portal",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const accentColor = await getBrandingAccentColor();
  const accentForeground = contrastForeground(accentColor);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={
        {
          "--accent": accentColor,
          "--accent-foreground": accentForeground,
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
