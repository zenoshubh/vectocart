import React, { Component, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-dvh bg-white flex items-center justify-center p-4">
          <Card className="border border-red-200 max-w-md w-full">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-red-50 p-3 mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-[#111827] mb-2">Something went wrong</h2>
                <p className="text-sm text-[#6B7280] mb-4">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <Button
                  onClick={this.handleReset}
                  className="bg-[#E40046] hover:bg-[#CC003F] text-white"
                >
                  Try again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

