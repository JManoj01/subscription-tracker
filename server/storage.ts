import { db } from "./db";
import {
  subscriptions,
  type CreateSubscriptionRequest,
  type UpdateSubscriptionRequest,
  type SubscriptionResponse
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getSubscriptions(): Promise<SubscriptionResponse[]>;
  getSubscription(id: number): Promise<SubscriptionResponse | undefined>;
  createSubscription(subscription: CreateSubscriptionRequest): Promise<SubscriptionResponse>;
  updateSubscription(id: number, updates: UpdateSubscriptionRequest): Promise<SubscriptionResponse>;
  deleteSubscription(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSubscriptions(): Promise<SubscriptionResponse[]> {
    return await db.select().from(subscriptions);
  }

  async getSubscription(id: number): Promise<SubscriptionResponse | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return sub;
  }

  async createSubscription(sub: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    const [created] = await db.insert(subscriptions).values(sub).returning();
    return created;
  }

  async updateSubscription(id: number, updates: UpdateSubscriptionRequest): Promise<SubscriptionResponse> {
    const [updated] = await db.update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async deleteSubscription(id: number): Promise<void> {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
  }
}

export const storage = new DatabaseStorage();