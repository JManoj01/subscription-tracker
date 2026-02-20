import { useSubscriptions, useCreateSubscription, useDeleteSubscription } from "@/hooks/use-subscriptions";
import { useAuth } from "@/hooks/use-auth";
import { format, differenceInDays, isAfter, isBefore, addDays } from "date-fns";
import { useState, useMemo } from "react";

export default function Dashboard() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { data: subscriptions, isLoading: subsLoading } = useSubscriptions();
  const createSub = useCreateSubscription();
  const deleteSub = useDeleteSubscription();

  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [cycle, setCycle] = useState("monthly");
  const [category, setCategory] = useState("other");
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndDate, setTrialEndDate] = useState("");

  const stats = useMemo(() => {
    if (!subscriptions) return { monthly: 0, yearly: 0, alerts: [], redundancies: [] };
    
    let monthly = 0;
    const alerts: any[] = [];
    const catCount: Record<string, string[]> = {};

    subscriptions.forEach(sub => {
      // Cost calculation
      const amount = sub.cost / 100;
      if (sub.cycle === "monthly") monthly += amount;
      else if (sub.cycle === "yearly") monthly += amount / 12;
      else if (sub.cycle === "weekly") monthly += amount * 4;
      else if (sub.cycle === "quarterly") monthly += amount / 3;

      // Alerts
      if (sub.isTrial && sub.trialEndDate) {
        const daysLeft = differenceInDays(new Date(sub.trialEndDate), new Date());
        if (daysLeft >= 0 && daysLeft <= 3) {
          alerts.push({ name: sub.name, daysLeft });
        }
      }

      // Redundancy check
      if (!catCount[sub.category]) catCount[sub.category] = [];
      catCount[sub.category].push(sub.name);
    });

    const redundancies = Object.entries(catCount)
      .filter(([_, names]) => names.length > 1)
      .map(([cat, names]) => ({ cat, names }));

    return { monthly, yearly: monthly * 12, alerts, redundancies };
  }, [subscriptions]);

  if (authLoading || subsLoading) return <div style={{fontFamily: 'monospace'}}>LOADING...</div>;

  if (!user) {
    return (
      <div style={{fontFamily: 'monospace', padding: '20px'}}>
        <h1>SUBSCRIPTION TRACKER</h1>
        <p>Keep track of your recurring expenses and trials.</p>
        <button onClick={() => window.location.href = "/api/login"}>LOGIN WITH REPLIT</button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costVal = parseFloat(cost);
    if (isNaN(costVal) || costVal <= 0) {
      alert("Please enter a valid cost greater than 0");
      return;
    }
    createSub.mutate({
      name,
      cost: Math.round(costVal * 100),
      cycle,
      category,
      isTrial,
      trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
      startDate: new Date(),
      status: "active",
    });
    setName("");
    setCost("");
    setCategory("other");
    setIsTrial(false);
    setTrialEndDate("");
  };

  return (
    <div style={{maxWidth: '800px', margin: '0 auto', paddingBottom: '50px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', marginBottom: '20px'}}>
        <h1>SUBSCRIPTION FORENSICS</h1>
        <div style={{textAlign: 'right'}}>
          <div>{user.email}</div>
          <button onClick={() => logout()}>LOGOUT</button>
        </div>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
        <div style={{border: '1px solid #000', padding: '10px', background: '#f0f0f0'}}>
          <strong>FINANCIAL SUMMARY</strong>
          <div>Monthly: ${stats.monthly.toFixed(2)}</div>
          <div>Yearly: ${stats.yearly.toFixed(2)}</div>
          <button onClick={() => window.open("/api/subscriptions/export", "_blank")} style={{marginTop: '10px'}}>EXPORT CSV</button>
        </div>

        <div style={{border: '1px solid #000', padding: '10px', background: stats.alerts.length > 0 ? '#fff0f0' : '#f0fff0'}}>
          <strong>ACTIVE ALERTS</strong>
          {stats.alerts.length === 0 ? (
            <div>No urgent trials.</div>
          ) : (
            stats.alerts.map((a, i) => (
              <div key={i} className="trial-warning">! {a.name}: Expires in {a.daysLeft} days</div>
            ))
          )}
        </div>
      </div>

      {stats.redundancies.length > 0 && (
        <div style={{border: '1px solid #000', padding: '10px', marginBottom: '20px', background: '#ffffed'}}>
          <strong>INSIGHTS: POTENTIAL REDUNDANCY</strong>
          {stats.redundancies.map((r, i) => (
            <div key={i}>- Multiple {r.cat} services: {r.names.join(", ")}</div>
          ))}
        </div>
      )}

      <h2>SUBSCRIPTIONS</h2>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Category</th>
            <th>Cost</th>
            <th>Cycle</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions?.map((sub) => {
            const daysLeft = sub.trialEndDate ? differenceInDays(new Date(sub.trialEndDate), new Date()) : null;
            return (
              <tr key={sub.id}>
                <td>
                  <strong>{sub.name}</strong>
                  {sub.isTrial && (
                    <div style={{fontSize: '0.8em', color: daysLeft !== null && daysLeft <= 3 ? 'red' : 'inherit'}}>
                      [TRIAL: {daysLeft !== null ? (daysLeft < 0 ? "EXPIRED" : `${daysLeft}d left`) : "No date"}]
                    </div>
                  )}
                </td>
                <td>{sub.category}</td>
                <td>${(sub.cost / 100).toFixed(2)}</td>
                <td>{sub.cycle}</td>
                <td>
                  <button onClick={() => { if(confirm("Delete?")) deleteSub.mutate(sub.id) }}>DEL</button>
                </td>
              </tr>
            );
          })}
          {subscriptions?.length === 0 && (
            <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px'}}>No subscriptions tracked yet.</td></tr>
          )}
        </tbody>
      </table>

      <h2>ADD NEW COMMITMENT</h2>
      <form onSubmit={handleSubmit} style={{ border: "1px solid #000", padding: "10px", background: '#fafafa' }}>
        <div style={{ marginBottom: "10px" }}>
          <label style={{display: 'inline-block', width: '100px'}}>Service: </label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Netflix" />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{display: 'inline-block', width: '100px'}}>Cost ($): </label>
          <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} required placeholder="9.99" />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{display: 'inline-block', width: '100px'}}>Cycle: </label>
          <select value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{display: 'inline-block', width: '100px'}}>Category: </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="entertainment">Entertainment</option>
            <option value="productivity">Productivity</option>
            <option value="utilities">Utilities</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{display: 'inline-block', width: '100px'}}>Free Trial? </label>
          <input type="checkbox" checked={isTrial} onChange={(e) => setIsTrial(e.target.checked)} />
        </div>
        {isTrial && (
          <div style={{ marginBottom: "10px" }}>
            <label style={{display: 'inline-block', width: '100px'}}>End Date: </label>
            <input type="date" value={trialEndDate} onChange={(e) => setTrialEndDate(e.target.value)} required />
          </div>
        )}
        <button type="submit" disabled={createSub.isPending} style={{width: '100%', padding: '5px', fontWeight: 'bold'}}>
          {createSub.isPending ? "PROCESSING..." : "ADD TO FORENSICS"}
        </button>
      </form>
    </div>
  );
}
