const CATEGORIES = [
  { name: "סלולר", emoji: "📱", full: false },
  { name: "טלוויזיה ואינטרנט", emoji: "📺", full: false },
  { name: "חברת חשמל", emoji: "⚡", full: false },
  { name: "קופת חולים", emoji: "🏥", full: false },
  { name: "ביטוח רכב", emoji: "🚗", full: false },
  { name: "ביטוח חיים/בריאות", emoji: "❤️", full: false },
  { name: "ביטוח דירה/תכולה", emoji: "🏠", full: false },
  { name: "מועדון כושר", emoji: "💪", full: false },
  { name: "סטרימינג", emoji: "🎬", full: false },
  { name: "חוגי ילדים", emoji: "👶", full: false },
  { name: "אבטחה ומיגון", emoji: "🔒", full: false },
  { name: "ניקיון וגינון", emoji: "🧹", full: false },
  { name: "ועד בניין", emoji: "🏢", full: false },
  { name: "ברי מים", emoji: "💧", full: false },
  { name: "חיובים קבועים אחרים", emoji: "➕", full: true },
];

const PRICE_RANGES = {
  "סלולר": ["עד ₪50", "₪50-100", "₪100-150", "מעל ₪150"],
  "טלוויזיה ואינטרנט": ["עד ₪100", "₪100-200", "₪200-300", "מעל ₪300"],
  "חברת חשמל": ["עד ₪200", "₪200-400", "₪400-600", "מעל ₪600"],
  "קופת חולים": ["זהב", "כסף", "ארד", "בסיסי"],
  "ביטוח רכב": ["עד ₪3,000", "₪3,000-5,000", "₪5,000-8,000", "₪8,000-12,000", "מעל ₪12,000"],
  "ביטוח חיים/בריאות": ["עד ₪200", "₪200-500", "₪500-1,000", "₪1,000-2,000", "מעל ₪2,000"],
  "ביטוח דירה/תכולה": ["עד ₪100", "₪100-200", "₪200-400", "מעל ₪400"],
  "מועדון כושר": ["עד ₪100", "₪100-200", "₪200-300", "מעל ₪300"],
  "סטרימינג": ["עד ₪50", "₪50-100", "₪100-150", "מעל ₪150"],
  "חוגי ילדים": ["עד ₪200", "₪200-400", "₪400-700", "מעל ₪700"],
  "אבטחה ומיגון": ["עד ₪80", "₪80-150", "₪150-250", "מעל ₪250"],
  "ניקיון וגינון": ["עד ₪150", "₪150-300", "₪300-500", "מעל ₪500"],
  "ועד בניין": ["עד ₪150", "₪150-300", "₪300-500", "מעל ₪500"],
  "ברי מים": ["עד ₪60", "₪60-100", "₪100-150", "מעל ₪150"],
  "חיובים קבועים אחרים": ["עד ₪100", "₪100-300", "₪300-500", "מעל ₪500"],
};

const DEMO_OFFERS = [
  {
    id: "cheap",
    label: "הכי זולה",
    plan: "5GB בסיסי",
    monthly: 89,
    regFee: 0,
    providerName: "גולן טלקום",
    registrationUrl: "https://www.golantele.co.il/",
    requiresSwitch: true,
  },
  {
    id: "value",
    label: "הכי משתלמת",
    plan: "30GB + שיחות",
    monthly: 129,
    regFee: 49,
    providerName: "HOT Mobile",
    registrationUrl: "https://www.hotmobile.co.il/",
    requiresSwitch: true,
  },
  {
    id: "premium",
    label: "שדרוג חבילה",
    plan: "50GB + VIP",
    monthly: 159,
    regFee: 0,
    providerName: "פרטנר",
    registrationUrl: "https://www.partner.co.il/",
    requiresSwitch: false,
  },
];

let userArea = "תל אביב";

const DISCOVERY_PLACEHOLDER = [
  {
    id: "disc-gym",
    emoji: "💪",
    title: "Holmes Place — תל אביב",
    category: "כושר",
    area: "תל אביב",
    description: "חודש ראשון ב-₪99",
    url: "https://www.holmesplace.co.il/",
  },
  {
    id: "disc-kids",
    emoji: "👶",
    title: "מכבי — חוג כדורגל",
    category: "חוגים",
    area: "תל אביב",
    description: "מתחיל מ-₪180/חודש",
    url: "https://www.maccabi4u.co.il/",
  },
  {
    id: "disc-security",
    emoji: "🔒",
    title: "שח\"ל — חבילת אבטחה",
    category: "אבטחה",
    area: "תל אביב",
    description: "₪79/חודש · ללא התחייבות",
    url: "https://www.shahal.co.il/",
  },
];

