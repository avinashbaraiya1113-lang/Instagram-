export const metadata = { title: "Comment → DM" };

export default function RootLayout({ children }) {
  return (
    <html lang="gu">
      <body
        style={{
          margin: 0,
          padding: "20px 16px",
          fontFamily: "system-ui, 'Noto Sans Gujarati', sans-serif",
          color: "#1d1d1f",
          background: "#fafafa",
        }}
      >
        {children}
      </body>
    </html>
  );
}
