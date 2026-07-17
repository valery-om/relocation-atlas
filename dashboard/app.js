(function () {
  "use strict";

  function validateRuntimeData(data) {
    var errors = [];
    if (!data || typeof data !== "object") return ["ATLAS_DATA отсутствует"];
    if (!data.meta || data.meta.schemaVersion !== 4) errors.push("Неподдерживаемая версия схемы");
    if (!Array.isArray(data.visaTypes) || !data.visaTypes.length) errors.push("Нет справочника visaTypes");
    if (!Array.isArray(data.entries) || !data.entries.length) errors.push("Нет маршрутов");
    if (!data.countryProfiles || typeof data.countryProfiles !== "object") errors.push("Нет countryProfiles");
    if (!data.citySignals || typeof data.citySignals !== "object") errors.push("Нет citySignals");
    if (!data.workProfiles || typeof data.workProfiles !== "object") errors.push("Нет workProfiles");
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
  var DATA_ERRORS = validateRuntimeData(DATA);
  if (DATA_ERRORS.length) {
    document.body.innerHTML = '<main class="fatal-error"><h1>Данные атласа не прошли проверку</h1><p>' + DATA_ERRORS.join(" · ") + '</p><p>Запустите <code>node scripts/validate-platform-data.js</code>.</p></main>';
    return;
  }

  var LEVEL_RANK = { temporary: 1, residence: 2, citizenship: 3 };
  var PROFILE_KEY = "relocation-atlas-profile-v4";
  var LEGACY_PROFILE_KEYS = ["relocation-atlas-profile-v3", "relocation-atlas-profile-v2"];
  var VISA_TYPES_BY_ID = DATA.visaTypes.reduce(function (map, type) { map[type.id] = type; return map; }, {});
  var PAGE_SIZE = 9;
  var DEFAULT_PROFILE = {
    nationality: "RU",
    level: "temporary",
    adults: 2,
    children: 0,
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

  var state = loadProfile();
  var computed = [];
  var visibleLimit = PAGE_SIZE;
  var hasCalculated = false;
  var calculationDirty = false;
  var lastFocus = null;
  var toastTimer = null;

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var clamp = function (value, min, max) { return Math.max(min, Math.min(max, value)); };

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

  function formatBudget(range, factor) {
    if (!range || range.length < 2) return "н/д";
    return "$" + Math.round(range[0] * factor / 100) * 100 + "–" + Math.round(range[1] * factor / 100) * 100;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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
    ["study", "talent", "childPlan", "keepDual", "verifiedOnly"].forEach(function (key) {
      if (typeof profile[key] !== "boolean") profile[key] = DEFAULT_PROFILE[key];
    });
    if (!DATA.nationalities.some(function (item) { return item.code === profile.nationality && item.status === "active"; })) profile.nationality = "RU";
    if (!["all", "asia", "europe", "eurasia", "americas", "africa-islands", "oceania"].includes(profile.zone)) profile.zone = "all";
    if (!["any", "warm", "temperate", "cool"].includes(profile.climate)) profile.climate = "any";
    if (!["any", "direct", "near"].includes(profile.seaPreference)) profile.seaPreference = "any";
    if (!["any", "direct", "near"].includes(profile.mountainPreference)) profile.mountainPreference = "any";
    if (!["wintering", "trial", "anchor"].includes(profile.stayStyle)) profile.stayStyle = "wintering";
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

  function topRoutes() {
    var eligible = computed.filter(function (entry) {
      return qualifiesLevel(entry) && (state.zone === "all" || entry.countryProfile.zone === state.zone);
    }).sort(function (a, b) {
      if (a.blockers.length !== b.blockers.length) return a.blockers.length - b.blockers.length;
      return b.score - a.score;
    });
    var clear = eligible.filter(function (entry) { return entry.blockers.length === 0; });
    return (clear.length >= 3 ? clear : eligible).slice(0, 3);
  }

  function recompute() {
    computed = DATA.entries.map(evaluate);
    saveProfile();
    render();
  }

  function renderCalculationState() {
    var showResults = hasCalculated && !calculationDirty;
    $("#resultsFlow").hidden = !showResults;
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
    renderDock();
  }

  function render() {
    renderTopMeta();
    renderVisaCatalog();
    renderOverview();
    renderShortlist();
    renderFilters();
    renderRouteList();
    renderComparison();
    renderCalculationState();
    renderDock();
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
    if (entry.blockers.length) return entry.blockers[0];
    var reasons = [];
    if (entry.lifestyle.status === "improves") reasons.push("базовая жизнь дешевле");
    else if (entry.budgetFits) reasons.push("вписывается в planning budget");
    if (entry.workAssessment.status === "legal") reasons.push("работу можно оформить");
    if (entry.status === "verified") reasons.push("official facts checked");
    if (entry.metrics.infra >= 4) reasons.push("сильная инфраструктура");
    if (entry.components.speed >= 85) reasons.push("короткий горизонт");
    return reasons.slice(0, 2).join(" · ") || "профиль проходит без hard blocker";
  }

  function renderOverview() {
    var top = topRoutes()[0];
    $("#leaderName").textContent = top ? top.country + " · " + top.route : "Нет маршрута";
    $("#leaderReason").textContent = top ? mainReason(top) : "Измените исходные данные";
    $("#lifestyleSignal").textContent = top ? signedPercent(top.lifestyle.delta) : "—";
    $("#lifestyleSignal").className = top ? lifestyleClass(top.lifestyle) : "";
    $("#incomeRemainder").textContent = top ? formatMoney(top.lifestyle.remaining) : "—";
    $("#incomeRemainder").className = top && top.lifestyle.remaining < 0 ? "negative-value" : "";
    $("#workSignal").textContent = top ? workStatusLabel(top.workAssessment.status) : "—";
    $("#workSignal").className = top ? workStatusClass(top.workAssessment.status) : "";
    $("#pinnedCount").textContent = state.pinned.length + "/3";
  }

  function renderShortlist() {
    var list = topRoutes();
    if (!list.length) {
      $("#shortlist").innerHTML = '<div class="route-empty">Для этого уровня пока нет совпадений.</div>';
      return;
    }
    $("#shortlist").innerHTML = list.map(function (entry) {
      var className = entry.blockers.length ? " blocked" : entry.status !== "verified" || entry.warnings.length ? " partial" : "";
      var status = entry.blockers.length ? entry.blockers[0] : entry.status === "verified" ? "без hard blocker" : "нужна проверка";
      return '<article class="short-card' + className + '">' +
        '<div class="short-card-top"><span class="flag">' + entry.flag + '</span><span class="score-ring">' + entry.score + '</span></div>' +
        '<div class="short-card-main"><span class="panel-index">' + escapeHtml(visaTypeLabel(entry.visaType)) + '</span><h3>' + escapeHtml(entry.country) + '</h3><div class="route-name">' + escapeHtml(entry.route) + ' · ' + escapeHtml(outcomeLabel(entry.outcome)) + '</div>' +
        '<div class="short-signals"><span class="' + lifestyleClass(entry.lifestyle) + '">' + escapeHtml(lifestyleLabel(entry.lifestyle)) + ' ' + signedPercent(entry.lifestyle.delta) + '</span><span class="' + workStatusClass(entry.workAssessment.status) + '">' + escapeHtml(workStatusLabel(entry.workAssessment.status)) + '</span></div>' +
        '<p class="short-card-reason">' + escapeHtml(mainReason(entry)) + '</p></div>' +
        '<div class="short-card-bottom"><span class="status-pill' + (entry.blockers.length ? " danger" : "") + '">' + escapeHtml(status) + '</span><button class="open-arrow" type="button" data-open="' + entry.id + '" aria-label="Подробнее о ' + escapeHtml(entry.country) + '">↗</button></div>' +
      '</article>';
    }).join("");
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
          '<div class="route-actions"><button type="button" data-open="' + entry.id + '">детали</button><button type="button" data-pin="' + entry.id + '" class="' + (pinned ? "pinned" : "") + '">' + (pinned ? "✓ в сравнении" : "+ сравнить") + '</button></div>' +
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
      return '<th><span>' + entry.flag + '</span><strong>' + escapeHtml(entry.country) + '</strong><small>' + escapeHtml(entry.route) + '</small><button class="remove-compare" type="button" data-remove-pin="' + entry.id + '">убрать</button></th>';
    }).join("") + '</tr></thead>';
    var rows = [
      comparisonRow("Персональный fit", entries.map(function (entry) { return '<strong>' + entry.score + '/100</strong>'; })),
      comparisonRow("Outcome", entries.map(function (entry) { return escapeHtml(outcomeLabel(entry.outcome)); })),
      comparisonRow("Тип визы", entries.map(function (entry) { return escapeHtml(visaTypeLabel(entry.visaType)); })),
      comparisonRow("Срок", entries.map(function (entry) { return escapeHtml(entry.stay); })),
      comparisonRow("Городской budget", entries.map(function (entry) { return entry.bestCity ? formatBudget(entry.bestCity.budget, householdFactor()) + '<br><small>' + escapeHtml(entry.bestCity.name) + '</small>' : "н/д"; })),
      comparisonRow("Уровень жизни", entries.map(function (entry) { return '<strong class="' + lifestyleClass(entry.lifestyle) + '">' + escapeHtml(lifestyleLabel(entry.lifestyle)) + '</strong><br><small>' + signedPercent(entry.lifestyle.delta) + ' к текущим расходам</small>'; })),
      comparisonRow("Останется от дохода", entries.map(function (entry) { return '<strong>' + formatMoney(entry.lifestyle.remaining) + '/мес.</strong><br><small>до налогов и визовых расходов</small>'; })),
      comparisonRow("Доход / funds", entries.map(function (entry) { return 'income ' + formatMoney(entry.incomeMin) + '<br>funds ' + formatMoney(entry.fundsMin); })),
      comparisonRow("Ваш формат работы", entries.map(function (entry) { return '<strong class="' + workStatusClass(entry.workAssessment.status) + '">' + escapeHtml(workStatusLabel(entry.workAssessment.status)) + '</strong><br><small>' + escapeHtml(entry.workAssessment.note) + '</small>'; })),
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

  function renderDock() {
    var dock = $("#compareDock");
    var entries = state.pinned.map(function (id) { return DATA.entries.find(function (entry) { return entry.id === id; }); }).filter(Boolean);
    dock.classList.toggle("visible", hasCalculated && !calculationDirty && entries.length > 0);
    $("#dockItems").innerHTML = entries.map(function (entry) { return '<span class="dock-item" title="' + escapeHtml(entry.country) + '">' + entry.flag + '</span>'; }).join("");
    $("#dockCount").textContent = entries.length;
  }

  function openDrawer(id) {
    var entry = computed.find(function (item) { return item.id === id; });
    if (!entry) return;
    lastFocus = document.activeElement;
    var outcomeRank = LEVEL_RANK[entry.outcome];
    var workProfile = DATA.workProfiles[entry.code];
    var blockers = entry.blockers.length ? entry.blockers.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join("") : '<li class="ok-item">Нет hard blocker для текущего профиля.</li>';
    var unknowns = entry.warnings.length ? entry.warnings.slice(0, 7).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join("") : '<li>Критические неизвестные не зафиксированы.</li>';
    var sources = entry.sources.map(function (source) {
      if (/^\.\.\//.test(source.url)) return '<li><span class="source-pending">' + escapeHtml(source.label) + ' · needs official source</span><span>verification queue</span></li>';
      return '<li><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(source.label) + ' ↗</a><span>' + escapeHtml(source.kind) + '</span></li>';
    }).join("");
    if (workProfile) {
      sources += workProfile.sources.map(function (url, sourceIndex) {
        return '<li><a href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer">Право на работу · official ' + (sourceIndex + 1) + ' ↗</a><span>official · ' + escapeHtml(workProfile.checkedAt) + '</span></li>';
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
      '<div class="drawer-title-row"><h2 id="drawerTitle"><span>' + entry.flag + '</span>' + escapeHtml(entry.country) + '</h2><div class="drawer-score">' + entry.score + '</div></div>' +
      '<p class="drawer-summary">' + escapeHtml(entry.summary) + '</p>' +
      '<section class="country-context" aria-label="Контекст страны">' +
        '<div><span>Часть мира</span><strong>' + escapeHtml(zoneLabel(entry.countryProfile.zone)) + '</strong></div>' +
        '<div><span>Язык</span><strong>' + escapeHtml(entry.countryProfile.languages) + '</strong><small>' + escapeHtml(languageAccessLabel(entry.countryProfile.languageAccess)) + '</small></div>' +
        '<div><span>Бюрократия</span><strong>' + escapeHtml(bureaucracyLabel(entry.countryProfile.bureaucracy)) + '</strong></div>' +
        '<div><span>Мигранты</span><strong>' + escapeHtml(migrantShareLabel(entry.countryProfile)) + '</strong><small>World Bank / UN · ' + escapeHtml(entry.countryProfile.migrantYear || "n/a") + '</small></div>' +
        '<div><span>Паспорт</span><strong>' + escapeHtml(passportSignal(entry.countryProfile)) + '</strong><small>сравнение с RU, не гарантия получения</small></div>' +
      '</section>' +
      '<div class="legal-stack">' +
        '<div class="legal-step active"><span>01 · вход</span><strong>' + escapeHtml(entry.entry) + '</strong><small>' + escapeHtml(entry.stay) + ' · ' + escapeHtml(entry.renewable) + '</small></div>' +
        '<div class="legal-step ' + (outcomeRank >= 2 ? "active" : "missing") + '"><span>02 · residence</span><strong>' + (outcomeRank >= 2 ? escapeHtml(outcomeLabel(entry.outcome)) : "Не доказан") + '</strong><small>' + (outcomeRank >= 2 ? "Маршрут моделируется как residence outcome." : "Нужна смена основания; текущий status не обещает ПМЖ.") + '</small></div>' +
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
      '</section>' + talentPanel +
      '<section class="drawer-section"><h3>Города для первого расчёта</h3><div class="city-tabs">' + cityTabs + '</div><div id="drawerCityProfile"></div></section>' +
      '<section class="drawer-section"><h3>Ваши hard blockers</h3><ul class="blocker-list">' + blockers + '</ul></section>' +
      '<section class="drawer-section"><h3>Что ещё проверить</h3><ul class="unknown-list">' + unknowns + '</ul></section>' +
      '<section class="drawer-section"><h3>Источники</h3><ul class="source-list">' + sources + '</ul><p class="drawer-disclaimer">Источник подтверждает конкретный юридический факт, а не персональное право на одобрение. City budget — planning range, не коммерческая оферта и не персональная смета.</p></section>';

    renderDrawerCity(entry, 0);
    $$("[data-city-index]", $("#drawerContent")).forEach(function (button) {
      button.addEventListener("click", function () {
        $$("[data-city-index]", $("#drawerContent")).forEach(function (item) { item.classList.remove("active"); });
        button.classList.add("active");
        renderDrawerCity(entry, Number(button.dataset.cityIndex));
      });
    });
    $("#drawerBackdrop").classList.add("open");
    $("#drawerBackdrop").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("#drawerClose").focus();
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
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function openMethod() {
    lastFocus = document.activeElement;
    $("#methodBackdrop").classList.add("open");
    $("#methodBackdrop").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("#methodClose").focus();
  }

  function closeMethod() {
    $("#methodBackdrop").classList.remove("open");
    $("#methodBackdrop").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
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

  function syncForm() {
    $("#nationalityInput").value = state.nationality;
    $("#adultsInput").value = state.adults;
    $("#childrenInput").value = state.children;
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
    $("#studyInput").checked = state.study;
    $("#talentInput").checked = state.talent;
    $("#childPlanInput").checked = state.childPlan;
    $("#dualInput").checked = state.keepDual;
    $("#verifiedInput").checked = state.verifiedOnly;
    $("#searchInput").value = state.search;
    $("#sortInput").value = state.sort;
    renderWorkHint();
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
      if (key === "horizon") $("#horizonOutput").textContent = state.horizon + " лет";
      if (key === "workMode") renderWorkHint();
      markCalculationDirty();
    });
  }

  function bindEvents() {
    bindProfileInput("nationalityInput", "nationality", "text");
    bindProfileInput("adultsInput", "adults", "number");
    bindProfileInput("childrenInput", "children", "number");
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
        recompute();
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
      var button = event.target.closest("[data-open]");
      if (button) openDrawer(button.dataset.open);
    });
    $("#routeList").addEventListener("click", function (event) {
      var openButton = event.target.closest("[data-open]");
      var pinButton = event.target.closest("[data-pin]");
      if (openButton) openDrawer(openButton.dataset.open);
      if (pinButton) togglePin(pinButton.dataset.pin);
    });
    $("#compareTable").addEventListener("click", function (event) {
      var button = event.target.closest("[data-remove-pin]");
      if (button) togglePin(button.dataset.removePin);
    });

    $("#drawerClose").addEventListener("click", closeDrawer);
    $("#drawerBackdrop").addEventListener("click", function (event) { if (event.target === event.currentTarget) closeDrawer(); });
    $$("[data-open-method]").forEach(function (button) { button.addEventListener("click", openMethod); });
    $("#methodClose").addEventListener("click", closeMethod);
    $("#methodBackdrop").addEventListener("click", function (event) { if (event.target === event.currentTarget) closeMethod(); });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if ($("#drawerBackdrop").classList.contains("open")) closeDrawer();
      if ($("#methodBackdrop").classList.contains("open")) closeMethod();
    });

    $("#goCompareButton").addEventListener("click", function () {
      $("#compareSection").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("#exportButton").addEventListener("click", function () {
      var payload = { exportedAt: new Date().toISOString(), atlasVersion: DATA.meta.version, schemaVersion: DATA.meta.schemaVersion, profileVersion: 4, profile: state };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "atlas-pereezda-profile.json";
      link.click();
      URL.revokeObjectURL(url);
      showToast("Профиль экспортирован");
    });

    $("#importButton").addEventListener("click", function () { $("#importInput").click(); });
    $("#importInput").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          state = mergeProfile(parsed.profile || parsed);
          visibleLimit = PAGE_SIZE;
          hasCalculated = false;
          calculationDirty = false;
          syncForm();
          recompute();
          showToast("Профиль импортирован");
        } catch (error) {
          showToast("Не удалось прочитать JSON");
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    });

    $("#resetButton").addEventListener("click", function () {
      if (!window.confirm("Сбросить введённые данные и закреплённые маршруты?")) return;
      state = clone(DEFAULT_PROFILE);
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
