import { useState } from "react";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { StatsOverview } from "@/components/StatsOverview";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: subscriptions, isLoading, error } = useSubscriptions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredSubscriptions = subscriptions?.filter(sub => 
    sub.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="h-12 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error loading subscriptions. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Pattern Background */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-white to-transparent pointer-events-none" />

      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl mb-2 text-primary font-display">
              Forensics
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your recurring commitments.
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="btn-primary gap-2">
                <Plus className="w-5 h-5" />
                Add Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Subscription</DialogTitle>
                <DialogDescription>
                  Enter the details of the service you want to track.
                </DialogDescription>
              </DialogHeader>
              <SubscriptionForm 
                mode="create" 
                onSuccess={() => setIsCreateOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {subscriptions && <StatsOverview subscriptions={subscriptions} />}

        {/* Filters & Search */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search subscriptions..." 
              className="pl-9 bg-white border-transparent shadow-sm hover:border-border/50 focus:border-primary transition-all rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl bg-white border-transparent shadow-sm">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map((sub) => (
            <SubscriptionCard key={sub.id} subscription={sub} />
          ))}

          {filteredSubscriptions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-3xl bg-white/50">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">No subscriptions found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {search ? "Try adjusting your search terms." : "Start tracking your expenses by adding your first subscription."}
              </p>
              {!search && (
                <Button 
                  variant="link" 
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 text-primary font-semibold"
                >
                  Add one now
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
