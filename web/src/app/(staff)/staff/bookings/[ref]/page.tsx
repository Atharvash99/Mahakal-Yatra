import { Suspense } from "react";
import BookingDetail from "@/components/staff/BookingDetail";
import { Loading } from "@/components/staff/ui";

async function Detail({ params }: { params: PageProps<"/staff/bookings/[ref]">["params"] }) {
  const { ref } = await params;
  return <BookingDetail bookingRef={ref} />;
}

export default function BookingPage(props: PageProps<"/staff/bookings/[ref]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Detail params={props.params} />
    </Suspense>
  );
}
