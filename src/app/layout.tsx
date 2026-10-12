import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Manrope, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { getBrandingSettings } from "@/lib/actions/branding";
import { contrastForeground } from "@/lib/color";
import { APP_NAME, fontCssVar } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The other curated font choices offered on /admin/branding. preload: false
// because only one of these is ever actually displayed per deployment — the
// browser only fetches whichever one --font-sans ends up pointing at.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], preload: false });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], preload: false });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Opus Technologies employee advocacy portal",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { accentColor, fontFamily } = await getBrandingSettings();
  const accentForeground = contrastForeground(accentColor);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
      style={
        {
          "--accent": accentColor,
          "--accent-foreground": accentForeground,
          "--font-sans": fontCssVar(fontFamily),
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
