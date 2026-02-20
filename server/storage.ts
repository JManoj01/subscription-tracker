import { db } from "./db";
import {
  subscriptions,
  type CreateSubscriptionRequest,
  type UpdateSubscriptionRequest,
  type SubscriptionResponse
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getSubscriptions(userId: string): Promise<SubscriptionResponse[]>;
  getSubscription(id: number, userId: string): Promise<SubscriptionResponse | undefined>;
  createSubscription(userId: string, subscription: CreateSubscriptionRequest): Promise<SubscriptionResponse>;
  updateSubscription(id: number, userId: string, updates: UpdateSubscriptionRequest): Promise<SubscriptionResponse>;
  deleteSubscription(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSubscriptions(userId: string): Promise<SubscriptionResponse[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  }

  async getSubscription(id: number, userId: string): Promise<SubscriptionResponse | undefined> {
    const [sub] = await db.select().from(subscriptions).where(
      and(eq(subscriptions.id, id), eq(subscriptions.userId, userId))
    );
    return sub;
  }

  async createSubscription(userId: string, sub: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    const [created] = await db.insert(subscriptions).values({ ...sub, userId }).returning();
    return created;
  }

  async updateSubscription(id: number, userId: string, updates: UpdateSubscriptionRequest): Promise<SubscriptionResponse> {
    const [updated] = await db.update(subscriptions)
      .set(updates)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .returning();
    if (!updated) throw new Error("Subscription not found or unauthorized");
    return updated;
  }

  async deleteSubscription(id: number, userId: string): Promise<void> {
    await db.delete(subscriptions).where(
      and(eq(subscriptions.id, id), eq(subscriptions.userId, userId))
    );
  }
}

export const storage = new DatabaseStorage();