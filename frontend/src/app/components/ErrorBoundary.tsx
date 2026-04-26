import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";

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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">문제가 발생했어요</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message ?? "알 수 없는 오류가 발생했습니다."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              다시 시도
            </Button>
            <Button onClick={() => window.location.reload()}>
              새로고침
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
