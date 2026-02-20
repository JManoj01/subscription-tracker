import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type SubscriptionInput, type SubscriptionUpdateInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useSubscriptions() {
  return useQuery({
    queryKey: [api.subscriptions.list.path],
    queryFn: async () => {
      const res = await fetch(api.subscriptions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      // Validate with Zod schema from shared routes
      return api.subscriptions.list.responses[200].parse(await res.json());
    },
  });
}

export function useSubscription(id: number) {
  return useQuery({
    queryKey: [api.subscriptions.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.subscriptions.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch subscription");
      return api.subscriptions.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SubscriptionInput) => {
      const res = await fetch(api.subscriptions.create.path, {
        method: api.subscriptions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create subscription");
      }
      return api.subscriptions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.subscriptions.list.path] });
      toast({
        title: "Success",
        description: "Subscription tracked successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & SubscriptionUpdateInput) => {
      const url = buildUrl(api.subscriptions.update.path, { id });
      const res = await fetch(url, {
        method: api.subscriptions.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update subscription");
      return api.subscriptions.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.subscriptions.list.path] });
      toast({
        title: "Updated",
        description: "Subscription details updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.subscriptions.delete.path, { id });
      const res = await fetch(url, {
        method: api.subscriptions.delete.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete subscription");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.subscriptions.list.path] });
      toast({
        title: "Deleted",
        description: "Subscription removed from tracking",
      });
    },
  });
}
