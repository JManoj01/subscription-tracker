import { useSubscriptions, useCreateSubscription, useDeleteSubscription } from "@/hooks/use-subscriptions";
import { format, differenceInDays, isAfter, startOfDay } from "date-fns";
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

  const calculateMonthly = (sub: any) => {
    const amount = sub.cost / 100;
    switch (sub.cycle) {
      case "weekly": return amount * (52 / 12);
      case "monthly": return amount;
      case "quarterly": return amount / 3;
      case "semiannual": return amount / 6;
      case "yearly": return amount / 12;
      default: return amount;
    }
  };

  const totalMonthly = subscriptions?.reduce((acc, sub) => acc + calculateMonthly(sub), 0) || 0;

  const today = startOfDay(new Date());
  const endingSoon = subscriptions?.filter(sub => {
    if (!sub.isTrial || !sub.trialEndDate) return false;
    const end = new Date(sub.trialEndDate);
    const diff = differenceInDays(end, today);
    return diff >= 0 && diff <= 3;
  }) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cost) return;
    
    createSub.mutate({
      name,
      cost: Math.round(parseFloat(cost) * 100),
      cycle,
      isTrial,
      trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
      startDate: new Date(),
      status: "active",
      url: null
    });
    setName("");
    setCost("");
    setIsTrial(false);
    setTrialEndDate("");
  };

  return (
    <div>
      <h1>SUBSCRIPTION TRACKER</h1>
      
      {endingSoon.length > 0 && (
        <div style={{ border: "2px solid red", padding: "10px", marginBottom: "20px", backgroundColor: "#fff0f0" }}>
          <strong style={{ color: "red" }}>!!! TRIAL EXPIRATION ALERT !!!</strong>
          <ul>
            {endingSoon.map(sub => (
              <li key={sub.id}>
                {sub.name} trial ends in {differenceInDays(new Date(sub.trialEndDate!), today)} days!
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <strong>ESTIMATED TOTAL MONTHLY COST: ${totalMonthly.toFixed(2)}</strong>
      </div>

      <h2>YOUR SUBSCRIPTIONS ({subscriptions?.length || 0})</h2>
      {subscriptions && subscriptions.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Cost</th>
              <th>Cycle</th>
              <th>Trial Info</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => {
              const daysLeft = sub.trialEndDate ? differenceInDays(new Date(sub.trialEndDate), today) : null;
              const isExpired = daysLeft !== null && daysLeft < 0;
              
              return (
                <tr key={sub.id} style={isExpired ? { backgroundColor: "#f0f0f0", color: "#666" } : {}}>
                  <td><strong>{sub.name}</strong></td>
                  <td>${(sub.cost / 100).toFixed(2)}</td>
                  <td>{sub.cycle}</td>
                  <td>
                    {sub.isTrial ? (
                      <span className={daysLeft !== null && daysLeft <= 3 ? "trial-warning" : ""}>
                        {isExpired ? "EXPIRED" : `${daysLeft} days left`}
                      </span>
                    ) : "N/A"}
                  </td>
                  <td>
                    <button onClick={() => { if(confirm('Delete?')) deleteSub.mutate(sub.id) }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>No subscriptions tracked yet. Add one below!</p>
      )}

      <h2>ADD NEW SUBSCRIPTION</h2>
      <form onSubmit={handleSubmit} style={{ border: "1px solid #000", padding: "15px", maxWidth: "450px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block" }}>Service Name:</label>
          <input 
            style={{ width: "100%" }}
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g. Netflix, Gym, etc."
            required 
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block" }}>Cost ($):</label>
          <input 
            style={{ width: "100%" }}
            type="number" 
            step="0.01" 
            value={cost} 
            onChange={(e) => setCost(e.target.value)} 
            placeholder="0.00"
            required 
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block" }}>Billing Cycle:</label>
          <select style={{ width: "100%" }} value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semiannual">Biannual (6 mo)</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div style={{ marginBottom: "10px", border: "1px dashed #ccc", padding: "5px" }}>
          <label>
            <input type="checkbox" checked={isTrial} onChange={(e) => setIsTrial(e.target.checked)} />
            This is a free trial
          </label>
          {isTrial && (
            <div style={{ marginTop: "10px" }}>
              <label style={{ display: "block" }}>Trial End Date:</label>
              <input 
                style={{ width: "100%" }}
                type="date" 
                value={trialEndDate} 
                onChange={(e) => setTrialEndDate(e.target.value)} 
                required 
              />
            </div>
          )}
        </div>
        <button type="submit" style={{ width: "100%", padding: "5px", fontWeight: "bold" }}>+ TRACK SUBSCRIPTION</button>
      </form>

      <div style={{ marginTop: "40px", fontSize: "0.8rem", color: "#666" }}>
        <p><em>Note: Monthly cost is estimated based on your billing cycle.</em></p>
      </div>
    </div>
  );
}
