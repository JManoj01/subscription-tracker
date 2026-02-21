package com.subscriptiontracker;

import java.time.Instant;

public class Subscription {
  private Integer id;
  private String name;
  private Integer cost;
  private String cycle;
  private String startDate;
  private boolean isTrial;
  private String trialEndDate;
  private String status;
  private String url;

  public Subscription() {}

  public Subscription(Integer id, String name, Integer cost, String cycle,
                      String startDate, boolean isTrial, String trialEndDate,
                      String status, String url) {
    this.id = id;
    this.name = name;
    this.cost = cost;
    this.cycle = cycle;
    this.startDate = startDate;
    this.isTrial = isTrial;
    this.trialEndDate = trialEndDate;
    this.status = status;
    this.url = url;
  }

  public Integer getId() { return id; }
  public void setId(Integer id) { this.id = id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public int getCost() { return cost != null ? cost : 0; }
  public Integer getCostOrNull() { return cost; }
  public void setCost(Integer cost) { this.cost = cost; }
  public String getCycle() { return cycle; }
  public void setCycle(String cycle) { this.cycle = cycle; }
  public String getStartDate() { return startDate; }
  public void setStartDate(String startDate) { this.startDate = startDate; }
  public boolean isTrial() { return isTrial; }
  public void setTrial(boolean trial) { isTrial = trial; }
  public String getTrialEndDate() { return trialEndDate; }
  public void setTrialEndDate(String trialEndDate) { this.trialEndDate = trialEndDate; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getUrl() { return url; }
  public void setUrl(String url) { this.url = url; }
}
