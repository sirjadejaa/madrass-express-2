"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center w-full h-full bg-muted/20 border-2 border-dashed border-border rounded-xl">
          <AlertCircle className="w-12 h-12 text-destructive mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2 text-foreground">Failed to load content</h2>
          <p className="text-muted-foreground text-sm">There was a problem rendering this component.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
