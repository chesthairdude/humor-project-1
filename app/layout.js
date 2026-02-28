import "./globals.css";
import { Geist } from "next/font/google";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "FunnyOrNot",
  description: "Caption voting app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.variable}>
      <body style={{ fontFamily: "var(--font-geist-sans), -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
