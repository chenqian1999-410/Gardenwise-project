import "./globals.css";

export const metadata = {
  title: "GardenWise AI",
  description: "AI-powered water-efficient landscape design for Bay Area Zone 10a gardens."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
