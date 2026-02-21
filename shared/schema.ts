import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cost: integer("cost").notNull(), // stored in cents
  cycle: text("cycle").notNull(), // 'monthly', 'yearly', 'weekly'
  startDate: timestamp("start_date").defaultNow().notNull(),
  isTrial: boolean("is_trial").default(false).notNull(),
  trialEndDate: timestamp("trial_end_date"),
  status: text("status").default('active').notNull(), // 'active', 'cancelled'
  url: text("url"),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true });

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type CreateSubscriptionRequest = InsertSubscription;
export type UpdateSubscriptionRequest = Partial<InsertSubscription>;

export type SubscriptionResponse = Subscription;
export type SubscriptionsListResponse = Subscription[];
