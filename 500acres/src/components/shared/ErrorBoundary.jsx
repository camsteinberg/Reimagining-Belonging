import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
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
            Something unexpected happened. Let's get you back on track.
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
