import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ color: "#dc2626", marginBottom: 16 }}>Something went wrong</h1>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f1f5f9", padding: 16, borderRadius: 8, fontSize: 14 }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
