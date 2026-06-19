import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

export function RouteTransition({ children }: { children: ReactNode }) {
  const status = useRouterState({ select: (s) => s.status });
  const [committedChildren, setCommittedChildren] = useState(children);

  useEffect(() => {
    if (status !== "pending") {
      setCommittedChildren(children);
    }
  }, [status, children]);

  const visibleChildren = status === "pending" ? committedChildren : children;

  return (
    <div
      data-route-container
      className="route-transition-root min-h-screen w-full max-w-[390px] mx-auto"
      style={{
        transition: "none",
        animation: "none",
      }}
    >
      {visibleChildren}
    </div>
  );
}
