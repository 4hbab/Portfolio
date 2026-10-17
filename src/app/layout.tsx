import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { siteMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

// Variable on weight, width and optical size: headings get the display cut at
// large sizes, and the hero sets the name in a narrower width.
const bricolage = Bricolage_Grotesque({
    subsets: ["latin"],
    variable: "--font-bricolage",
    display: "swap",
    axes: ["opsz", "wdth"],
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains-mono",
    display: "swap",
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${bricolage.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
            <head>
                {/* Runs before first paint so the hero can hold its animated
                    parts back instead of flashing them before hydration. Without
                    JS the class never lands and everything simply shows. */}
                <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
            </head>
            <body>
                <a href="#main-content" className="skip-to-content">
                    Skip to content
                </a>
                {children}
            </body>
        </html>
    );
}
