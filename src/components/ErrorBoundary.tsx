"use client";

import { Component, ReactNode } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to monitoring service (Sentry, etc.)
        console.error("Error caught by boundary:", error, errorInfo);

        // TODO: Send to Sentry
        // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-black mb-2">Something went wrong</h1>
                        <p className="text-muted-text mb-6">
                            We're sorry for the inconvenience. Please try refreshing the page.
                        </p>
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                                <p className="text-xs font-mono text-red-900 break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="primary"
                                onClick={() => window.location.reload()}
                            >
                                Refresh Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => (window.location.href = "/")}
                            >
                                Go Home
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
