import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper to get userId from req.user
  const getUserId = (req: any) => req.user.claims.sub;

  app.get(api.subscriptions.list.path, isAuthenticated, async (req, res) => {
    const subs = await storage.getSubscriptions(getUserId(req));
    res.json(subs);
  });

  app.get(api.subscriptions.export.path, isAuthenticated, async (req, res) => {
    const subs = await storage.getSubscriptions(getUserId(req));
    const header = "Name,Cost,Cycle,Category,Status,StartDate,IsTrial,TrialEndDate\n";
    const rows = subs.map(s => 
      `"${s.name}",${s.cost / 100},"${s.cycle}","${s.category}","${s.status}","${s.startDate.toISOString()}",${s.isTrial},"${s.trialEndDate?.toISOString() || ""}"`
    ).join("\n");
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscriptions.csv');
    res.send(header + rows);
  });

  app.get(api.subscriptions.get.path, isAuthenticated, async (req, res) => {
    const sub = await storage.getSubscription(Number(req.params.id), getUserId(req));
    if (!sub) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.json(sub);
  });

  app.post(api.subscriptions.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.subscriptions.create.input.parse(req.body);
      const sub = await storage.createSubscription(getUserId(req), input);
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

  app.patch(api.subscriptions.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.subscriptions.update.input.parse(req.body);
      const sub = await storage.updateSubscription(Number(req.params.id), getUserId(req), input);
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

  app.delete(api.subscriptions.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteSubscription(Number(req.params.id), getUserId(req));
    res.status(204).end();
  });

  return httpServer;
}
