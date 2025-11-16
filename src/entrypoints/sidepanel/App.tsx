import { HiOutlineShoppingCart } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function App() {
  return (
    <div className="min-h-dvh bg-white text-[#111827]">
      {/* Top bar */}
      <header className="px-4 py-3 border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[#E40046] flex items-center justify-center">
              <HiOutlineShoppingCart className="h-4 w-4 text-white" aria-hidden />
            </div>
            <span className="text-base font-semibold tracking-tight">VectoCart</span>
          </div>
          <span className="text-xs text-[#6B7280]">Side Panel</span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pt-5">
        <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#E40046] via-[#CC003F] to-[#B00037] px-4 py-6"
          >
            <h1 className="text-white text-xl font-semibold leading-snug">
              Collaborative shopping that helps teams decide faster
            </h1>
            <p className="mt-1.5 text-white/85 text-sm">
              Create a room, add products from any store, and let everyone vote —
              right inside your browser.
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" className="bg-white text-[#111827] hover:bg-white/95">
                Get started
              </Button>
              <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/15">
                Learn more
              </Button>
            </div>
          </div>
          <div className="bg-white"></div>
        </div>
      </section>

      {/* Features */}
      <main className="px-4 py-5">
        <div className="grid grid-cols-1 gap-3">
          <FeatureCard
            title="Create shared rooms"
            description="Spin up a room with a short code and invite your team in one click."
            badge="Real‑time"
          />
          <FeatureCard
            title="Add products from top stores"
            description="Amazon, Flipkart, Meesho — all in one place."
            badge="Multi‑store"
          />
          <FeatureCard
            title="Vote and decide together"
            description="Upvote/downvote and sort to the top. One vote per person, always."
            badge="Fair votes"
          />
          <FeatureCard
            title="Side panel workflow"
            description="Stay on the product page while the room updates live alongside."
            badge="Focused"
          />
        </div>

        {/* Secondary CTA */}
        <Card className="mt-5 border border-[#E5E7EB] bg-[#F8F9FA]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Ready to start?</h3>
                <p className="text-sm text-[#6B7280]">
                  Open or create a room to begin adding products.
                </p>
              </div>
              <Button className="bg-[#E40046] hover:bg-[#CC003F] active:bg-[#B00037] text-white">
                Open room
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default App;

function FeatureCard(props: { title: string; description: string; badge: string }) {
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
