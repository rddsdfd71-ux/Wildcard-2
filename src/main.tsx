import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";
import { initPostHog } from "./lib/analytics";

initPostHog();

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      return (
        <div style={{
          background: "#0a0a0a",
          color: "#fff",
          minHeight: "100vh",
          padding: "24px 16px",
          fontFamily: "monospace",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <h2 style={{ color: "#FF6B00", fontSize: "18px", margin: 0 }}>
            Wild Card — App Error
          </h2>
          <p style={{ color: "#aaa", fontSize: "13px", margin: 0 }}>
            Something crashed. Screenshot this and share it.
          </p>
          <div style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "11px",
            color: "#ff9999",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            maxHeight: "60vh",
            overflow: "auto"
          }}>
            {err?.name}: {err?.message}{"\n\n"}{err?.stack}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#FF6B00",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.log('SW setup:', e);
    }
  });
}

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Oswald:wght@500;600&family=Roboto:wght@400;500&display=swap";
document.head.appendChild(fontLink);

const fontAwesomeLink = document.createElement("link");
fontAwesomeLink.rel = "stylesheet";
fontAwesomeLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
document.head.appendChild(fontAwesomeLink);

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
