import { AuthProvider } from '@/components/auth-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { TimezoneProvider } from '@/components/timezone-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { WorkspaceProvider } from '@/components/workspace-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TimezoneProvider>
          <AuthProvider>
            <WorkspaceProvider>
              {children}
            </WorkspaceProvider>
          </AuthProvider>
        </TimezoneProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
