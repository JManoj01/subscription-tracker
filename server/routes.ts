import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.subscriptions.list.path, async (req, res) => {
    const subs = await storage.getSubscriptions();
    res.json(subs);
  });

  app.get(api.subscriptions.get.path, async (req, res) => {
    const sub = await storage.getSubscription(Number(req.params.id));
    if (!sub) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.json(sub);
  });

  app.post(api.subscriptions.create.path, async (req, res) => {
    try {
      const input = api.subscriptions.create.input.parse(req.body);
      const sub = await storage.createSubscription(input);
      res.status(201).json(sub);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.subscriptions.update.path, async (req, res) => {
    try {
      const input = api.subscriptions.update.input.parse(req.body);
      const sub = await storage.updateSubscription(Number(req.params.id), input);
      res.json(sub);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.subscriptions.delete.path, async (req, res) => {
    await storage.deleteSubscription(Number(req.params.id));
    res.status(204).end();
  });

  // Seed data on startup
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getSubscriptions();
  if (existing.length === 0) {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14);

    await storage.createSubscription({
      name: "Netflix",
      cost: 1549, // $15.49
      cycle: "monthly",
      startDate: new Date("2023-01-15"),
      isTrial: false,
      status: "active"
    });

    await storage.createSubscription({
      name: "Adobe Creative Cloud",
      cost: 5499, // $54.99
      cycle: "monthly",
      startDate: new Date(),
      isTrial: true,
      trialEndDate: threeDaysFromNow,
      status: "active"
    });

    await storage.createSubscription({
      name: "Spotify",
      cost: 1099, // $10.99
      cycle: "monthly",
      startDate: new Date("2022-06-01"),
      isTrial: false,
      status: "active"
    });

    await storage.createSubscription({
      name: "Amazon Prime",
      cost: 13900, // $139.00
      cycle: "yearly",
      startDate: new Date(),
      isTrial: true,
      trialEndDate: twoWeeksFromNow,
      status: "active"
    });
  }
}