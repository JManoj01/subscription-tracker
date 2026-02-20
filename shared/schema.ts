import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  cost: integer("cost").notNull(), // stored in cents
  cycle: text("cycle").notNull(), // 'monthly', 'yearly', 'weekly', 'quarterly'
  startDate: timestamp("start_date").defaultNow().notNull(),
  isTrial: boolean("is_trial").default(false).notNull(),
  trialEndDate: timestamp("trial_end_date"),
  status: text("status").default('active').notNull(), // 'active', 'cancelled'
  url: text("url"),
  category: text("category").default('other').notNull(), // 'entertainment', 'productivity', 'utilities', 'other'
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, userId: true });

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type CreateSubscriptionRequest = InsertSubscription;
export type UpdateSubscriptionRequest = Partial<InsertSubscription>;

export type SubscriptionResponse = Subscription;
export type SubscriptionsListResponse = Subscription[];
