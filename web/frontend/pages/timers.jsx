import React, { useEffect, useState } from "react";
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Button,
  DatePicker,
  Popover,
  Stack,
  Banner,
  Modal,
  Select,
  TextStyle,
  Icon,
} from "@shopify/polaris";
import { DeleteMinor, EditMinor, SearchMinor } from "@shopify/polaris-icons";

/* -------------------- HELPERS -------------------- */
function formatDate(date) {
  if (!(date instanceof Date)) return "";
  return date.toLocaleDateString("en-CA");
}

function normalizeDateRange(range) {
  const today = new Date();
  if (!range || !range.start) {
    return { start: today, end: today };
  }
  return {
    start: range.start,
    end: range.end ?? range.start,
  };
}

function combineDateAndTime(date, time) {
  const [h = "0", m = "0"] = time.split(":");
  const d = new Date(date);
  d.setHours(Number(h));
  d.setMinutes(Number(m));
  d.setSeconds(0);
  return d.toISOString();
}

/* -------------------- COUNTDOWN -------------------- */
function CountdownPreview({ endTime, urgencyMinutes }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      const diff = Math.floor(
        (new Date(endTime).getTime() - Date.now()) / 1000
      );
      setRemaining(diff);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endTime]);

  if (remaining <= 0) return null;
  if (remaining > urgencyMinutes * 60) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          background: "#fff3cd",
          color: "#664d03",
          fontWeight: 600,
          display: "inline-block",
        }}
      >
        ⏰ Offer valid for {mm}:{ss}
      </div>
    </div>
  );
}

