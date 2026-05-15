import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SummaryCard from "@/components/SummaryCard";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Counter component to render value directly
vi.mock("@/components/Counter", () => ({
  default: ({ value, formatter }: { value: number; formatter: (v: number) => string }) => (
    <span data-testid="counter-value">{formatter(value)}</span>
  ),
}));

describe("SummaryCard", () => {
  it("renders the title", () => {
    render(
      <SummaryCard
        title="PRIMARY_GROWTH"
        value={3.45}
        icon={<span>📈</span>}
        trend="UP"
        type="percent"
      />
    );
    expect(screen.getByText(/PRIMARY_GROWTH/i)).toBeInTheDocument();
  });

  it("renders percent values correctly", () => {
    render(
      <SummaryCard
        title="INFLATION"
        value={5.67}
        icon={<span>🔥</span>}
        trend="HIGH"
        type="percent"
      />
    );
    expect(screen.getByTestId("counter-value")).toHaveTextContent("5.67%");
  });

  it("shows UP trend indicator for positive trends", () => {
    render(
      <SummaryCard
        title="GROWTH"
        value={2.1}
        icon={<span>↑</span>}
        trend="UP"
        type="percent"
      />
    );
    expect(screen.getByText("UP")).toBeInTheDocument();
  });

  it("shows DOWN trend indicator for negative trends", () => {
    render(
      <SummaryCard
        title="GROWTH"
        value={-1.2}
        icon={<span>↓</span>}
        trend="DOWN"
        type="percent"
      />
    );
    expect(screen.getByText("DOWN")).toBeInTheDocument();
  });

  it("hides trend indicator for NEUTRAL", () => {
    render(
      <SummaryCard
        title="WEALTH"
        value={45000}
        icon={<span>💰</span>}
        trend="NEUTRAL"
        type="pcap"
      />
    );
    expect(screen.queryByText("NEUTRAL")).not.toBeInTheDocument();
  });
});