const CONVERSIONS_KEY = "nego_demo_conversions";
const PROFILE_KEY = "nego_demo_profile";
const REFERRAL_CODE = "FIXX-DEMO26";
const REFERRAL_LINK = "https://fixx.ai/invite/FIXX-DEMO26";
const NAV_SCREENS = ["s3", "s6", "s-notifications", "s-profile"];

let currentScreenId = "s1";

function loadProfileSettings() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveProfileSettings(patch) {
  const next = { ...loadProfileSettings(), ...patch };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

function fmtRel(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שעות`;
  return `לפני ${Math.floor(h / 24)} ימים`;
}

function goTo(screenId) {
  showScreen(screenId);
}
window.goTo = goTo;

function updateBottomNav(screenId) {
  const nav = document.getElementById("bottom-nav");
  const app = document.querySelector(".app");
  const show = NAV_SCREENS.includes(screenId);
  if (nav) nav.hidden = !show;
  if (app) app.classList.toggle("has-bottom-nav", show);
  nav?.querySelectorAll(".bottom-nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.target === screenId);
  });
}

function buildNotifications() {
  const prefs = loadProfileSettings().notifPrefs || {
    expiry: true,
    negotiation: true,
    scan: true,
    retention: true,
  };
  const now = Date.now();
  const items = [];

  if (prefs.retention) {
    const retentionVisible = document.getElementById("s4-retention-result")?.style.display !== "none";
    items.push({
      type: "retention",
      icon: "📞",
      title: "מחלקת שימור מתקשרת עכשיו",
      body: retentionVisible
        ? liveAssistState.resultText || "שיחת השימור הסתיימה"
        : "פרטנר — הסוכן מלווה אותך ב-Live Assist",
      ts: now,
      urgent: !retentionVisible,
    });
  }

  if (prefs.negotiation) {
    const statusText = document.getElementById("s4-status")?.textContent?.replace("● ", "") || "מו״מ פעיל";
    items.push({
      type: "negotiation",
      icon: "🤝",
      title: "עדכון סטטוס מו״מ",
      body: `פרטנר · ${statusText}`,
      ts: now - 45 * 60000,
    });
  }

  if (prefs.expiry) {
    items.push({
      type: "expiry",
      icon: "⏳",
      title: "תוקף הטבה בעוד 14 יום",
      body: "ההטבה על חבילת הסלולר בפרטנר פגה ב-14/07 — הסוכן יבדוק חידוש",
      ts: now - 2 * 86400000,
    });
  }

  if (prefs.scan) {
    items.push({
      type: "scan",
      icon: "📊",
      title: "תוצאות סריקה חצי-שנתית",
      body: selectedCategories.size
        ? `נמצאו ${selectedCategories.size} קטגוריות עם פוטנציאל חיסכון`
        : "הסוכן סרק חיובים — השלם את השאלון לתוצאות מלאות",
      ts: now - 5 * 86400000,
    });
  }

  return items.sort((a, b) => b.ts - a.ts);
}

function renderNotifications() {
  const list = document.getElementById("notifications-list");
  if (!list) return;
  const items = buildNotifications();
  if (items.length === 0) {
    list.innerHTML = `<p class="sub" style="text-align:center">אין התראות כרגע</p>`;
    return;
  }
  list.innerHTML = items
    .map(
      (n) => `
    <article class="notification-item${n.urgent ? " urgent" : ""}">
      <div class="notification-icon">${n.icon}</div>
      <div class="notification-body">
        <p class="notification-title">${n.title}</p>
        <p class="notification-text">${n.body}</p>
        <p class="notification-time">${fmtRel(n.ts)}</p>
      </div>
    </article>`,
    )
    .join("");
}

function setToggleState(btn, on) {
  if (!btn) return;
  btn.setAttribute("aria-pressed", on ? "true" : "false");
}

function renderProfile() {
  const settings = loadProfileSettings();
  const locationOn = settings.locationEnabled ?? false;

  setToggleState(document.getElementById("profile-location-toggle"), locationOn);
  const hint = document.getElementById("profile-location-hint");
  if (hint) {
    hint.textContent = locationOn
      ? `מיקום פעיל · ${settings.locationArea || userArea}`
      : "מאפשר הצעות רלוונטיות באזורך";
  }

  const prefs = settings.notifPrefs || { expiry: true, negotiation: true, scan: true, retention: true };
  document.querySelectorAll(".notif-pref").forEach((btn) => {
    const key = btn.dataset.pref;
    setToggleState(btn, prefs[key] !== false);
  });

  const tags = document.getElementById("profile-categories");
  if (tags) {
    if (selectedCategories.size === 0) {
      tags.innerHTML = `<span class="profile-tag">טרם נבחרו קטגוריות</span>`;
    } else {
      tags.innerHTML = Array.from(selectedCategories)
        .map((name) => {
          const cat = CATEGORIES.find((c) => c.name === name);
          return `<span class="profile-tag">${cat?.emoji ?? ""} ${name}</span>`;
        })
        .join("");
    }
  }
}

function maybeShowLocationSheet() {
  const settings = loadProfileSettings();
  if (settings.locationPrompted) return;
  document.getElementById("location-sheet")?.removeAttribute("hidden");
}

function closeLocationSheet(prompted = true) {
  if (prompted) saveProfileSettings({ locationPrompted: true });
  document.getElementById("location-sheet")?.setAttribute("hidden", "");
}

function initProfileAndNav() {
  const settings = loadProfileSettings();
  if (settings.locationEnabled) {
    userArea = settings.locationArea || userArea;
  }

  document.getElementById("profile-location-toggle")?.addEventListener("click", (e) => {
    const btn = e.currentTarget;
    const next = btn.getAttribute("aria-pressed") !== "true";
    if (next) {
      const city = document.getElementById("profile-city-input")?.value?.trim() || userArea;
      saveProfileSettings({ locationEnabled: true, locationArea: city, locationPrompted: true });
      userArea = city;
    } else {
      saveProfileSettings({ locationEnabled: false });
    }
    renderProfile();
    renderDiscoveryCard("s6-discovery", 2);
    renderDiscoveryCard("s7-discovery", 2);
  });

  document.querySelectorAll(".notif-pref").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.pref;
      const prefs = { ...(loadProfileSettings().notifPrefs || {}), [key]: btn.getAttribute("aria-pressed") === "true" ? false : true };
      saveProfileSettings({ notifPrefs: prefs });
      setToggleState(btn, prefs[key] !== false);
      renderNotifications();
    });
  });

  document.getElementById("copy-referral")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_CODE);
      alert("הקוד הועתק");
    } catch {
      alert(REFERRAL_CODE);
    }
  });

  document.getElementById("share-referral")?.addEventListener("click", () => {
    const text = `הצטרף ל-Fixx עם הקוד ${REFERRAL_CODE} — ${REFERRAL_LINK}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  });

  document.getElementById("location-allow")?.addEventListener("click", () => {
    const city = document.getElementById("profile-city-input")?.value?.trim() || "תל אביב";
    saveProfileSettings({ locationEnabled: true, locationArea: city, locationPrompted: true });
    userArea = city;
    closeLocationSheet(false);
    renderProfile();
    renderDiscoveryCard("s6-discovery", 2);
  });

  document.getElementById("location-deny")?.addEventListener("click", () => {
    saveProfileSettings({ locationEnabled: false, locationPrompted: true });
    closeLocationSheet(false);
    renderProfile();
  });
}

