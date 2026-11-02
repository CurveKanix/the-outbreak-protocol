import "./globals.css";
export const metadata = { title: "The Outbreak Protocol", description: "Host-driven social deduction" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="th"><body className="scanline">{children}</body></html>; }
