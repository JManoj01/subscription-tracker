package com.subscriptiontracker;

import com.google.gson.Gson;
import io.javalin.Javalin;
import io.javalin.http.HttpStatus;
import io.javalin.json.JavalinGson;

import java.util.List;
import java.util.Map;

public class Main {
  private static final Gson GSON = new Gson();
  private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));

  public static void main(String[] args) {
    SubscriptionRepository repo = new SubscriptionRepository();
    Javalin app = Javalin.create(config -> {
      config.jsonMapper(new JavalinGson(GSON, false));
      config.staticFiles.add(staticFileConfig -> {
        staticFileConfig.hostedPath = "/";
        staticFileConfig.directory = "/static";
        staticFileConfig.location = io.javalin.http.staticfiles.Location.CLASSPATH;
      });
    });

    app.get("/", ctx -> ctx.redirect("/index.html"));

    app.get("/api/subscriptions", ctx -> {
      List<Subscription> list = repo.findAll();
      ctx.json(list);
    });

    app.get("/api/subscriptions/{id}", ctx -> {
      int id = Integer.parseInt(ctx.pathParam("id"));
      repo.findById(id).ifPresentOrElse(ctx::json, () -> ctx.status(HttpStatus.NOT_FOUND).json(Map.of("message", "Subscription not found")));
    });

    app.post("/api/subscriptions", ctx -> {
      Subscription body = ctx.bodyAsClass(Subscription.class);
      validateCreate(body);
      Subscription created = repo.create(normalizeForCreate(body));
      ctx.status(HttpStatus.CREATED).json(created);
    });

    app.patch("/api/subscriptions/{id}", ctx -> {
      int id = Integer.parseInt(ctx.pathParam("id"));
      Subscription body = ctx.bodyAsClass(Subscription.class);
      Subscription updated = repo.update(id, body);
      if (updated == null) {
        ctx.status(HttpStatus.NOT_FOUND).json(Map.of("message", "Subscription not found"));
        return;
      }
      ctx.json(updated);
    });

    app.delete("/api/subscriptions/{id}", ctx -> {
      int id = Integer.parseInt(ctx.pathParam("id"));
      boolean deleted = repo.delete(id);
      if (deleted) {
        ctx.status(HttpStatus.NO_CONTENT);
      } else {
        ctx.status(HttpStatus.NOT_FOUND).json(Map.of("message", "Subscription not found"));
      }
    });

    app.exception(IllegalArgumentException.class, (e, ctx) -> {
      ctx.status(HttpStatus.BAD_REQUEST).json(Map.of("message", e.getMessage()));
    });

    try {
      app.start(PORT);
      System.out.println("Subscription Tracker running at http://localhost:" + PORT);
    } catch (Exception e) {
      if (e.getMessage() != null && e.getMessage().contains("Port already in use")) {
        System.err.println("ERROR: Port " + PORT + " is already in use.");
        System.err.println("Either stop the process using port " + PORT + " or set a different port:");
        System.err.println("  PORT=8080 mvn exec:java -Dexec.mainClass=\"com.subscriptiontracker.Main\"");
        System.exit(1);
      }
      throw e;
    }
  }

  private static void validateCreate(Subscription sub) {
    if (sub.getName() == null || sub.getName().isBlank()) {
      throw new IllegalArgumentException("name is required");
    }
    if (sub.getCostOrNull() == null || sub.getCost() < 0) {
      throw new IllegalArgumentException("cost must be non-negative");
    }
    if (sub.getCycle() == null || sub.getCycle().isBlank()) {
      sub.setCycle("monthly");
    }
  }

  private static Subscription normalizeForCreate(Subscription sub) {
    if (sub.getStartDate() == null || sub.getStartDate().isEmpty()) {
      sub.setStartDate(java.time.Instant.now().toString());
    }
    if (sub.getStatus() == null || sub.getStatus().isEmpty()) {
      sub.setStatus("active");
    }
    if (sub.getCostOrNull() == null) {
      sub.setCost(0);
    }
    return sub;
  }
}
