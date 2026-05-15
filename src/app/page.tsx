import Globe from "@/components/Globe";

// World Bank data is annual — 24h ISR cache is appropriate
export const revalidate = 86400;

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Globe />
    </main>
  );
}
