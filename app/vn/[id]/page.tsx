import VnDetail from "@/components/vn-detail";

export const dynamic = "force-dynamic";

export default function VisualNovelPage({ params }: { params: { id: string } }) {
  return <VnDetail id={params.id} />;
}
