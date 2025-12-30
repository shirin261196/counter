import React, { useEffect, useState } from "react";

export default function TimersPage() {
  const [shop, setShop] = useState(null);
  const [timers, setTimers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ productId: "", startTime: "", endTime: "", message: "", urgencyMinutes: 5 });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Shopify admin will usually provide the shop in the URL as ?shop=... when loading the app
    const params = new URLSearchParams(window.location.search);
    const s = params.get("shop");
    setShop(s);
    if (s) fetchTimers(s);
  }, []);

  async function fetchTimers(shopDomain) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/timer/${encodeURIComponent(shopDomain)}`);
      const data = await res.json();
      if (res.ok && data.timers) setTimers(data.timers);
      else setError(data.error || "Failed to fetch timers");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function createTimer(e) {
    e.preventDefault();
    setError(null);
    try {
      const body = { ...form };
      if (shop) body.storeDomain = shop;
      const res = await fetch(`/api/timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      setForm({ productId: "", startTime: "", endTime: "", message: "", urgencyMinutes: 5 });
      fetchTimers(shop);
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Countdown Timers</h1>
      <p>Shop: {shop || "(no shop supplied in URL)"}</p>

      <section style={{ marginBottom: 24 }}>
        <h2>Create Timer</h2>
        <form onSubmit={createTimer}>
          <div>
            <label>Product ID</label>
            <input value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} />
          </div>
          <div>
            <label>Start Time (ISO)</label>
            <input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} placeholder="2025-12-31T12:00:00Z" />
          </div>
          <div>
            <label>End Time (ISO)</label>
            <input value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} placeholder="2025-12-31T13:00:00Z" />
          </div>
          <div>
            <label>Message</label>
            <input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div>
            <label>Urgency Minutes</label>
            <input type="number" value={form.urgencyMinutes} onChange={(e) => setForm({ ...form, urgencyMinutes: Number(e.target.value) })} />
          </div>
          <div style={{ marginTop: 8 }}>
            <button type="submit">Create Timer</button>
          </div>
        </form>
        {error && <div style={{ color: "red" }}>{error}</div>}
      </section>

      <section>
        <h2>Active Timers</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Message</th>
                <th>Start</th>
                <th>End</th>
                <th>Urgency (min)</th>
              </tr>
            </thead>
            <tbody>
              {timers.length === 0 && (
                <tr>
                  <td colSpan={5}>No active timers</td>
                </tr>
              )}
              {timers.map((t) => (
                <tr key={t._id}>
                  <td>{t.productId}</td>
                  <td>{t.message}</td>
                  <td>{new Date(t.startTime).toLocaleString()}</td>
                  <td>{new Date(t.endTime).toLocaleString()}</td>
                  <td>{t.urgencyMinutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
