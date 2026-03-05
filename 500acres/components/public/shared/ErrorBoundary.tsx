'use client';

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-8">
          <p className="font-sans text-xs uppercase tracking-[0.4em] text-charcoal/30 mb-8">
            Something went wrong
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-charcoal mb-6 text-center">
            We hit a snag.
          </h1>
          <p className="font-serif text-lg text-charcoal/50 mb-10 text-center max-w-md">
            Something unexpected happened. Let&apos;s get you back on track.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = "/";
            }}
            className="bg-charcoal text-cream px-8 py-4 rounded-full font-serif text-lg hover:bg-forest transition-colors"
          >
            Back to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