const LIVE_ASSIST_CTX = {
  providerName: "פרטנר",
  competitorName: "HOT Mobile",
  competitorPrice: 129,
  currentPrice: 189,
};

function buildLiveAssistScript(ctx) {
  const comp = Math.round(ctx.competitorPrice);
  const orig = Math.round(ctx.currentPrice);
  const target = Math.max(comp, Math.round(orig * 0.85));
  return {
    root: {
      id: "root",
      label: "משפט פתיחה",
      text: `קיבלתי הצעה מ-${ctx.competitorName} ב-₪${comp} לחודש לאותה חבילה.`,
      branches: { discount: "discount_1", refuse: "refuse_1", counter: "counter_1" },
    },
    discount_1: {
      id: "discount_1",
      label: "כשמציעים הנחה",
      text: `תודה, אבל זה עדיין לא משתלם מול ${ctx.competitorName}. מה המחיר הכי נמוך שאתם יכולים לתת?`,
      branches: { discount: "discount_2", refuse: "refuse_2", counter: "counter_1" },
    },
    discount_2: {
      id: "discount_2",
      label: "אם ההנחה עדיין לא מספיקה",
      text: `אני צריך לרדת ל-₪${target} לפחות כדי להישאר. אם לא — אני מאשר את המעבר.`,
      branches: { refuse: "refuse_2", counter: "counter_2" },
    },
    refuse_1: {
      id: "refuse_1",
      label: "כשסירבו לשפר",
      text: `אני מבין. אז אני אאשר את המעבר ל-${ctx.competitorName} היום — אלא אם תשוו את ההצעה.`,
      branches: { discount: "discount_1", counter: "counter_1" },
    },
    refuse_2: {
      id: "refuse_2",
      label: "סגירה נחרצת",
      text: "תודה על השיחה. אני מעדכן את הסוכן שלי וממשיך בתהליך המעבר.",
    },
    counter_1: {
      id: "counter_1",
      label: "הצעת נגד",
      text: `${ctx.competitorName} מציע ₪${comp} עם אותה חבילה. תוכלו להשתוות או לשפר?`,
      branches: { discount: "discount_1", refuse: "refuse_1", counter: "counter_2" },
    },
    counter_2: {
      id: "counter_2",
      label: "לחץ על ההצעה",
      text: `אני מחכה לתשובה סופית עכשיו — אחרת אני חותם עם ${ctx.competitorName}.`,
      branches: { discount: "discount_2", refuse: "refuse_2" },
    },
  };
}

