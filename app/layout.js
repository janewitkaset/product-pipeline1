export const metadata = { title: "Product Clip Generator", description: "AI Video Pipeline" };
export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, background: "#080808" }}>{children}</body>
    </html>
  );
}
