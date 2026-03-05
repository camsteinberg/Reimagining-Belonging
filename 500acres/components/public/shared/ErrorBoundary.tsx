'use client';

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** When true, renders a compact inline fallback instead of a full-page one. */
  inline?: boolean;
  /** Label shown in the inline fallback heading (e.g. "Analytics"). */
  label?: string;
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

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.inline) {
        return (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-6 py-12 text-center">
            <p className="font-sans text-xs uppercase tracking-[0.4em] text-[var(--color-text-muted)] mb-4">
              Something went wrong
            </p>
            <p className="font-serif text-lg font-semibold text-[var(--color-text)] mb-2">
              {this.props.label
                ? `Could not load ${this.props.label}.`
                : 'This section hit a snag.'}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-sm">
              An unexpected error occurred. You can try again or navigate away and come back.
            </p>
            <button
              onClick={this.handleRetry}
              className="rounded-full bg-[var(--color-charcoal)] px-6 py-2.5 font-serif text-sm text-[var(--color-warm-white)] hover:bg-[var(--color-forest)] transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      }

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
          <div className="flex items-center gap-4">
            <button
              onClick={this.handleRetry}
              className="bg-charcoal text-cream px-8 py-4 rounded-full font-serif text-lg hover:bg-forest transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="border border-charcoal/20 text-charcoal px-8 py-4 rounded-full font-serif text-lg hover:bg-charcoal/5 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
