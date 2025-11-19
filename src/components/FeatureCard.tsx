import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function FeatureCard(props: { title: string; description: string; badge: string }) {
  return (
    <Card className="border border-[#E5E7EB] bg-white">
      <CardHeader className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">{props.title}</CardTitle>
              <span className="rounded-full bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-medium text-[#6B7280] border border-[#E5E7EB]">
                {props.badge}
              </span>
            </div>
            <CardDescription className="mt-1">{props.description}</CardDescription>
          </div>
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#E5E7EB] text-[#6B7280]"
            aria-hidden
          >
            →
          </span>
        </div>
      </CardHeader>
    </Card>
  );
}


