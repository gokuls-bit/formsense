import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "FormSense AI - Enterprise Document Intelligence",
    description: "Automated Form & Document Intelligence System",
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
