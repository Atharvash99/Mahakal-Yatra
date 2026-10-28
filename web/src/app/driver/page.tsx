import type { Metadata } from "next";
import DriverApp from "@/components/DriverApp";

export const metadata: Metadata = {
  title: "Driver portal | MahakalYatra",
  robots: { index: false, follow: false },
};

export default function DriverPage() {
  return (
    <div className="bg-cream px-4 py-8">
      <DriverApp />
    </div>
  );
}
