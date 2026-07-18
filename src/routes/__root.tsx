import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { isAuthenticated } from "../lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { ErrorState } from "@/components/ui-ext/ErrorState";
import { EmptyState } from "@/components/ui-ext/EmptyState";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <EmptyState
          icon={<Compass className="h-5 w-5" aria-hidden />}
          title="404 — Page not found"
          description="The page you're looking for doesn't exist or has been moved."
          action={
            <Button asChild>
              <Link to="/">Go home</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <ErrorState
          title="This page didn't load"
          description="Something went wrong on our end. Try again or head back home."
          onRetry={() => {
            router.invalidate();
            reset();
          }}
          action={
            <Button variant="outline" asChild>
              <Link to="/">Go home</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    if (location.pathname === "/login") return;
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ERAP — Enterprise Remote Administration Platform" },
      { name: "description", content: "Enterprise remote administration, session management, agent deployment, and audit for private-WAN Windows fleets." },
      { name: "author", content: "ERAP" },
      { property: "og:title", content: "ERAP — Enterprise Remote Administration Platform" },
      { property: "og:description", content: "Enterprise remote administration, session management, agent deployment, and audit for private-WAN Windows fleets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
