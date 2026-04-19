import "./globals.css";
import { getSEOTags } from "@/lib/seo";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = getSEOTags();

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body
        className={`antialiased ${poppins.variable}`}
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        {children}
      </body>
    </html>
  );
}

