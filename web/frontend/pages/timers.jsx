import React, { useCallback, useEffect, useState } from "react";
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Button,
  DatePicker,
  Stack,
  Banner,
} from "@shopify/polaris";

function combineDateAndTime(dateObj, timeStr) {
  // timeStr expected as HH:MM (24h). If empty, default to 00:00
  const [h = "0", m = "0"] = (timeStr || "").split(":");
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();
  const d = new Date(year, month, day, parseInt(h, 10), parseInt(m, 10));
  return d.toISOString();
}

export default function TimersPage() {
  const [shop, setShop] = useState(null);
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState("");
  const [urgencyMinutes, setUrgencyMinutes] = useState(5);

  // DatePicker state: use single-date selection stored as {start, end}
  const today = new Date();
  const [startDate, setStartDate] = useState({ start: today, end: today });
  const [endDate, setEndDate] = useState({ start: today, end: today });
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("shop");
    setShop(s);
  }, []);

  const handleCreate = useCallback(
    async (event) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);
      setLoading(true);
      try {
        // build ISO datetimes
        const sIso = combineDateAndTime(startDate.start, startTime);
        const eIso = combineDateAndTime(endDate.start, endTime);

        const body = {
          productId,
          startTime: sIso,
          endTime: eIso,
          message,
          urgencyMinutes: Number(urgencyMinutes),
        };
        if (shop) body.storeDomain = shop;

        const res = await fetch(`/api/timer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || JSON.stringify(data));
        setSuccess("Timer created");
        // Optionally clear form
        setProductId("");
        setMessage("");
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    },
    [productId, startDate, startTime, endDate, endTime, message, urgencyMinutes, shop]
  );

  return (
    <Page title="Countdown Timers">
      <Card sectioned>
        <FormLayout onSubmit={handleCreate}>
          {error && <Banner status="critical">{error}</Banner>}
          {success && <Banner status="success">{success}</Banner>}

          <TextField
            label="Product ID"
            value={productId}
            onChange={setProductId}
            required
            helpText="The Shopify product ID this timer applies to"
          />

          <Stack distribution="fillEvenly">
            <div>
              <label style={{ display: "block", marginBottom: 8 }}>Start date</label>
              <DatePicker
                month={startDate.start.getMonth()}
                year={startDate.start.getFullYear()}
                onChange={(selected) => setStartDate(selected)}
                selected={startDate}
              />
              <TextField label="Start time (HH:MM)" value={startTime} onChange={setStartTime} type="text" />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8 }}>End date</label>
              <DatePicker
                month={endDate.start.getMonth()}
                year={endDate.start.getFullYear()}
                onChange={(selected) => setEndDate(selected)}
                selected={endDate}
              />
              <TextField label="End time (HH:MM)" value={endTime} onChange={setEndTime} type="text" />
            </div>
          </Stack>

          <TextField label="Promotion message" value={message} onChange={setMessage} multiline />

          <TextField
            label="Urgency minutes"
            type="number"
            value={String(urgencyMinutes)}
            onChange={(v) => setUrgencyMinutes(Number(v))}
          />

          <Button submit primary loading={loading} onClick={handleCreate}>
            Save timer
          </Button>
        </FormLayout>
      </Card>
    </Page>
  );
}