/* -------------------- MAIN PAGE -------------------- */
export default function TimersPage() {
  const today = new Date();
  const todayRange = { start: today, end: today };

  const [shop, setShop] = useState(null);
  const [timers, setTimers] = useState([]);
  const [search, setSearch] = useState("");

  const [modalActive, setModalActive] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [timerName, setTimerName] = useState("");
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState("");

  const [urgencyMinutes, setUrgencyMinutes] = useState(5);
  const [urgencyType, setUrgencyType] = useState("color_pulse");
  const [formSize, setFormSize] = useState("medium");
  const [formPosition, setFormPosition] = useState("bottom-right");

  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#111111");

  const [startDate, setStartDate] = useState(todayRange);
  const [endDate, setEndDate] = useState(todayRange);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");

  const [startMonth, setStartMonth] = useState(today.getMonth());
const [startYear, setStartYear] = useState(today.getFullYear());

const [endMonth, setEndMonth] = useState(today.getMonth());
const [endYear, setEndYear] = useState(today.getFullYear());

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  /* -------------------- LOAD SHOP -------------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShop(params.get("shop"));
  }, []);

  useEffect(() => {
    if (shop) fetchTimers();
  }, [shop]);

  const fetchTimers = async () => {
    const res = await fetch(`/api/timer/${shop}`);
    const data = await res.json();
    setTimers(data.timers || []);
  };

  /* -------------------- SAVE -------------------- */
  const handleSave = async () => {
    setLoading(true);
    setError(null);

    const startISO = combineDateAndTime(startDate.start, startTime);
    const endISO = combineDateAndTime(endDate.start, endTime);

    if (new Date(endISO) <= new Date(startISO)) {
      setError("End time must be after start time");
      setLoading(false);
      return;
    }

    const body = {
      storeDomain: shop,
      productId,
      message,
      urgencyMinutes,
      startTime: startISO,
      endTime: endISO,
      styles: {
        title: timerName,
        background_color: backgroundColor,
        text_color: textColor,
        size: formSize,
        position: formPosition,
        urgency_type: urgencyType,
      },
    };

    const res = await fetch(
      editingId ? `/api/timer/${editingId}` : "/api/timer",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      setError("Failed to save timer");
    } else {
      setSuccess(editingId ? "Timer updated" : "Timer created");
      setModalActive(false);
      setEditingId(null);
      fetchTimers();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this timer?")) return;
    await fetch(`/api/timer/${id}`, { method: "DELETE" });
    fetchTimers();
  };

  const handleEdit = (t) => {
    const s = new Date(t.startTime);
    const e = new Date(t.endTime);

    setEditingId(t._id);
    setTimerName(t.styles?.title || "");
    setProductId(t.productId);
    setMessage(t.message);
    setUrgencyMinutes(t.urgencyMinutes);
    setBackgroundColor(t.styles?.background_color || "#ffffff");
    setTextColor(t.styles?.text_color || "#111111");
    setFormSize(t.styles?.size || "medium");
    setFormPosition(t.styles?.position || "bottom-right");
    setUrgencyType(t.styles?.urgency_type || "color_pulse");

    setStartDate({ start: s, end: s });
    setEndDate({ start: e, end: e });
    setStartTime(`${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`);
    setEndTime(`${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`);

    setModalActive(true);
  };

  return (
    <Page title="Countdown Timers">
      <Card sectioned>
        {error && <Banner status="critical">{error}</Banner>}
        {success && <Banner status="success">{success}</Banner>}

        <Stack alignment="center">
          <TextField
            prefix={<Icon source={SearchMinor} />}
            placeholder="Search timers"
            value={search}
            onChange={setSearch}
          />
          <Button primary onClick={() => setModalActive(true)}>
            Create timer
          </Button>
        </Stack>

        {timers
          .filter((t) =>
            t.message?.toLowerCase().includes(search.toLowerCase())
          )
          .map((t) => (
            <Card.Section key={t._id}>
              <Stack distribution="equalSpacing">
                <div>
                  <TextStyle variation="strong">
                    {t.styles?.title || "Untitled timer"}
                  </TextStyle>
                  <div>{t.message}</div>
                  <div style={{ color: "#888" }}>
                    Ends: {new Date(t.endTime).toLocaleString()}
                  </div>

                  <CountdownPreview
                    endTime={t.endTime}
                    urgencyMinutes={t.urgencyMinutes}
                  />
                </div>

                <Stack>
                  <Button plain icon={EditMinor} onClick={() => handleEdit(t)} />
                  <Button plain destructive icon={DeleteMinor} onClick={() => handleDelete(t._id)} />
                </Stack>
              </Stack>
            </Card.Section>
          ))}

        {/* MODAL */}
        <Modal
          open={modalActive}
          title={editingId ? "Edit Timer" : "Create Timer"}
          onClose={() => setModalActive(false)}
          primaryAction={{ content: "Save", onAction: handleSave, loading }}
        >
          <Modal.Section>
            <FormLayout>
              <TextField label="Timer name" value={timerName} onChange={setTimerName} />
              <TextField label="Product ID" value={productId} onChange={setProductId} />
              <TextField label="Promotion description" value={message} onChange={setMessage} multiline />

              <Stack>
                <div>
                  <label>Background color</label>
                  <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
                </div>
                <div>
                  <label>Text color</label>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                </div>
              </Stack>

              <Select label="Timer size" options={sizeOptions} value={formSize} onChange={setFormSize} />
              <Select label="Timer position" options={positionOptions} value={formPosition} onChange={setFormPosition} />
              <Select label="Urgency notification" options={urgencyOptions} value={urgencyType} onChange={setUrgencyType} />

              <TextField
                label="Urgency minutes"
                type="number"
                value={String(urgencyMinutes)}
                onChange={(v) => setUrgencyMinutes(Number(v))}
              />

              {/* START DATE */}
              <Popover
                active={startOpen}
                activator={
                  <TextField
                    label="Start date"
                    value={formatDate(startDate.start)}
                    readOnly
                    onFocus={() => setStartOpen(true)}
                  />
                }
                onClose={() => setStartOpen(false)}
              >
            <DatePicker
  month={startMonth}
  year={startYear}
  selected={startDate}
  onMonthChange={(month, year) => {
    setStartMonth(month);
    setStartYear(year);
  }}
  onChange={(range) => {
    const normalized = normalizeDateRange(range);
    setStartDate(normalized);
    setStartMonth(normalized.start.getMonth());
    setStartYear(normalized.start.getFullYear());
    setStartOpen(false);
  }}
/>

              </Popover>

              <TextField label="Start time" type="time" value={startTime} onChange={setStartTime} />

              {/* END DATE */}
              <Popover
                active={endOpen}
                activator={
                  <TextField
                    label="End date"
                    value={formatDate(endDate.start)}
                    readOnly
                    onFocus={() => setEndOpen(true)}
                  />
                }
                onClose={() => setEndOpen(false)}
              >
            <DatePicker
  month={endMonth}
  year={endYear}
  selected={endDate}
  onMonthChange={(month, year) => {
    setEndMonth(month);
    setEndYear(year);
  }}
  onChange={(range) => {
    const normalized = normalizeDateRange(range);
    setEndDate(normalized);
    setEndMonth(normalized.start.getMonth());
    setEndYear(normalized.start.getFullYear());
    setEndOpen(false);
  }}
/>

              </Popover>

              <TextField label="End time" type="time" value={endTime} onChange={setEndTime} />
            </FormLayout>
          </Modal.Section>
        </Modal>
      </Card>
    </Page>
  );
}
