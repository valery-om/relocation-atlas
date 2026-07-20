(function () {
  "use strict";

  function validateRuntimeData(data) {
    var errors = [];
    if (!data || typeof data !== "object") return ["ATLAS_DATA отсутствует"];
    if (!data.meta || data.meta.schemaVersion !== 5) errors.push("Неподдерживаемая версия схемы");
    if (!Array.isArray(data.visaTypes) || !data.visaTypes.length) errors.push("Нет справочника visaTypes");
    if (!Array.isArray(data.entries) || !data.entries.length) errors.push("Нет маршрутов");
    if (!data.countryProfiles || typeof data.countryProfiles !== "object") errors.push("Нет countryProfiles");
    if (!data.citySignals || typeof data.citySignals !== "object") errors.push("Нет citySignals");
    if (!data.workProfiles || typeof data.workProfiles !== "object") errors.push("Нет workProfiles");
    if (!data.childEducationProfiles || typeof data.childEducationProfiles !== "object") errors.push("Нет childEducationProfiles");
    var typeIds = new Set((data.visaTypes || []).map(function (type) { return type.id; }));
    if (typeIds.size !== (data.visaTypes || []).length) errors.push("Повторяющийся visaType id");
    var routeIds = new Set();
    (data.entries || []).forEach(function (entry) {
      if (!entry.id || routeIds.has(entry.id)) errors.push("Повтор или пустой route id");
      routeIds.add(entry.id);
      if (!typeIds.has(entry.visaType)) errors.push((entry.id || "route") + ": неизвестный visaType");
      if (!entry.availability || !entry.availability.RU) errors.push((entry.id || "route") + ": нет RU availability");
      if (!Array.isArray(entry.sources) || !entry.sources.length) errors.push((entry.id || "route") + ": нет источника");
      if (entry.visaType === "talent" && !entry.talentProfile) errors.push((entry.id || "route") + ": нет talentProfile");
      if (!data.countryProfiles || !data.countryProfiles[entry.code]) errors.push((entry.id || "route") + ": нет countryProfile");
      (entry.cities || []).forEach(function (city) {
        if (!data.citySignals || !data.citySignals[entry.code + "|" + city.name]) errors.push((entry.id || "route") + ": нет citySignal");
      });
    });
    return errors.slice(0, 6);
  }

  var DATA = window.ATLAS_DATA;
  var I18N = window.ATLAS_I18N;
  var DATA_ERRORS = validateRuntimeData(DATA);
  if (DATA_ERRORS.length) {
    document.body.innerHTML = '<main class="fatal-error"><h1>Данные атласа не прошли проверку</h1><p>' + DATA_ERRORS.join(" · ") + '</p><p>Запустите <code>node scripts/validate-platform-data.js</code>.</p></main>';
    return;
  }

  var LEVEL_RANK = { temporary: 1, residence: 2, citizenship: 3 };
  var APP_VERSION = "0.11.0";
  var PLAN_VERSION = 4;
  var PROFILE_KEY = "relocation-atlas-profile-v5";
  var PLAN_BOARD_KEY = "relocation-atlas-plan-board-v1";
  var SCENARIO_KEY = "relocation-atlas-scenario-v1";
  var FINALISTS_KEY = "relocation-atlas-finalists-v1";
  var PLAN_BOARD_VERSION = 1;
  var SCENARIO_VERSION = 1;
  var FINALISTS_VERSION = 1;
  var PLAN_CHECK_STATUSES = ["todo", "in-progress", "verified"];
  var FINALIST_ROLES = ["unassigned", "anchor", "fallback", "research"];
  var LEGACY_PROFILE_KEYS = ["relocation-atlas-profile-v4", "relocation-atlas-profile-v3", "relocation-atlas-profile-v2"];
  var VISA_TYPES_BY_ID = DATA.visaTypes.reduce(function (map, type) { map[type.id] = type; return map; }, {});
  var PAGE_SIZE = 9;
  var DEFAULT_PROFILE = {
    nationality: "RU",
    level: "temporary",
    adults: 2,
    children: 0,
    childEducationStage: "none",
    childEducationFormat: "either",
    childEducationVisa: false,
    income: 4000,
    currentSpend: 2200,
    budget: 2500,
    savings: 15000,
    investment: 0,
    zone: "all",
    climate: "any",
    seaPreference: "any",
    mountainPreference: "any",
    stayStyle: "wintering",
    workMode: "remote",
    skillSector: "digital",
    skillText: "",
    horizon: 6,
    presence: "unsure",
    study: true,
    talent: false,
    childPlan: false,
    keepDual: true,
    verifiedOnly: false,
    weights: { safety: 9, cost: 8, infra: 8, nature: 6, certainty: 10, speed: 7 },
    segment: "all",
    catalogType: "talent",
    visaTypeFilter: "all",
    search: "",
    sort: "score",
    pinned: []
  };

  var JUDGE_DEMO_PROFILE = Object.assign(clonePlain(DEFAULT_PROFILE), {
    level: "residence",
    adults: 2,
    children: 1,
    childEducationStage: "primary",
    childEducationFormat: "international",
    childEducationVisa: true,
    income: 9000,
    currentSpend: 4000,
    budget: 7000,
    savings: 60000,
    investment: 0,
    zone: "europe",
    climate: "temperate",
    workMode: "remote",
    skillSector: "digital",
    horizon: 10,
    presence: "can-stay",
    study: true,
    talent: true,
    childPlan: false,
    keepDual: true,
    pinned: ["pt-d8", "de-study", "uk-talent"]
  });

  function clonePlain(value) {
    return JSON.parse(JSON.stringify(value));
  }

  var state = loadProfile();
  var planBoardState = loadPlanBoard();
  var scenarioState = loadScenario();
  var finalistState = loadFinalists();
  var computed = [];
  var scenarioResult = null;
  var visibleLimit = PAGE_SIZE;
  var hasCalculated = false;
  var calculationDirty = false;
  var lastFocus = null;
  var toastTimer = null;

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var clamp = function (value, min, max) { return Math.max(min, Math.min(max, value)); };
  var uiText = function (value) { return I18N ? I18N.translate(value) : value; };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character];
    });
  }

  function formatMoney(value) {
    var number = Number(value || 0);
    if (!number) return "—";
    if (number >= 1000000) return "$" + (number / 1000000).toFixed(number % 1000000 ? 1 : 0) + "m";
    if (number >= 1000) return "$" + Math.round(number / 1000) + "k";
    return "$" + Math.round(number);
  }

  function formatExactMoney(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return "$" + Math.round(number).toLocaleString("en-US");
  }

  function formatBudget(range, factor) {
    if (!range || range.length < 2) return "н/д";
    return "$" + Math.round(range[0] * factor / 100) * 100 + "–" + Math.round(range[1] * factor / 100) * 100;
  }

  function formatMoneyRange(range) {
    if (!range || range.length < 2) return "н/д";
    return formatExactMoney(range[0]) + "–" + formatExactMoney(range[1]);
  }

  function adjustedRange(range) {
    if (!range || range.length < 2) return null;
    var factor = householdFactor();
    return range.map(function (value) { return Math.round(value * factor / 100) * 100; });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function emptyPlanBoard() {
    return { version: PLAN_BOARD_VERSION, items: {} };
  }

  function validIsoDate(value) {
    return typeof value === "string" && !Number.isNaN(Date.parse(value));
  }

  function loadPlanBoard() {
    try {
      var parsed = JSON.parse(localStorage.getItem(PLAN_BOARD_KEY) || "null");
      if (!parsed || parsed.version !== PLAN_BOARD_VERSION || !parsed.items || typeof parsed.items !== "object" || Array.isArray(parsed.items)) return emptyPlanBoard();
      var clean = emptyPlanBoard();
      Object.keys(parsed.items).slice(0, 500).forEach(function (id) {
        var item = parsed.items[id];
        if (!/^[a-z0-9-]+:(?:hard-blocker|unknown):[a-z0-9]+$/i.test(id) || !item || !PLAN_CHECK_STATUSES.includes(item.status)) return;
        clean.items[id] = {
          status: item.status,
          updatedAt: validIsoDate(item.updatedAt) ? item.updatedAt : null
        };
      });
      return clean;
    } catch (error) {
      return emptyPlanBoard();
    }
  }

  function savePlanBoard() {
    try {
      localStorage.setItem(PLAN_BOARD_KEY, JSON.stringify(planBoardState));
    } catch (error) {
      showToast("Браузер не сохранил статусы плана");
    }
  }

  function clearPlanBoard() {
    planBoardState = emptyPlanBoard();
    try {
      localStorage.removeItem(PLAN_BOARD_KEY);
    } catch (error) {
      showToast("Не удалось очистить статусы плана");
    }
  }

  function emptyFinalistState() {
    return { version: FINALISTS_VERSION, choices: {} };
  }

  function finalistRoute(routeId) {
    return DATA.entries.find(function (entry) { return entry.id === routeId; });
  }

  function normalizeFinalistState(value) {
    var clean = emptyFinalistState();
    var claimedRoles = { anchor: false, fallback: false };
    if (!value || value.version !== FINALISTS_VERSION || !value.choices || typeof value.choices !== "object" || Array.isArray(value.choices)) return clean;
    DATA.entries.forEach(function (route) {
      var choice = value.choices[route.id];
      if (!choice || typeof choice !== "object" || Array.isArray(choice)) return;
      var role = FINALIST_ROLES.includes(choice.role) ? choice.role : "unassigned";
      if ((role === "anchor" || role === "fallback") && claimedRoles[role]) role = "unassigned";
      if (role === "anchor" || role === "fallback") claimedRoles[role] = true;
      var cityName = typeof choice.cityName === "string" && route.cities.some(function (city) { return city.name === choice.cityName; }) ? choice.cityName : null;
      if (role === "unassigned" && !cityName) return;
      clean.choices[route.id] = {
        role: role,
        cityName: cityName,
        updatedAt: validIsoDate(choice.updatedAt) ? choice.updatedAt : null
      };
    });
    return clean;
  }

  function loadFinalists() {
    try {
      return normalizeFinalistState(JSON.parse(localStorage.getItem(FINALISTS_KEY) || "null"));
    } catch (error) {
      return emptyFinalistState();
    }
  }

  function saveFinalists() {
    try {
      localStorage.setItem(FINALISTS_KEY, JSON.stringify(finalistState));
    } catch (error) {
      showToast("Браузер не сохранил выбор финалистов");
    }
  }

  function clearFinalists() {
    finalistState = emptyFinalistState();
    try {
      localStorage.removeItem(FINALISTS_KEY);
    } catch (error) {
      showToast("Не удалось очистить выбор финалистов");
    }
  }

  function emptyScenarioState() {
    return { version: SCENARIO_VERSION, open: false, draft: null, hasCompared: false, baselineSignature: null };
  }

  function scenarioDraftFromProfile(profile) {
    return {
      budget: boundedNumber(profile.budget, 0, 1000000, DEFAULT_PROFILE.budget, false),
      presence: ["unsure", "can-stay", "need-travel"].includes(profile.presence) ? profile.presence : "unsure",
      workMode: ["remote", "local-job", "self-employed", "hands-on", "not-working"].includes(profile.workMode) ? profile.workMode : "remote",
      childPlan: Boolean(profile.childPlan)
    };
  }

  function normalizeScenarioDraft(draft, profile) {
    var fallback = scenarioDraftFromProfile(profile || DEFAULT_PROFILE);
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) return fallback;
    return scenarioDraftFromProfile(Object.assign({}, fallback, draft));
  }

  function loadScenario() {
    try {
      var parsed = JSON.parse(localStorage.getItem(SCENARIO_KEY) || "null");
      if (!parsed || parsed.version !== SCENARIO_VERSION) return emptyScenarioState();
      return {
        version: SCENARIO_VERSION,
        open: parsed.open === true,
        draft: parsed.draft ? normalizeScenarioDraft(parsed.draft, state || DEFAULT_PROFILE) : null,
        hasCompared: parsed.hasCompared === true,
        baselineSignature: typeof parsed.baselineSignature === "string" ? parsed.baselineSignature : null
      };
    } catch (error) {
      return emptyScenarioState();
    }
  }

  function saveScenario() {
    try {
      localStorage.setItem(SCENARIO_KEY, JSON.stringify(scenarioState));
    } catch (error) {
      showToast("Браузер не сохранил сценарий");
    }
  }

  function clearScenario() {
    scenarioState = emptyScenarioState();
    scenarioResult = null;
    try {
      localStorage.removeItem(SCENARIO_KEY);
    } catch (error) {
      showToast("Не удалось очистить сценарий");
    }
  }

  function stableCheckHash(value) {
    var hash = 2166136261;
    String(value).trim().toLocaleLowerCase("ru-RU").split("").forEach(function (character) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    });
    return (hash >>> 0).toString(36);
  }

  function checklistItemId(routeId, type, label) {
    return routeId + ":" + type + ":" + stableCheckHash(label);
  }

  function boundedNumber(value, min, max, fallback, integer) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = fallback;
    number = Math.max(min, Math.min(max, number));
    return integer ? Math.round(number) : number;
  }

  function stayStyleForLevel(level) {
    return { temporary: "wintering", residence: "trial", citizenship: "anchor" }[level] || "wintering";
  }

  function loadProfile() {
    try {
      var raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) LEGACY_PROFILE_KEYS.some(function (key) {
        raw = localStorage.getItem(key);
        return Boolean(raw);
      });
      var saved = raw ? JSON.parse(raw) : null;
      if (saved && saved.localWork === true && !saved.workMode) saved.workMode = "local-job";
      return mergeProfile(saved || {});
    } catch (error) {
      return clone(DEFAULT_PROFILE);
    }
  }

  function mergeProfile(saved) {
    var profile = clone(DEFAULT_PROFILE);
    Object.keys(profile).forEach(function (key) {
      if (saved[key] !== undefined) profile[key] = saved[key];
    });
    profile.weights = clone(DEFAULT_PROFILE.weights);
    Object.keys(DEFAULT_PROFILE.weights).forEach(function (key) {
      if (saved.weights && Object.prototype.hasOwnProperty.call(saved.weights, key)) profile.weights[key] = saved.weights[key];
    });
    profile.adults = boundedNumber(profile.adults, 1, 6, DEFAULT_PROFILE.adults, true);
    profile.children = boundedNumber(profile.children, 0, 8, DEFAULT_PROFILE.children, true);
    profile.income = boundedNumber(profile.income, 0, 1000000, DEFAULT_PROFILE.income, false);
    profile.currentSpend = boundedNumber(profile.currentSpend, 0, 1000000, DEFAULT_PROFILE.currentSpend, false);
    profile.budget = boundedNumber(profile.budget, 0, 1000000, DEFAULT_PROFILE.budget, false);
    profile.savings = boundedNumber(profile.savings, 0, 100000000, DEFAULT_PROFILE.savings, false);
    profile.investment = boundedNumber(profile.investment, 0, 100000000, DEFAULT_PROFILE.investment, false);
    profile.horizon = boundedNumber(profile.horizon, 1, 12, DEFAULT_PROFILE.horizon, true);
    Object.keys(DEFAULT_PROFILE.weights).forEach(function (key) {
      profile.weights[key] = boundedNumber(profile.weights[key], 0, 10, DEFAULT_PROFILE.weights[key], true);
    });
    ["study", "talent", "childPlan", "childEducationVisa", "keepDual", "verifiedOnly"].forEach(function (key) {
      if (typeof profile[key] !== "boolean") profile[key] = DEFAULT_PROFILE[key];
    });
    if (!DATA.nationalities.some(function (item) { return item.code === profile.nationality && item.status === "active"; })) profile.nationality = "RU";
    if (!["all", "asia", "europe", "eurasia", "americas", "africa-islands", "oceania"].includes(profile.zone)) profile.zone = "all";
    if (!["any", "warm", "temperate", "cool"].includes(profile.climate)) profile.climate = "any";
    if (!["any", "direct", "near"].includes(profile.seaPreference)) profile.seaPreference = "any";
    if (!["any", "direct", "near"].includes(profile.mountainPreference)) profile.mountainPreference = "any";
    if (!["none", "nursery", "kindergarten", "primary", "secondary"].includes(profile.childEducationStage)) profile.childEducationStage = "none";
    if (!["either", "local", "international"].includes(profile.childEducationFormat)) profile.childEducationFormat = "either";
    if (!["wintering", "trial", "anchor"].includes(profile.stayStyle)) profile.stayStyle = "wintering";
    if (!["unsure", "can-stay", "need-travel"].includes(profile.presence)) profile.presence = "unsure";
    if (!["remote", "local-job", "self-employed", "hands-on", "not-working"].includes(profile.workMode)) profile.workMode = "remote";
    if (!["digital", "professional", "beauty", "hospitality", "trades", "care", "creative", "other"].includes(profile.skillSector)) profile.skillSector = "other";
    profile.skillText = typeof profile.skillText === "string" ? profile.skillText.slice(0, 120) : "";
    if (!["all", "remote", "talent", "education", "family", "investment"].includes(profile.segment)) profile.segment = "all";
    if (!["score", "budget", "speed", "certainty", "infra"].includes(profile.sort)) profile.sort = "score";
    profile.search = typeof profile.search === "string" ? profile.search.slice(0, 200) : "";
    profile.pinned = Array.isArray(saved.pinned) ? saved.pinned.filter(function (id) {
      return DATA.entries.some(function (entry) { return entry.id === id; });
    }).slice(0, 3) : [];
    if (!LEVEL_RANK[profile.level]) profile.level = "temporary";
    profile.stayStyle = stayStyleForLevel(profile.level);
    if (!VISA_TYPES_BY_ID[profile.catalogType]) profile.catalogType = "talent";
    if (profile.visaTypeFilter !== "all" && !VISA_TYPES_BY_ID[profile.visaTypeFilter]) profile.visaTypeFilter = "all";
    return profile;
  }

  function saveProfile() {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(state));
    } catch (error) {
      showToast("Браузер не сохранил профиль");
    }
  }

  function householdFactor() {
    return Math.max(.62, (Number(state.adults || 1) + Number(state.children || 0) * .55) / 2);
  }

  function segmentOf(entry) {
    return VISA_TYPES_BY_ID[entry.visaType].family;
  }

  function segmentLabel(segment) {
    return { remote: "REMOTE / ENTRY", talent: "TALENT", education: "EDUCATION", family: "FAMILY", investment: "INVESTMENT" }[segment] || "ROUTE";
  }

  function outcomeLabel(outcome) {
    return { temporary: "Временная база", residence: "ВНЖ / ПМЖ", citizenship: "Гражданство" }[outcome] || outcome;
  }

  function visaTypeLabel(visaType) {
    return VISA_TYPES_BY_ID[visaType] ? VISA_TYPES_BY_ID[visaType].label : visaType;
  }

  function countryProfile(entry) {
    return DATA.countryProfiles[entry.code];
  }

  function citySignal(entry, city) {
    return DATA.citySignals[entry.code + "|" + city.name];
  }

  function zoneLabel(zone) {
    return { all: "Весь мир", asia: "Азия", europe: "Европа", eurasia: "Евразия", americas: "Америка", "africa-islands": "Африка / острова", oceania: "Океания" }[zone] || zone;
  }

  function workModeLabel(mode) {
    return { remote: "Удалённая работа", "local-job": "Ищу местный найм", "self-employed": "Свои клиенты / self-employed", "hands-on": "Работа руками / с клиентами", "not-working": "Пока не планирую работать" }[mode] || mode;
  }

  function presenceLabel(value) {
    return { unsure: "Пока не знаем", "can-stay": "Да, можем без выездов", "need-travel": "Нет, нужны поездки" }[value] || "Пока не знаем";
  }

  function childPlanLabel(value) {
    return value ? "Да, реальный план" : "Нет";
  }

  function childEducationStageLabel(value) {
    return { none: "не выбран", nursery: "ясли · до 3 лет", kindergarten: "детский сад · 3–6 лет", primary: "начальная школа", secondary: "средняя / старшая школа" }[value] || "не выбран";
  }

  function childEducationFormatLabel(value) {
    return { either: "любой подходящий", local: "местная школа / сад", international: "international / bilingual" }[value] || "любой подходящий";
  }

  function childEducationStatusLabel(value) {
    return { verified: "официальный слой", restricted: "ограниченный route", "route-dependent": "зависит от статуса", "needs-check": "не исследовано", "not-derived": "не даёт статус родителю", "not-selected": "не учтено" }[value] || "не исследовано";
  }

  function childEducationStatusClass(value) {
    if (value === "verified") return "education-verified";
    if (value === "restricted" || value === "route-dependent") return "education-conditional";
    if (value === "not-derived") return "education-danger";
    return "education-unknown";
  }

  function skillSectorLabel(sector) {
    return { digital: "Digital / IT / online", professional: "Право, финансы, консалтинг", beauty: "Красота / маникюр / hair", hospitality: "Кафе, отели, сервис", trades: "Ремесло и технические навыки", care: "Уход, здоровье, обучение", creative: "Креативные профессии", other: "Другое" }[sector] || sector;
  }

  function workStatusLabel(status) {
    return { legal: "можно легализовать", "route-dependent": "зависит от route", "permit-required": "нужно разрешение", "high-risk": "высокий риск", "not-authorized": "не разрешено", "needs-check": "нужно проверить" }[status] || status;
  }

  function workStatusClass(status) {
    if (status === "legal") return "work-legal";
    if (status === "route-dependent" || status === "permit-required") return "work-conditional";
    if (status === "high-risk" || status === "not-authorized") return "work-danger";
    return "work-unknown";
  }

  function passportSignal(profile) {
    if (!profile) return "нет данных";
    if (profile.passportTier > 3) return "сильнее RU";
    if (profile.passportTier < 3) return "слабее RU";
    return "≈ RU";
  }

  function languageAccessLabel(value) {
    return { easy: "легче без местного языка", mixed: "язык быстро становится важен", hard: "местный язык критичен" }[value] || "needs research";
  }

  function bureaucracyLabel(value) {
    return { light: "относительно лёгкая", moderate: "средняя", heavy: "тяжёлая" }[value] || "needs research";
  }

  function geographyLabel(value, feature) {
    var labels = feature === "sea"
      ? { direct: "море в городе", near: "море рядом", none: "без моря" }
      : { direct: "горы рядом", near: "горы до 2 часов", none: "без гор" };
    return labels[value] || "не проверено";
  }

  function housingLabel(value) {
    return { balanced: "рынок спокойнее", warm: "спрос заметный", hot: "рынок перегрет", severe: "дефицит / очень дорого", seasonal: "сильная сезонность", volatile: "цены волатильны", limited: "очень мало предложения" }[value] || "needs research";
  }

  function migrantShareLabel(profile) {
    return profile && profile.migrantShare != null ? profile.migrantShare.toFixed(1).replace(".0", "") + "% жителей" : "нет сопоставимых данных";
  }

  function signedPercent(value) {
    if (value == null || !Number.isFinite(value)) return "—";
    var rounded = Math.round(value * 100);
    return (rounded > 0 ? "+" : "") + rounded + "%";
  }

  function featureMatch(actual, preference) {
    if (preference === "any") return 0;
    if (actual === "direct") return 28;
    if (actual === "near" && preference === "near") return 18;
    return -18;
  }

  function bestCity(entry) {
    if (!entry.cities || !entry.cities.length) return null;
    return entry.cities.slice().sort(function (a, b) {
      var aSignal = citySignal(entry, a);
      var bSignal = citySignal(entry, b);
      var aScore = featureMatch(aSignal.sea, state.seaPreference) + featureMatch(aSignal.mountains, state.mountainPreference) - a.budget[0] / 180;
      var bScore = featureMatch(bSignal.sea, state.seaPreference) + featureMatch(bSignal.mountains, state.mountainPreference) - b.budget[0] / 180;
      return bScore - aScore;
    })[0];
  }

  function climateMatch(entry) {
    if (state.climate === "any") return 100;
    var text = entry.cities.map(function (city) { return city.climate; }).join(" ").toLocaleLowerCase("ru");
    if (state.climate === "warm") return /троп|жарк|море|океан|средизем|субтроп/.test(text) ? 100 : 45;
    if (state.climate === "temperate") return /четыре|умерен|континент/.test(text) ? 100 : 52;
    if (state.climate === "cool") return /холод|прохлад|умерен|четыре/.test(text) ? 100 : 40;
    return 70;
  }

  function speedScore(entry) {
    if (state.level === "temporary") {
      if (/90 дней|60 дней|45 дней|30 дней/.test(entry.stay)) return 72;
      if (/180|год|12/.test(entry.stay)) return 92;
      return 82;
    }
    if (state.level === "residence") return entry.outcome === "citizenship" ? 84 : 78;
    var years = Number(entry.citizenshipYears || 20);
    if (years <= 1) return 100;
    if (years <= 2) return 94;
    if (years <= 4) return 82;
    if (years <= 5) return 72;
    if (years <= 7) return 57;
    if (years <= 10) return 39;
    return 20;
  }

  function certaintyScore(entry) {
    var grade = { A: 94, B: 72, C: 46 }[entry.confidence] || 50;
    if (entry.status === "partial") grade -= 7;
    if (entry.status === "needs-check") grade -= 18;
    var availability = entry.availability[state.nationality] || { status: "planned" };
    if (availability.status === "needs-check") grade -= 10;
    if (availability.status === "planned" || availability.status === "blocked") grade -= 35;
    return clamp(grade, 0, 100);
  }

  function workAssessment(entry) {
    if (state.workMode === "not-working") {
      return { status: "legal", note: "Работа не является условием первого этапа.", score: 92 };
    }
    var profile = DATA.workProfiles[entry.code];
    var ruleKey = { remote: "remote", "local-job": "localJob", "self-employed": "selfEmployed", "hands-on": "handsOn" }[state.workMode];
    var rule = profile && profile[ruleKey];
    if (state.workMode === "remote") {
      if (entry.remoteWork === "no") return { status: "not-authorized", note: "Этот route не разрешает заявленную remote activity.", score: 0 };
      if (entry.remoteWork === "uncertain") return rule ? Object.assign({ score: workScore(rule.status) }, rule) : { status: "needs-check", note: "Dedicated remote-work right не подтверждён.", score: 32 };
      if (entry.remoteWork === "limited" || entry.remoteWork === "category-specific") return rule ? Object.assign({ score: workScore(rule.status) }, rule) : { status: "route-dependent", note: "Remote work ограничена условиями категории.", score: 70 };
      return rule ? Object.assign({ score: workScore(rule.status) }, rule) : { status: "legal", note: "Route прямо моделируется для remote income.", score: 100 };
    }
    if (state.workMode === "local-job" && entry.localWork === "no") {
      return rule ? Object.assign({ score: workScore(rule.status) }, rule) : { status: "not-authorized", note: "Текущий route не даёт local work right.", score: 0 };
    }
    if (rule) return Object.assign({ score: workScore(rule.status) }, rule);
    if (entry.localWork === "yes") {
      return { status: state.workMode === "local-job" ? "legal" : "route-dependent", note: state.workMode === "local-job" ? "Route заявляет local work right; profession-specific licensing проверяется отдельно." : "Иммиграционный статус допускает работу, но business/professional rules ещё нужно проверить.", score: state.workMode === "local-job" ? 95 : 76 };
    }
    if (entry.localWork === "switch" || entry.localWork === "limited" || entry.localWork === "petitioner/itinerary" || entry.localWork === "category-specific") {
      return { status: "permit-required", note: "Нужна смена основания или отдельное разрешение под activity.", score: 52 };
    }
    return { status: "needs-check", note: "Для этого способа заработка нет достаточного official-source layer.", score: 32 };
  }

  function workScore(status) {
    return { legal: 100, "route-dependent": 78, "permit-required": 52, "needs-check": 32, "high-risk": 0, "not-authorized": 0 }[status] || 25;
  }

  function lifestyleResult(cityMid) {
    var income = Number(state.income || 0);
    var currentSpend = Number(state.currentSpend || 0);
    var remaining = income - cityMid;
    var delta = currentSpend ? (cityMid - currentSpend) / currentSpend : null;
    var coverage = cityMid ? income / cityMid : 0;
    var status = "unknown";
    if (income && cityMid > income) status = "does-not-fit";
    else if (delta === null) status = "unknown";
    else if (delta <= -.15) status = "improves";
    else if (delta <= .15) status = "similar";
    else status = "declines";
    var continuity = delta === null ? 55 : clamp(100 - Math.max(0, delta * 115) + Math.max(0, -delta * 35), 0, 100);
    var coverageScore = cityMid ? clamp(coverage * 62, 0, 100) : 50;
    return { status: status, delta: delta, remaining: remaining, coverage: coverage, score: continuity * .45 + coverageScore * .55 };
  }

  function lifestyleLabel(result) {
    if (!result || result.status === "unknown") return "нужны текущие расходы";
    if (result.status === "does-not-fit") return "доход не покрывает корзину";
    if (result.status === "improves") return "базовая жизнь дешевле";
    if (result.status === "similar") return "примерно тот же уровень";
    return "базовая жизнь дороже";
  }

  function lifestyleClass(result) {
    if (!result) return "life-unknown";
    if (result.status === "improves") return "life-improves";
    if (result.status === "similar") return "life-similar";
    if (result.status === "declines" || result.status === "does-not-fit") return "life-declines";
    return "life-unknown";
  }

  function stayStyleScore(entry) {
    if (state.stayStyle === "anchor") return entry.outcome === "citizenship" ? 100 : entry.outcome === "residence" ? 58 : 20;
    if (state.stayStyle === "trial") return entry.outcome === "residence" ? 100 : entry.outcome === "citizenship" ? 88 : 62;
    return entry.outcome === "temporary" || entry.visaType === "nomad" || entry.visaType === "visitor" ? 100 : 72;
  }

  function childEducationAssessment(entry) {
    var active = state.childEducationStage !== "none";
    var profile = DATA.childEducationProfiles && DATA.childEducationProfiles[entry.code];
    var stage = state.childEducationStage;
    var provision = active && profile && profile.provision ? profile.provision[stage] : null;
    var studentApplies = Boolean(active && profile && profile.student && profile.student.stages.includes(stage));
    var unknowns = [];

    if (active && !profile) {
      unknowns.push("Образование ребёнка: страна ещё не исследована по dependent-path, школьной визе, сопровождающему родителю и " + childEducationStageLabel(stage));
    }
    if (active && provision && (provision.status === "needs-check" || provision.status === "route-dependent")) {
      unknowns.push("Образование ребёнка · " + childEducationStageLabel(stage) + ": " + provision.summary);
    }
    if (active && state.childEducationFormat === "international") {
      unknowns.push("International / bilingual образование: стоимость, места и конкретная программа не проверены по городу");
    }
    if (active && state.childEducationVisa && profile && !studentApplies) {
      unknowns.push("Отдельное школьное основание не подтверждено для этапа «" + childEducationStageLabel(stage) + "»; сначала проверяйте dependent-path по статусу родителя");
    }
    if (active && state.childEducationVisa && profile && profile.guardian.status === "not-derived") {
      unknowns.push("Сопровождающий родитель: школьный статус ребёнка не создаёт подтверждённого статуса взрослому; требуется собственное основание");
    }

    return {
      active: active,
      stage: stage,
      stageLabel: childEducationStageLabel(stage),
      format: state.childEducationFormat,
      formatLabel: childEducationFormatLabel(state.childEducationFormat),
      schoolAsBasis: state.childEducationVisa,
      profile: profile || null,
      provision: provision || null,
      studentApplies: studentApplies,
      status: !active ? "not-selected" : !profile ? "needs-check" : state.childEducationVisa && !studentApplies ? "restricted" : provision ? provision.status : "needs-check",
      headline: !active
        ? "Этап образования не выбран в профиле."
        : !profile
          ? "Для страны ещё нет официального child-education среза."
          : state.childEducationVisa && !studentApplies
            ? "Самостоятельный school route для выбранного этапа не подтверждён."
            : provision.summary,
      unknowns: unknowns
    };
  }

  function evaluate(entry) {
    var blockers = [];
    var warnings = [];
    var availability = entry.availability[state.nationality] || { status: "planned", note: "Nationality layer not researched." };
    var factor = householdFactor();
    var city = bestCity(entry);
    var cityLow = city ? city.budget[0] * factor : 0;
    var cityMid = city ? ((city.budget[0] + city.budget[1]) / 2) * factor : 0;
    var requiredInvestment = Number(entry.investmentMin || 0) + Number(entry.applyCost || 0);
    var segment = segmentOf(entry);
    var work = workAssessment(entry);
    var childEducation = childEducationAssessment(entry);
    var lifestyle = lifestyleResult(cityMid);
    var profile = countryProfile(entry);
    var signal = city ? citySignal(entry, city) : null;

    if (availability.status === "blocked" || availability.status === "planned") blockers.push("Нет проверенной доступности для гражданства");
    if (availability.status === "needs-check") warnings.push("Nationality / compliance требует pre-check");
    if (Number(state.income || 0) < Number(entry.incomeMin || 0)) blockers.push("Доход ниже " + formatMoney(entry.incomeMin) + "/мес.");
    if (Number(state.savings || 0) < Number(entry.fundsMin || 0)) blockers.push("Накопления ниже " + formatMoney(entry.fundsMin));
    if (entry.investmentMin && Number(state.investment || 0) < requiredInvestment) blockers.push("Инвестиционный бюджет ниже ≈" + formatMoney(requiredInvestment));
    if (!entry.investmentMin && Number(state.savings || 0) < Number(entry.applyCost || 0)) blockers.push("Не хватает на стартовые расходы ≈" + formatMoney(entry.applyCost));
    if (cityLow && Number(state.budget || 0) < cityLow) blockers.push("Бюджет жизни ниже ≈" + formatMoney(cityLow) + "/мес.");
    if (work.status === "high-risk" || work.status === "not-authorized") blockers.push("Заработок: " + workStatusLabel(work.status));
    if (work.status === "permit-required" || work.status === "route-dependent" || work.status === "needs-check") warnings.push("Работа: " + work.note);
    if (["local-job", "self-employed", "hands-on"].includes(state.workMode)) warnings.push("Спрос, зарплата и язык для профессии ещё не смоделированы по городу");
    if (["professional", "care", "beauty"].includes(state.skillSector) && ["local-job", "self-employed", "hands-on"].includes(state.workMode)) warnings.push("Проверить recognition, professional/sanitary и municipal licensing для навыка");
    if (lifestyle.status === "does-not-fit") blockers.push("Доход не покрывает среднюю city basket");
    if (state.level === "citizenship" && state.keepDual && entry.dual === "no") blockers.push("Проблема сохранения гражданства РФ");
    if (state.level === "citizenship" && entry.citizenshipYears && Number(state.horizon) < Number(entry.citizenshipYears)) blockers.push("Clock дольше " + state.horizon + " лет");
    if (state.level === "citizenship" && entry.presenceDemand) {
      if (state.presence === "need-travel") blockers.push("Нужны поездки: " + entry.presenceDemand.note);
      if (state.presence === "unsure") blockers.push("Нет ответа о непрерывном присутствии: " + entry.presenceDemand.note);
    }
    if (segment === "education" && !state.study) blockers.push("Нужна готовность учиться очно");
    if (segment === "talent" && !state.talent) blockers.push("Нужна подтверждаемая talent-гипотеза");
    if (segment === "family" && !state.childPlan) blockers.push("Ребёнок не отмечен как семейный план");
    if (entry.remoteWork === "uncertain") warnings.push("Remote work не оформлен отдельным статусом");
    if (signal && state.seaPreference !== "any" && signal.sea === "none") warnings.push("Море не совпадает с предпочтением");
    if (signal && state.mountainPreference !== "any" && signal.mountains === "none") warnings.push("Горы не совпадают с предпочтением");
    if (entry.status !== "verified") warnings.push("Часть условий требует обновления");
    warnings = warnings.concat(entry.unknowns || []);

    var metrics = entry.metrics;
    var components = {
      safety: ((metrics.peace + (6 - metrics.hazard) + (6 - metrics.policy)) / 3) * 20,
      cost: (6 - metrics.cost) * 20,
      infra: metrics.infra * 20,
      nature: metrics.nature * 20,
      certainty: certaintyScore(entry),
      speed: speedScore(entry)
    };
    var weighted = 0;
    var weightTotal = 0;
    Object.keys(components).forEach(function (key) {
      var weight = Number(state.weights[key] || 0);
      weighted += components[key] * weight;
      weightTotal += weight;
    });
    var contextScore = weightTotal ? weighted / weightTotal : 50;

    var budgetFit = cityLow ? clamp(Number(state.budget || 0) / cityLow * 72, 0, 100) : 72;
    var resourceFit = 100;
    if (entry.incomeMin) resourceFit = Math.min(resourceFit, clamp(Number(state.income || 0) / entry.incomeMin * 82, 0, 100));
    if (entry.fundsMin) resourceFit = Math.min(resourceFit, clamp(Number(state.savings || 0) / entry.fundsMin * 82, 0, 100));
    if (entry.investmentMin) resourceFit = Math.min(resourceFit, clamp(Number(state.investment || 0) / requiredInvestment * 88, 0, 100));
    var zoneFit = state.zone === "all" || profile.zone === state.zone ? 100 : 35;
    var scenarioFit = 82;
    if (segment === "education") scenarioFit = state.study ? 100 : 10;
    if (segment === "talent") scenarioFit = state.talent ? 100 : 18;
    if (segment === "family") scenarioFit = state.childPlan ? 100 : 5;
    scenarioFit = scenarioFit * .6 + stayStyleScore(entry) * .4;
    var profileScore = (budgetFit * .17 + resourceFit * .18 + lifestyle.score * .18 + work.score * .18 + climateMatch(entry) * .10 + zoneFit * .07 + scenarioFit * .12);
    var score = contextScore * .66 + profileScore * .34 - Math.min(24, blockers.length * 6);

    return Object.assign({}, entry, {
      blockers: blockers,
      warnings: warnings,
      segment: segment,
      score: Math.round(clamp(score, 0, 100)),
      cityLow: cityLow,
      cityMid: cityMid,
      bestCity: city,
      citySignal: signal,
      countryProfile: profile,
      workAssessment: work,
      childEducation: childEducation,
      lifestyle: lifestyle,
      budgetFits: !cityLow || Number(state.budget || 0) >= cityLow,
      availabilityState: availability,
      components: components
    });
  }

  function qualifiesLevel(entry) {
    return LEVEL_RANK[entry.outcome] >= LEVEL_RANK[state.level];
  }

  function routeMatchesFilters(entry) {
    if (!qualifiesLevel(entry)) return false;
    if (state.zone !== "all" && entry.countryProfile.zone !== state.zone) return false;
    if (state.segment !== "all" && entry.segment !== state.segment) return false;
    if (state.visaTypeFilter !== "all" && entry.visaType !== state.visaTypeFilter) return false;
    if (state.verifiedOnly && entry.status !== "verified") return false;
    var query = String(state.search || "").trim().toLocaleLowerCase("ru");
    if (query) {
      var haystack = [entry.country, entry.route, entry.entry, entry.region, zoneLabel(entry.countryProfile.zone), entry.countryProfile.languages, visaTypeLabel(entry.visaType)].concat(entry.cities.map(function (city) { return city.name; })).join(" ").toLocaleLowerCase("ru");
      if (haystack.indexOf(query) < 0) return false;
    }
    return true;
  }

  function sortedVisible() {
    var list = computed.filter(routeMatchesFilters);
    list.sort(function (a, b) {
      if (state.sort === "budget") return (a.cityLow || 999999) - (b.cityLow || 999999);
      if (state.sort === "speed") return b.components.speed - a.components.speed;
      if (state.sort === "certainty") return b.components.certainty - a.components.certainty;
      if (state.sort === "infra") return b.metrics.infra - a.metrics.infra;
      if (a.blockers.length !== b.blockers.length) return a.blockers.length - b.blockers.length;
      return b.score - a.score;
    });
    return list;
  }

  function rankForDecision(entries) {
    return entries.slice().sort(function (a, b) {
      if (a.blockers.length !== b.blockers.length) return a.blockers.length - b.blockers.length;
      if (a.warnings.length !== b.warnings.length) return a.warnings.length - b.warnings.length;
      return b.score - a.score;
    });
  }

  function topRoutes() {
    var eligible = rankForDecision(computed.filter(function (entry) {
      return qualifiesLevel(entry) && (state.zone === "all" || entry.countryProfile.zone === state.zone);
    }));
    var selected = [];

    function addBest(filter) {
      var candidate = eligible.find(function (entry) {
        return selected.indexOf(entry) < 0 && filter(entry);
      });
      if (candidate) selected.push(candidate);
    }

    addBest(function (entry) { return entry.outcome === state.level; });
    if (state.level === "temporary") {
      addBest(function (entry) { return entry.outcome === "residence"; });
      addBest(function (entry) { return entry.outcome === "citizenship"; });
    } else if (state.level === "residence") {
      addBest(function (entry) { return entry.outcome === "citizenship"; });
    }
    eligible.forEach(function (entry) {
      if (selected.length < 3 && selected.indexOf(entry) < 0) selected.push(entry);
    });
    return selected;
  }

  function decisionProfileSignature(profile) {
    var decisionProfile = {
      nationality: profile.nationality,
      level: profile.level,
      adults: profile.adults,
      children: profile.children,
      childEducationStage: profile.childEducationStage,
      childEducationFormat: profile.childEducationFormat,
      childEducationVisa: profile.childEducationVisa,
      income: profile.income,
      currentSpend: profile.currentSpend,
      budget: profile.budget,
      savings: profile.savings,
      investment: profile.investment,
      zone: profile.zone,
      climate: profile.climate,
      seaPreference: profile.seaPreference,
      mountainPreference: profile.mountainPreference,
      stayStyle: profile.stayStyle,
      workMode: profile.workMode,
      skillSector: profile.skillSector,
      skillText: profile.skillText,
      horizon: profile.horizon,
      presence: profile.presence,
      study: profile.study,
      talent: profile.talent,
      childPlan: profile.childPlan,
      keepDual: profile.keepDual,
      weights: profile.weights
    };
    return stableCheckHash(JSON.stringify(decisionProfile));
  }

  function decisionForProfile(profile) {
    var baselineState = state;
    var baselineComputed = computed;
    try {
      state = mergeProfile(profile);
      state.stayStyle = stayStyleForLevel(state.level);
      computed = DATA.entries.map(evaluate);
      var trajectories = topRoutes();
      var leader = trajectories[0] || null;
      return {
        profile: clone(state),
        entries: computed.slice(),
        trajectories: trajectories,
        leader: leader,
        reason: leader ? mainReason(leader) : "Нет маршрута для выбранной цели",
        constraint: leader ? mainConstraint(leader) : "Нет результата"
      };
    } finally {
      state = baselineState;
      computed = baselineComputed;
    }
  }

  function scenarioProfile() {
    var profile = clone(state);
    var draft = normalizeScenarioDraft(scenarioState.draft, state);
    profile.budget = draft.budget;
    profile.presence = state.level === "citizenship" ? draft.presence : state.presence;
    profile.workMode = draft.workMode;
    profile.childPlan = draft.childPlan;
    return profile;
  }

  function scenarioChanges() {
    var draft = normalizeScenarioDraft(scenarioState.draft, state);
    var changes = [];
    if (Number(draft.budget) !== Number(state.budget)) changes.push("Бюджет: " + formatExactMoney(state.budget) + " → " + formatExactMoney(draft.budget) + "/мес.");
    if (state.level === "citizenship" && draft.presence !== state.presence) changes.push("Поездки: " + presenceLabel(state.presence) + " → " + presenceLabel(draft.presence));
    if (draft.workMode !== state.workMode) changes.push("Работа: " + workModeLabel(state.workMode) + " → " + workModeLabel(draft.workMode));
    if (draft.childPlan !== state.childPlan) changes.push("Семейный сценарий: " + childPlanLabel(state.childPlan) + " → " + childPlanLabel(draft.childPlan));
    return changes;
  }

  function routeRisks(entry) {
    if (!entry) return [];
    return entry.blockers.map(function (text) { return { key: "blocker:" + text, label: "Hard blocker · " + text }; })
      .concat(entry.warnings.map(function (text) { return { key: "unknown:" + text, label: "Неизвестное · " + text }; }));
  }

  function riskDifference(left, right) {
    var rightKeys = new Set(right.map(function (item) { return item.key; }));
    return left.filter(function (item) { return !rightKeys.has(item.key); });
  }

  function scenarioRankingReason(baselineLeader, alternativeLeader, alternativeEntries) {
    if (!baselineLeader || !alternativeLeader) return "Для одного из профилей нет подходящего маршрута.";
    if (baselineLeader.id === alternativeLeader.id) return "Лидер не сменился; ниже показано, какие его риски и сравнительный fit изменились.";
    var oldLeaderInScenario = alternativeEntries.find(function (entry) { return entry.id === baselineLeader.id; });
    if (!oldLeaderInScenario) return "Новый лидер лучше соответствует выбранной цели после изменения ответов.";
    if (alternativeLeader.blockers.length < oldLeaderInScenario.blockers.length) {
      return "Новый лидер поднялся выше: в сценарии у него меньше hard blockers, чем у прежнего лидера.";
    }
    if (alternativeLeader.warnings.length < oldLeaderInScenario.warnings.length) {
      return "Новый лидер поднялся выше: при равном числе blockers у него меньше неизвестных.";
    }
    if (alternativeLeader.score > oldLeaderInScenario.score) {
      return "Новый лидер поднялся выше по сравнительному fit после применения изменённых ответов.";
    }
    return "Изменённые ответы поменяли порядок goal-aligned маршрутов; blockers и неизвестные по-прежнему важнее среднего fit.";
  }

  function trajectoryRole(entry, index) {
    if (state.level === "temporary") {
      return { temporary: "Быстрый старт", residence: "Закрепиться", citizenship: "Citizenship anchor" }[entry.outcome] || "Траектория";
    }
    if (state.level === "residence") {
      if (entry.outcome === "residence") return index === 0 ? "Лидер для ВНЖ" : "Residence fallback";
      return "ВНЖ → citizenship";
    }
    return index === 0 ? "Citizenship leader" : index === 1 ? "Баланс / fallback" : "Альтернативный anchor";
  }

  function recompute() {
    computed = DATA.entries.map(evaluate);
    saveProfile();
    render();
  }

  function renderCalculationState() {
    var showResults = hasCalculated && !calculationDirty;
    $("#resultsFlow").hidden = !showResults;
    $("#referenceFlow").hidden = !showResults;
    $("#calculationGate").hidden = showResults;
    $("#calculateButton span").textContent = hasCalculated ? "Пересчитать траектории" : "Рассчитать траектории";
    if (!showResults) {
      $("#calculationGateTitle").innerHTML = calculationDirty
        ? 'Данные изменились.<br><em>Обновим маршрут.</em>'
        : 'Сначала —<br>ваши ответы.<br><em>Потом — страны.</em>';
      $("#calculationGateText").textContent = calculationDirty
        ? "Мы сохранили новые ответы. Нажмите «Пересчитать», чтобы не смешивать старый результат с новым профилем."
        : "Заполните анкету и нажмите «Рассчитать». Здесь появятся лидер, три ближайшие траектории и объяснение почему.";
      $("#gateCalculateButton").textContent = calculationDirty ? "Пересчитать →" : "Рассчитать сейчас →";
    }
  }

  function calculateRoutes(shouldScroll) {
    state.stayStyle = stayStyleForLevel(state.level);
    hasCalculated = true;
    calculationDirty = false;
    visibleLimit = PAGE_SIZE;
    recompute();
    if (shouldScroll) requestAnimationFrame(function () {
      $("#resultStart").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function markCalculationDirty() {
    state.stayStyle = stayStyleForLevel(state.level);
    visibleLimit = PAGE_SIZE;
    if (hasCalculated) calculationDirty = true;
    saveProfile();
    renderCalculationState();
    renderScenario();
    renderMyPlan();
    renderDock();
  }

  function render() {
    renderTopMeta();
    renderVisaCatalog();
    renderOverview();
    renderShortlist();
    renderScenario();
    renderFilters();
    renderRouteList();
    renderComparison();
    renderCalculationState();
    renderMyPlan();
    renderDock();
    if (I18N) I18N.apply(document.documentElement);
  }

  function loadJudgeDemo() {
    var customProfile = decisionProfileSignature(state) !== decisionProfileSignature(DEFAULT_PROFILE) || state.pinned.length > 0;
    if (customProfile && !window.confirm(uiText("Заменить текущие локальные ответы анонимным demo profile? Сначала скачайте профиль, если хотите его сохранить."))) return;
    state = clone(JUDGE_DEMO_PROFILE);
    clearPlanBoard();
    clearScenario();
    finalistState = {
      version: FINALISTS_VERSION,
      choices: {
        "pt-d8": { role: "anchor", cityName: "Лиссабон", updatedAt: null },
        "de-study": { role: "fallback", cityName: "Берлин", updatedAt: null },
        "uk-talent": { role: "research", cityName: "Лондон", updatedAt: null }
      }
    };
    saveFinalists();
    visibleLimit = PAGE_SIZE;
    syncForm();
    calculateRoutes(true);
    showToast("Анонимный demo profile загружен");
  }

  function renderTopMeta() {
    var countries = new Set(DATA.entries.map(function (entry) { return entry.code; }));
    var sourceCount = DATA.entries.reduce(function (sum, entry) { return sum + entry.sources.length; }, 0);
    var cityCount = DATA.entries.reduce(function (sum, entry) { return sum + entry.cities.length; }, 0);
    $("#topRouteCount").textContent = DATA.entries.length;
    $("#topCountryCount").textContent = countries.size;
    $("#heroSources").textContent = sourceCount;
    $("#heroCities").textContent = cityCount;
  }

  function renderVisaCatalog() {
    var counts = DATA.entries.reduce(function (map, entry) {
      map[entry.visaType] = (map[entry.visaType] || 0) + 1;
      return map;
    }, {});
    $("#visaTypeGrid").innerHTML = DATA.visaTypes.map(function (type) {
      var active = state.catalogType === type.id;
      var count = counts[type.id] || 0;
      return '<button class="visa-type-card' + (active ? " active" : "") + (type.status === "queue" ? " queue" : "") + '" type="button" role="tab" aria-selected="' + (active ? "true" : "false") + '" data-catalog-type="' + type.id + '">' +
        '<span class="visa-type-index">' + escapeHtml(type.index) + '</span>' +
        '<span class="visa-type-mark">' + escapeHtml(type.mark) + '</span>' +
        '<strong>' + escapeHtml(type.label) + '</strong>' +
        '<small>' + (count ? count + " маршрутов" : "research queue") + '</small>' +
      '</button>';
    }).join("");

    var type = VISA_TYPES_BY_ID[state.catalogType] || DATA.visaTypes[0];
    var routes = computed.filter(function (entry) { return entry.visaType === type.id; }).sort(function (a, b) {
      if (LEVEL_RANK[a.outcome] !== LEVEL_RANK[b.outcome]) return LEVEL_RANK[b.outcome] - LEVEL_RANK[a.outcome];
      return b.score - a.score;
    });
    var routeButtons = routes.map(function (entry) {
      return '<button class="catalog-route" type="button" data-open="' + entry.id + '">' +
        '<span>' + entry.flag + '</span><strong>' + escapeHtml(entry.country) + '</strong><small>' + escapeHtml(entry.route) + '</small><b>' + escapeHtml(outcomeLabel(entry.outcome)) + ' ↗</b>' +
      '</button>';
    }).join("");
    var action = routes.length
      ? '<button class="catalog-filter-button" type="button" data-filter-type="' + type.id + '">Показать все ' + routes.length + ' в глобальном экране ↓</button>'
      : '<span class="catalog-queue-note">Категория уже заложена в schema. Официальный RU-screening — в следующей очереди.</span>';
    var researchLink = '<button class="catalog-method-button" type="button" data-open-method>Как мы проверяем данные ↗</button>';

    $("#visaCatalogFocus").innerHTML =
      '<div class="catalog-focus-intro"><span class="panel-index">' + escapeHtml(type.mark) + ' / ' + escapeHtml(type.index) + '</span><h3>' + escapeHtml(type.label) + '</h3><p>' + escapeHtml(type.description) + '</p><strong>' + escapeHtml(type.fit) + '</strong></div>' +
      '<div class="catalog-focus-facts">' +
        '<article><span>Что доказывать</span><p>' + escapeHtml(type.evidence) + '</p></article>' +
        '<article><span>Работодатель</span><p>' + escapeHtml(type.employer) + '</p></article>' +
        '<article><span>Максимальный outcome</span><p>' + escapeHtml(type.outcome) + '</p></article>' +
        '<article class="risk"><span>Не перепутать</span><p>' + escapeHtml(type.risk) + '</p></article>' +
      '</div>' +
      '<div class="catalog-route-strip">' + (routeButtons || '<div class="catalog-empty-route">Пока нет проверенных карточек.</div>') + '</div>' +
      '<div class="catalog-focus-action">' + action + researchLink + '</div>';
  }

  function mainReason(entry) {
    var reasons = [];
    if (entry.lifestyle.status === "improves") reasons.push("базовая жизнь дешевле");
    else if (entry.budgetFits) reasons.push("вписывается в planning budget");
    if (entry.workAssessment.status === "legal") reasons.push("работу можно оформить");
    if (entry.presenceDemand && state.presence === "can-stay") reasons.push("presence clock совместим с ответом");
    if (entry.status === "verified") reasons.push("official facts checked");
    if (entry.metrics.infra >= 4) reasons.push("сильная инфраструктура");
    if (entry.components.speed >= 85) reasons.push("короткий горизонт");
    return reasons.slice(0, 2).join(" · ") || "сильнее других вариантов по выбранным весам";
  }

  function mainConstraint(entry) {
    if (entry.blockers.length) return entry.blockers[0];
    if (entry.warnings.length) return entry.warnings[0];
    return "Критических blockers и неизвестных в текущем срезе не найдено";
  }

  function renderOverview() {
    var routes = topRoutes();
    var top = routes[0];
    $("#leaderRole").textContent = top ? trajectoryRole(top, 0) + " · " + outcomeLabel(top.outcome) : "Текущий лидер";
    $("#leaderName").textContent = top ? top.country + " · " + top.route : "Нет маршрута";
    $("#leaderReason").textContent = top ? mainReason(top) : "Измените исходные данные";
    $("#leaderConstraint").textContent = top ? mainConstraint(top) : "—";
    $("#leaderScore").textContent = top ? top.score + "/100" : "—";
    $("#lifestyleSignal").textContent = top ? signedPercent(top.lifestyle.delta) : "—";
    $("#lifestyleSignal").className = top ? lifestyleClass(top.lifestyle) : "";
    $("#incomeRemainder").textContent = top ? formatMoney(top.lifestyle.remaining) : "—";
    $("#incomeRemainder").className = top && top.lifestyle.remaining < 0 ? "negative-value" : "";
    $("#workSignal").textContent = top ? workStatusLabel(top.workAssessment.status) : "—";
    $("#workSignal").className = top ? workStatusClass(top.workAssessment.status) : "";
  }

  function renderShortlist() {
    var list = topRoutes();
    if (!list.length) {
      $("#shortlist").innerHTML = '<div class="route-empty">Для этого уровня пока нет совпадений.</div>';
      return;
    }
    $("#shortlist").innerHTML = list.map(function (entry, index) {
      var className = entry.blockers.length ? " blocked" : entry.status !== "verified" || entry.warnings.length || entry.childEducation.active && entry.childEducation.status !== "verified" ? " partial" : "";
      var pinned = state.pinned.indexOf(entry.id) >= 0;
      var educationSignal = entry.childEducation.active
        ? '<div class="short-education"><span>Ребёнок · ' + escapeHtml(entry.childEducation.stageLabel) + '</span><strong class="' + childEducationStatusClass(entry.childEducation.status) + '">' + escapeHtml(childEducationStatusLabel(entry.childEducation.status)) + '</strong></div>'
        : "";
      return '<article class="short-card' + className + '">' +
        '<div class="short-card-top"><span class="flag">' + entry.flag + '</span><span class="score-ring">' + entry.score + '<small>fit</small></span></div>' +
        '<div class="short-card-main"><span class="panel-index">' + escapeHtml(trajectoryRole(entry, index)) + '</span><h3>' + escapeHtml(entry.country) + '</h3><div class="route-name">' + escapeHtml(entry.route) + ' · ' + escapeHtml(outcomeLabel(entry.outcome)) + '</div>' +
        '<div class="short-signals"><span class="' + lifestyleClass(entry.lifestyle) + '">' + escapeHtml(lifestyleLabel(entry.lifestyle)) + ' ' + signedPercent(entry.lifestyle.delta) + '</span><span class="' + workStatusClass(entry.workAssessment.status) + '">' + escapeHtml(workStatusLabel(entry.workAssessment.status)) + '</span></div>' + educationSignal +
        '<div class="short-explanation"><p><b>Почему подходит</b>' + escapeHtml(mainReason(entry)) + '</p><p class="short-limit"><b>' + (entry.blockers.length ? "Hard blocker" : "Проверить") + '</b>' + escapeHtml(mainConstraint(entry)) + '</p></div>' +
        '<div class="short-meta"><span>grade ' + escapeHtml(entry.confidence) + '</span><span>checked ' + escapeHtml(entry.checkedAt) + '</span></div></div>' +
        '<div class="short-card-bottom"><button class="short-compare' + (pinned ? " pinned" : "") + '" type="button" data-pin="' + entry.id + '" aria-pressed="' + (pinned ? "true" : "false") + '">' + (pinned ? "✓ В сравнении" : "+ Сравнить") + '</button><button class="short-open" type="button" data-open="' + entry.id + '" aria-label="Подробнее о ' + escapeHtml(entry.country) + '">↗</button></div>' +
      '</article>';
    }).join("");
  }

  function ensureScenarioDraft() {
    if (!scenarioState.draft) scenarioState.draft = scenarioDraftFromProfile(state);
    else scenarioState.draft = normalizeScenarioDraft(scenarioState.draft, state);
  }

  function syncScenarioInputs() {
    ensureScenarioDraft();
    $("#scenarioBudgetInput").value = scenarioState.draft.budget;
    $("#scenarioPresenceInput").value = scenarioState.draft.presence;
    $("#scenarioWorkModeInput").value = scenarioState.draft.workMode;
    $("#scenarioChildPlanInput").value = String(scenarioState.draft.childPlan);
    $("#scenarioPresenceField").hidden = state.level !== "citizenship";
  }

  function renderScenarioRiskList(id, items, emptyText) {
    $("#" + id).innerHTML = items.length
      ? items.map(function (item) { return "<li>" + escapeHtml(item.label) + "</li>"; }).join("")
      : '<li class="empty">' + escapeHtml(emptyText) + "</li>";
  }

  function renderScenarioResult(baselineLeader) {
    var alternativeLeader = scenarioResult && scenarioResult.leader;
    if (!baselineLeader || !alternativeLeader) {
      $("#scenarioResult").hidden = false;
      $("#scenarioResultTitle").textContent = "Для одного из профилей нет результата";
      $("#scenarioResultReason").textContent = "Проверьте цель, фильтр части мира и исходные ограничения.";
      $("#scenarioChangesList").innerHTML = '<li class="no-change">Недостаточно данных для дельты</li>';
      $("#scenarioCurrentLeader").textContent = baselineLeader ? baselineLeader.country + " · " + baselineLeader.route : "Нет маршрута";
      $("#scenarioAlternativeLeader").textContent = alternativeLeader ? alternativeLeader.country + " · " + alternativeLeader.route : "Нет маршрута";
      $("#openScenarioRouteButton").disabled = true;
      renderScenarioRiskList("scenarioRemovedRisks", [], "Нет сопоставимого результата");
      renderScenarioRiskList("scenarioAddedRisks", [], "Нет сопоставимого результата");
      return;
    }

    var leaderChanged = baselineLeader.id !== alternativeLeader.id;
    var changes = scenarioChanges();
    var baselineForAlternative = computed.find(function (entry) { return entry.id === alternativeLeader.id; });
    var routeDelta = alternativeLeader.score - (baselineForAlternative ? baselineForAlternative.score : alternativeLeader.score);
    var currentRisks = routeRisks(baselineLeader);
    var alternativeRisks = routeRisks(alternativeLeader);
    var removed = riskDifference(currentRisks, alternativeRisks);
    var added = riskDifference(alternativeRisks, currentRisks);

    $("#scenarioResult").hidden = false;
    $("#scenarioResultLabel").textContent = leaderChanged ? "Лидер изменился" : "Лидер сохранился";
    $("#scenarioResultTitle").textContent = leaderChanged
      ? baselineLeader.country + " → " + alternativeLeader.country
      : alternativeLeader.country + " остаётся первым";
    $("#scenarioResultReason").textContent = (changes.length
      ? "В расчёте изменены: " + changes.join(" · ") + ". "
      : "Сценарий совпадает с текущими четырьмя ответами. ") + scenarioRankingReason(baselineLeader, alternativeLeader, scenarioResult.entries);
    $("#scenarioChangesList").innerHTML = changes.length
      ? changes.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("")
      : '<li class="no-change">Изменений нет — контрольный расчёт</li>';

    $("#scenarioCurrentLeader").textContent = baselineLeader.country + " · " + baselineLeader.route;
    $("#scenarioCurrentReason").textContent = mainReason(baselineLeader);
    $("#scenarioCurrentScore").textContent = baselineLeader.score + "/100";
    $("#scenarioAlternativeLeader").textContent = alternativeLeader.country + " · " + alternativeLeader.route;
    $("#scenarioAlternativeReason").textContent = scenarioResult.reason;
    $("#scenarioAlternativeScore").textContent = alternativeLeader.score + "/100";
    $("#scenarioRouteDelta").textContent = "для этого маршрута: " + (routeDelta > 0 ? "+" : "") + routeDelta + " fit";
    $("#scenarioAlternativeQuality").textContent = "grade " + alternativeLeader.confidence + " · checked " + alternativeLeader.checkedAt;
    $("#scenarioShiftMark").textContent = leaderChanged ? "→" : "=";
    $("#scenarioShiftDelta").textContent = leaderChanged ? "смена лидера" : (routeDelta > 0 ? "+" : "") + routeDelta + " fit";
    $("#openScenarioRouteButton").disabled = false;
    $("#openScenarioRouteButton").dataset.routeId = alternativeLeader.id;
    renderScenarioRiskList("scenarioRemovedRisks", removed, "Ничего не исчезло");
    renderScenarioRiskList("scenarioAddedRisks", added, "Ничего нового не появилось");
  }

  function renderScenario() {
    var ready = hasCalculated && !calculationDirty;
    var lab = $("#scenarioLab");
    var openButton = $("#openScenarioButton");
    openButton.setAttribute("aria-expanded", ready && scenarioState.open ? "true" : "false");
    openButton.innerHTML = scenarioState.open ? "Скрыть сценарий <span>↑</span>" : "Что изменит результат? <span>→</span>";
    lab.hidden = !ready || !scenarioState.open;
    if (!ready || !scenarioState.open) {
      scenarioResult = null;
      return;
    }

    ensureScenarioDraft();
    syncScenarioInputs();
    $("#scenarioBaselineBudget").textContent = formatExactMoney(state.budget) + "/мес.";
    $("#scenarioBaselinePresence").textContent = state.level === "citizenship" ? presenceLabel(state.presence) : "Не влияет на эту цель";
    $("#scenarioBaselineWork").textContent = workModeLabel(state.workMode);
    $("#scenarioBaselineFamily").textContent = childPlanLabel(state.childPlan);

    var signature = decisionProfileSignature(state);
    if (scenarioState.hasCompared && scenarioState.baselineSignature !== signature) {
      scenarioState.hasCompared = false;
      scenarioState.baselineSignature = null;
      scenarioResult = null;
      saveScenario();
    }

    var changes = scenarioChanges();
    var status = $("#scenarioFormStatus");
    status.className = "scenario-form-status";
    if (scenarioState.hasCompared) {
      scenarioResult = decisionForProfile(scenarioProfile());
      status.textContent = "Сценарий рассчитан. Исходная анкета не изменена.";
      status.classList.add("ready");
      renderScenarioResult(topRoutes()[0] || null);
    } else {
      scenarioResult = null;
      $("#scenarioResult").hidden = true;
      status.textContent = changes.length
        ? "Готово изменений: " + changes.length + ". Нажмите «Сравнить с текущим»."
        : "Сценарий совпадает с текущими ответами — можно сделать контрольный расчёт.";
      if (changes.length) status.classList.add("dirty");
    }
  }

  function openScenarioLab() {
    if (!hasCalculated || calculationDirty) {
      showToast("Сначала рассчитайте актуальный маршрут");
      return;
    }
    scenarioState.open = !scenarioState.open;
    ensureScenarioDraft();
    saveScenario();
    renderScenario();
    if (scenarioState.open) requestAnimationFrame(function () {
      $("#scenarioLab").scrollIntoView({ behavior: "smooth", block: "start" });
      $("#scenarioBudgetInput").focus({ preventScroll: true });
    });
  }

  function updateScenarioDraft(key, value) {
    ensureScenarioDraft();
    scenarioState.draft[key] = value;
    scenarioState.hasCompared = false;
    scenarioState.baselineSignature = null;
    scenarioResult = null;
    saveScenario();
    renderScenario();
  }

  function compareScenario() {
    if (!hasCalculated || calculationDirty) {
      showToast("Сначала пересчитайте основной профиль");
      return;
    }
    ensureScenarioDraft();
    scenarioState.hasCompared = true;
    scenarioState.baselineSignature = decisionProfileSignature(state);
    saveScenario();
    renderScenario();
    requestAnimationFrame(function () {
      $("#scenarioResult").scrollIntoView({ behavior: "smooth", block: "start" });
      $("#scenarioResultTitle").setAttribute("tabindex", "-1");
      $("#scenarioResultTitle").focus({ preventScroll: true });
    });
  }

  function resetScenario() {
    scenarioState.draft = scenarioDraftFromProfile(state);
    scenarioState.hasCompared = false;
    scenarioState.baselineSignature = null;
    scenarioResult = null;
    saveScenario();
    renderScenario();
    $("#scenarioBudgetInput").focus();
    showToast("Сценарий сброшен — анкета не изменена");
  }

  function renderFilters() {
    $$("[data-segment]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.segment === state.segment);
    });
    $$("[data-zone]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.zone === state.zone);
    });
    var filtered = state.visaTypeFilter !== "all";
    $("#visaFilterStatus").hidden = !filtered;
    $("#visaFilterLabel").textContent = filtered ? visaTypeLabel(state.visaTypeFilter) : "—";
  }

  function freshnessClass(entry) {
    if (entry.status === "needs-check") return "stale";
    if (entry.status === "partial") return "partial";
    return "";
  }

  function renderRouteList() {
    var all = sortedVisible();
    var list = all.slice(0, visibleLimit);
    if (!list.length) {
      $("#routeList").innerHTML = '<div class="route-empty"><strong>Ничего не найдено</strong><br>Снимите фильтр типа визы, части мира или verified-only либо увеличьте бюджет.</div>';
    } else {
      $("#routeList").innerHTML = list.map(function (entry) {
        var pinned = state.pinned.indexOf(entry.id) >= 0;
        var alert = entry.blockers.length ? entry.blockers[0] : "нет hard blocker";
        var alertClass = entry.blockers.length ? "" : " ok";
        var city = entry.bestCity;
        return '<article class="route-row">' +
          '<div class="route-cell route-identity"><span class="route-flag">' + entry.flag + '</span><div><strong>' + escapeHtml(entry.country) + '</strong><small>' + escapeHtml(entry.route) + ' · ' + escapeHtml(visaTypeLabel(entry.visaType)) + '</small><span class="route-alert' + alertClass + '">' + escapeHtml(alert) + '</span></div></div>' +
          '<div class="route-cell"><span>срок / outcome</span><strong>' + escapeHtml(entry.stay) + '</strong><small>' + escapeHtml(outcomeLabel(entry.outcome)) + '</small></div>' +
          '<div class="route-cell"><span>жизнь · ' + (city ? escapeHtml(city.name) : "город") + '</span><strong class="' + lifestyleClass(entry.lifestyle) + '">' + escapeHtml(lifestyleLabel(entry.lifestyle)) + '</strong><small>' + (city ? formatBudget(city.budget, householdFactor()) + ' · ' + signedPercent(entry.lifestyle.delta) : "planning range") + '</small></div>' +
          '<div class="route-cell"><span>' + escapeHtml(workModeLabel(state.workMode)) + '</span><strong class="' + workStatusClass(entry.workAssessment.status) + '">' + escapeHtml(workStatusLabel(entry.workAssessment.status)) + '</strong><small>' + escapeHtml(entry.workAssessment.note) + '</small></div>' +
          '<div class="route-cell fit-score"><strong>' + entry.score + '</strong><small>fit</small><span class="freshness ' + freshnessClass(entry) + '"><i></i>' + escapeHtml(entry.checkedAt) + '</span></div>' +
          '<div class="route-actions"><button type="button" data-open="' + entry.id + '">детали</button><button type="button" data-pin="' + entry.id + '" aria-pressed="' + (pinned ? "true" : "false") + '" class="' + (pinned ? "pinned" : "") + '">' + (pinned ? "✓ в сравнении" : "+ сравнить") + '</button></div>' +
        '</article>';
      }).join("");
    }
    $("#loadMoreButton").hidden = all.length <= visibleLimit;
    $("#loadMoreButton").textContent = "Показать ещё · " + Math.max(0, all.length - visibleLimit) + " ↓";
  }

  function comparisonRow(label, values) {
    return '<tr><td>' + escapeHtml(label) + '</td>' + values.map(function (value) { return '<td>' + value + '</td>'; }).join("") + '</tr>';
  }

  function renderComparison() {
    var entries = state.pinned.map(function (id) {
      return computed.find(function (entry) { return entry.id === id; });
    }).filter(Boolean);
    var empty = $("#compareEmpty");
    var wrap = $("#compareTableWrap");
    if (!entries.length) {
      empty.hidden = false;
      wrap.hidden = true;
      return;
    }
    empty.hidden = true;
    wrap.hidden = false;
    var header = '<thead><tr><th>маршрут</th>' + entries.map(function (entry) {
      return '<th><span>' + entry.flag + '</span><strong>' + escapeHtml(entry.country) + '</strong><small>' + escapeHtml(entry.route) + '</small><button class="compare-open" type="button" data-open="' + entry.id + '">Открыть детали</button><button class="remove-compare" type="button" data-remove-pin="' + entry.id + '">убрать</button></th>';
    }).join("") + '</tr></thead>';
    var rows = [
      comparisonRow("Сравнительный fit", entries.map(function (entry) { return '<strong>' + entry.score + '/100</strong><br><small>не вероятность одобрения</small>'; })),
      comparisonRow("Outcome", entries.map(function (entry) { return escapeHtml(outcomeLabel(entry.outcome)); })),
      comparisonRow("Тип визы", entries.map(function (entry) { return escapeHtml(visaTypeLabel(entry.visaType)); })),
      comparisonRow("Срок", entries.map(function (entry) { return escapeHtml(entry.stay); })),
      comparisonRow("Городской budget", entries.map(function (entry) { return entry.bestCity ? formatBudget(entry.bestCity.budget, householdFactor()) + '<br><small>' + escapeHtml(entry.bestCity.name) + '</small>' : "н/д"; })),
      comparisonRow("Уровень жизни", entries.map(function (entry) { return '<strong class="' + lifestyleClass(entry.lifestyle) + '">' + escapeHtml(lifestyleLabel(entry.lifestyle)) + '</strong><br><small>' + signedPercent(entry.lifestyle.delta) + ' к текущим расходам</small>'; })),
      comparisonRow("Останется от дохода", entries.map(function (entry) { return '<strong>' + formatMoney(entry.lifestyle.remaining) + '/мес.</strong><br><small>до налогов и визовых расходов</small>'; })),
      comparisonRow("Доход / funds", entries.map(function (entry) { return 'income ' + formatMoney(entry.incomeMin) + '<br>funds ' + formatMoney(entry.fundsMin); })),
      comparisonRow("Ваш формат работы", entries.map(function (entry) { return '<strong class="' + workStatusClass(entry.workAssessment.status) + '">' + escapeHtml(workStatusLabel(entry.workAssessment.status)) + '</strong><br><small>' + escapeHtml(entry.workAssessment.note) + '</small>'; })),
      state.childEducationStage !== "none" ? comparisonRow("Ребёнок и образование", entries.map(function (entry) { return '<strong class="' + childEducationStatusClass(entry.childEducation.status) + '">' + escapeHtml(childEducationStatusLabel(entry.childEducation.status)) + '</strong><br><small>' + escapeHtml(entry.childEducation.headline) + '</small>'; })) : "",
      comparisonRow("Море / горы / аренда", entries.map(function (entry) { return entry.citySignal ? escapeHtml(geographyLabel(entry.citySignal.sea, "sea") + ' · ' + geographyLabel(entry.citySignal.mountains, "mountains")) + '<br><small>' + escapeHtml(housingLabel(entry.citySignal.housing)) + '</small>' : "н/д"; })),
      comparisonRow("Язык / бюрократия", entries.map(function (entry) { return escapeHtml(entry.countryProfile.languages) + '<br><small>' + escapeHtml(languageAccessLabel(entry.countryProfile.languageAccess) + ' · ' + bureaucracyLabel(entry.countryProfile.bureaucracy)) + '</small>'; })),
      comparisonRow("Мигранты", entries.map(function (entry) { return escapeHtml(migrantShareLabel(entry.countryProfile)) + '<br><small>World Bank / UN, ' + escapeHtml(entry.countryProfile.migrantYear || "n/a") + '</small>'; })),
      comparisonRow("Паспорт", entries.map(function (entry) { return '<strong>' + escapeHtml(passportSignal(entry.countryProfile)) + '</strong><br><small>относительный tier, не обещание получить</small>'; })),
      comparisonRow("Гражданство", entries.map(function (entry) { return entry.citizenshipYears ? entry.citizenshipYears + ' лет · dual ' + escapeHtml(entry.dual) : "нет прямого clock"; })),
      comparisonRow("Hard blockers", entries.map(function (entry) { return entry.blockers.length ? '<span class="route-alert">' + escapeHtml(entry.blockers.join(" · ")) + '</span>' : '<span class="route-alert ok">нет</span>'; })),
      comparisonRow("Проверенность", entries.map(function (entry) { return 'grade ' + escapeHtml(entry.confidence) + '<br><small>' + escapeHtml(entry.checkedAt) + '</small>'; }))
    ].join("");
    $("#compareTable").innerHTML = header + '<tbody>' + rows + '</tbody>';
  }

  function comparisonEntries() {
    return state.pinned.map(function (id) {
      return computed.find(function (entry) { return entry.id === id; });
    }).filter(Boolean);
  }

  function finalistRoleLabel(role) {
    return { anchor: "Основной маршрут", fallback: "Запасной маршрут", research: "Продолжить исследование", unassigned: "Роль не выбрана" }[role] || "Роль не выбрана";
  }

  function finalistChoice(routeId) {
    var saved = finalistState.choices[routeId] || {};
    return {
      role: FINALIST_ROLES.includes(saved.role) ? saved.role : "unassigned",
      cityName: typeof saved.cityName === "string" ? saved.cityName : null,
      updatedAt: validIsoDate(saved.updatedAt) ? saved.updatedAt : null
    };
  }

  function selectedFinalistCity(entry) {
    var cityName = finalistChoice(entry.id).cityName;
    return cityName ? entry.cities.find(function (city) { return city.name === cityName; }) || null : null;
  }

  function finalistGate(id, label, status, detail) {
    return { id: id, label: label, status: status, detail: detail };
  }

  function finalistReadiness(entry, city) {
    var unknowns = entry.warnings.concat(entry.childEducation.unknowns);
    var legalBlockers = entry.blockers.filter(function (item) {
      return !/^(Бюджет жизни|Доход не покрывает среднюю city basket|Заработок:)/.test(item);
    });
    var legalGate = legalBlockers.length
      ? finalistGate("eligibility", "Право / eligibility", "stop", legalBlockers.length + " hard blocker")
      : entry.status !== "verified" || entry.availabilityState.status === "needs-check"
        ? finalistGate("eligibility", "Право / eligibility", "caution", "Нет hard blocker, но правило требует перепроверки")
        : finalistGate("eligibility", "Право / eligibility", "clear", "Hard blocker не найден в текущем профиле");

    var monthlyRange = city ? adjustedRange(city.budget) : null;
    var budget = Number(state.budget || 0);
    var budgetGate = !monthlyRange
      ? finalistGate("budget", "Бюджет жизни", "unknown", "Сначала выберите город")
      : budget < monthlyRange[0]
        ? finalistGate("budget", "Бюджет жизни", "stop", "Ниже нижней границы " + formatExactMoney(monthlyRange[0]) + "/мес.")
        : budget < monthlyRange[1]
          ? finalistGate("budget", "Бюджет жизни", "caution", "Покрывает только нижнюю часть диапазона")
          : finalistGate("budget", "Бюджет жизни", "clear", "Весь planning range укладывается в budget");

    var workStatus = entry.workAssessment.status;
    var workGate = workStatus === "legal"
      ? finalistGate("work", "Работа", "clear", workStatusLabel(workStatus))
      : workStatus === "high-risk" || workStatus === "not-authorized"
        ? finalistGate("work", "Работа", "stop", workStatusLabel(workStatus))
        : finalistGate("work", "Работа", "caution", workStatusLabel(workStatus));

    var familyGate = !entry.childEducation.active
      ? finalistGate("family", "Ребёнок / образование", "not-applicable", "Этап образования не выбран")
      : entry.childEducation.status === "verified"
        ? finalistGate("family", "Ребёнок / образование", "clear", entry.childEducation.headline)
        : finalistGate("family", "Ребёнок / образование", "caution", entry.childEducation.headline);

    var qualityGate = entry.status === "verified" && entry.confidence === "A"
      ? finalistGate("data", "Качество данных", "clear", "confidence A · checked " + entry.checkedAt)
      : finalistGate("data", "Качество данных", "caution", "confidence " + entry.confidence + " · " + entry.status + " · checked " + entry.checkedAt);

    return {
      kind: "separate-gates",
      disclaimer: "Readiness не усредняется и не является вероятностью одобрения.",
      gates: [legalGate, budgetGate, workGate, familyGate, qualityGate],
      blockerCount: entry.blockers.length,
      unknownCount: unknowns.length
    };
  }

  function finalistRoleSummary(entries, role, label) {
    var entry = entries.find(function (item) { return finalistChoice(item.id).role === role; });
    var city = entry ? selectedFinalistCity(entry) : null;
    return '<article data-role="' + role + '"><span>' + escapeHtml(label) + '</span><strong>' + (entry ? escapeHtml(entry.country) : "Не выбран") + '</strong><small>' + (entry ? escapeHtml(entry.route) + (city ? " · " + escapeHtml(city.name) : " · выберите город") : "Назначьте роль в карточке") + '</small></article>';
  }

  function renderFinalistRound(entries) {
    var enough = entries.length >= 2;
    var status = $("#finalistDecisionStatus");
    $("#finalistEmpty").hidden = enough;
    $("#finalistWorkspace").hidden = !enough;
    if (!enough) {
      status.dataset.state = "empty";
      status.textContent = "Нужны 2–3 маршрута";
      $("#finalistRoleSummary").innerHTML = "";
      $("#finalistCards").innerHTML = "";
      return;
    }

    var anchor = entries.find(function (entry) { return finalistChoice(entry.id).role === "anchor"; });
    var fallback = entries.find(function (entry) { return finalistChoice(entry.id).role === "fallback"; });
    status.dataset.state = anchor && fallback ? "ready" : "partial";
    status.textContent = anchor && fallback ? "Основной + запасной зафиксированы" : "Назначьте основной и запасной";

    var researching = entries.filter(function (entry) { return finalistChoice(entry.id).role === "research"; });
    $("#finalistRoleSummary").innerHTML = finalistRoleSummary(entries, "anchor", "01 · Основной") +
      finalistRoleSummary(entries, "fallback", "02 · Запасной") +
      '<article data-role="research"><span>03 · Исследовать</span><strong>' + (researching.length ? researching.map(function (entry) { return escapeHtml(entry.country); }).join(" · ") : "Не выбрано") + '</strong><small>Не влияет на порядок и сравнительный fit</small></article>';

    $("#finalistCards").innerHTML = entries.map(function (entry, index) {
      var choice = finalistChoice(entry.id);
      var city = selectedFinalistCity(entry);
      var readiness = finalistReadiness(entry, city);
      var monthlyRange = city ? adjustedRange(city.budget) : null;
      var annualRange = monthlyRange ? monthlyRange.map(function (value) { return value * 12; }) : null;
      var roleOptions = [
        ["unassigned", "Роль не выбрана"],
        ["anchor", "Основной маршрут"],
        ["fallback", "Запасной маршрут"],
        ["research", "Продолжить исследование"]
      ].map(function (option) {
        return '<option value="' + option[0] + '"' + (choice.role === option[0] ? " selected" : "") + '>' + option[1] + '</option>';
      }).join("");
      var cityOptions = '<option value="">Выберите город</option>' + entry.cities.map(function (item) {
        return '<option value="' + escapeHtml(item.name) + '"' + (choice.cityName === item.name ? " selected" : "") + '>' + escapeHtml(item.name) + '</option>';
      }).join("");
      var gates = readiness.gates.map(function (gate) {
        return '<li data-status="' + gate.status + '"><span>' + escapeHtml(gate.label) + '</span><strong>' + escapeHtml(gate.detail) + '</strong></li>';
      }).join("");
      return '<article class="finalist-card" data-role="' + choice.role + '">' +
        '<header><div><span>' + String(index + 1).padStart(2, "0") + ' · ' + entry.flag + ' · ' + escapeHtml(outcomeLabel(entry.outcome)) + '</span><h4>' + escapeHtml(entry.country) + '</h4><p>' + escapeHtml(entry.route) + '</p></div><b>' + entry.score + '<small>/100 fit<br>не approval</small></b></header>' +
        '<div class="finalist-controls"><label><span>Роль в решении</span><select data-finalist-role="' + entry.id + '" aria-label="Роль маршрута ' + escapeHtml(entry.country) + '">' + roleOptions + '</select></label><label><span>Город для планирования</span><select data-finalist-city="' + entry.id + '" aria-label="Город для маршрута ' + escapeHtml(entry.country) + '">' + cityOptions + '</select></label></div>' +
        '<div class="finalist-cost"><div><span>Месяц · семья</span><strong>' + formatMoneyRange(monthlyRange) + '</strong></div><div><span>Первый год · база</span><strong>' + formatMoneyRange(annualRange) + '</strong></div><div><span>Route application</span><strong>' + (entry.applyCost ? "≈" + formatExactMoney(entry.applyCost) : "н/д") + '</strong></div></div>' +
        '<ul class="finalist-gates" aria-label="Проверки готовности">' + gates + '</ul>' +
        '<footer><span>' + readiness.blockerCount + ' blockers · ' + readiness.unknownCount + ' unknowns · checked ' + escapeHtml(entry.checkedAt) + '</span><button type="button" data-finalist-open="' + entry.id + '">Детали и источники <b>↗</b></button></footer>' +
      '</article>';
    }).join("");
  }

  function setFinalistRole(routeId, role) {
    if (!FINALIST_ROLES.includes(role) || !comparisonEntries().some(function (entry) { return entry.id === routeId; })) return;
    var now = new Date().toISOString();
    if (role === "anchor" || role === "fallback") Object.keys(finalistState.choices).forEach(function (id) {
      if (id !== routeId && finalistState.choices[id].role === role) {
        finalistState.choices[id].role = "unassigned";
        finalistState.choices[id].updatedAt = now;
        if (!finalistState.choices[id].cityName) delete finalistState.choices[id];
      }
    });
    var choice = finalistChoice(routeId);
    choice.role = role;
    choice.updatedAt = now;
    if (choice.role === "unassigned" && !choice.cityName) delete finalistState.choices[routeId];
    else finalistState.choices[routeId] = choice;
    saveFinalists();
    renderMyPlan();
    showToast(finalistRoleLabel(role));
  }

  function setFinalistCity(routeId, cityName) {
    var entry = comparisonEntries().find(function (item) { return item.id === routeId; });
    if (!entry || cityName && !entry.cities.some(function (city) { return city.name === cityName; })) return;
    var choice = finalistChoice(routeId);
    choice.cityName = cityName || null;
    choice.updatedAt = new Date().toISOString();
    if (choice.role === "unassigned" && !choice.cityName) delete finalistState.choices[routeId];
    else finalistState.choices[routeId] = choice;
    saveFinalists();
    renderMyPlan();
    showToast(cityName ? "Город: " + cityName : "Город не выбран");
  }

  function planRole(entry, trajectories) {
    var index = trajectories.findIndex(function (item) { return item.id === entry.id; });
    return index >= 0 ? trajectoryRole(entry, index) : "Выбрано для сравнения";
  }

  function planSources(entry) {
    var seen = new Set();
    var sources = (entry.sources || []).filter(function (source) {
      return /^https?:\/\//.test(source.url || "");
    }).map(function (source) {
      seen.add(source.url);
      return { label: source.label, url: source.url, kind: source.kind || "official", checkedAt: entry.checkedAt };
    });
    var workProfile = DATA.workProfiles[entry.code];
    if (workProfile) workProfile.sources.forEach(function (url, index) {
      if (seen.has(url)) return;
      seen.add(url);
      sources.push({ label: "Право на работу · official " + (index + 1), url: url, kind: "official", checkedAt: workProfile.checkedAt });
    });
    if (entry.childEducation && entry.childEducation.active && entry.childEducation.profile) {
      entry.childEducation.profile.sources.forEach(function (source) {
        if (seen.has(source.url)) return;
        seen.add(source.url);
        sources.push({ label: source.label, url: source.url, kind: "official", checkedAt: entry.childEducation.profile.checkedAt });
      });
    }
    return sources;
  }

  function childEducationPlanSources(entry) {
    if (!entry.childEducation || !entry.childEducation.profile) return [];
    return entry.childEducation.profile.sources.map(function (source) {
      return { label: source.label, url: source.url, kind: "official", checkedAt: entry.childEducation.profile.checkedAt };
    });
  }

  function planChecklistRoutes(trajectories, comparison) {
    var routes = [];
    trajectories.concat(comparison).forEach(function (entry) {
      if (!routes.some(function (item) { return item.id === entry.id; })) routes.push(entry);
    });
    return routes;
  }

  function planCheckStatusLabel(status) {
    return { todo: "Проверить", "in-progress": "В работе", verified: "Проверено" }[status] || "Проверить";
  }

  function planCheckTypeLabel(type) {
    return type === "hard-blocker" ? "Hard blocker" : "Неизвестное";
  }

  function planChecklistItem(entry, type, label, context) {
    var id = checklistItemId(entry.id, type, label);
    var saved = planBoardState.items[id];
    context = context || {};
    return {
      id: id,
      routeId: entry.id,
      country: entry.country,
      route: entry.route,
      type: type,
      priority: type === "hard-blocker" ? "hard-blocker" : "verify",
      item: label,
      status: saved ? saved.status : "todo",
      updatedAt: saved ? saved.updatedAt : null,
      dataQuality: {
        confidence: context.confidence || entry.confidence,
        checkedAt: context.checkedAt || entry.checkedAt
      },
      officialSources: context.officialSources || planSources(entry)
    };
  }

  function sortPlanChecklist(items) {
    return items.sort(function (a, b) {
      var completedDifference = Number(a.status === "verified") - Number(b.status === "verified");
      if (completedDifference) return completedDifference;
      var typeDifference = Number(a.type !== "hard-blocker") - Number(b.type !== "hard-blocker");
      if (typeDifference) return typeDifference;
      var preferenceDifference = Number(/не совпада(?:ет|ют) с предпочтением/i.test(a.item)) - Number(/не совпада(?:ет|ют) с предпочтением/i.test(b.item));
      if (preferenceDifference) return preferenceDifference;
      var activityDifference = Number(a.status !== "in-progress") - Number(b.status !== "in-progress");
      if (activityDifference) return activityDifference;
      return (a.country + a.item).localeCompare(b.country + b.item, "ru");
    });
  }

  function buildVerificationChecklist(trajectories, comparison) {
    var checklist = [];
    var seen = new Set();
    planChecklistRoutes(trajectories, comparison).forEach(function (entry) {
      entry.blockers.forEach(function (item) {
        var check = planChecklistItem(entry, "hard-blocker", item);
        if (!seen.has(check.id)) {
          seen.add(check.id);
          checklist.push(check);
        }
      });
      entry.warnings.forEach(function (item) {
        var check = planChecklistItem(entry, "unknown", item);
        if (!seen.has(check.id)) {
          seen.add(check.id);
          checklist.push(check);
        }
      });
      entry.childEducation.unknowns.forEach(function (item) {
        var educationProfile = entry.childEducation.profile;
        var check = planChecklistItem(entry, "unknown", item, {
          confidence: educationProfile ? educationProfile.confidence : "C",
          checkedAt: educationProfile ? educationProfile.checkedAt : DATA.meta.checkedAt,
          officialSources: childEducationPlanSources(entry)
        });
        if (!seen.has(check.id)) {
          seen.add(check.id);
          checklist.push(check);
        }
      });
    });
    return sortPlanChecklist(checklist);
  }

  function planChecklistProgress(checklist) {
    return checklist.reduce(function (progress, item) {
      progress.total += 1;
      if (item.status === "verified") progress.verified += 1;
      else if (item.status === "in-progress") progress.inProgress += 1;
      else progress.todo += 1;
      return progress;
    }, { total: 0, verified: 0, inProgress: 0, todo: 0 });
  }

  function checklistExportItem(item) {
    return {
      id: item.id,
      routeId: item.routeId,
      country: item.country,
      route: item.route,
      type: item.type,
      priority: item.priority,
      item: item.item,
      status: item.status,
      updatedAt: item.updatedAt,
      dataQuality: clone(item.dataQuality),
      officialSources: clone(item.officialSources)
    };
  }

  function planRouteSnapshot(entry, role, cityOverride) {
    var city = cityOverride === undefined ? entry.bestCity : cityOverride;
    var cityRange = city ? adjustedRange(city.budget) : null;
    var cityMid = cityRange ? (cityRange[0] + cityRange[1]) / 2 : 0;
    var lifestyle = cityOverride === undefined ? entry.lifestyle : lifestyleResult(cityMid);
    return {
      id: entry.id,
      role: role,
      country: entry.country,
      route: entry.route,
      visaType: { id: entry.visaType, label: visaTypeLabel(entry.visaType) },
      outcome: { id: entry.outcome, label: outcomeLabel(entry.outcome) },
      comparativeFit: {
        value: entry.score,
        scale: "0-100",
        kind: "comparative-fit",
        disclaimer: DATA.meta.legalDisclaimer
      },
      reason: mainReason(entry),
      blockers: clone(entry.blockers),
      unknowns: clone(entry.warnings.concat(entry.childEducation.unknowns)),
      budget: {
        currency: "USD",
        kind: "planning-range",
        city: city ? city.name : null,
        monthlyHouseholdRange: cityRange,
        rentHouseholdRange: city ? adjustedRange(city.rent) : null,
        currentSpendDeltaPercent: lifestyle.delta == null ? null : Math.round(lifestyle.delta * 100),
        remainingIncomeMonthly: Math.round(lifestyle.remaining)
      },
      work: {
        requestedMode: state.workMode,
        requestedModeLabel: workModeLabel(state.workMode),
        status: entry.workAssessment.status,
        statusLabel: workStatusLabel(entry.workAssessment.status),
        note: entry.workAssessment.note
      },
      family: {
        spousePolicy: entry.spouse,
        childEducation: {
          stage: entry.childEducation.stage,
          stageLabel: entry.childEducation.stageLabel,
          preferredFormat: entry.childEducation.format,
          preferredFormatLabel: entry.childEducation.formatLabel,
          schoolAsImmigrationBasis: entry.childEducation.schoolAsBasis,
          status: entry.childEducation.status,
          statusLabel: childEducationStatusLabel(entry.childEducation.status),
          summary: entry.childEducation.headline,
          dependent: entry.childEducation.profile ? clone(entry.childEducation.profile.dependent) : null,
          student: entry.childEducation.profile ? clone(entry.childEducation.profile.student) : null,
          guardian: entry.childEducation.profile ? clone(entry.childEducation.profile.guardian) : null,
          provision: entry.childEducation.provision ? clone(entry.childEducation.provision) : null,
          jurisdiction: entry.childEducation.profile ? entry.childEducation.profile.jurisdiction : null,
          checkedAt: entry.childEducation.profile ? entry.childEducation.profile.checkedAt : null,
          confidence: entry.childEducation.profile ? entry.childEducation.profile.confidence : "C"
        }
      },
      legal: {
        entryBasis: entry.entry,
        stay: entry.stay,
        renewable: entry.renewable,
        maximumOutcome: entry.outcome,
        citizenshipYearsToApply: entry.citizenshipYears || null,
        dualCitizenship: entry.dual,
        presenceDemand: entry.presenceDemand ? clone(entry.presenceDemand) : null
      },
      resources: {
        minimumIncomeMonthly: Number(entry.incomeMin || 0),
        minimumFunds: Number(entry.fundsMin || 0),
        minimumInvestment: Number(entry.investmentMin || 0),
        estimatedApplicationCost: Number(entry.applyCost || 0)
      },
      dataQuality: {
        status: entry.status,
        confidence: entry.confidence,
        checkedAt: entry.checkedAt
      },
      officialSources: planSources(entry)
    };
  }

  function finalistRouteSnapshot(entry) {
    var choice = finalistChoice(entry.id);
    var city = selectedFinalistCity(entry);
    var snapshot = planRouteSnapshot(entry, finalistRoleLabel(choice.role), city);
    var monthlyRange = city ? adjustedRange(city.budget) : null;
    snapshot.decisionRole = {
      id: choice.role,
      label: finalistRoleLabel(choice.role),
      selectedBy: "user",
      updatedAt: choice.updatedAt
    };
    snapshot.selectedCity = city ? {
      name: city.name,
      selectedBy: "user",
      monthlyHouseholdPlanningRange: monthlyRange,
      firstYearBasePlanningRange: monthlyRange.map(function (value) { return value * 12; }),
      routeApplicationCostEstimate: Number(entry.applyCost || 0),
      excludedCostCategories: ["tax", "insurance", "education", "travel", "deposits", "inflation", "unexpected-costs"],
      checkedAt: entry.checkedAt
    } : null;
    snapshot.readiness = finalistReadiness(entry, city);
    return snapshot;
  }

  function buildPlanPayload() {
    var trajectories = topRoutes();
    var comparison = comparisonEntries();
    var trajectorySnapshots = trajectories.map(function (entry, index) {
      return planRouteSnapshot(entry, trajectoryRole(entry, index));
    });
    var comparisonSnapshots = comparison.map(function (entry) {
      return planRouteSnapshot(entry, planRole(entry, trajectories));
    });
    var finalistSnapshots = comparison.map(finalistRouteSnapshot);
    var anchor = finalistSnapshots.find(function (entry) { return entry.decisionRole.id === "anchor"; }) || null;
    var fallback = finalistSnapshots.find(function (entry) { return entry.decisionRole.id === "fallback"; }) || null;
    var checklist = buildVerificationChecklist(trajectories, comparison);
    var progress = planChecklistProgress(checklist);
    var nextItem = checklist.find(function (item) { return item.status !== "verified"; }) || null;
    var presentationLocale = I18N ? I18N.locale : "ru";
    return {
      exportedAt: new Date().toISOString(),
      atlasVersion: APP_VERSION,
      presentationLocale: presentationLocale,
      dataset: {
        version: DATA.meta.version,
        schemaVersion: DATA.meta.schemaVersion,
        checkedAt: DATA.meta.checkedAt,
        nationalityLayer: state.nationality
      },
      planVersion: PLAN_VERSION,
      profileVersion: 5,
      profile: clone(state),
      presentation: {
        locale: presentationLocale,
        requestedOutcomeLabel: uiText(outcomeLabel(state.level)),
        leaderLabel: trajectories[0] ? uiText(trajectories[0].country + " · " + trajectories[0].route) : null,
        finalistLabels: finalistSnapshots.map(function (entry) {
          return {
            id: entry.id,
            route: uiText(entry.country + " · " + entry.route),
            role: uiText(entry.decisionRole.label),
            city: entry.selectedCity ? uiText(entry.selectedCity.name) : null
          };
        }),
        note: uiText("Это локализованные подписи для чтения. Канонические route ids, blockers, unknowns, даты и URL остаются в decision.")
      },
      decision: {
        status: "current",
        requestedOutcome: { id: state.level, label: outcomeLabel(state.level) },
        leader: trajectorySnapshots[0] || null,
        trajectories: trajectorySnapshots,
        comparison: comparisonSnapshots,
        finalists: {
          version: FINALISTS_VERSION,
          kind: "user-selected-finalists",
          status: comparison.length < 2 ? "not-started" : anchor && fallback ? "roles-assigned" : "incomplete",
          disclaimer: "Роли и города выбраны пользователем. Они не меняют сравнительный fit и не являются юридической рекомендацией.",
          anchorRouteId: anchor ? anchor.id : null,
          fallbackRouteId: fallback ? fallback.id : null,
          routes: finalistSnapshots
        },
        verificationBoard: {
          version: PLAN_BOARD_VERSION,
          progress: progress,
          nextItemId: nextItem ? nextItem.id : null
        },
        nextVerification: nextItem ? checklistExportItem(nextItem) : null,
        verificationChecklist: checklist.map(checklistExportItem)
      },
      privacy: {
        storage: "local-download",
        containsFinancialAnswers: true,
        note: "Файл создан локально в браузере. Atlas не отправляет его на сервер."
      }
    };
  }

  function renderPlanBoard(checklist) {
    var progress = planChecklistProgress(checklist);
    var nextItem = checklist.find(function (item) { return item.status !== "verified"; }) || null;
    var percent = progress.total ? Math.round(progress.verified / progress.total * 100) : 0;
    var next = $("#planNext");
    var nextButton = $("#planNextButton");

    $("#planProgressLabel").textContent = progress.verified + " / " + progress.total;
    $("#planProgressTrack").setAttribute("aria-valuemax", progress.total);
    $("#planProgressTrack").setAttribute("aria-valuenow", progress.verified);
    $("#planProgressBar").style.width = percent + "%";

    if (nextItem) {
      next.dataset.state = "open";
      next.dataset.kind = nextItem.type;
      $("#planNextType").textContent = planCheckTypeLabel(nextItem.type) + " · следующий шаг";
      $("#planNextTitle").textContent = nextItem.item;
      $("#planNextMeta").textContent = nextItem.country + " · " + nextItem.route + " · данные проверены " + nextItem.dataQuality.checkedAt + " · confidence " + nextItem.dataQuality.confidence;
      nextButton.hidden = false;
      nextButton.dataset.checkId = nextItem.id;
    } else {
      next.dataset.state = "complete";
      next.dataset.kind = "none";
      $("#planNextType").textContent = progress.total ? "Текущий список изучен" : "Открытых проверок нет";
      $("#planNextTitle").textContent = progress.total ? "Все пункты отмечены как проверенные" : "В текущем срезе нет blockers или unknowns";
      $("#planNextMeta").textContent = "Это не подтверждение eligibility и не обещание одобрения. Перед подачей всё равно перепроверьте правила и даты.";
      nextButton.hidden = true;
      nextButton.dataset.checkId = "";
    }

    if (!checklist.length) {
      $("#planChecklist").innerHTML = '<div class="plan-board-empty"><strong>Список пуст</strong><span>Atlas не нашёл зафиксированных blockers или unknowns для этих маршрутов. Откройте детали перед финальным решением.</span></div>';
      return;
    }

    $("#planChecklist").innerHTML = checklist.map(function (item, index) {
      var source = item.officialSources[0];
      var sourceAction = source
        ? '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noreferrer">Официальный источник ↗</a>'
        : '<span class="plan-source-missing">Официальный источник требует проверки</span>';
      var options = PLAN_CHECK_STATUSES.map(function (status) {
        return '<option value="' + status + '"' + (item.status === status ? " selected" : "") + '>' + planCheckStatusLabel(status) + '</option>';
      }).join("");
      return '<article class="plan-check" data-check-id="' + escapeHtml(item.id) + '" data-kind="' + item.type + '" data-status="' + item.status + '">' +
        '<div class="plan-check-number">' + String(index + 1).padStart(2, "0") + '</div>' +
        '<div class="plan-check-body"><div class="plan-check-kicker"><span>' + escapeHtml(planCheckTypeLabel(item.type)) + '</span><b>' + escapeHtml(item.country) + '</b></div>' +
        '<h4>' + escapeHtml(item.item) + '</h4><p>' + escapeHtml(item.route) + '</p>' +
        '<div class="plan-check-meta"><span>checked ' + escapeHtml(item.dataQuality.checkedAt) + '</span><span>confidence ' + escapeHtml(item.dataQuality.confidence) + '</span>' + sourceAction + '<button type="button" data-plan-open="' + escapeHtml(item.routeId) + '">Детали маршрута</button></div></div>' +
        '<label class="plan-check-status"><span>Статус проверки</span><select data-check-status="' + escapeHtml(item.id) + '" aria-label="Статус проверки: ' + escapeHtml(item.country) + ' — ' + escapeHtml(item.item) + '">' + options + '</select></label>' +
      '</article>';
    }).join("");
  }

  function setPlanCheckStatus(id, status) {
    if (!id || !PLAN_CHECK_STATUSES.includes(status)) return;
    planBoardState.items[id] = { status: status, updatedAt: new Date().toISOString() };
    savePlanBoard();
    renderMyPlan();
    showToast("Статус: " + planCheckStatusLabel(status));
  }

  function importPlanBoard(payload) {
    var checklist = payload && payload.decision && Array.isArray(payload.decision.verificationChecklist)
      ? payload.decision.verificationChecklist.slice(0, 500)
      : [];
    var imported = 0;
    checklist.forEach(function (item) {
      if (!item || typeof item.routeId !== "string" || typeof item.item !== "string" || !PLAN_CHECK_STATUSES.includes(item.status)) return;
      if (!DATA.entries.some(function (entry) { return entry.id === item.routeId; })) return;
      var type = item.type === "hard-blocker" || item.priority === "hard-blocker" ? "hard-blocker" : item.type === "unknown" || item.priority === "verify" ? "unknown" : null;
      if (!type) return;
      var id = checklistItemId(item.routeId, type, item.item);
      if (item.id && item.id !== id) return;
      planBoardState.items[id] = {
        status: item.status,
        updatedAt: validIsoDate(item.updatedAt) ? item.updatedAt : null
      };
      imported += 1;
    });
    if (imported) savePlanBoard();
    return imported;
  }

  function importFinalists(payload) {
    var container = payload && payload.decision ? payload.decision.finalists : null;
    var routes = Array.isArray(container) ? container : container && Array.isArray(container.routes) ? container.routes : [];
    var importedState = emptyFinalistState();
    routes.slice(0, 3).forEach(function (item) {
      if (!item || typeof item.id !== "string" || !finalistRoute(item.id)) return;
      var role = item.decisionRole && FINALIST_ROLES.includes(item.decisionRole.id) ? item.decisionRole.id : "unassigned";
      var cityName = item.selectedCity && typeof item.selectedCity.name === "string" ? item.selectedCity.name : null;
      importedState.choices[item.id] = {
        role: role,
        cityName: cityName,
        updatedAt: item.decisionRole && validIsoDate(item.decisionRole.updatedAt) ? item.decisionRole.updatedAt : null
      };
    });
    finalistState = normalizeFinalistState(importedState);
    var imported = Object.keys(finalistState.choices).length;
    if (imported) saveFinalists();
    return imported;
  }

  function renderMyPlan() {
    var ready = hasCalculated && !calculationDirty;
    var trajectories = ready ? topRoutes() : [];
    var comparison = ready ? comparisonEntries() : [];
    var checklist = ready ? buildVerificationChecklist(trajectories, comparison) : [];
    var progress = planChecklistProgress(checklist);
    var status = $("#planStatus");
    status.dataset.state = ready ? "ready" : calculationDirty ? "stale" : "empty";

    if (ready) {
      $("#planStateLabel").textContent = "Актуальный расчёт · dataset " + DATA.meta.version;
      $("#planStateTitle").textContent = checklist.length && progress.verified === checklist.length ? "Текущий список изучен" : "План готов к работе";
      $("#planStateText").textContent = "Начните с первого незакрытого hard blocker или unknown. Статусы сохраняются только в этом браузере и входят в приватный JSON; сравнительный fit не является вероятностью одобрения.";
    } else if (calculationDirty) {
      $("#planStateLabel").textContent = "Профиль изменился";
      $("#planStateTitle").textContent = "Старый план больше не актуален";
      $("#planStateText").textContent = "Пересчитайте траектории: Atlas не выгружает старую рекомендацию вместе с новыми ответами.";
    } else {
      $("#planStateLabel").textContent = "Сначала расчёт";
      $("#planStateTitle").textContent = "План ещё не собран";
      $("#planStateText").textContent = "Заполните анкету и рассчитайте траектории. После этого Atlas сохранит результат вместе с причинами, ограничениями и датами.";
    }

    $("#planLeader").textContent = ready && trajectories[0] ? trajectories[0].country : "—";
    $("#planLeaderRole").textContent = ready && trajectories[0] ? trajectoryRole(trajectories[0], 0) : "после расчёта";
    $("#planTrajectoryCount").textContent = trajectories.length;
    $("#planComparisonCount").textContent = comparison.length;
    $("#planCheckCount").textContent = progress.verified + " / " + progress.total;
    $("#finalistRound").hidden = !ready;
    if (ready) renderFinalistRound(comparison);
    $("#planBoard").hidden = !ready;
    if (ready) renderPlanBoard(checklist);
    else {
      $("#planChecklist").innerHTML = "";
      $("#planNextButton").dataset.checkId = "";
    }
    $("#exportPlanButton").hidden = !ready;
    $("#planCalculateButton").hidden = ready;
    $("#planCalculateButton").innerHTML = (calculationDirty ? "Пересчитать план" : "Рассчитать маршрут") + " <span>→</span>";
  }

  function downloadJson(filename, payload, message) {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast(message);
  }

  function exportProfile() {
    downloadJson("atlas-pereezda-profile.json", {
      exportedAt: new Date().toISOString(),
      atlasVersion: APP_VERSION,
      presentationLocale: I18N ? I18N.locale : "ru",
      datasetVersion: DATA.meta.version,
      schemaVersion: DATA.meta.schemaVersion,
      profileVersion: 5,
      profile: clone(state)
    }, "Анкета скачана");
  }

  function exportPlan() {
    if (!hasCalculated || calculationDirty) {
      showToast("Сначала пересчитайте маршрут");
      return;
    }
    downloadJson("atlas-pereezda-plan.json", buildPlanPayload(), "План скачан на устройство");
  }

  function renderDock() {
    var dock = $("#compareDock");
    var entries = state.pinned.map(function (id) { return DATA.entries.find(function (entry) { return entry.id === id; }); }).filter(Boolean);
    dock.classList.toggle("visible", hasCalculated && !calculationDirty && entries.length > 0);
    $("#dockItems").innerHTML = entries.map(function (entry) { return '<span class="dock-item" title="' + escapeHtml(entry.country) + '">' + entry.flag + '</span>'; }).join("");
    $("#dockCount").textContent = entries.length;
  }

  function withProfileState(profile, callback) {
    var previousState = state;
    try {
      state = profile;
      return callback();
    } finally {
      state = previousState;
    }
  }

  function educationSourceLinks(profile, sourceIds) {
    if (!profile || !Array.isArray(sourceIds)) return "";
    return sourceIds.map(function (sourceId, index) {
      var source = profile.sources.find(function (item) { return item.id === sourceId; });
      return source ? '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noreferrer">Источник' + (sourceIds.length > 1 ? " " + (index + 1) : "") + ' ↗</a>' : "";
    }).join("");
  }

  function educationRoleCard(title, record, profile) {
    var safeRecord = record || { status: "needs-check", summary: "Для страны ещё нет официального исследования этого слоя.", sourceIds: [] };
    return '<article class="education-role-card"><div><span>' + escapeHtml(title) + '</span><b class="' + childEducationStatusClass(safeRecord.status) + '">' + escapeHtml(childEducationStatusLabel(safeRecord.status)) + '</b></div><p>' + escapeHtml(safeRecord.summary) + '</p><footer>' + educationSourceLinks(profile, safeRecord.sourceIds) + '</footer></article>';
  }

  function renderChildEducationSection(entry) {
    var assessment = entry.childEducation;
    var profile = assessment.profile;
    var dependent = profile && profile.dependent;
    if (dependent && Array.isArray(dependent.routeIds) && !dependent.routeIds.includes(entry.id)) {
      dependent = { status: "needs-check", summary: "Dependent-path ещё не связан с этим конкретным маршрутом; не переносите условия другого основания.", sourceIds: dependent.sourceIds };
    }
    var provision = assessment.provision || {
      status: "needs-check",
      summary: assessment.active ? "Для выбранного этапа нет отдельного официального слоя." : "Выберите этап образования в анкете, чтобы получить проверку сада или школы.",
      sourceIds: []
    };
    return '<section class="drawer-section child-education-section"><div class="child-education-heading"><div><span>CHILD / EDUCATION</span><h3>Ребёнок и образование</h3></div><b class="' + childEducationStatusClass(assessment.status) + '">' + escapeHtml(childEducationStatusLabel(assessment.status)) + '</b></div>' +
      '<div class="child-education-context"><div><span>Этап</span><strong>' + escapeHtml(assessment.stageLabel) + '</strong></div><div><span>Формат</span><strong>' + escapeHtml(assessment.formatLabel) + '</strong></div><div><span>Школа как основание</span><strong>' + (assessment.schoolAsBasis ? "проверять" : "нет") + '</strong></div></div>' +
      '<div class="education-role-grid">' +
        educationRoleCard("01 · По статусу родителя", dependent, profile) +
        educationRoleCard("02 · Собственный school route", profile && profile.student, profile) +
        educationRoleCard("03 · Сопровождающий родитель", profile && profile.guardian, profile) +
        educationRoleCard("04 · Сад / школа", provision, profile) +
      '</div>' +
      '<p class="education-boundary">' + (profile ? escapeHtml(profile.jurisdiction) + ' · checked ' + escapeHtml(profile.checkedAt) + ' · confidence ' + escapeHtml(profile.confidence) + '. ' : "Официальный country layer отсутствует. ") + 'Школьная виза ребёнка не означает автоматически статус или право на работу родителя. Стоимость и места international / bilingual проверяются по городу.</p></section>';
  }

  function openDrawer(id, profileContext, entryCollection) {
    var entry = (entryCollection || computed).find(function (item) { return item.id === id; });
    if (!entry) return;
    var drawerProfile = profileContext ? mergeProfile(profileContext) : state;
    withProfileState(drawerProfile, function () {
    lastFocus = document.activeElement;
    var outcomeRank = LEVEL_RANK[entry.outcome];
    var workProfile = DATA.workProfiles[entry.code];
    var blockers = entry.blockers.length ? entry.blockers.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join("") : '<li class="ok-item">Нет hard blocker для текущего профиля.</li>';
    var allUnknowns = entry.warnings.concat(entry.childEducation.unknowns);
    var unknowns = allUnknowns.length ? allUnknowns.slice(0, 9).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join("") : '<li>Критические неизвестные не зафиксированы.</li>';
    var sources = entry.sources.map(function (source) {
      if (/^\.\.\//.test(source.url)) return '<li><span class="source-pending">' + escapeHtml(source.label) + ' · needs official source</span><span>verification queue</span></li>';
      return '<li><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(source.label) + ' ↗</a><span>' + escapeHtml(source.kind) + '</span></li>';
    }).join("");
    if (workProfile) {
      sources += workProfile.sources.map(function (url, sourceIndex) {
        return '<li><a href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer">Право на работу · official ' + (sourceIndex + 1) + ' ↗</a><span>official · ' + escapeHtml(workProfile.checkedAt) + '</span></li>';
      }).join("");
    }
    if (entry.childEducation.profile) {
      sources += entry.childEducation.profile.sources.map(function (source) {
        return '<li><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(source.label) + ' ↗</a><span>official · ' + escapeHtml(entry.childEducation.profile.checkedAt) + '</span></li>';
      }).join("");
    }
    var cityTabs = entry.cities.map(function (city, index) {
      return '<button class="city-tab' + (index === 0 ? " active" : "") + '" type="button" data-city-index="' + index + '">' + escapeHtml(city.name) + '</button>';
    }).join("");
    var talentPanel = "";
    if (entry.talentProfile) {
      talentPanel = '<section class="drawer-section talent-evidence-section"><div class="talent-section-heading"><div><span>TALENT GATE</span><h3>Как устроен отбор</h3></div><b>' + escapeHtml(entry.talentProfile.model) + '</b></div>' +
        '<div class="talent-gate"><p>' + escapeHtml(entry.talentProfile.gate) + '</p><strong>' + escapeHtml(entry.talentProfile.routeRole) + '</strong></div>' +
        '<div class="talent-employer"><span>Employer / petitioner</span><p>' + escapeHtml(entry.talentProfile.employer) + '</p></div>' +
        '<div class="talent-evidence-list">' + entry.talentProfile.evidence.map(function (item, evidenceIndex) {
          return '<article><span>0' + (evidenceIndex + 1) + '</span><p>' + escapeHtml(item) + '</p></article>';
        }).join("") + '</div></section>';
    }

    $("#drawerContent").innerHTML =
      '<div class="drawer-kicker">' + escapeHtml(entry.region) + ' · ' + escapeHtml(visaTypeLabel(entry.visaType)) + ' · checked ' + escapeHtml(entry.checkedAt) + '</div>' +
      '<div class="drawer-title-row"><h2 id="drawerTitle"><span>' + entry.flag + '</span>' + escapeHtml(entry.country) + '</h2><div class="drawer-score">' + entry.score + '<small>fit</small></div></div>' +
      '<p class="drawer-summary">' + escapeHtml(entry.summary) + '</p>' +
      '<section class="drawer-decision" aria-label="Объяснение персонального результата"><div><span>Почему в списке</span><strong>' + escapeHtml(mainReason(entry)) + '</strong></div><div class="decision-risk"><span>' + (entry.blockers.length ? "Hard blocker" : "Проверить") + '</span><strong>' + escapeHtml(mainConstraint(entry)) + '</strong></div><div><span>Качество данных</span><strong>grade ' + escapeHtml(entry.confidence) + ' · checked ' + escapeHtml(entry.checkedAt) + '</strong></div></section>' +
      '<section class="country-context" aria-label="Контекст страны">' +
        '<div><span>Часть мира</span><strong>' + escapeHtml(zoneLabel(entry.countryProfile.zone)) + '</strong></div>' +
        '<div><span>Язык</span><strong>' + escapeHtml(entry.countryProfile.languages) + '</strong><small>' + escapeHtml(languageAccessLabel(entry.countryProfile.languageAccess)) + '</small></div>' +
        '<div><span>Бюрократия</span><strong>' + escapeHtml(bureaucracyLabel(entry.countryProfile.bureaucracy)) + '</strong></div>' +
        '<div><span>Мигранты</span><strong>' + escapeHtml(migrantShareLabel(entry.countryProfile)) + '</strong><small>World Bank / UN · ' + escapeHtml(entry.countryProfile.migrantYear || "n/a") + '</small></div>' +
        '<div><span>Паспорт</span><strong>' + escapeHtml(passportSignal(entry.countryProfile)) + '</strong><small>сравнение с RU, не гарантия получения</small></div>' +
      '</section>' +
      '<div class="legal-stack">' +
        '<div class="legal-step active"><span>01 · основание входа</span><strong>' + escapeHtml(entry.entry) + '</strong><small>' + escapeHtml(entry.stay) + ' · продление: ' + escapeHtml(entry.renewable) + '</small></div>' +
        '<div class="legal-step ' + (outcomeRank >= 2 ? "active" : "missing") + '"><span>02 · residence</span><strong>' + (outcomeRank >= 2 ? "ВНЖ / residence stage" : "Не доказан") + '</strong><small>' + (outcomeRank >= 2 ? "Законное проживание входит в маршрут; точный статус и продление смотрите в основании." : "Нужна смена основания; текущий status не обещает ВНЖ или ПМЖ.") + '</small></div>' +
        '<div class="legal-step ' + (outcomeRank >= 3 ? "active" : "missing") + '"><span>03 · citizenship</span><strong>' + (outcomeRank >= 3 ? escapeHtml(entry.citizenshipYears + " лет до права подать") : "Clock не подтверждён") + '</strong><small>' + (outcomeRank >= 3 ? "Dual: " + escapeHtml(entry.dual) + " · право подать ≠ паспорт" : "Не использовать этот route как citizenship anchor.") + '</small></div>' +
      '</div>' +
      '<section class="drawer-section"><h3>Ресурсы и права</h3><div class="drawer-grid">' +
        '<div class="drawer-fact"><span>Remote income</span><strong>' + (entry.incomeMin ? "от " + formatMoney(entry.incomeMin) + "/мес." : "без подтверждённого порога") + '</strong></div>' +
        '<div class="drawer-fact"><span>Funds / savings</span><strong>' + (entry.fundsMin ? "от " + formatMoney(entry.fundsMin) : "нет фиксированного порога") + '</strong></div>' +
        '<div class="drawer-fact"><span>Investment / fees</span><strong>' + (entry.investmentMin ? formatMoney(entry.investmentMin) + " + ≈" + formatMoney(entry.applyCost) : "старт ≈" + formatMoney(entry.applyCost)) + '</strong></div>' +
        '<div class="drawer-fact"><span>' + escapeHtml(workModeLabel(state.workMode)) + '</span><strong class="' + workStatusClass(entry.workAssessment.status) + '">' + escapeHtml(workStatusLabel(entry.workAssessment.status)) + '</strong></div>' +
        '<div class="drawer-fact"><span>Супруг / семья</span><strong>' + escapeHtml(entry.spouse) + '</strong></div>' +
      '<div class="drawer-fact"><span>Confidence</span><strong>grade ' + escapeHtml(entry.confidence) + ' · ' + escapeHtml(entry.status) + '</strong></div>' +
      '</div></section>' +
      '<section class="drawer-section work-reality"><div class="work-reality-heading"><div><span>WORK REALITY</span><h3>Как можно зарабатывать</h3></div><b class="' + workStatusClass(entry.workAssessment.status) + '">' + escapeHtml(workStatusLabel(entry.workAssessment.status)) + '</b></div>' +
        '<p class="work-reality-mode">' + escapeHtml(workModeLabel(state.workMode)) + ' · ' + escapeHtml(skillSectorLabel(state.skillSector)) + (state.skillText ? ' · ' + escapeHtml(state.skillText) : '') + '</p>' +
        '<p>' + escapeHtml(entry.workAssessment.note) + '</p>' +
        '<small>' + (workProfile ? 'Правило проверено ' + escapeHtml(workProfile.checkedAt) + '. ' : 'Для страны нет углублённого work layer. ') + 'Налоги, лицензия профессии и муниципальные правила проверяются отдельно.</small>' +
      '</section>' + renderChildEducationSection(entry) + talentPanel +
      '<section class="drawer-section"><h3>Города для первого расчёта</h3><div class="city-tabs">' + cityTabs + '</div><div id="drawerCityProfile"></div></section>' +
      '<section class="drawer-section"><h3>Ваши hard blockers</h3><ul class="blocker-list">' + blockers + '</ul></section>' +
      '<section class="drawer-section"><h3>Что ещё проверить</h3><ul class="unknown-list">' + unknowns + '</ul></section>' +
      '<section class="drawer-section"><h3>Источники</h3><ul class="source-list">' + sources + '</ul><p class="drawer-disclaimer">Источник подтверждает конкретный юридический факт, а не персональное право на одобрение. City budget — planning range, не коммерческая оферта и не персональная смета.</p></section>';

    renderDrawerCity(entry, 0);
    $$("[data-city-index]", $("#drawerContent")).forEach(function (button) {
      button.addEventListener("click", function () {
        $$("[data-city-index]", $("#drawerContent")).forEach(function (item) { item.classList.remove("active"); });
        button.classList.add("active");
        withProfileState(drawerProfile, function () { renderDrawerCity(entry, Number(button.dataset.cityIndex)); });
      });
    });
    $("#drawerBackdrop").hidden = false;
    $("#drawerBackdrop").classList.add("open");
    $("#drawerBackdrop").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("#drawerClose").focus();
    });
  }

  function renderDrawerCity(entry, index) {
    var city = entry.cities[index];
    if (!city) {
      $("#drawerCityProfile").innerHTML = '<div class="route-empty">City layer ещё не заполнен.</div>';
      return;
    }
    var signal = citySignal(entry, city);
    var cityMid = ((city.budget[0] + city.budget[1]) / 2) * householdFactor();
    var lifestyle = lifestyleResult(cityMid);
    $("#drawerCityProfile").innerHTML = '<article class="city-profile">' +
      '<div class="city-profile-header"><h4>' + escapeHtml(city.name) + '</h4><div class="city-budget"><strong>' + formatBudget(city.budget, householdFactor()) + ' / мес.</strong><span>planning range для вашего household</span></div></div>' +
      '<div class="city-life-callout"><div><span>К текущим расходам</span><strong class="' + lifestyleClass(lifestyle) + '">' + signedPercent(lifestyle.delta) + ' · ' + escapeHtml(lifestyleLabel(lifestyle)) + '</strong></div><div><span>Останется от дохода</span><strong>' + formatMoney(lifestyle.remaining) + '/мес.</strong></div></div>' +
      '<div class="city-meta"><span>аренда ' + formatBudget(city.rent, householdFactor()) + '</span><span>' + escapeHtml(city.climate) + '</span><span>' + escapeHtml(geographyLabel(signal.sea, "sea")) + '</span><span>' + escapeHtml(geographyLabel(signal.mountains, "mountains")) + '</span><span>' + escapeHtml(housingLabel(signal.housing)) + '</span><span>internet: ' + escapeHtml(city.internet) + '</span><span>infra ' + city.infra + '/5</span><span>nature ' + city.nature + '/5</span></div>' +
      '<p>' + escapeHtml(city.note) + '</p>' +
    '</article>';
  }

  function closeDrawer() {
    $("#drawerBackdrop").classList.remove("open");
    $("#drawerBackdrop").setAttribute("aria-hidden", "true");
    $("#drawerBackdrop").hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function openMethod() {
    lastFocus = document.activeElement;
    $("#methodBackdrop").hidden = false;
    $("#methodBackdrop").classList.add("open");
    $("#methodBackdrop").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("#methodClose").focus();
  }

  function closeMethod() {
    $("#methodBackdrop").classList.remove("open");
    $("#methodBackdrop").setAttribute("aria-hidden", "true");
    $("#methodBackdrop").hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function trapDialogFocus(event, container) {
    var focusable = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', container).filter(function (element) {
      return !element.hidden && element.getClientRects().length > 0;
    });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function togglePin(id) {
    var index = state.pinned.indexOf(id);
    if (index >= 0) {
      state.pinned.splice(index, 1);
    } else if (state.pinned.length < 3) {
      state.pinned.push(id);
    } else {
      showToast("В сравнении уже три маршрута");
      return;
    }
    recompute();
  }

  function showToast(message) {
    var toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  function renderWorkHint() {
    var hints = {
      remote: "Проверяем, разрешает ли конкретный статус работу на иностранный доход. Безвиз и visitor status не равны work right.",
      "local-job": "Показываем рынок только вместе с рабочим разрешением, sponsor или свободным доступом по ЕАЭС.",
      "self-employed": "Виза и business right — разные слои. Отдельно проверяем клиентов, регистрацию и налоги.",
      "hands-on": "Самый рисковый сценарий: маникюр, hair, spa и другие услуги местным клиентам часто нелегальны без отдельного permit и лицензии.",
      "not-working": "Работа не фильтрует первый этап; доход и funds для визы всё равно учитываются."
    };
    $("#workModeHint").textContent = hints[state.workMode] || "";
    $("#workModeHint").classList.toggle("risk", state.workMode === "hands-on");
  }

  function renderPresenceField() {
    var field = $("#presenceField");
    field.hidden = state.level !== "citizenship";
  }

  function syncForm() {
    $("#nationalityInput").value = state.nationality;
    $("#adultsInput").value = state.adults;
    $("#childrenInput").value = state.children;
    $("#childEducationStageInput").value = state.childEducationStage;
    $("#childEducationFormatInput").value = state.childEducationFormat;
    $("#childEducationVisaInput").checked = state.childEducationVisa;
    $("#incomeInput").value = state.income;
    $("#currentSpendInput").value = state.currentSpend;
    $("#budgetInput").value = state.budget;
    $("#savingsInput").value = state.savings;
    $("#investmentInput").value = state.investment;
    $("#zoneInput").value = state.zone;
    $("#climateInput").value = state.climate;
    $("#seaPreferenceInput").value = state.seaPreference;
    $("#mountainPreferenceInput").value = state.mountainPreference;
    $("#levelInput").value = state.level;
    $("#workModeInput").value = state.workMode;
    $("#skillSectorInput").value = state.skillSector;
    $("#skillTextInput").value = state.skillText;
    $("#horizonInput").value = state.horizon;
    $("#horizonOutput").textContent = state.horizon + " лет";
    $("#presenceInput").value = state.presence;
    $("#studyInput").checked = state.study;
    $("#talentInput").checked = state.talent;
    $("#childPlanInput").checked = state.childPlan;
    $("#dualInput").checked = state.keepDual;
    $("#verifiedInput").checked = state.verifiedOnly;
    $("#searchInput").value = state.search;
    $("#sortInput").value = state.sort;
    renderWorkHint();
    renderPresenceField();
    $$("[data-weight]").forEach(function (input) {
      input.value = state.weights[input.dataset.weight];
      input.parentElement.querySelector("output").textContent = input.value;
    });
  }

  function bindProfileInput(id, key, type) {
    var element = $("#" + id);
    var eventName = type === "checkbox" || element.tagName === "SELECT" ? "change" : "input";
    element.addEventListener(eventName, function (event) {
      state[key] = type === "checkbox" ? event.target.checked : type === "number" ? Number(event.target.value || 0) : event.target.value;
      if (key === "level") state.stayStyle = stayStyleForLevel(state.level);
      if (key === "level") renderPresenceField();
      if (key === "horizon") $("#horizonOutput").textContent = state.horizon + " лет";
      if (key === "workMode") renderWorkHint();
      markCalculationDirty();
    });
  }

  function bindEvents() {
    bindProfileInput("nationalityInput", "nationality", "text");
    bindProfileInput("adultsInput", "adults", "number");
    bindProfileInput("childrenInput", "children", "number");
    bindProfileInput("childEducationStageInput", "childEducationStage", "text");
    bindProfileInput("childEducationFormatInput", "childEducationFormat", "text");
    bindProfileInput("childEducationVisaInput", "childEducationVisa", "checkbox");
    bindProfileInput("incomeInput", "income", "number");
    bindProfileInput("currentSpendInput", "currentSpend", "number");
    bindProfileInput("budgetInput", "budget", "number");
    bindProfileInput("savingsInput", "savings", "number");
    bindProfileInput("investmentInput", "investment", "number");
    bindProfileInput("zoneInput", "zone", "text");
    bindProfileInput("climateInput", "climate", "text");
    bindProfileInput("seaPreferenceInput", "seaPreference", "text");
    bindProfileInput("mountainPreferenceInput", "mountainPreference", "text");
    bindProfileInput("levelInput", "level", "text");
    bindProfileInput("workModeInput", "workMode", "text");
    bindProfileInput("skillSectorInput", "skillSector", "text");
    bindProfileInput("skillTextInput", "skillText", "text");
    bindProfileInput("horizonInput", "horizon", "number");
    bindProfileInput("presenceInput", "presence", "text");
    bindProfileInput("studyInput", "study", "checkbox");
    bindProfileInput("talentInput", "talent", "checkbox");
    bindProfileInput("childPlanInput", "childPlan", "checkbox");
    bindProfileInput("dualInput", "keepDual", "checkbox");
    bindProfileInput("verifiedInput", "verifiedOnly", "checkbox");

    $$("[data-weight]").forEach(function (input) {
      input.addEventListener("input", function () {
        state.weights[input.dataset.weight] = Number(input.value);
        input.parentElement.querySelector("output").textContent = input.value;
        markCalculationDirty();
      });
    });

    $("#profileForm").addEventListener("submit", function (event) {
      event.preventDefault();
      calculateRoutes(true);
    });
    $("#gateCalculateButton").addEventListener("click", function () { calculateRoutes(true); });
    $("#planCalculateButton").addEventListener("click", function () {
      var wasCalculated = hasCalculated;
      calculateRoutes(!wasCalculated);
      if (wasCalculated) requestAnimationFrame(function () {
        $("#myPlan").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    $("#exportPlanButton").addEventListener("click", exportPlan);
    $("#planProfileButton").addEventListener("click", exportProfile);
    $("#loadDemoButton").addEventListener("click", loadJudgeDemo);
    $("#planNextButton").addEventListener("click", function () {
      var id = $("#planNextButton").dataset.checkId;
      if (!id) return;
      var row = $$("[data-check-id]", $("#planChecklist")).find(function (item) { return item.dataset.checkId === id; });
      if (!row) return;
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      requestAnimationFrame(function () { $("select", row).focus(); });
    });
    $("#planChecklist").addEventListener("change", function (event) {
      var select = event.target.closest("[data-check-status]");
      if (select) setPlanCheckStatus(select.dataset.checkStatus, select.value);
    });
    $("#planChecklist").addEventListener("click", function (event) {
      var openButton = event.target.closest("[data-plan-open]");
      if (openButton) openDrawer(openButton.dataset.planOpen);
    });
    $("#finalistChooseButton").addEventListener("click", function () {
      $("#compareSection").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#finalistRound").addEventListener("change", function (event) {
      var roleSelect = event.target.closest("[data-finalist-role]");
      var citySelect = event.target.closest("[data-finalist-city]");
      if (roleSelect) setFinalistRole(roleSelect.dataset.finalistRole, roleSelect.value);
      if (citySelect) setFinalistCity(citySelect.dataset.finalistCity, citySelect.value);
    });
    $("#finalistRound").addEventListener("click", function (event) {
      var openButton = event.target.closest("[data-finalist-open]");
      if (openButton) openDrawer(openButton.dataset.finalistOpen);
    });
    $("#openScenarioButton").addEventListener("click", openScenarioLab);
    $("#scenarioForm").addEventListener("submit", function (event) {
      event.preventDefault();
      compareScenario();
    });
    $("#scenarioBudgetInput").addEventListener("input", function (event) {
      ensureScenarioDraft();
      if (event.target.value === "") return;
      scenarioState.draft.budget = boundedNumber(event.target.value, 0, 1000000, state.budget, false);
      scenarioState.hasCompared = false;
      scenarioResult = null;
      saveScenario();
    });
    $("#scenarioBudgetInput").addEventListener("change", function (event) {
      updateScenarioDraft("budget", boundedNumber(event.target.value, 0, 1000000, state.budget, false));
    });
    $("#scenarioPresenceInput").addEventListener("change", function (event) {
      updateScenarioDraft("presence", event.target.value);
    });
    $("#scenarioWorkModeInput").addEventListener("change", function (event) {
      updateScenarioDraft("workMode", event.target.value);
    });
    $("#scenarioChildPlanInput").addEventListener("change", function (event) {
      updateScenarioDraft("childPlan", event.target.value === "true");
    });
    $("#resetScenarioButton").addEventListener("click", resetScenario);
    $("#openScenarioRouteButton").addEventListener("click", function () {
      var routeId = $("#openScenarioRouteButton").dataset.routeId;
      if (!routeId || !scenarioResult) return;
      openDrawer(routeId, scenarioResult.profile, scenarioResult.entries);
    });

    $$("[data-segment]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.segment = button.dataset.segment;
        state.visaTypeFilter = "all";
        visibleLimit = PAGE_SIZE;
        recompute();
      });
    });

    $$("[data-zone]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.zone = button.dataset.zone;
        visibleLimit = PAGE_SIZE;
        syncForm();
        markCalculationDirty();
      });
    });

    $("#visaTypeGrid").addEventListener("click", function (event) {
      var button = event.target.closest("[data-catalog-type]");
      if (!button) return;
      state.catalogType = button.dataset.catalogType;
      saveProfile();
      renderVisaCatalog();
    });
    $("#visaCatalogFocus").addEventListener("click", function (event) {
      var openButton = event.target.closest("[data-open]");
      var filterButton = event.target.closest("[data-filter-type]");
      var methodButton = event.target.closest("[data-open-method]");
      if (openButton) openDrawer(openButton.dataset.open);
      if (methodButton) openMethod();
      if (filterButton) {
        state.visaTypeFilter = filterButton.dataset.filterType;
        state.segment = "all";
        state.search = "";
        visibleLimit = PAGE_SIZE;
        syncForm();
        recompute();
        $("#explorerTitle").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    $("#clearVisaFilter").addEventListener("click", function () {
      state.visaTypeFilter = "all";
      visibleLimit = PAGE_SIZE;
      recompute();
    });

    $("#searchInput").addEventListener("input", function (event) {
      state.search = event.target.value;
      visibleLimit = PAGE_SIZE;
      recompute();
    });
    $("#sortInput").addEventListener("change", function (event) {
      state.sort = event.target.value;
      recompute();
    });
    $("#loadMoreButton").addEventListener("click", function () {
      visibleLimit += PAGE_SIZE;
      renderRouteList();
    });

    $("#shortlist").addEventListener("click", function (event) {
      var openButton = event.target.closest("[data-open]");
      var pinButton = event.target.closest("[data-pin]");
      if (openButton) openDrawer(openButton.dataset.open);
      if (pinButton) togglePin(pinButton.dataset.pin);
    });
    $("#routeList").addEventListener("click", function (event) {
      var openButton = event.target.closest("[data-open]");
      var pinButton = event.target.closest("[data-pin]");
      if (openButton) openDrawer(openButton.dataset.open);
      if (pinButton) togglePin(pinButton.dataset.pin);
    });
    $("#compareTable").addEventListener("click", function (event) {
      var removeButton = event.target.closest("[data-remove-pin]");
      var openButton = event.target.closest("[data-open]");
      if (removeButton) togglePin(removeButton.dataset.removePin);
      if (openButton) openDrawer(openButton.dataset.open);
    });

    $("#drawerClose").addEventListener("click", closeDrawer);
    $("#drawerBackdrop").addEventListener("click", function (event) { if (event.target === event.currentTarget) closeDrawer(); });
    $$("[data-open-method]").forEach(function (button) { button.addEventListener("click", openMethod); });
    $("#methodClose").addEventListener("click", closeMethod);
    $("#methodBackdrop").addEventListener("click", function (event) { if (event.target === event.currentTarget) closeMethod(); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if ($("#drawerBackdrop").classList.contains("open")) closeDrawer();
        else if ($("#methodBackdrop").classList.contains("open")) closeMethod();
        return;
      }
      if (event.key !== "Tab") return;
      if ($("#drawerBackdrop").classList.contains("open")) trapDialogFocus(event, $("#routeDrawer"));
      if ($("#methodBackdrop").classList.contains("open")) trapDialogFocus(event, $("#methodDialog"));
    });

    $("#goCompareButton").addEventListener("click", function () {
      $("#compareSection").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("#exportButton").addEventListener("click", exportProfile);

    $("#importButton").addEventListener("click", function () { $("#importInput").click(); });
    $("#importInput").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          state = mergeProfile(parsed.profile || parsed);
          var importedStatuses = importPlanBoard(parsed);
          clearFinalists();
          var importedFinalists = importFinalists(parsed);
          clearScenario();
          visibleLimit = PAGE_SIZE;
          hasCalculated = false;
          calculationDirty = false;
          syncForm();
          recompute();
          showToast(parsed.planVersion
            ? "План импортирован" + (importedStatuses ? " · статусы " + importedStatuses : "") + (importedFinalists ? " · финалисты " + importedFinalists : "") + " — пересчитайте"
            : "Профиль импортирован — пересчитайте");
        } catch (error) {
          showToast("Не удалось прочитать JSON");
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    });

    $("#resetButton").addEventListener("click", function () {
      if (!window.confirm(uiText("Сбросить анкету, сравнение, сценарий, финалистов и статусы плана?"))) return;
      state = clone(DEFAULT_PROFILE);
      clearPlanBoard();
      clearScenario();
      clearFinalists();
      visibleLimit = PAGE_SIZE;
      hasCalculated = false;
      calculationDirty = false;
      syncForm();
      recompute();
      showToast("Профиль сброшен");
    });
  }

  syncForm();
  bindEvents();
  recompute();
}());