const liveAssistState = {
  script: buildLiveAssistScript(LIVE_ASSIST_CTX),
  nodeId: "root",
  called: false,
  resultText: null,
  pendingBranch: null,
  lastOfferAmount: null,
};

const BRANCHES_REQUIRING_AMOUNT = ["discount", "counter"];

const selectedCategories = new Set();
const selectedRanges = {};
let selectedOfferId = "value";
let confirmedSavings = 0;

const demoState = {
  providerName: "פרטנר",
  category: "סלולר",
  beforeMonthly: 189,
  afterMonthly: 129,
  regFee: 49,
  pendingOffer: null,
  negotiationOutcome: "offers",
};

function getDiscoveryOffers(area = userArea, limit = 2) {
  const inArea = DISCOVERY_PLACEHOLDER.filter((o) => o.area === area);
  const pool = inArea.length >= limit ? inArea : [...inArea, ...DISCOVERY_PLACEHOLDER.filter((o) => o.area !== area)];
  return pool.slice(0, limit);
}

function renderDiscoveryCard(containerId, limit = 2) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const offers = getDiscoveryOffers(userArea, limit);
  container.innerHTML = `
    <div class="discovery-card">
      <div class="discovery-card-head">
        <p class="discovery-card-title">הצעות נוספות באזורך</p>
        <span class="discovery-card-area">📍 ${userArea}</span>
      </div>
      <div class="discovery-items">
        ${offers
          .map(
            (o) => `
          <a class="discovery-item" href="${o.url}" target="_blank" rel="noopener noreferrer">
            <span class="discovery-item-emoji">${o.emoji}</span>
            <span class="discovery-item-body">
              <span class="discovery-item-title">${o.title}</span>
              <span class="discovery-item-meta">${o.category} · ${o.description}</span>
            </span>
            <span class="discovery-item-chevron">‹</span>
          </a>`,
          )
          .join("")}
      </div>
    </div>
  `;
}

