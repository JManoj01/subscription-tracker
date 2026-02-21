package com.subscriptiontracker;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

public class SubscriptionService {

  public static double monthlyEquivalentCents(Subscription sub) {
    int c = sub.getCost();
    switch (sub.getCycle() != null ? sub.getCycle() : "monthly") {
      case "weekly":   return c * (52.0 / 12.0);
      case "monthly":  return c;
      case "quarterly": return c / 3.0;
      case "semiannual": return c / 6.0;
      case "yearly":   return c / 12.0;
      default:         return c;
    }
  }

  public static double totalMonthlyCents(List<Subscription> subscriptions) {
    return subscriptions.stream()
        .filter(s -> "active".equals(s.getStatus()))
        .mapToDouble(SubscriptionService::monthlyEquivalentCents)
        .sum();
  }

  public static double totalYearlyCents(List<Subscription> subscriptions) {
    return totalMonthlyCents(subscriptions) * 12;
  }

  public static Long trialDaysLeft(Subscription sub) {
    if (!sub.isTrial() || sub.getTrialEndDate() == null || sub.getTrialEndDate().isEmpty())
      return null;
    try {
      Instant end = Instant.parse(sub.getTrialEndDate());
      LocalDate endDate = LocalDate.ofInstant(end, ZoneId.systemDefault());
      LocalDate today = LocalDate.now();
      return ChronoUnit.DAYS.between(today, endDate);
    } catch (Exception e) {
      return null;
    }
  }

  public static boolean isTrialEndingSoon(Subscription sub) {
    Long days = trialDaysLeft(sub);
    return days != null && days >= 0 && days <= 3;
  }
}
