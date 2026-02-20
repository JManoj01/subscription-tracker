import { SubscriptionResponse } from "@shared/routes";
import { Wallet, AlertTriangle, CalendarCheck } from "lucide-react";
import { differenceInDays } from "date-fns";

interface StatsOverviewProps {
  subscriptions: SubscriptionResponse[];
}

export function StatsOverview({ subscriptions }: StatsOverviewProps) {
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  
  // Calculate monthly burn
  const monthlyTotal = activeSubs.reduce((acc, sub) => {
    let monthlyCost = sub.cost;
    if (sub.cycle === 'yearly') monthlyCost = sub.cost / 12;
    if (sub.cycle === 'weekly') monthlyCost = sub.cost * 4.33;
    return acc + monthlyCost;
  }, 0);

  const yearlyTotal = monthlyTotal * 12;

  // Find expiring trials
  const expiringTrials = subscriptions.filter(sub => {
    if (!sub.isTrial || !sub.trialEndDate) return false;
    const daysLeft = differenceInDays(new Date(sub.trialEndDate), new Date());
    return daysLeft >= 0 && daysLeft <= 5;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Wallet className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <p className="text-muted-foreground font-medium mb-1">Monthly Recurring</p>
          <h2 className="text-4xl font-bold font-display text-primary tracking-tight">
            ${(monthlyTotal / 100).toFixed(2)}
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            ≈ ${(yearlyTotal / 100).toFixed(0)} / year
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <CalendarCheck className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <p className="text-muted-foreground font-medium mb-1">Active Subscriptions</p>
          <h2 className="text-4xl font-bold font-display text-primary tracking-tight">
            {activeSubs.length}
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            across {new Set(activeSubs.map(s => s.cycle)).size} billing cycles
          </p>
        </div>
      </div>

      <div className={`
        rounded-2xl p-6 border shadow-sm relative overflow-hidden
        ${expiringTrials.length > 0 
          ? 'bg-amber-50/50 border-amber-200' 
          : 'bg-white border-border/50'}
      `}>
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <AlertTriangle className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <p className={`${expiringTrials.length > 0 ? "text-amber-700" : "text-muted-foreground"} font-medium mb-1`}>
            Expiring Trials
          </p>
          <h2 className={`text-4xl font-bold font-display tracking-tight ${expiringTrials.length > 0 ? "text-amber-600" : "text-primary"}`}>
            {expiringTrials.length}
          </h2>
          <p className={`${expiringTrials.length > 0 ? "text-amber-600/80" : "text-muted-foreground"} text-xs mt-2`}>
            {expiringTrials.length > 0 
              ? "Action needed soon!" 
              : "No trials ending in the next 5 days"}
          </p>
        </div>
      </div>
    </div>
  );
}
