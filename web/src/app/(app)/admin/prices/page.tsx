import { PriceReview } from "@/components/admin/price-review";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function PriceReviewPage() {
  return (
    <div>
      <ScreenHeader title="Review prices" />
      <PriceReview />
    </div>
  );
}