function recordConversion(fromProvider, toProvider, planName) {
  try {
    const raw = localStorage.getItem(CONVERSIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({
      fromProvider,
      toProvider,
      planName,
      completedAt: new Date().toISOString(),
    });
    localStorage.setItem(CONVERSIONS_KEY, JSON.stringify(list));
  } catch {}
}

function getRegistrationSteps(fromProvider, toProvider, planName) {
  return [
    `לחץ על הכפתור למטה ועבור לאתר ${toProvider} להרשמה`,
    `בחר את החבילה "${planName}" והשלם את טופס ההצטרפות`,
    `לאחר סיום — חזור ל-Fixx וסמן "סיימתי את ההרשמה" (מ-${fromProvider})`,
  ];
}

function renderRegistrationScreen() {
  const offer = getSelectedOffer();
  const sub = document.getElementById("s8-sub");
  const providerEl = document.getElementById("s8-provider");
  const stepsEl = document.getElementById("s8-steps");
  const cta = document.getElementById("s8-register-cta");

  if (sub) sub.textContent = `מעבר מ-${demoState.providerName} ל-${offer.providerName}`;
  if (providerEl) providerEl.textContent = offer.providerName;
  if (stepsEl) {
    stepsEl.innerHTML = getRegistrationSteps(demoState.providerName, offer.providerName, offer.plan)
      .map((step, i) => `<li><span class="step-num">${i + 1}</span><span>${step}</span></li>`)
      .join("");
  }
  if (cta) {
    cta.href = offer.registrationUrl;
    cta.textContent = `עבור להרשמה ב-${offer.providerName}`;
  }
}

function proceedAfterConfirm() {
  const offer = getSelectedOffer();
  demoState.afterMonthly = offer.monthly;
  demoState.regFee = offer.regFee;
  confirmedSavings = computeAnnualSavings(demoState.beforeMonthly, demoState.afterMonthly, demoState.regFee);

  if (offer.requiresSwitch) {
    demoState.pendingOffer = offer;
    renderRegistrationScreen();
    showScreen("s8");
    return;
  }

  demoState.providerName = offer.providerName;
  showScreen("s7");
}

function formatMoney(n) {
  return "₪" + Math.round(n).toLocaleString("he-IL");
}

function computeAnnualSavings(before, after, regFee) {
  const monthlySave = Math.max(0, before - after);
  return Math.max(0, monthlySave * 12 - regFee);
}

function showScreen(id) {
  currentScreenId = id;
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  updateBottomNav(id);
  if (id === "s7") {
    renderSuccessScreen();
    renderDiscoveryCard("s7-discovery", 2);
    spawnConfetti();
  }
  if (id === "s6") {
    renderDashboard();
    if (!document.getElementById("s6-main")?.hasAttribute("hidden")) {
      renderDiscoveryCard("s6-discovery", 2);
    }
    maybeShowLocationSheet();
  }
  if (id === "s8") renderRegistrationScreen();
  if (id === "s4") renderS4();
  if (id === "s-notifications") renderNotifications();
  if (id === "s-profile") renderProfile();
}

function toggleCategory(name) {
  if (selectedCategories.has(name)) {
    selectedCategories.delete(name);
    delete selectedRanges[name];
  } else {
    selectedCategories.add(name);
  }
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.classList.toggle("selected", selectedCategories.has(btn.dataset.category));
  });
  buildPriceRanges();
}

function selectRange(category, range, btn) {
  selectedRanges[category] = range;
  document.querySelectorAll(`.range-btn[data-category="${CSS.escape(category)}"]`).forEach((el) => {
    el.classList.toggle("selected", el === btn);
  });
}

function buildPriceRanges() {
  const wrapper = document.getElementById("priceRanges");
  const container = document.getElementById("rangeCards");
  if (!wrapper || !container) return;

  container.innerHTML = "";

  if (selectedCategories.size === 0) {
    wrapper.style.display = "none";
    return;
  }

  selectedCategories.forEach((category) => {
    const ranges = PRICE_RANGES[category];
    if (!ranges?.length) return;

    const cat = CATEGORIES.find((c) => c.name === category);
    const card = document.createElement("div");
    card.className = "price-range-card";

    const title = document.createElement("p");
    title.className = "price-range-title";
    title.textContent = `${cat?.emoji ?? ""} ${category} — בחר טווח`;

    const btns = document.createElement("div");
    btns.className = "range-btns";

    ranges.forEach((range) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "range-btn";
      btn.dataset.category = category;
      btn.textContent = range;
      if (selectedRanges[category] === range) btn.classList.add("selected");
      btn.addEventListener("click", () => selectRange(category, range, btn));
      btns.appendChild(btn);
    });

    card.appendChild(title);
    card.appendChild(btns);
    container.appendChild(card);
  });

  wrapper.style.display = container.children.length > 0 ? "block" : "none";
}

function renderCategories() {
  const grid = document.getElementById("categories-grid");
  if (!grid) return;

  grid.innerHTML = "";
  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cat-btn" + (cat.full ? " full" : "");
    btn.dataset.category = cat.name;
    btn.innerHTML = `<span>${cat.emoji}</span><span>${cat.name}</span>`;
    btn.addEventListener("click", () => toggleCategory(cat.name));
    grid.appendChild(btn);
  });
}

function renderOffers() {
  const list = document.getElementById("offers-list");
  if (!list) return;

  list.innerHTML = "";
  DEMO_OFFERS.forEach((offer) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "glass-card offer-card" + (selectedOfferId === offer.id ? " selected" : "");
    card.innerHTML = `
      <p style="margin:0;font-size:11px;color:var(--teal);font-weight:700">${offer.label}</p>
      <p style="margin:4px 0 0;font-weight:700">${offer.plan}</p>
      <p class="offer-price" style="margin:8px 0 0">${formatMoney(offer.monthly)}<span style="font-size:12px;font-weight:400;color:var(--muted-foreground)">/חודש</span></p>
    `;
    card.addEventListener("click", () => {
      selectedOfferId = offer.id;
      renderOffers();
      document.getElementById("go-s5").disabled = false;
    });
    list.appendChild(card);
  });
}

