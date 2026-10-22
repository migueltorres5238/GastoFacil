import "./globals.css";

export const metadata = {
  title: "GastoFácil",
  description: "Control de gastos personales para estudiantes",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f7a5a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
