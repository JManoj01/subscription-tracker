import { useSubscriptions, useCreateSubscription, useDeleteSubscription } from "@/hooks/use-subscriptions";
import { format, differenceInDays } from "date-fns";
import { useState } from "react";

export default function Dashboard() {
  const { data: subscriptions, isLoading } = useSubscriptions();
  const createSub = useCreateSubscription();
  const deleteSub = useDeleteSubscription();

  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [cycle, setCycle] = useState("monthly");
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState("");

  if (isLoading) return <div>Loading...</div>;

  const totalMonthly = subscriptions?.reduce((acc, sub) => {
    const amount = sub.cost / 100;
    if (sub.cycle === "monthly") return acc + amount;
    if (sub.cycle === "yearly") return acc + amount / 12;
    if (sub.cycle === "weekly") return acc + amount * 4;
    return acc;
  }, 0) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSub.mutate({
      name,
      cost: Math.round(parseFloat(cost) * 100),
      cycle,
      isTrial,
      trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
      startDate: new Date(),
      status: "active",
    });
    setName("");
    setCost("");
    setIsTrial(false);
    setTrialEndDate("");
  };

  return (
    <div>
      <h1>SUBSCRIPTION TRACKER</h1>
      
      <div>
        <strong>TOTAL ESTIMATED MONTHLY BURDEN: ${totalMonthly.toFixed(2)}</strong>
      </div>

      <h2>CURRENT SUBSCRIPTIONS</h2>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Cost</th>
            <th>Cycle</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions?.map((sub) => {
            const daysLeft = sub.trialEndDate ? differenceInDays(new Date(sub.trialEndDate), new Date()) : null;
            return (
              <tr key={sub.id}>
                <td>
                  {sub.name}
                  {sub.isTrial && (
                    <div className={daysLeft !== null && daysLeft <= 3 ? "trial-warning" : ""}>
                      [TRIAL: {daysLeft !== null ? (daysLeft < 0 ? "EXPIRED" : `${daysLeft} days left`) : "No date"}]
                    </div>
                  )}
                </td>
                <td>${(sub.cost / 100).toFixed(2)}</td>
                <td>{sub.cycle}</td>
                <td>{sub.status}</td>
                <td>
                  <button onClick={() => deleteSub.mutate(sub.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>ADD NEW</h2>
      <form onSubmit={handleSubmit} style={{ border: "1px solid #000", padding: "10px", maxWidth: "400px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>Service: </label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Cost ($): </label>
          <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} required />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Cycle: </label>
          <select value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Free Trial? </label>
          <input type="checkbox" checked={isTrial} onChange={(e) => setIsTrial(e.target.checked)} />
        </div>
        {isTrial && (
          <div style={{ marginBottom: "10px" }}>
            <label>End Date: </label>
            <input type="date" value={trialEndDate} onChange={(e) => setTrialEndDate(e.target.value)} required />
          </div>
        )}
        <button type="submit">Track It</button>
      </form>
    </div>
  );
}
