import { useParams } from "react-router-dom";
import { PublishedPolicy } from "@/components/governance/PublishedPolicy";
import NotFound from "./NotFound";

export default function PolicyPage() {
  const { slug } = useParams();
  return <PublishedPolicy slug={slug ?? ""} fallback={<NotFound />} />;
}
