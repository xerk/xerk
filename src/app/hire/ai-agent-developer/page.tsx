import { HireLanding, landingMeta } from "@/components/xerk/hire-landing";
import { getLanding } from "@/data/landing";

export const revalidate = 3600;

const landing = getLanding("ai-agent-developer")!;
export const metadata = landingMeta(landing);

export default function Page() {
  return <HireLanding landing={landing} />;
}