function getSelectedOffer() {
  return DEMO_OFFERS.find((o) => o.id === selectedOfferId) ?? DEMO_OFFERS[1];
}

function renderConfirmSummary() {
  const box = document.getElementById("confirm-summary");
  const offer = getSelectedOffer();
  if (!box) return;

  demoState.afterMonthly = offer.monthly;
  demoState.regFee = offer.regFee;
  confirmedSavings = computeAnnualSavings(demoState.beforeMonthly, demoState.afterMonthly, demoState.regFee);

  box.innerHTML = `
    <p class="price-range-title">${demoState.providerName} · ${demoState.category}</p>
    <p class="sub" style="margin:8px 0 0">הצעה: <strong>${offer.plan}</strong> · ${offer.providerName}</p>
    <p class="sub" style="margin:8px 0 0">מחיר חודשי: <strong>${formatMoney(offer.monthly)}</strong></p>
    <p class="sub" style="margin:8px 0 0">${offer.requiresSwitch ? "מעבר לספק חדש" : "עדכון חבילה אצל הספק הקיים"}</p>
    <p class="sub" style="margin:8px 0 0">חיסכון שנתי משוער: <strong style="color:var(--teal)">${formatMoney(confirmedSavings)}</strong></p>
  `;
}

function renderSuccessScreen() {
  const offer = getSelectedOffer();
  demoState.afterMonthly = offer.monthly;
  confirmedSavings = computeAnnualSavings(demoState.beforeMonthly, demoState.afterMonthly, demoState.regFee);

  const beforeEl = document.getElementById("s7-before");
  const afterEl = document.getElementById("s7-after");
  const savingsEl = document.getElementById("s7-savings");

  if (beforeEl) beforeEl.textContent = formatMoney(demoState.beforeMonthly) + "/חודש";
  if (afterEl) afterEl.textContent = formatMoney(demoState.afterMonthly) + "/חודש";
  if (savingsEl) savingsEl.textContent = formatMoney(confirmedSavings);
}

