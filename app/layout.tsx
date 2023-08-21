"use client"
import { AppProps } from "next/app";
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from "next-themes";
import "../css/tailwind.css";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <ThemeProvider attribute="class">
                <body>
                    {children}
                    <Analytics />
                </body>
            </ThemeProvider>
        </html>
    );
}
