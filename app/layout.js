import "./globals.css";
import { APP_NAME } from "@/lib/options";

export const metadata = {
  title: `${APP_NAME}: photo-based crop disease check`,
  description:
    "Upload a photo of a sick leaf. Get the likely disease, what to do this week, and today's mandi price.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2C230",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anek+Devanagari:wdth,wght@75..125,400..800&family=Anek+Gurmukhi:wdth,wght@75..125,400..800&family=Anek+Latin:wdth,wght@75..125,400..800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
