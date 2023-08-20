"use client"
import { AppProps } from "next/app";
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
                <body>{children}</body>
            </ThemeProvider>
        </html>
    );
}
