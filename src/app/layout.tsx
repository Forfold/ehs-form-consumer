import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Providers from "./Providers";
import AuthGate from "./components/main/AuthGate";
import type { ThemeMode } from "./theme";
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
  title: "FormVis",
  description: "Extract and visualize industrial stormwater inspection data",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("theme")?.value;
  const initialMode: ThemeMode =
    cookieTheme === "dark" ? "dark" : cookieTheme === "system" ? "system" : "light";

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers initialMode={initialMode}>
            <AuthGate>{children}</AuthGate>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
