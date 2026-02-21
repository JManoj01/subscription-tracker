package com.subscriptiontracker;

import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class SubscriptionRepository {
  private static final String JDBC_URL = "jdbc:h2:./subscription_tracker_db;AUTO_SERVER=TRUE";
  private static final String JDBC_USER = "sa";
  private static final String JDBC_PASSWORD = "";

  private final String jdbcUrl;

  public SubscriptionRepository() {
    this(JDBC_URL);
  }

  public SubscriptionRepository(String jdbcUrl) {
    this.jdbcUrl = jdbcUrl;
    initSchema();
  }

  private void initSchema() {
    String sql = """
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cost INT NOT NULL,
        cycle VARCHAR(50) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        is_trial BOOLEAN NOT NULL DEFAULT FALSE,
        trial_end_date TIMESTAMP NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        url VARCHAR(2048) NULL
      )
      """;
    try (Connection conn = getConnection();
         Statement st = conn.createStatement()) {
      st.execute(sql);
    } catch (SQLException e) {
      throw new RuntimeException("Failed to init schema", e);
    }
  }

  private Connection getConnection() throws SQLException {
    return DriverManager.getConnection(jdbcUrl, JDBC_USER, JDBC_PASSWORD);
  }

  private static String toIso(Timestamp ts) {
    if (ts == null) return null;
    return ts.toInstant().toString();
  }

  private static Subscription mapRow(ResultSet rs) throws SQLException {
    Subscription s = new Subscription();
    s.setId(rs.getInt("id"));
    s.setName(rs.getString("name"));
    s.setCost(rs.getInt("cost"));
    s.setCycle(rs.getString("cycle"));
    s.setStartDate(toIso(rs.getTimestamp("start_date")));
    s.setTrial(rs.getBoolean("is_trial"));
    s.setTrialEndDate(toIso(rs.getTimestamp("trial_end_date")));
    s.setStatus(rs.getString("status"));
    s.setUrl(rs.getString("url"));
    return s;
  }

  public List<Subscription> findAll() {
    List<Subscription> list = new ArrayList<>();
    String sql = "SELECT id, name, cost, cycle, start_date, is_trial, trial_end_date, status, url FROM subscriptions ORDER BY id";
    try (Connection conn = getConnection();
         Statement st = conn.createStatement();
         ResultSet rs = st.executeQuery(sql)) {
      while (rs.next()) {
        list.add(mapRow(rs));
      }
    } catch (SQLException e) {
      throw new RuntimeException("Failed to list subscriptions", e);
    }
    return list;
  }

  public Optional<Subscription> findById(int id) {
    String sql = "SELECT id, name, cost, cycle, start_date, is_trial, trial_end_date, status, url FROM subscriptions WHERE id = ?";
    try (Connection conn = getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
      ps.setInt(1, id);
      try (ResultSet rs = ps.executeQuery()) {
        if (rs.next()) {
          return Optional.of(mapRow(rs));
        }
      }
    } catch (SQLException e) {
      throw new RuntimeException("Failed to get subscription " + id, e);
    }
    return Optional.empty();
  }

  public Subscription create(Subscription sub) {
    String sql = """
      INSERT INTO subscriptions (name, cost, cycle, start_date, is_trial, trial_end_date, status, url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      """;
    try (Connection conn = getConnection();
         PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      ps.setString(1, sub.getName());
      ps.setInt(2, sub.getCost() >= 0 ? sub.getCost() : 0);
      ps.setString(3, sub.getCycle());
      ps.setTimestamp(4, sub.getStartDate() != null ? Timestamp.from(Instant.parse(sub.getStartDate())) : Timestamp.from(Instant.now()));
      ps.setBoolean(5, sub.isTrial());
      ps.setTimestamp(6, sub.getTrialEndDate() != null && !sub.getTrialEndDate().isEmpty() ? Timestamp.from(Instant.parse(sub.getTrialEndDate())) : null);
      ps.setString(7, sub.getStatus() != null ? sub.getStatus() : "active");
      ps.setString(8, sub.getUrl());
      ps.executeUpdate();
      try (ResultSet keys = ps.getGeneratedKeys()) {
        if (keys.next()) {
          sub.setId(keys.getInt(1));
        }
      }
    } catch (SQLException e) {
      throw new RuntimeException("Failed to create subscription", e);
    }
    return sub;
  }

  public Subscription update(int id, Subscription updates) {
    Subscription existing = findById(id).orElse(null);
    if (existing == null) return null;
    if (updates.getName() != null) existing.setName(updates.getName());
    if (updates.getCostOrNull() != null) existing.setCost(updates.getCostOrNull());
    if (updates.getCycle() != null) existing.setCycle(updates.getCycle());
    if (updates.getStartDate() != null) existing.setStartDate(updates.getStartDate());
    existing.setTrial(updates.isTrial());
    existing.setTrialEndDate(updates.getTrialEndDate());
    if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
    if (updates.getUrl() != null) existing.setUrl(updates.getUrl());

    String sql = """
      UPDATE subscriptions SET name = ?, cost = ?, cycle = ?, start_date = ?, is_trial = ?, trial_end_date = ?, status = ?, url = ?
      WHERE id = ?
      """;
    try (Connection conn = getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
      ps.setString(1, existing.getName());
      ps.setInt(2, existing.getCost());
      ps.setString(3, existing.getCycle());
      ps.setTimestamp(4, Timestamp.from(Instant.parse(existing.getStartDate())));
      ps.setBoolean(5, existing.isTrial());
      ps.setTimestamp(6, existing.getTrialEndDate() != null && !existing.getTrialEndDate().isEmpty() ? Timestamp.from(Instant.parse(existing.getTrialEndDate())) : null);
      ps.setString(7, existing.getStatus());
      ps.setString(8, existing.getUrl());
      ps.setInt(9, id);
      ps.executeUpdate();
    } catch (SQLException e) {
      throw new RuntimeException("Failed to update subscription", e);
    }
    return existing;
  }

  public boolean delete(int id) {
    String sql = "DELETE FROM subscriptions WHERE id = ?";
    try (Connection conn = getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
      ps.setInt(1, id);
      return ps.executeUpdate() > 0;
    } catch (SQLException e) {
      throw new RuntimeException("Failed to delete subscription", e);
    }
  }
}