function formatDateIL(date) {
  return date.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

function getRecheckDate(days = 90) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function showCompetitiveOutcome() {
  demoState.negotiationOutcome = "competitive";
  renderS4();
}

function renderS4() {
  const competitive = demoState.negotiationOutcome === "competitive";
  document.getElementById("s4-competitive-result")?.toggleAttribute("hidden", !competitive);
  document.getElementById("go-offers")?.toggleAttribute("hidden", competitive);
  document.getElementById("s4-mark-competitive")?.toggleAttribute("hidden", competitive);
  document.getElementById("open-live-assist")?.toggleAttribute("hidden", competitive);

  const status = document.getElementById("s4-status");
  if (status && competitive) {
    status.textContent = "● הבדיקה הושלמה";
    status.style.color = "var(--muted-foreground)";
  } else if (status) {
    status.textContent = "● מו״מ פעיל";
    status.style.color = "var(--teal)";
  }

  const recheck = document.getElementById("s4-recheck-date");
  if (recheck && competitive) {
    recheck.textContent = `בדיקה חוזרת אוטומטית: ${formatDateIL(getRecheckDate())}`;
  }
}

function renderDashboard() {
  const empty = selectedCategories.size === 0;
  document.getElementById("s6-empty")?.toggleAttribute("hidden", !empty);
  document.getElementById("s6-main")?.toggleAttribute("hidden", empty);

  if (empty) return;

  const totalEl = document.getElementById("dashboard-savings");
  const lineEl = document.getElementById("dashboard-provider-line");
  const offer = getSelectedOffer();

  if (totalEl) totalEl.textContent = formatMoney(confirmedSavings);
  if (lineEl) {
    lineEl.textContent = `${demoState.providerName} — ${offer.plan} · ${formatMoney(offer.monthly)}/חודש`;
  }
}

function spawnConfetti() {
  const layer = document.getElementById("confetti-layer");
  if (!layer) return;

  layer.innerHTML = "";
  const colors = ["var(--teal)", "#00e5c8", "#7fffe8", "#ffffff"];

  for (let i = 0; i < 24; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${10 + Math.random() * 80}%`;
    piece.style.top = `${5 + Math.random() * 30}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = piece.style.width;
    layer.appendChild(piece);
  }
}

function buildWhatsAppUrl(amount) {
  const text = `חסכתי ${formatMoney(amount)} בשנה עם Fixx!`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function showLiveAssistScriptView() {
  document.getElementById("live-assist-script-view")?.removeAttribute("hidden");
  document.getElementById("live-assist-outcome-view")?.setAttribute("hidden", "");
  document.getElementById("live-assist-amount-view")?.setAttribute("hidden", "");
}

function showLiveAssistAmountView(branch) {
  liveAssistState.pendingBranch = branch;
  document.getElementById("live-assist-script-view")?.setAttribute("hidden", "");
  document.getElementById("live-assist-outcome-view")?.setAttribute("hidden", "");
  document.getElementById("live-assist-amount-view")?.removeAttribute("hidden");
  const input = document.getElementById("live-assist-branch-amount");
  if (input) {
    input.value = liveAssistState.lastOfferAmount ?? "";
    input.focus();
  }
}

function renderLiveAssistNode() {
  const node = liveAssistState.script[liveAssistState.nodeId] ?? liveAssistState.script.root;
  const labelEl = document.getElementById("live-assist-label");
  const textEl = document.getElementById("live-assist-text");
  if (labelEl) labelEl.textContent = node.label;
  if (textEl) {
    textEl.textContent = `"${node.text}"`;
    textEl.style.animation = "none";
    void textEl.offsetWidth;
    textEl.style.animation = "";
  }

  document.querySelectorAll(".live-assist-branch-btn").forEach((btn) => {
    const branch = btn.dataset.branch;
    const enabled = !!node.branches?.[branch];
    btn.disabled = !enabled;
    btn.style.display = enabled ? "block" : "none";
  });
}

function advanceLiveAssistBranch(branch) {
  const node = liveAssistState.script[liveAssistState.nodeId] ?? liveAssistState.script.root;
  const nextId = node.branches?.[branch];
  if (!nextId || !liveAssistState.script[nextId]) return false;
  if (liveAssistState.nodeId === "root") liveAssistState.called = true;
  liveAssistState.nodeId = nextId;
  liveAssistState.pendingBranch = null;
  showLiveAssistScriptView();
  renderLiveAssistNode();
  return true;
}

function openLiveAssist() {
  liveAssistState.nodeId = "root";
  liveAssistState.called = false;
  liveAssistState.pendingBranch = null;
  showLiveAssistScriptView();
  document.getElementById("live-assist")?.removeAttribute("hidden");
  renderLiveAssistNode();
}

function closeLiveAssist() {
  document.getElementById("live-assist")?.setAttribute("hidden", "");
}

function liveAssistBranch(branch) {
  const node = liveAssistState.script[liveAssistState.nodeId] ?? liveAssistState.script.root;
  if (!node.branches?.[branch]) return;
  if (BRANCHES_REQUIRING_AMOUNT.includes(branch)) {
    showLiveAssistAmountView(branch);
    return;
  }
  advanceLiveAssistBranch(branch);
}

function continueLiveAssistAmount() {
  const amt = Number(document.getElementById("live-assist-branch-amount")?.value);
  if (!amt || amt <= 0) {
    alert("הזן סכום חודשי תקין");
    return;
  }
  liveAssistState.lastOfferAmount = amt;
  const branch = liveAssistState.pendingBranch;
  if (!branch) return;
  advanceLiveAssistBranch(branch);
}

function showLiveAssistOutcome() {
  document.getElementById("live-assist-script-view")?.setAttribute("hidden", "");
  document.getElementById("live-assist-amount-view")?.setAttribute("hidden", "");
  document.getElementById("live-assist-outcome-view")?.removeAttribute("hidden");
  const recorded = document.getElementById("live-assist-recorded-amount");
  if (recorded) {
    if (liveAssistState.lastOfferAmount) {
      recorded.textContent = `סכום שתועד: ${formatMoney(liveAssistState.lastOfferAmount)}/חודש`;
      recorded.removeAttribute("hidden");
    } else {
      recorded.setAttribute("hidden", "");
    }
  }
}

function getSwitchOffer() {
  return DEMO_OFFERS.find((o) => o.requiresSwitch) || DEMO_OFFERS[0];
}

function finishLiveAssistStayed() {
  if (!liveAssistState.lastOfferAmount || liveAssistState.lastOfferAmount <= 0) {
    alert('תעד כמה הציעו במהלך השיחה (בחירה ב"הציעו הנחה" או "הציעו הצעת נגד")');
    return;
  }
  demoState.afterMonthly = liveAssistState.lastOfferAmount;
  demoState.regFee = 0;
  confirmedSavings = computeAnnualSavings(demoState.beforeMonthly, demoState.afterMonthly, demoState.regFee);
  const currentEl = document.getElementById("s4-current-price");
  if (currentEl) currentEl.textContent = formatMoney(liveAssistState.lastOfferAmount);
  reportRetentionResult(
    `נשארת עם ${demoState.providerName} · ${formatMoney(liveAssistState.lastOfferAmount)}/חודש`,
    "השימור הצליח",
  );
  showScreen("s7");
}

function finishLiveAssistSwitch() {
  const offer = getSwitchOffer();
  selectedOfferId = offer.id;
  demoState.afterMonthly = offer.monthly;
  demoState.regFee = offer.regFee;
  demoState.pendingOffer = offer;
  confirmedSavings = computeAnnualSavings(demoState.beforeMonthly, demoState.afterMonthly, demoState.regFee);
  reportRetentionResult(`ממשיך ל-${offer.providerName}`, "מעבר לספק חדש");
  renderRegistrationScreen();
  showScreen("s8");
}

function reportRetentionResult(text, statusLabel) {
  liveAssistState.resultText = text;
  const box = document.getElementById("s4-retention-result");
  const line = document.getElementById("s4-retention-result-text");
  const status = document.getElementById("s4-status");
  if (box) box.style.display = "block";
  if (line) line.textContent = text;
  if (status) {
    status.textContent = `● ${statusLabel}`;
    status.style.color = "var(--teal)";
  }
  closeLiveAssist();
}

function initLiveAssist() {
  document.getElementById("open-live-assist")?.addEventListener("click", openLiveAssist);
  document.getElementById("close-live-assist")?.addEventListener("click", closeLiveAssist);
  document.getElementById("live-assist-finish")?.addEventListener("click", showLiveAssistOutcome);
  document.getElementById("live-assist-back-script")?.addEventListener("click", showLiveAssistScriptView);
  document.getElementById("live-assist-amount-back")?.addEventListener("click", showLiveAssistScriptView);
  document.getElementById("live-assist-amount-continue")?.addEventListener("click", continueLiveAssistAmount);

  document.querySelectorAll(".live-assist-branch-btn[data-branch]").forEach((btn) => {
    btn.addEventListener("click", () => liveAssistBranch(btn.dataset.branch));
  });

  document.getElementById("live-assist-stayed")?.addEventListener("click", finishLiveAssistStayed);
  document.getElementById("live-assist-switch")?.addEventListener("click", finishLiveAssistSwitch);
}

function initDemo() {
  renderCategories();
  buildPriceRanges();
  renderOffers();
  renderDiscoveryCard("s6-discovery", 2);
  initLiveAssist();
  initProfileAndNav();
  renderProfile();

  document.getElementById("go-s2")?.addEventListener("click", () => showScreen("s2"));

  document.getElementById("skip-questionnaire")?.addEventListener("click", () => showScreen("s6"));
  document.getElementById("s6-complete-questionnaire")?.addEventListener("click", () => showScreen("s2"));

  document.getElementById("start-agent")?.addEventListener("click", () => {
    if (selectedCategories.size === 0) {
      alert("בחר לפחות קטגוריה אחת");
      return;
    }
    demoState.negotiationOutcome = "offers";
    showScreen("s3");
    setTimeout(() => showScreen("s4"), 1800);
  });

  document.getElementById("go-offers")?.addEventListener("click", () => showScreen("s9"));
  document.getElementById("s4-mark-competitive")?.addEventListener("click", showCompetitiveOutcome);
  document.getElementById("back-s4")?.addEventListener("click", () => showScreen("s4"));

  document.getElementById("go-s5")?.addEventListener("click", () => {
    renderConfirmSummary();
    showScreen("s5");
  });

  document.getElementById("confirm-choice")?.addEventListener("click", () => {
    renderConfirmSummary();
    proceedAfterConfirm();
  });

  document.getElementById("registration-done")?.addEventListener("click", () => {
    const offer = getSelectedOffer();
    const fromProvider = demoState.providerName;
    recordConversion(fromProvider, offer.providerName, offer.plan);
    demoState.providerName = offer.providerName;
    showScreen("s7");
  });

  document.getElementById("share-whatsapp")?.addEventListener("click", () => {
    window.open(buildWhatsAppUrl(confirmedSavings), "_blank", "noopener,noreferrer");
  });

  document.getElementById("go-s6")?.addEventListener("click", () => showScreen("s6"));
}

document.addEventListener("DOMContentLoaded", initDemo);
