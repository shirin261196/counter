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
  Modal,
  Select,
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
  const [modalActive, setModalActive] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#111111");
  const [timerName, setTimerName] = useState("");
  const [urgencyType, setUrgencyType] = useState("color_pulse");
  const [formSize, setFormSize] = useState("medium");
  const [formPosition, setFormPosition] = useState("bottom-right");

  const sizeOptions = [
    { label: "Small", value: "small" },
    { label: "Medium", value: "medium" },
    { label: "Large", value: "large" },
  ];
  const positionOptions = [
    { label: "Top right", value: "top-right" },
    { label: "Bottom right", value: "bottom-right" },
    { label: "Inline", value: "inline" },
  ];
  const urgencyOptions = [
    { label: "Color pulse", value: "color_pulse" },
    { label: "Banner", value: "banner" },
    { label: "None", value: "none" },
  ];

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
        // client-side validation: productId required and start < end
        if (!productId || String(productId).trim() === "") {
          setError("Product ID is required");
          setLoading(false);
          return;
        }
        const sDate = new Date(sIso);
        const eDate = new Date(eIso);
        if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
          setError("Invalid start or end datetime");
          setLoading(false);
          return;
        }
        if (eDate <= sDate) {
          setError("End time must be after start time");
          setLoading(false);
          return;
        }

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

  const handleCreateWithStyles = useCallback(async (event) => {
    event && event.preventDefault && event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const sIso = combineDateAndTime(startDate.start, startTime);
      const eIso = combineDateAndTime(endDate.start, endTime);

      if (!productId || String(productId).trim() === "") {
        setError("Product ID is required");
        setLoading(false);
        return;
      }
      const sDate = new Date(sIso);
      const eDate = new Date(eIso);
      if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
        setError("Invalid start or end datetime");
        setLoading(false);
        return;
      }
      if (eDate <= sDate) {
        setError("End time must be after start time");
        setLoading(false);
        return;
      }

      const body = {
        productId,
        startTime: sIso,
        endTime: eIso,
        message,
        urgencyMinutes: Number(urgencyMinutes),
        styles: {
          title: timerName,
          background_color: backgroundColor,
          text_color: textColor,
          size: formSize,
          position: formPosition,
          urgency_type: urgencyType,
        },
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
      setProductId("");
      setMessage("");
      setTimerName("");
      setBackgroundColor("#ffffff");
      setTextColor("#111111");
      setModalActive(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [productId, startDate, startTime, endDate, endTime, message, urgencyMinutes, timerName, backgroundColor, textColor, formSize, formPosition, urgencyType, shop]);

  return (
    <Page title="Countdown Timers">
      <Card sectioned>
        {error && <Banner status="critical">{error}</Banner>}
        {success && <Banner status="success">{success}</Banner>}

        <Button primary onClick={() => setModalActive(true)}>
          Create timer
        </Button>

        <Modal
          open={modalActive}
          onClose={() => setModalActive(false)}
          title="Create New Timer"
          primaryAction={{
            content: "Create timer",
            onAction: handleCreateWithStyles,
            loading,
          }}
          secondaryActions={[{ content: "Cancel", onAction: () => setModalActive(false) }]}
        >
          <Modal.Section>
            <FormLayout>
              <TextField label="Timer name" value={timerName} onChange={setTimerName} />
              <TextField label="Product ID" value={productId} onChange={setProductId} required helpText="The Shopify product ID this timer applies to" />

              <Stack distribution="fillEvenly">
                <div>
                  <label style={{ display: "block", marginBottom: 8 }}>Start date</label>
                  <DatePicker month={startDate.start.getMonth()} year={startDate.start.getFullYear()} onChange={(selected) => setStartDate(selected)} selected={startDate} />
                  <TextField label="Start time (HH:MM)" value={startTime} onChange={setStartTime} />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8 }}>End date</label>
                  <DatePicker month={endDate.start.getMonth()} year={endDate.start.getFullYear()} onChange={(selected) => setEndDate(selected)} selected={endDate} />
                  <TextField label="End time (HH:MM)" value={endTime} onChange={setEndTime} />
                </div>
              </Stack>

              <TextField label="Promotion description" value={message} onChange={setMessage} multiline />

              <Stack>
                <div>
                  <label>Background color</label>
                  <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ width: 64, height: 36, border: 'none' }} />
                </div>
                <div>
                  <label>Text color</label>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: 64, height: 36, border: 'none' }} />
                </div>
              </Stack>

              <Select label="Timer size" options={sizeOptions} value={formSize} onChange={setFormSize} />
              <Select label="Timer position" options={positionOptions} value={formPosition} onChange={setFormPosition} />
              <Select label="Urgency notification" options={urgencyOptions} value={urgencyType} onChange={setUrgencyType} />

              <TextField label="Urgency minutes" type="number" value={String(urgencyMinutes)} onChange={(v) => setUrgencyMinutes(Number(v))} />
            </FormLayout>
          </Modal.Section>
        </Modal>
      </Card>
    </Page>
  );
}
