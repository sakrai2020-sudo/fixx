import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  PROVIDER_LIST_STATUS_COLORS,
  getProviderListCategories,
  loadProvidersList,
  resetProvidersList,
  saveProvidersList,
  type ProviderListItem,
  type ProviderListStatus,
} from "@/lib/providers-list";

export const Route = createFileRoute("/_authenticated/providers-list")({
  component: ProvidersListPage,
});

function ProvidersListPage() {
  const [providers, setProviders] = useState<ProviderListItem[]>(() => loadProvidersList());
  const categories = useMemo(() => getProviderListCategories(providers), [providers]);
  const [filter, setFilter] = useState("הכל");
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState(() => categories[0] ?? "סלולר");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  const persist = (next: ProviderListItem[]) => {
    setProviders(next);
    saveProvidersList(next);
  };

  const filtered = providers.filter((p) => {
    const matchCat = filter === "הכל" || p.category === filter;
    const q = search.trim();
    const matchSearch = !q || p.name.includes(q) || p.category.includes(q) || p.notes.includes(q);
    return matchCat && matchSearch;
  });

  const grouped = categories.reduce<Record<string, ProviderListItem[]>>((acc, cat) => {
    const items = filtered.filter((p) => p.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  const updateStatus = (id: number, status: ProviderListStatus) => {
    persist(providers.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const addProvider = () => {
    if (!newName.trim()) return;
    const newId = Math.max(...providers.map((p) => p.id), 0) + 1;
    persist([
      ...providers,
      {
        id: newId,
        category: newCat,
        name: newName.trim(),
        affiliate: "",
        status: "ממתין",
        notes: "",
      },
    ]);
    setNewName("");
    setAdding(false);
  };

  const stats = {
    total: providers.length,
    active: providers.filter((p) => p.status === "פעיל").length,
    registered: providers.filter((p) => p.status === "נרשמתי").length,
    pending: providers.filter((p) => p.status === "ממתין").length,
  };

  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        direction: "rtl",
        background: "#060E1A",
        minHeight: "100vh",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            background: "#0B1628",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 16,
            border: "1px solid #172440",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#00C2A8" }}>
                n<span style={{ color: "white" }}>ego</span>
              </div>
              <div style={{ fontSize: 13, color: "#8A9BB5", marginTop: 2 }}>רשימת ספקים · מעקב BD ו-Affiliate</div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "סה״כ ספקים", value: stats.total, color: "white" },
                { label: "פעיל", value: stats.active, color: "#00C2A8" },
                { label: "נרשמתי", value: stats.registered, color: "#FFB020" },
                { label: "ממתין", value: stats.pending, color: "#8A9BB5" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    textAlign: "center",
                    background: "#172440",
                    borderRadius: 10,
                    padding: "8px 14px",
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#8A9BB5" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש ספק..."
            style={{
              background: "#0B1628",
              border: "1px solid #3D4F6A",
              borderRadius: 10,
              padding: "8px 14px",
              color: "white",
              fontSize: 13,
              fontFamily: "inherit",
              direction: "rtl",
              flex: 1,
              minWidth: 160,
            }}
          />
          {["הכל", ...categories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              style={{
                background: filter === cat ? "#00C2A8" : "#0B1628",
                color: filter === cat ? "#0B1628" : "#8A9BB5",
                border: `1px solid ${filter === cat ? "#00C2A8" : "#3D4F6A"}`,
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#00C2A8",
                letterSpacing: 0.5,
                marginBottom: 8,
                paddingRight: 4,
              }}
            >
              {cat} · {items.length} ספקים
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((p) => {
                const sc = PROVIDER_LIST_STATUS_COLORS[p.status];
                return (
                  <div
                    key={p.id}
                    style={{
                      background: "#0B1628",
                      border: "1px solid #172440",
                      borderRadius: 12,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{p.name}</div>
                      {p.affiliate && (
                        <div style={{ fontSize: 11, color: "#3D4F6A", marginTop: 2, wordBreak: "break-all" }}>
                          {p.affiliate}
                        </div>
                      )}
                      {p.notes && (
                        <div style={{ fontSize: 11, color: "#FFB020", marginTop: 2, lineHeight: 1.4 }}>{p.notes}</div>
                      )}
                    </div>
                    <select
                      value={p.status}
                      onChange={(e) => updateStatus(p.id, e.target.value as ProviderListStatus)}
                      style={{
                        background: sc.bg,
                        color: sc.text,
                        border: `1px solid ${sc.border}`,
                        borderRadius: 20,
                        padding: "4px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        direction: "rtl",
                        flexShrink: 0,
                      }}
                    >
                      {(Object.keys(PROVIDER_LIST_STATUS_COLORS) as ProviderListStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#8A9BB5",
              padding: "32px 16px",
              fontSize: 14,
            }}
          >
            לא נמצאו ספקים לחיפוש זה
          </div>
        )}

        <div
          style={{
            background: "#0B1628",
            border: "1px dashed #3D4F6A",
            borderRadius: 12,
            padding: 16,
            marginTop: 8,
          }}
        >
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              style={{
                background: "none",
                border: "none",
                color: "#00C2A8",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                width: "100%",
                textAlign: "right",
              }}
            >
              ➕ הוסף ספק שחסר
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="שם ספק"
                style={{
                  background: "#172440",
                  border: "1px solid #3D4F6A",
                  borderRadius: 10,
                  padding: "8px 12px",
                  color: "white",
                  fontSize: 13,
                  fontFamily: "inherit",
                  flex: 1,
                  minWidth: 140,
                  direction: "rtl",
                }}
              />
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                style={{
                  background: "#172440",
                  border: "1px solid #3D4F6A",
                  borderRadius: 10,
                  padding: "8px 12px",
                  color: "white",
                  fontSize: 13,
                  fontFamily: "inherit",
                  direction: "rtl",
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addProvider}
                style={{
                  background: "#00C2A8",
                  color: "#0B1628",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                הוסף
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                style={{
                  background: "#172440",
                  color: "#8A9BB5",
                  border: "1px solid #3D4F6A",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ביטול
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm("לאפס את הרשימה לברירת המחדל?")) {
              persist(resetProvidersList());
            }
          }}
          style={{
            marginTop: 16,
            background: "transparent",
            border: "1px solid #3D4F6A",
            color: "#8A9BB5",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          איפוס לרשימת ברירת מחדל
        </button>
      </div>
    </div>
  );
}
