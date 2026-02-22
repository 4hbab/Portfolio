import type { Metadata } from "next";
import { DM_Sans, Bebas_Neue } from "next/font/google";
import { siteMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-display",
    display: "swap",
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${dmSans.variable} ${bebasNeue.variable}`}>
            <body>
                <a href="#main-content" className="skip-to-content">
                    Skip to content
                </a>
                {children}
            </body>
        </html>
    );
}
