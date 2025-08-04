// src/app/layout.jsx
import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import ConditionalNavbar from "../components/ConditionalNavbar";
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: "Amazon Clone",
  description: "E-commerce platform built with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ConditionalNavbar />
          <main>{children}</main>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
