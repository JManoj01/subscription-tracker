import { SubscriptionResponse } from "@shared/routes";
import { format, differenceInDays } from "date-fns";
import { Calendar, CreditCard, ExternalLink, AlertTriangle, MoreVertical, Trash2, Edit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeleteSubscription } from "@/hooks/use-subscriptions";
import { useState } from "react";
import { SubscriptionForm } from "./SubscriptionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubscriptionCardProps {
  subscription: SubscriptionResponse;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const { mutate: deleteSub } = useDeleteSubscription();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const daysUntilTrialEnds = subscription.isTrial && subscription.trialEndDate
    ? differenceInDays(new Date(subscription.trialEndDate), new Date())
    : null;

  const isTrialEndingSoon = daysUntilTrialEnds !== null && daysUntilTrialEnds <= 3 && daysUntilTrialEnds >= 0;
  const isTrialExpired = daysUntilTrialEnds !== null && daysUntilTrialEnds < 0;

  return (
    <>
      <div className="group relative bg-white rounded-2xl p-6 border border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
              <span className="font-display font-bold text-lg">
                {subscription.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg leading-tight">
                {subscription.name}
              </h3>
              <a 
                href={subscription.url || "#"} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5 transition-colors"
              >
                {subscription.url ? new URL(subscription.url).hostname : "No URL"}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteSub(subscription.id)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              ${(subscription.cost / 100).toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground font-medium">
              /{subscription.cycle}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Started {format(new Date(subscription.startDate), "MMM d, yyyy")}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span className="capitalize">{subscription.status}</span>
            </div>
          </div>

          {subscription.isTrial && (
            <div className={`
              mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2
              ${isTrialExpired ? 'bg-destructive/10 text-destructive' : 
                isTrialEndingSoon ? 'bg-amber-50 text-amber-600' : 'bg-secondary text-secondary-foreground'}
            `}>
              {isTrialEndingSoon && <AlertTriangle className="w-4 h-4" />}
              {isTrialExpired 
                ? "Trial expired" 
                : `${daysUntilTrialEnds} days left in trial`}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          <SubscriptionForm 
            mode="edit" 
            initialData={subscription} 
            onSuccess={() => setIsEditOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
