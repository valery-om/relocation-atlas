(function () {
  "use strict";

  window.ATLAS_DATA = {
    meta: {
      version: "0.6.0",
      schemaVersion: 5,
      checkedAt: "2026-07-20",
      nationality: "RU",
      screeningUniverse: 57,
      legalDisclaimer: "Score сортирует варианты и не является вероятностью выдачи визы, ВНЖ, ПМЖ или гражданства."
    },
    nationalities: [
      { code: "RU", label: "Россия", status: "active", note: "Phase 1: nationality-specific entry and restriction checks." },
      { code: "UA", label: "Украина", status: "planned", note: "Будет добавлено отдельным availability layer." },
      { code: "BY", label: "Беларусь", status: "planned", note: "Будет добавлено отдельным availability layer." }
    ],
    levels: {
      temporary: {
        label: "Зимовка / попробовать",
        short: "1–24 месяца",
        description: "Легально пожить и отдельно проверить право на выбранный формат работы, не предполагая, что срок ведёт к ПМЖ или паспорту."
      },
      residence: {
        label: "Закрепиться",
        short: "ВНЖ / ПМЖ",
        description: "Продлевать статус, менять основание и строить устойчивую резиденцию."
      },
      citizenship: {
        label: "Построить гражданство",
        short: "5–10+ лет",
        description: "Считать только засчитываемое проживание, physical presence, супруга и двойное гражданство."
      }
    },
    countryProfiles: {
      TH: { zone: "asia", languages: "тайский · английский в турзонах", languageAccess: "mixed", bureaucracy: "moderate", migrantShare: 4.4, migrantYear: 2024, passportTier: 3 },
      MY: { zone: "asia", languages: "малайский · английский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 10.7, migrantYear: 2024, passportTier: 3 },
      ID: { zone: "asia", languages: "индонезийский · английский в туристических зонах", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 0.2, migrantYear: 2024, passportTier: 2 },
      VN: { zone: "asia", languages: "вьетнамский · английский в крупных городах", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 0.3, migrantYear: 2024, passportTier: 2 },
      GE: { zone: "eurasia", languages: "грузинский · русский · английский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 2.1, migrantYear: 2024, passportTier: 2 },
      AM: { zone: "eurasia", languages: "армянский · русский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 9.2, migrantYear: 2024, passportTier: 2 },
      KZ: { zone: "eurasia", languages: "казахский · русский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 10.1, migrantYear: 2024, passportTier: 2 },
      KG: { zone: "eurasia", languages: "кыргызский · русский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 2.7, migrantYear: 2024, passportTier: 1 },
      RS: { zone: "europe", languages: "сербский · английский", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 10.6, migrantYear: 2024, passportTier: 3 },
      TR: { zone: "eurasia", languages: "турецкий · английский в турзонах", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 8.1, migrantYear: 2024, passportTier: 3 },
      AE: { zone: "asia", languages: "арабский · английский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 74.0, migrantYear: 2024, passportTier: 5 },
      MU: { zone: "africa-islands", languages: "английский · французский · креольский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 2.3, migrantYear: 2024, passportTier: 3 },
      CR: { zone: "americas", languages: "испанский · английский в expat-зонах", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 12.2, migrantYear: 2024, passportTier: 4 },
      HR: { zone: "europe", languages: "хорватский · английский", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 13.6, migrantYear: 2024, passportTier: 5 },
      SI: { zone: "europe", languages: "словенский · английский", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 14.9, migrantYear: 2024, passportTier: 5 },
      TW: { zone: "asia", languages: "китайский · английский", languageAccess: "mixed", bureaucracy: "moderate", migrantShare: null, migrantYear: null, passportTier: 4 },
      UY: { zone: "americas", languages: "испанский", languageAccess: "mixed", bureaucracy: "moderate", migrantShare: 4.7, migrantYear: 2024, passportTier: 4 },
      AR: { zone: "americas", languages: "испанский", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 4.3, migrantYear: 2024, passportTier: 4 },
      EC: { zone: "americas", languages: "испанский", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 4.1, migrantYear: 2024, passportTier: 3 },
      LU: { zone: "europe", languages: "люксембургский · французский · немецкий · английский", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 51.2, migrantYear: 2024, passportTier: 5 },
      AU: { zone: "oceania", languages: "английский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 30.4, migrantYear: 2024, passportTier: 5 },
      US: { zone: "americas", languages: "английский", languageAccess: "easy", bureaucracy: "heavy", migrantShare: 15.2, migrantYear: 2024, passportTier: 5 },
      GB: { zone: "europe", languages: "английский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 17.1, migrantYear: 2024, passportTier: 5 },
      HK: { zone: "asia", languages: "кантонский · английский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 41.3, migrantYear: 2024, passportTier: 4 },
      FR: { zone: "europe", languages: "французский", languageAccess: "hard", bureaucracy: "heavy", migrantShare: 13.8, migrantYear: 2024, passportTier: 5 },
      DE: { zone: "europe", languages: "немецкий · английский в крупных городах", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 19.8, migrantYear: 2024, passportTier: 5 },
      BR: { zone: "americas", languages: "португальский", languageAccess: "hard", bureaucracy: "heavy", migrantShare: 0.7, migrantYear: 2024, passportTier: 4 },
      BO: { zone: "americas", languages: "испанский", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 1.5, migrantYear: 2024, passportTier: 2 },
      CV: { zone: "africa-islands", languages: "португальский · креольский", languageAccess: "mixed", bureaucracy: "moderate", migrantShare: 3.1, migrantYear: 2024, passportTier: 2 },
      PT: { zone: "europe", languages: "португальский · английский в городах", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 10.8, migrantYear: 2024, passportTier: 5 },
      ES: { zone: "europe", languages: "испанский · региональные языки", languageAccess: "mixed", bureaucracy: "heavy", migrantShare: 18.5, migrantYear: 2024, passportTier: 5 },
      DM: { zone: "africa-islands", languages: "английский · креольский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 12.7, migrantYear: 2024, passportTier: 4 },
      GD: { zone: "africa-islands", languages: "английский · креольский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 6.3, migrantYear: 2024, passportTier: 4 },
      KN: { zone: "africa-islands", languages: "английский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 17.0, migrantYear: 2024, passportTier: 4 },
      NR: { zone: "oceania", languages: "науруанский · английский", languageAccess: "easy", bureaucracy: "moderate", migrantShare: 21.3, migrantYear: 2024, passportTier: 2 }
    },
    childEducationProfiles: {
      GB: {
        checkedAt: "2026-07-20",
        confidence: "A",
        status: "verified",
        jurisdiction: "United Kingdom · school provision note applies to England",
        dependent: {
          status: "route-dependent",
          routeIds: ["uk-talent"],
          summary: "В текущем Global Talent route подходящие дети могут податься как dependants и учиться; срок и settlement ребёнка проверяются отдельно.",
          sourceIds: ["gb-global-talent-dependants"]
        },
        student: {
          status: "restricted",
          stages: ["kindergarten", "primary", "secondary"],
          summary: "Child Student: возраст 4–17, только independent school; без settlement и без собственных dependants.",
          sourceIds: ["gb-child-student"]
        },
        guardian: {
          status: "restricted",
          stages: ["kindergarten", "primary"],
          summary: "Parent of a Child Student: один родитель для ребёнка 4–11; родителю нельзя работать или учиться, статус прекращается не позднее 12-летия ребёнка.",
          sourceIds: ["gb-parent-child-student"]
        },
        provision: {
          nursery: { status: "needs-check", summary: "Child Student начинается с 4 лет; nursery, стоимость и места зависят от статуса семьи и города.", sourceIds: ["gb-child-student"] },
          kindergarten: { status: "route-dependent", summary: "С 4 лет возможна independent school по Child Student; state-funded school в Англии зависит от допустимого статуса проживания семьи.", sourceIds: ["gb-child-student", "gb-school-admissions"] },
          primary: { status: "route-dependent", summary: "Independent school возможна по Child Student; доступ к state-funded school в Англии зависит от статуса проживания семьи.", sourceIds: ["gb-child-student", "gb-school-admissions"] },
          secondary: { status: "route-dependent", summary: "Child Student покрывает independent school до 17 лет; конкретные места, fees и программа проверяются по школе.", sourceIds: ["gb-child-student"] }
        },
        sources: [
          { id: "gb-child-student", label: "GOV.UK — Child Student visa", url: "https://www.gov.uk/child-study-visa", kind: "official" },
          { id: "gb-parent-child-student", label: "GOV.UK — Parent of a Child Student visa", url: "https://www.gov.uk/parent-of-a-child-at-school-visa", kind: "official" },
          { id: "gb-global-talent-dependants", label: "GOV.UK — Global Talent: partner and children", url: "https://www.gov.uk/global-talent/your-partner-and-children", kind: "official" },
          { id: "gb-school-admissions", label: "GOV.UK — School admissions from overseas", url: "https://www.gov.uk/guidance/schools-admissions-applications-from-overseas-children", kind: "official" }
        ]
      },
      DE: {
        checkedAt: "2026-07-20",
        confidence: "A",
        status: "verified",
        jurisdiction: "Germany · school placement varies by federal state",
        dependent: {
          status: "route-dependent",
          routeIds: ["de-study"],
          summary: "Несовершеннолетний не состоящий в браке ребёнок может присоединиться к подходящему родителю; после 16 лет действуют дополнительные условия.",
          sourceIds: ["de-child-reunification"]
        },
        student: {
          status: "restricted",
          stages: ["secondary"],
          summary: "Самостоятельный school residence permit по §16f — как правило, с 9 класса и для школы с международной ориентацией либо подходящей негосударственной моделью.",
          sourceIds: ["de-residence-act"]
        },
        guardian: {
          status: "not-derived",
          stages: [],
          summary: "§16f не устанавливает отдельный статус сопровождающего родителя; взрослому нужно собственное основание проживания.",
          sourceIds: ["de-residence-act"]
        },
        provision: {
          nursery: { status: "verified", summary: "Crèche обычно покрывает возраст до 3 лет; право на childcare возникает с 1 года, но места могут быть дефицитны.", sourceIds: ["de-child-care"] },
          kindergarten: { status: "verified", summary: "Kindergarten обычно рассчитан примерно на 3–7 лет; доступны bilingual варианты, стоимость и места зависят от города.", sourceIds: ["de-child-care"] },
          primary: { status: "verified", summary: "Обязательная школа обычно начинается примерно с 6 лет; большинство государственных школ бесплатны, placement зависит от земли и школы.", sourceIds: ["de-school-system"] },
          secondary: { status: "verified", summary: "Государственная школа обычно бесплатна; private и international schools платные, а правила зависят от федеральной земли.", sourceIds: ["de-school-system"] }
        },
        sources: [
          { id: "de-child-reunification", label: "Make it in Germany — Children joining parents", url: "https://www.make-it-in-germany.com/en/visa-residence/family-reunification/children-join", kind: "official" },
          { id: "de-residence-act", label: "Federal Ministry of Justice — Residence Act §16f", url: "https://www.gesetze-im-internet.de/englisch_aufenthg/englisch_aufenthg.html", kind: "official" },
          { id: "de-school-system", label: "Make it in Germany — School system", url: "https://www.make-it-in-germany.com/en/living-in-germany/family-life/school-system", kind: "official" },
          { id: "de-child-care", label: "Make it in Germany — Child care", url: "https://www.make-it-in-germany.com/en/living-in-germany/family-life/child-care", kind: "official" }
        ]
      },
      PT: {
        checkedAt: "2026-07-20",
        confidence: "A",
        status: "verified",
        jurisdiction: "Portugal",
        dependent: {
          status: "route-dependent",
          routeIds: ["pt-d8"],
          summary: "Несовершеннолетний ребёнок может входить в family reunification законно проживающего sponsor; условия проверяются по статусу основного заявителя.",
          sourceIds: ["pt-family-reunification"]
        },
        student: {
          status: "restricted",
          stages: ["secondary"],
          summary: "Самостоятельное основание secondary student подтверждено для возраста 14–21 при зачислении и подтверждённом проживании.",
          sourceIds: ["pt-secondary-visa", "pt-law-article-92"]
        },
        guardian: {
          status: "not-derived",
          stages: [],
          summary: "Общее автоматическое право родителя сопровождать обычного secondary student не подтверждено; взрослому нужен собственный статус или отдельный pre-check.",
          sourceIds: ["pt-family-reunification"]
        },
        provision: {
          nursery: { status: "needs-check", summary: "Государственный guide отделяет поддержку детей младше 3 лет; формат, стоимость и наличие места нужно проверять по муниципалитету.", sourceIds: ["pt-education-guide"] },
          kindergarten: { status: "verified", summary: "Formal education доступно с 3 лет; язык, место и private/international вариант проверяются локально.", sourceIds: ["pt-education-guide"] },
          primary: { status: "verified", summary: "Доступ к образованию подтверждён на национальном уровне; школа, язык и международная программа остаются city-level выбором.", sourceIds: ["pt-education-guide"] },
          secondary: { status: "verified", summary: "Доступ к secondary education подтверждён; самостоятельный student route — отдельная модель для возраста 14–21.", sourceIds: ["pt-education-guide", "pt-secondary-visa"] }
        },
        sources: [
          { id: "pt-secondary-visa", label: "gov.pt — Residence visa for study", url: "https://www2.gov.pt/pt-PT/servicos/pedir-um-visto-de-residencia-para-estudo-intercambio-de-estudantes-estagio-profissional-ou-voluntariado", kind: "official" },
          { id: "pt-law-article-92", label: "Diário da República — Lei 23/2007, artigo 92", url: "https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2007-67564445-155706530", kind: "official" },
          { id: "pt-family-reunification", label: "gov.pt — Family reunification", url: "https://www2.gov.pt/pt/servicos/pedir-um-visto-de-residencia-para-reagrupamento-familiar", kind: "official" },
          { id: "pt-education-guide", label: "gov.pt — Education in Portugal for migrants", url: "https://www.gov.pt/guias/migrantes-ensino-em-portugal-para-criancas-jovens-e-adultos", kind: "official" }
        ]
      }
    },
    citySignals: {
      "TH|Бангкок": { sea: "near", mountains: "none", housing: "hot" },
      "TH|Чиангмай": { sea: "none", mountains: "direct", housing: "warm" },
      "MY|Куала-Лумпур": { sea: "near", mountains: "near", housing: "warm" },
      "MY|Пенанг": { sea: "direct", mountains: "direct", housing: "warm" },
      "ID|Бали": { sea: "direct", mountains: "direct", housing: "severe" },
      "ID|Джакарта": { sea: "direct", mountains: "none", housing: "hot" },
      "VN|Хошимин": { sea: "near", mountains: "none", housing: "hot" },
      "VN|Дананг": { sea: "direct", mountains: "direct", housing: "warm" },
      "GE|Тбилиси": { sea: "none", mountains: "near", housing: "hot" },
      "GE|Батуми": { sea: "direct", mountains: "direct", housing: "seasonal" },
      "AM|Ереван": { sea: "none", mountains: "near", housing: "warm" },
      "KZ|Алматы": { sea: "none", mountains: "direct", housing: "hot" },
      "KZ|Астана": { sea: "none", mountains: "none", housing: "balanced" },
      "KG|Бишкек": { sea: "none", mountains: "direct", housing: "warm" },
      "RS|Белград": { sea: "none", mountains: "none", housing: "hot" },
      "TR|Стамбул": { sea: "direct", mountains: "none", housing: "hot" },
      "TR|Анталья": { sea: "direct", mountains: "direct", housing: "seasonal" },
      "AE|Дубай": { sea: "direct", mountains: "none", housing: "severe" },
      "AE|Абу-Даби": { sea: "direct", mountains: "none", housing: "hot" },
      "MU|Grand Baie": { sea: "direct", mountains: "near", housing: "seasonal" },
      "CR|Сан-Хосе": { sea: "none", mountains: "direct", housing: "hot" },
      "HR|Загреб": { sea: "none", mountains: "near", housing: "warm" },
      "SI|Любляна": { sea: "near", mountains: "near", housing: "hot" },
      "TW|Тайбэй": { sea: "near", mountains: "direct", housing: "hot" },
      "UY|Монтевидео": { sea: "direct", mountains: "none", housing: "warm" },
      "AR|Буэнос-Айрес": { sea: "near", mountains: "none", housing: "volatile" },
      "AR|Мендоса": { sea: "none", mountains: "direct", housing: "balanced" },
      "EC|Кито": { sea: "none", mountains: "direct", housing: "balanced" },
      "LU|Люксембург": { sea: "none", mountains: "none", housing: "severe" },
      "AU|Мельбурн": { sea: "direct", mountains: "near", housing: "severe" },
      "US|Нью-Йорк": { sea: "direct", mountains: "none", housing: "severe" },
      "GB|Лондон": { sea: "none", mountains: "none", housing: "severe" },
      "US|Сан-Франциско": { sea: "direct", mountains: "near", housing: "severe" },
      "HK|Гонконг": { sea: "direct", mountains: "direct", housing: "severe" },
      "FR|Лион": { sea: "none", mountains: "near", housing: "hot" },
      "DE|Берлин": { sea: "none", mountains: "none", housing: "hot" },
      "FR|Париж": { sea: "none", mountains: "none", housing: "severe" },
      "BR|Флорианополис": { sea: "direct", mountains: "direct", housing: "seasonal" },
      "BR|Сан-Паулу": { sea: "near", mountains: "near", housing: "hot" },
      "BO|Санта-Крус": { sea: "none", mountains: "none", housing: "balanced" },
      "CV|Прая": { sea: "direct", mountains: "near", housing: "hot" },
      "PT|Лиссабон": { sea: "direct", mountains: "near", housing: "severe" },
      "ES|Валенсия": { sea: "direct", mountains: "near", housing: "hot" },
      "DM|Розо": { sea: "direct", mountains: "direct", housing: "limited" },
      "GD|Сент-Джорджес": { sea: "direct", mountains: "direct", housing: "limited" },
      "KN|Бастер": { sea: "direct", mountains: "direct", housing: "limited" },
      "NR|Ярен": { sea: "direct", mountains: "none", housing: "limited" }
    },
    workProfiles: {
      TH: {
        checkedAt: "2026-07-17",
        remote: { status: "route-dependent", note: "DTV Workcation — foreign remote/freelance evidence; visitor entry is not the same right." },
        localJob: { status: "permit-required", note: "Thai employer, Non-Immigrant B and work permit before starting work." },
        selfEmployed: { status: "permit-required", note: "Local clients/business require a separate work/business structure." },
        handsOn: { status: "high-risk", note: "DTV/visitor status does not authorise salon, manicure or other local-client services." },
        sources: ["https://image.mfa.go.th/mfa/0/91fPdh6NtO/VISA_Information/New_Visa_Measures_July_2024.pdf", "https://www.mfa.go.th/en/publicservice/non-immigrant-visa-b-for-business-and-work"]
      },
      MY: {
        checkedAt: "2026-07-17",
        remote: { status: "route-dependent", note: "DE Rantau is built for foreign employer or qualifying digital freelance contracts." },
        localJob: { status: "permit-required", note: "Local employment needs a separate Malaysian employment route." },
        selfEmployed: { status: "permit-required", note: "Local clients are not assumed under the foreign-remote pass." },
        handsOn: { status: "high-risk", note: "Hands-on local services are outside the DE Rantau model." },
        sources: ["https://mdec.my/static/pdf/derantau/DE%20Rantau%20Pass%20FAQ-Foreign.pdf", "https://www.mdec.my/static/pdf/derantau/251105%20Mandatory%20Documents%20for%20Remote%20Worker%20Final%20v1.pdf"]
      },
      ID: {
        checkedAt: "2026-07-17",
        remote: { status: "route-dependent", note: "E33G permits tasks for a company outside Indonesia." },
        localJob: { status: "permit-required", note: "A local sponsor/work authorisation route is required." },
        selfEmployed: { status: "not-authorized", note: "E33G prohibits selling goods/services outside the permitted foreign work." },
        handsOn: { status: "high-risk", note: "Bali has current deportation cases for beauty, hair and spa work on incompatible permits." },
        sources: ["https://www.imigrasi.go.id/wna/daftar-visa-indonesia/E33G", "https://ngurahrai.imigrasi.go.id/bule-rusia-buka-praktik-kecantikan-ilegal-diamankan-imigrasi-ngurah-rai/", "https://rudenimdenpasar.imigrasi.go.id/read/690"]
      },
      VN: {
        checkedAt: "2026-07-17",
        remote: { status: "needs-check", note: "Visitor/e-Visa is not a dedicated remote-work status." },
        localJob: { status: "permit-required", note: "Work permit regime targets managers, executives, experts and technical workers." },
        selfEmployed: { status: "permit-required", note: "Business/service activity needs a separate lawful structure." },
        handsOn: { status: "high-risk", note: "Ordinary manicure/service work is not a realistic visitor-to-work route in the current screen." },
        sources: ["https://vbpl.moj.gov.vn/bonoivu/Pages/vbpq-toanvan.aspx?ItemID=180273&Keyword=&dvid=320", "https://vietnam.gov.vn/work-permits-68947"]
      },
      GE: {
        checkedAt: "2026-07-17",
        remote: { status: "permit-required", note: "Since 1 March 2026 paid remote work from Georgia requires right to work for non-PR foreigners." },
        localJob: { status: "permit-required", note: "Local employer and worker must complete the new right-to-work/residence procedure." },
        selfEmployed: { status: "permit-required", note: "The 2026 rule expressly covers independent contracting, trade and services." },
        handsOn: { status: "permit-required", note: "Client services require right to work plus business/professional compliance." },
        sources: ["https://www.matsne.gov.ge/en/document/view/2806732?publication=6", "https://norway.mfa.gov.ge/en/news/929284-new-rules-for-the-employed-self-employed-aliens-with-no-permit-for-permanent-residence-in-georgia-sh"]
      },
      AM: {
        checkedAt: "2026-07-17",
        remote: { status: "route-dependent", note: "Foreign remote income still needs tax/residence analysis." },
        localJob: { status: "legal", note: "Russian citizens may work under EAEU rules without a separate work permit; formal contract remains required." },
        selfEmployed: { status: "route-dependent", note: "Registration, tax and activity-specific rules apply." },
        handsOn: { status: "route-dependent", note: "Potentially legal after formal registration/employment and any sanitary licensing." },
        sources: ["https://eec.eaeunion.org/en/news/01-01-2015-1/"]
      },
      KZ: {
        checkedAt: "2026-07-17",
        remote: { status: "route-dependent", note: "Contract, temporary residence and tax treatment must match actual activity." },
        localJob: { status: "legal", note: "EAEU citizens have free access to employment without a work permit; formal contract/residence steps remain." },
        selfEmployed: { status: "permit-required", note: "Government guidance says foreigner registration as individual entrepreneur generally requires permanent residence." },
        handsOn: { status: "route-dependent", note: "Employment can be legal under EAEU; own salon/service structure has separate gates." },
        sources: ["https://www.gov.kz/memleket/entities/enbek/press/news/details/1203836?lang=ru", "https://www.gov.kz/services/4631?lang=en", "https://www.gov.kz/memleket/entities/kgd-kostanay/press/news/details/1233972?lang=ru"]
      },
      KG: {
        checkedAt: "2026-07-17",
        remote: { status: "route-dependent", note: "Residence/registration and tax analysis remain separate." },
        localJob: { status: "legal", note: "EAEU labour-market access removes the separate work-permit gate; use a formal contract." },
        selfEmployed: { status: "route-dependent", note: "Business and tax registration must be checked for the activity." },
        handsOn: { status: "route-dependent", note: "Potentially legal through formal employment/business, subject to local requirements." },
        sources: ["https://eec.eaeunion.org/en/news/01-01-2015-1/"]
      },
      RS: {
        checkedAt: "2026-07-17",
        remote: { status: "needs-check", note: "Visa-free entry does not itself resolve paid-work and tax status." },
        localJob: { status: "permit-required", note: "Use Visa D / single permit for residence and work." },
        selfEmployed: { status: "permit-required", note: "Company/self-employment route and single permit must be structured." },
        handsOn: { status: "permit-required", note: "Local client services require the matching work/residence basis." },
        sources: ["https://welcometoserbia.gov.rs/help"]
      },
      TR: {
        checkedAt: "2026-07-17",
        remote: { status: "needs-check", note: "Tourist/rental residence is not a dedicated remote-work permission." },
        localJob: { status: "permit-required", note: "A Turkish work permit is tied to the authorised job/workplace." },
        selfEmployed: { status: "permit-required", note: "Own workplace requires work permit before activity starts." },
        handsOn: { status: "high-risk", note: "Tourist or rental residence does not authorise manicure/salon work." },
        sources: ["https://csgb.gov.tr/uigm/en/general-information/yabancilara-duzenlenen-belgeler/", "https://csgb.gov.tr/uigm/en/general-information/conditions-and-process-for-foreigners-to-open-a-company-workplace-in-turkiye/"]
      },
      AE: {
        checkedAt: "2026-07-17",
        remote: { status: "route-dependent", note: "Virtual work residence is for a company outside UAE." },
        localJob: { status: "permit-required", note: "Formal offer, work permit and employment/residence procedure are required." },
        selfEmployed: { status: "permit-required", note: "Use a freelance work permit or licensed business route." },
        handsOn: { status: "permit-required", note: "Beauty/service work needs the matching employer/freelance permit and professional/municipal compliance." },
        sources: ["https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/residence-visa-for-working-outside-the-uae", "https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/job-offers-and-work-permits-and-contracts/work-permits"]
      }
    },
    visaTypes: [
      {
        id: "visitor", family: "remote", label: "Безвиз / visitor", index: "01", status: "active", mark: "ENTRY",
        description: "Короткий законный въезд без самостоятельного ВНЖ и без обещания иммиграционного clock.",
        fit: "Разведка страны, сезонная база, пауза между долгими статусами.",
        evidence: "Паспорт, срок пребывания, регистрация и правила въезда.",
        employer: "Не нужен; работа обычно не разрешена.", outcome: "Только временное пребывание.",
        risk: "Visa-run и remote work нельзя автоматически считать законной долгосрочной стратегией."
      },
      {
        id: "nomad", family: "remote", label: "Digital nomad", index: "02", status: "active", mark: "REMOTE",
        description: "Виза или ВНЖ для удалённой работы на клиентов и работодателей за пределами страны.",
        fit: "Подтверждаемый foreign income, независимость от местного рынка труда.",
        evidence: "Доход, контракт/клиенты, страховка, жильё и накопления.",
        employer: "Местный работодатель обычно исключён.", outcome: "От временной базы до ВНЖ; citizenship clock зависит от страны.",
        risk: "Название nomad не гарантирует ПМЖ, local work right или зачёт проживания."
      },
      {
        id: "independent", family: "remote", label: "Доход / самостоятельность", index: "03", status: "active", mark: "MEANS",
        description: "Резиденция на независимом доходе, ренте, предпринимательстве или собственной экономической активности.",
        fit: "Стабильный документируемый доход и готовность стать реальным резидентом.",
        evidence: "Источник дохода, банковская история, жильё, налоги и habitual life.",
        employer: "Обычный job offer не обязателен.", outcome: "Часто полноценная резиденция и потенциальный citizenship anchor.",
        risk: "Налоговая резиденция и physical presence важнее ярлыка программы."
      },
      {
        id: "talent", family: "talent", label: "Talent / exceptional ability", index: "04", status: "active", mark: "MERIT",
        description: "Конкурсный вход за признание, вклад, инновации или выдающиеся профессиональные достижения.",
        fit: "Личная доказуемая роль, независимое признание и устойчивый impact в узком поле.",
        evidence: "Награды, публикации, judging, critical role, original contribution, media и рекомендации.",
        employer: "Зависит от программы: от self-petition до nomination или petitioner/agent.", outcome: "От временной визы до немедленного PR; всегда смотреть конкретный route.",
        risk: "Высокая дискреция: сильное резюме не заменяет критерии и первичные доказательства."
      },
      {
        id: "education", family: "education", label: "Учёба", index: "05", status: "active", mark: "STUDY",
        description: "Очная программа, после которой возможна смена статуса на работу, business или иной qualifying residence.",
        fit: "Готовность учиться, платить tuition и строить язык/интеграцию.",
        evidence: "Admission, средства, академические документы, учебный план и страховка.",
        employer: "Не нужен для входа; может понадобиться после выпуска.", outcome: "Зависит от зачёта student years и post-study switch.",
        risk: "Студенческий срок может считаться частично или не вести к гражданству сам по себе."
      },
      {
        id: "family", family: "family", label: "Семья / рождение", index: "06", status: "active", mark: "FAMILY",
        description: "Статус через супруга, родителя, ребёнка или реальный семейный факт.",
        fit: "Только существующее семейное основание или независимый план семьи.",
        evidence: "Акты гражданского состояния, совместная жизнь и статус sponsor.",
        employer: "Обычно не является условием входа.", outcome: "От dependant residence до сокращённой натурализации.",
        risk: "Гражданство ребёнка и статус родителей — разные юридические последствия."
      },
      {
        id: "investment", family: "investment", label: "Инвестиции / CBI", index: "07", status: "active", mark: "CAPITAL",
        description: "Residence by investment, golden visa или прямое citizenship by investment.",
        fit: "Капитал сверх бюджета основного переезда и проверяемый source of funds.",
        evidence: "Происхождение средств, due diligence, лицензированный канал и семейные документы.",
        employer: "Не нужен.", outcome: "От временной резиденции до прямого гражданства.",
        risk: "Headline minimum не равен all-in стоимости, а паспортная программа не равна хорошей стране жизни."
      },
      {
        id: "work", family: "remote", label: "Работа / self-employed", index: "08", status: "queue", mark: "LOCAL",
        description: "Локальный контракт, shortage occupation, собственный бизнес или разрешённая самостоятельная деятельность.",
        fit: "Нужна местная карьера либо готовность строить регулируемый business.",
        evidence: "Контракт, квалификация, лицензия, salary threshold или бизнес-план.",
        employer: "Часто обязателен; self-employed routes проверяются отдельно.", outcome: "Обычно ВНЖ с потенциальным переходом к ПМЖ.",
        risk: "Phase 2: категория заложена в схему, но пока не имеет отдельного RU-screening набора."
      }
    ],
    contextSources: [
      { label: "UNDP Human Development Report 2025", url: "https://hdr.undp.org/content/human-development-report-2025", kind: "index" },
      { label: "World Happiness Report 2026", url: "https://files.worldhappiness.report/WHR26.pdf", kind: "index" },
      { label: "Global Peace Index 2026", url: "https://www.economicsandpeace.org/report/global-peace-index-2026/", kind: "index" },
      { label: "World Bank ICP / price levels", url: "https://www.worldbank.org/en/programs/icp/data", kind: "open-data" },
      { label: "World Bank / UN International migrant stock 2024", url: "https://data.worldbank.org/indicator/SM.POP.TOTL.ZS", kind: "open-data" },
      { label: "Henley Passport Index — current ranking", url: "https://www.henleyglobal.com/passport-index/ranking", kind: "index" },
      { label: "WHO UHC Service Coverage", url: "https://www.who.int/data/gho/data/themes/topics/indicator-groups/indicator-group-details/GHO/universal-health-coverage-index", kind: "open-data" },
      { label: "Numbeo city cost signal", url: "https://www.numbeo.com/cost-of-living/", kind: "secondary" }
    ],
    entries: [
      {
        id: "th-dtv", country: "Таиланд", code: "TH", flag: "🇹🇭", region: "Азия", outcome: "temporary", visaType: "nomad",
        route: "Destination Thailand Visa", entry: "DTV / workcation", stay: "180 дней за въезд · visa 5 лет", renewable: "1× до 180 дней",
        summary: "Длинная и гибкая remote-база в Азии без доказанного PR/citizenship clock.",
        incomeMin: 0, fundsMin: 14000, investmentMin: 0, applyCost: 300, citizenshipYears: null,
        spouse: "Супруг и дети <20", remoteWork: "yes", localWork: "no", dual: "n/a",
        availability: { RU: { status: "eligible", note: "Nationality-neutral DTV; embassy-specific filing rules." } },
        metrics: { life: 3, peace: 3, infra: 4, nature: 5, cost: 2, hazard: 4, policy: 2, passport: 3 },
        cities: [
          { name: "Бангкок", budget: [2100, 3100], rent: [700, 1300], climate: "жарко / влажно", internet: "быстрый", infra: 5, nature: 2, note: "Международный хаб, медицина и транспорт; воздух и жара сезонно." },
          { name: "Чиангмай", budget: [1400, 2200], rent: [400, 800], climate: "тропический север", internet: "быстрый", infra: 3, nature: 5, note: "Дешевле и ближе к природе; smoke season — hard lifestyle factor." }
        ],
        checkedAt: "2026-07-15", confidence: "A", status: "verified",
        unknowns: ["Требования конкретного консульства и текущей страны подачи"],
        sources: [
          { label: "Thailand e-Visa — DTV", url: "https://www.thaievisa.go.th/visa/dtv-visa", kind: "official" },
          { label: "MFA — DTV 180 days", url: "https://image.mfa.go.th/mfa/0/91fPdh6NtO/VISA_Information/New_Visa_Measures_July_2024.pdf", kind: "official" }
        ]
      },
      {
        id: "my-derantau", country: "Малайзия", code: "MY", flag: "🇲🇾", region: "Азия", outcome: "temporary", visaType: "nomad",
        route: "DE Rantau Nomad Pass", entry: "Professional Visit Pass", stay: "3–12 месяцев", renewable: "+12 месяцев · всего до 24",
        summary: "Сильная инфраструктурная база для remote-пары; граждане РФ уже входят в заметную группу держателей.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 300, citizenshipYears: null,
        spouse: "Супруг dependant, без work right", remoteWork: "yes", localWork: "no", dual: "n/a",
        availability: { RU: { status: "eligible", note: "FAQ: all nationalities; Russian nationals are among approved cohorts." } },
        metrics: { life: 4, peace: 4, infra: 5, nature: 4, cost: 2, hazard: 3, policy: 2, passport: 3 },
        cities: [
          { name: "Куала-Лумпур", budget: [1800, 2700], rent: [600, 1100], climate: "экваториальный", internet: "быстрый", infra: 5, nature: 3, note: "Транспорт, медицина, аэропорт и английский; влажность круглый год." },
          { name: "Пенанг", budget: [1500, 2300], rent: [450, 850], climate: "море / влажно", internet: "быстрый", infra: 4, nature: 4, note: "Компактнее и спокойнее; меньше рынок local jobs." }
        ],
        checkedAt: "2026-07-15", confidence: "B", status: "partial",
        unknowns: ["Текущий income threshold для конкретной профессии", "Налоговый режим после 60/182 дней"],
        sources: [
          { label: "MDEC — DE Rantau FAQ", url: "https://mdec.my/static/pdf/derantau/DE%20Rantau%20Pass%20FAQ-Foreign.pdf", kind: "official" },
          { label: "MDEC — programme expansion", url: "https://www.mdec.my/press-releases/mdec-expands-de-rantau-programme-new-opportunities-for-global-digital-nomads-and-exciting-partnerships", kind: "official" }
        ]
      },
      {
        id: "id-e33g", country: "Индонезия", code: "ID", flag: "🇮🇩", region: "Азия", outcome: "residence", visaType: "nomad",
        route: "E33G Remote Worker", entry: "Limited-stay visa", stay: "1 год", renewable: "да · online",
        summary: "Настоящий remote residence permit без sponsor; высокий документированный доход.",
        incomeMin: 5000, fundsMin: 2000, investmentMin: 0, applyCost: 430, citizenshipYears: null,
        spouse: "Needs verification", remoteWork: "yes", localWork: "no", dual: "n/a",
        availability: { RU: { status: "eligible", note: "Nationality-neutral official route; employer must be outside Indonesia." } },
        metrics: { life: 3, peace: 3, infra: 3, nature: 5, cost: 2, hazard: 5, policy: 3, passport: 2 },
        cities: [
          { name: "Бали", budget: [1700, 2800], rent: [650, 1400], climate: "тропический остров", internet: "средний/быстрый", infra: 3, nature: 5, note: "Большое nomad-сообщество; трафик, flood/volcano/earthquake exposure." },
          { name: "Джакарта", budget: [1800, 2800], rent: [600, 1200], climate: "жарко / влажно", internet: "быстрый", infra: 4, nature: 1, note: "Деловой центр; трафик, загрязнение и flood risk." }
        ],
        checkedAt: "2026-07-15", confidence: "A", status: "verified",
        unknowns: ["Dependent procedure", "Tax and employer-document compatibility"],
        sources: [{ label: "Indonesia Immigration — E33G", url: "https://www.imigrasi.go.id/wna/daftar-visa-indonesia/E33G", kind: "official" }]
      },
      {
        id: "vn-entry", country: "Вьетнам", code: "VN", flag: "🇻🇳", region: "Азия", outcome: "temporary", visaType: "visitor",
        route: "Visa-free / e-Visa", entry: "45 дней без визы или e-Visa", stay: "до 90 дней по e-Visa", renewable: "новая виза / другое основание",
        summary: "Очень удобная тестовая база, но без отдельного digital-nomad residence и local work rights.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 50, citizenshipYears: null,
        spouse: "Отдельный въезд", remoteWork: "uncertain", localWork: "no", dual: "n/a",
        availability: { RU: { status: "eligible", note: "45-day exemption through 2028-03-14; e-visa up to 90 days." } },
        metrics: { life: 3, peace: 4, infra: 3, nature: 5, cost: 1, hazard: 4, policy: 3, passport: 2 },
        cities: [
          { name: "Хошимин", budget: [1500, 2300], rent: [500, 1000], climate: "жарко / влажно", internet: "быстрый", infra: 4, nature: 2, note: "Энергичный мегаполис и аэропорт; шум, трафик, flood/heat." },
          { name: "Дананг", budget: [1200, 1900], rent: [350, 750], climate: "море / тайфуны", internet: "быстрый", infra: 3, nature: 5, note: "Пляжи и компактность; сезонные штормы и меньше international connectivity." }
        ],
        checkedAt: "2026-07-15", confidence: "A", status: "verified",
        unknowns: ["Remote work is not a dedicated permitted status", "Long-stay route requires another purpose"],
        sources: [
          { label: "Vietnam Embassy Moscow — exemption", url: "https://vnembassy-moscow.mofa.gov.vn/web/guest/tin-chi-tiet/chi-tiet/viet-nam-39-s-visa-exemption-list-57163-172.html", kind: "official" },
          { label: "Vietnam Immigration — e-Visa", url: "https://evisa.immigration.gov.vn/trang-chu-ttdt", kind: "official" }
        ]
      },
      {
        id: "ge-entry", country: "Грузия", code: "GE", flag: "🇬🇪", region: "Кавказ", outcome: "temporary", visaType: "visitor",
        route: "Безвизовый год", entry: "Ordinance No. 255", stay: "1 полный год", renewable: "повторный въезд ≠ residence strategy",
        summary: "Минимальный entry friction для граждан РФ; отдельный ВНЖ нужен для устойчивого статуса.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 0, citizenshipYears: null,
        spouse: "Отдельный въезд", remoteWork: "uncertain", localWork: "switch", dual: "n/a",
        availability: { RU: { status: "eligible", note: "Russia remains in official one-year visa-free list." } },
        metrics: { life: 3, peace: 3, infra: 3, nature: 5, cost: 2, hazard: 4, policy: 4, passport: 2 },
        cities: [
          { name: "Тбилиси", budget: [1600, 2500], rent: [600, 1100], climate: "четыре сезона", internet: "быстрый", infra: 3, nature: 4, note: "Русскоязычная среда и сервисы; рынок аренды волатилен, seismic/political exposure." },
          { name: "Батуми", budget: [1400, 2300], rent: [500, 1000], climate: "море / влажно", internet: "быстрый", infra: 3, nature: 5, note: "Море и мягкая зима; сезонность, влажность и coastal hazards." }
        ],
        checkedAt: "2026-07-15", confidence: "A", status: "verified",
        unknowns: ["Current residence thresholds for business/work", "Banking access by individual profile"],
        sources: [{ label: "Government of Georgia — visa-free list", url: "https://www.matsne.gov.ge/en/document/view/2867361", kind: "official" }]
      },
      {
        id: "am-entry", country: "Армения", code: "AM", flag: "🇦🇲", region: "Кавказ", outcome: "temporary", visaType: "visitor",
        route: "Безвизовый въезд", entry: "bilateral visa-free regime", stay: "до 180 дней в год · recheck treaty", renewable: "ВНЖ на другом основании",
        summary: "Низкий entry friction и знакомая среда; military/security layer нельзя скрывать внутри score.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 0, citizenshipYears: null,
        spouse: "Отдельный въезд", remoteWork: "uncertain", localWork: "switch", dual: "yes",
        availability: { RU: { status: "eligible", note: "Russia is listed for all passport types." } },
        metrics: { life: 3, peace: 2, infra: 3, nature: 4, cost: 2, hazard: 4, policy: 3, passport: 2 },
        cities: [{ name: "Ереван", budget: [1500, 2400], rent: [550, 1000], climate: "сухой континентальный", internet: "быстрый", infra: 3, nature: 3, note: "Русский язык и tech-среда; seismic and regional security risk." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial",
        unknowns: ["Exact bilateral stay cap", "Military implications for spouse", "Residence and citizenship practice"],
        sources: [
          { label: "Armenia MFA — visa-free agreements", url: "https://www.mfa.am/en/whoneedvisa", kind: "official" },
          { label: "Armenia MFA — visa rules", url: "https://www.mfa.am/en/visa/", kind: "official" }
        ]
      },
      {
        id: "kz-entry", country: "Казахстан", code: "KZ", flag: "🇰🇿", region: "Центральная Азия", outcome: "temporary", visaType: "visitor",
        route: "Безвизовый въезд", entry: "обычный паспорт РФ", stay: "90 дней / 180", renewable: "нужен stay document",
        summary: "Понятная региональная база с крупными городами; принимающая сторона уведомляет миграционную службу.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 0, citizenshipYears: null,
        spouse: "Отдельный въезд", remoteWork: "uncertain", localWork: "switch", dual: "n/a",
        availability: { RU: { status: "eligible", note: "90 days within 180 days for ordinary passport." } },
        metrics: { life: 3, peace: 3, infra: 4, nature: 4, cost: 2, hazard: 3, policy: 3, passport: 2 },
        cities: [
          { name: "Алматы", budget: [1700, 2600], rent: [650, 1200], climate: "континентальный", internet: "быстрый", infra: 4, nature: 5, note: "Горы и крупный рынок; earthquake/air-quality risk." },
          { name: "Астана", budget: [1600, 2500], rent: [550, 1100], climate: "очень холодная зима", internet: "быстрый", infra: 4, nature: 2, note: "Новая инфраструктура; экстремальный холод и ветры." }
        ],
        checkedAt: "2026-07-15", confidence: "A", status: "verified",
        unknowns: ["RVP basis and remote-income tax treatment"],
        sources: [{ label: "eGov Kazakhstan — visa regime", url: "https://egov.kz/cms/en/articles/for_foreigners/visa_regime_for_foreigners?mobile=no", kind: "official" }]
      },
      {
        id: "kg-entry", country: "Кыргызстан", code: "KG", flag: "🇰🇬", region: "Центральная Азия", outcome: "temporary", visaType: "visitor",
        route: "Безвизовый въезд ЕАЭС", entry: "обычный паспорт РФ", stay: "90 дней / 180", renewable: "ВНЖ/работа на другом основании",
        summary: "Одна из самых бюджетных региональных баз; регистрация нужна после первых 30 дней.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 0, citizenshipYears: null,
        spouse: "Отдельный въезд", remoteWork: "uncertain", localWork: "switch", dual: "n/a",
        availability: { RU: { status: "eligible", note: "EAEU citizens: 90/180 without stay document." } },
        metrics: { life: 2, peace: 3, infra: 2, nature: 5, cost: 1, hazard: 4, policy: 3, passport: 1 },
        cities: [{ name: "Бишкек", budget: [1100, 1800], rent: [350, 700], climate: "континентальный", internet: "средний/быстрый", infra: 2, nature: 5, note: "Очень близко горы; winter air quality, healthcare depth and seismic risk." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified",
        unknowns: ["Residence path and medical contingency budget"],
        sources: [
          { label: "Cabinet — stay regulation", url: "https://www.gov.kg/ru/npa/s/4495", kind: "official" },
          { label: "Digital Ministry — registration", url: "https://digital.gov.kg/press/novyj-poryadok-registraczii/", kind: "official" }
        ]
      },
      {
        id: "rs-entry", country: "Сербия", code: "RS", flag: "🇷🇸", region: "Европа", outcome: "temporary", visaType: "visitor",
        route: "Безвизовый въезд", entry: "ordinary passport", stay: "до 30 дней", renewable: "для переезда нужен ВНЖ",
        summary: "Короткий безвизовый тест европейской базы; visa-run не считается стратегией.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 0, citizenshipYears: null,
        spouse: "Отдельный въезд", remoteWork: "uncertain", localWork: "switch", dual: "yes",
        availability: { RU: { status: "eligible", note: "30 days visa-free for ordinary passport." } },
        metrics: { life: 3, peace: 3, infra: 3, nature: 3, cost: 3, hazard: 2, policy: 3, passport: 3 },
        cities: [{ name: "Белград", budget: [1900, 2900], rent: [750, 1400], climate: "четыре сезона", internet: "быстрый", infra: 4, nature: 2, note: "Региональный хаб и русскоязычная миграция; аренда и air quality." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified",
        unknowns: ["Current temporary residence basis and Russian banking compatibility"],
        sources: [{ label: "Serbia MFA — Russia visa regime", url: "https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-regime/ruska-federacija", kind: "official" }]
      },
      {
        id: "tr-entry", country: "Турция", code: "TR", flag: "🇹🇷", region: "Европа / Азия", outcome: "temporary", visaType: "visitor",
        route: "Безвизовый въезд", entry: "tourism/business", stay: "до 60 дней", renewable: "residence approval отдельно",
        summary: "Простой вход и огромный выбор городов, но туристический ВНЖ нельзя считать гарантированным.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 0, citizenshipYears: null,
        spouse: "Отдельный въезд", remoteWork: "uncertain", localWork: "switch", dual: "yes",
        availability: { RU: { status: "eligible", note: "60 days visa-free for ordinary passport." } },
        metrics: { life: 3, peace: 2, infra: 4, nature: 5, cost: 2, hazard: 5, policy: 4, passport: 2 },
        cities: [
          { name: "Стамбул", budget: [2100, 3300], rent: [850, 1600], climate: "море / четыре сезона", internet: "быстрый", infra: 5, nature: 2, note: "Глобальная связность; earthquake, inflation and crowding." },
          { name: "Анталья", budget: [1700, 2700], rent: [650, 1200], climate: "средиземноморский", internet: "быстрый", infra: 3, nature: 5, note: "Море и мягкая зима; жара, wildfire and seasonal rents." }
        ],
        checkedAt: "2026-07-15", confidence: "A", status: "verified",
        unknowns: ["Residence approval by city/profile", "Inflation-adjusted budget"],
        sources: [{ label: "Türkiye MFA — visa information", url: "https://www.mfa.gov.tr/consular-info.ru.mfa", kind: "official" }]
      },
      {
        id: "ae-virtual", country: "ОАЭ", code: "AE", flag: "🇦🇪", region: "Ближний Восток", outcome: "residence", visaType: "nomad",
        route: "Virtual Work Residence", entry: "self-sponsored residence", stay: "1 год", renewable: "по актуальным условиям",
        summary: "Легальный remote residence и сильная инфраструктура; обычного citizenship outcome нет.",
        incomeMin: 3500, fundsMin: 0, investmentMin: 0, applyCost: 700, citizenshipYears: null,
        spouse: "Family sponsorship отдельно", remoteWork: "yes", localWork: "switch", dual: "n/a",
        availability: { RU: { status: "needs-check", note: "Route is nationality-neutral; payments/compliance require pre-check." } },
        metrics: { life: 4, peace: 4, infra: 5, nature: 2, cost: 5, hazard: 3, policy: 3, passport: 5 },
        cities: [
          { name: "Дубай", budget: [3800, 6000], rent: [1600, 3000], climate: "пустыня / экстремальная жара", internet: "быстрый", infra: 5, nature: 2, note: "Аэропорт, сервисы и безопасность; высокая стоимость и car dependence." },
          { name: "Абу-Даби", budget: [3600, 5600], rent: [1500, 2700], climate: "пустыня / жара", internet: "быстрый", infra: 5, nature: 2, note: "Спокойнее и зеленее центра Дубая; тот же heat exposure." }
        ],
        checkedAt: "2026-07-15", confidence: "A", status: "verified",
        unknowns: ["Russian payment and banking onboarding", "Family all-in cost"],
        sources: [{ label: "UAE Government — virtual work visa", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/residence-visa-for-working-outside-the-uae", kind: "official" }]
      },
      {
        id: "mu-premium", country: "Маврикий", code: "MU", flag: "🇲🇺", region: "Африка", outcome: "temporary", visaType: "nomad",
        route: "Premium Visa", entry: "remote / long stay", stay: "1 год", renewable: "да",
        summary: "Мирная тёплая island-база; long-stay visa не обещает ПМЖ или паспорт.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 0, citizenshipYears: null,
        spouse: "Семья включается", remoteWork: "yes", localWork: "no", dual: "uncertain",
        availability: { RU: { status: "eligible", note: "Programme itself is nationality-neutral; travel/payment pre-check." } },
        metrics: { life: 3, peace: 5, infra: 3, nature: 5, cost: 3, hazard: 4, policy: 2, passport: 3 },
        cities: [{ name: "Grand Baie", budget: [2200, 3400], rent: [850, 1500], climate: "тропический остров", internet: "средний/быстрый", infra: 3, nature: 5, note: "Море и expat services; cyclone/coastal risk and island logistics." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Tax residency and renewal evidence"],
        sources: [{ label: "Passport and Immigration Office", url: "https://passport.govmu.org/passport/%3Fpage_id%3D595", kind: "official" }]
      },
      {
        id: "cr-nomad", country: "Коста-Рика", code: "CR", flag: "🇨🇷", region: "Центральная Америка", outcome: "temporary", visaType: "nomad",
        route: "Remote Worker Estancia", entry: "digital nomad estancia", stay: "1 год", renewable: "+1 год",
        summary: "Стабильная природная база для семьи, но estancia сама не является citizenship clock.",
        incomeMin: 5000, fundsMin: 0, investmentMin: 0, applyCost: 500, citizenshipYears: null,
        spouse: "Family threshold included", remoteWork: "yes", localWork: "no", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Programme eligibility and consular filing must be rechecked for RU." } },
        metrics: { life: 4, peace: 4, infra: 3, nature: 5, cost: 3, hazard: 5, policy: 2, passport: 4 },
        cities: [{ name: "Сан-Хосе", budget: [2500, 3800], rent: [900, 1600], climate: "высокогорный тропический", internet: "быстрый", infra: 3, nature: 5, note: "Медицина и аэропорт; earthquakes, volcanoes, traffic and higher regional cost." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["RU application practice", "Private insurance and car budget"],
        sources: [{ label: "Visit Costa Rica — digital nomads", url: "https://www.visitcostarica.com/digital-nomads", kind: "official" }]
      },
      {
        id: "hr-nomad", country: "Хорватия", code: "HR", flag: "🇭🇷", region: "Европа", outcome: "temporary", visaType: "nomad",
        route: "Digital Nomad Residence", entry: "temporary stay", stay: "до 18 месяцев", renewable: "после обязательного разрыва",
        summary: "Качественная EU-база, но permit специально не строит непрерывный citizenship clock.",
        incomeMin: 3800, fundsMin: 0, investmentMin: 0, applyCost: 300, citizenshipYears: null,
        spouse: "Close family", remoteWork: "yes", localWork: "no", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Eligibility is broad; consular/payment practical access needs recheck." } },
        metrics: { life: 4, peace: 4, infra: 4, nature: 5, cost: 3, hazard: 3, policy: 2, passport: 5 },
        cities: [{ name: "Загреб", budget: [2300, 3400], rent: [850, 1450], climate: "четыре сезона", internet: "быстрый", infra: 4, nature: 3, note: "Столица и медицина; seismic exposure and EU-level costs." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Exact family income threshold"],
        sources: [{ label: "Croatia MUP — digital nomads", url: "https://mup.gov.hr/aliens-281621/digital-nomads/286833", kind: "official" }]
      },
      {
        id: "si-nomad", country: "Словения", code: "SI", flag: "🇸🇮", region: "Европа", outcome: "temporary", visaType: "nomad",
        route: "Digital Nomad Residence", entry: "temporary residence", stay: "до 1 года", renewable: "нет · возможна смена основания",
        summary: "Одна из лучших сред в атласе; специальный permit короткий, а обычная натурализация длинная.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 350, citizenshipYears: 10,
        spouse: "Immediate family", remoteWork: "yes", localWork: "no", dual: "no",
        availability: { RU: { status: "needs-check", note: "Nationality-neutral rules; practical filing and renunciation impact." } },
        metrics: { life: 5, peace: 5, infra: 5, nature: 5, cost: 3, hazard: 3, policy: 2, passport: 5 },
        cities: [{ name: "Любляна", budget: [2500, 3700], rent: [1000, 1700], climate: "четыре сезона", internet: "быстрый", infra: 5, nature: 5, note: "Компактность, природа, безопасность; дорогая аренда и небольшой рынок." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Exact income formula", "Citizenship renunciation exceptions"],
        sources: [
          { label: "Slovenia — digital nomad residence", url: "https://www.gov.si/en/news/2025-11-21-temporary-residence-permit-for-digital-nomads/", kind: "official" },
          { label: "Slovenia — citizenship", url: "https://www.gov.si/en/topics/citizenship/", kind: "official" }
        ]
      },
      {
        id: "tw-gold", country: "Тайвань", code: "TW", flag: "🇹🇼", region: "Азия", outcome: "residence", visaType: "talent",
        route: "Employment Gold Card", entry: "talent / open work permit", stay: "1–3 года", renewable: "да · APRC possible",
        summary: "Сильная tech-база и путь к APRC после трёх лет; обычное второе гражданство проблемно.",
        talentProfile: {
          gate: "Квалификация по одному из официальных professional fields; salary route существует не во всех полях.",
          model: "field criteria",
          employer: "Не нужен: Gold Card объединяет open work permit, residence permit и visa.",
          evidence: ["Документы выбранного professional field", "Доход или достижения — по конкретному subfield", "Актуальная профессиональная деятельность"],
          routeRole: "Talent residence → APRC; паспорт только как отдельная исключительная гипотеза."
        },
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 350, citizenshipYears: null,
        spouse: "Resident visa + open work permit", remoteWork: "yes", localWork: "yes", dual: "no",
        availability: { RU: { status: "eligible", note: "Field qualification is decisive; security/document recheck." } },
        metrics: { life: 5, peace: 3, infra: 5, nature: 5, cost: 3, hazard: 5, policy: 3, passport: 4 },
        cities: [{ name: "Тайбэй", budget: [2300, 3500], rent: [900, 1600], climate: "субтропический", internet: "очень быстрый", infra: 5, nature: 4, note: "Tech, медицина и транспорт; earthquake/typhoon and cross-strait tail risk." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Talent field fit", "Renunciation and high-level professional exception"],
        sources: [
          { label: "Gold Card qualification", url: "https://goldcard.nat.gov.tw/en/apply/step-2/profession/", kind: "official" },
          { label: "Gold Card → APRC", url: "https://goldcard.nat.gov.tw/en/faq/i-am-already-a-gold-card-holder-what-other-qualifications-must-i-meet-in-order-to-apply/", kind: "official" }
        ]
      },
      {
        id: "uy-residence", country: "Уругвай", code: "UY", flag: "🇺🇾", region: "Южная Америка", outcome: "citizenship", visaType: "independent",
        route: "Прямая legal residence", entry: "foreign income / habitual life", stay: "постоянная residence", renewable: "поддерживать habitual residence",
        summary: "Главный balance anchor: доступный вход, семья и три года до права подать.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 600, citizenshipYears: 3,
        spouse: "Residence вместе; каждый доказывает life", remoteWork: "yes", localWork: "yes", dual: "yes",
        availability: { RU: { status: "eligible", note: "Formal route has no nationality exclusion found; apostille/payment pre-check." } },
        metrics: { life: 4, peace: 4, infra: 4, nature: 4, cost: 3, hazard: 1, policy: 2, passport: 4 },
        cities: [{ name: "Монтевидео", budget: [2400, 3600], rent: [900, 1500], climate: "умеренный океанический", internet: "быстрый", infra: 4, nature: 4, note: "Стабильная среда и низкая сейсмика; высокая региональная стоимость." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Exact habitual-life evidence", "Tax and spouse clock for selected structure"],
        sources: [
          { label: "Uruguay — permanent legal residence", url: "https://www.gub.uy/tramites/residencia-legal-permanente", kind: "official" },
          { label: "Uruguay — carta de ciudadanía", url: "https://www.gub.uy/tramites/carta-ciudadania-ciudadania-legal-uruguaya", kind: "official" }
        ]
      },
      {
        id: "ar-rentista", country: "Аргентина", code: "AR", flag: "🇦🇷", region: "Южная Америка", outcome: "citizenship", visaType: "independent",
        route: "Rentista / самостоятельный доход", entry: "temporary residence", stay: "продлеваемая residence", renewable: "да",
        summary: "Самый быстрый обычный citizenship clock, но два года без выездов — реальный hard blocker.",
        presenceDemand: { kind: "continuous-no-exit", durationYears: 2, note: "Два года непрерывного проживания без выездов." },
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 500, citizenshipYears: 2,
        spouse: "Family temporary residence; separate filing", remoteWork: "yes", localWork: "yes", dual: "uncertain",
        availability: { RU: { status: "eligible", note: "No nationality exclusion in route; dual-citizenship conclusion needs written check." } },
        metrics: { life: 4, peace: 3, infra: 4, nature: 5, cost: 2, hazard: 2, policy: 5, passport: 4 },
        cities: [
          { name: "Буэнос-Айрес", budget: [1800, 3000], rent: [650, 1300], climate: "умеренный", internet: "быстрый", infra: 4, nature: 2, note: "Культура, медицина и образование; macro/currency volatility." },
          { name: "Мендоса", budget: [1400, 2300], rent: [450, 850], climate: "сухой / горы", internet: "быстрый", infra: 3, nature: 5, note: "Анды и ниже стоимость; seismic and water stress." }
        ],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["No-exit interpretation", "Dual citizenship for exact pair", "Income form"],
        sources: [
          { label: "Argentina — migration law / rentista", url: "https://www.argentina.gob.ar/normativa/nacional/92016/actualizacion", kind: "official" },
          { label: "Argentina — Ley 346", url: "https://www.argentina.gob.ar/normativa/nacional/ley-346-48854/actualizacion", kind: "official" }
        ]
      },
      {
        id: "ec-remote", country: "Эквадор", code: "EC", flag: "🇪🇨", region: "Южная Америка", outcome: "citizenship", visaType: "nomad",
        route: "Remote residence → ПМЖ", entry: "remote-work residence", stay: "temporary → PR", renewable: "да",
        summary: "Формальная цепочка remote residence → PR → гражданство; security и seismic risk высоки.",
        incomeMin: 1400, fundsMin: 0, investmentMin: 0, applyCost: 900, citizenshipYears: 4.75,
        spouse: "Dependent with financial uplift", remoteWork: "yes", localWork: "switch", dual: "yes",
        availability: { RU: { status: "eligible", note: "Route is general; consular and document legalization pre-check." } },
        metrics: { life: 3, peace: 2, infra: 3, nature: 5, cost: 1, hazard: 5, policy: 4, passport: 3 },
        cities: [{ name: "Кито", budget: [1400, 2200], rent: [450, 850], climate: "вечная весна / высота", internet: "быстрый", infra: 3, nature: 5, note: "Климат и Анды; altitude, seismic/volcanic and security risk." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Spouse independent clock", "Security by neighborhood"],
        sources: [
          { label: "Ecuador — remote residence", url: "https://www.gob.ec/sites/default/files/sign/procedure-14306-20230303313131-15570099-signed.pdf", kind: "official" },
          { label: "Ecuador — permanent residence", url: "https://www.cancilleria.gob.ec/2020/06/15/visa-residencia-permanente/", kind: "official" }
        ]
      },
      {
        id: "lu-study", country: "Люксембург", code: "LU", flag: "🇱🇺", region: "Европа", outcome: "citizenship", visaType: "education",
        route: "Master / PhD → legal residence", entry: "student residence", stay: "учёба + post-study", renewable: "при qualifying status",
        summary: "Качественный EU anchor через образование; высокая стоимость и отдельный spouse route.",
        incomeMin: 0, fundsMin: 22000, investmentMin: 0, applyCost: 1200, citizenshipYears: 5,
        spouse: "Family reunification", remoteWork: "limited", localWork: "yes", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Admission is possible; sanctions, tuition payment and consular practice require current check." } },
        metrics: { life: 5, peace: 5, infra: 5, nature: 3, cost: 5, hazard: 1, policy: 2, passport: 5 },
        cities: [{ name: "Люксембург", budget: [3800, 5600], rent: [1700, 2800], climate: "умеренный", internet: "очень быстрый", infra: 5, nature: 3, note: "Безопасность, transport and EU jobs; extreme housing cost." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Exact degree and tuition", "Student-year count", "Spouse timing"],
        sources: [
          { label: "Luxembourg — third-country student", url: "https://guichet.public.lu/en/citoyens/immigration/plus-3-mois/ressortissant-tiers/etudiant/etudiant-pays-tiers.html", kind: "official" },
          { label: "Luxembourg — naturalisation", url: "https://guichet.public.lu/en/citoyens/citoyennete/nationalite-luxembourgeoise/acquisition-recouvrement/naturalisation.html", kind: "official" }
        ]
      },
      {
        id: "au-niv", country: "Австралия", code: "AU", flag: "🇦🇺", region: "Океания", outcome: "citizenship", visaType: "talent",
        route: "National Innovation Visa 858", entry: "talent / invitation", stay: "permanent visa", renewable: "PR",
        summary: "Сильный talent anchor без обычного employer route; invitation и доказательства — главный фильтр.",
        talentProfile: {
          gate: "EOI → invitation → nomination Form 1000 → visa application within the invitation window.",
          model: "invitation + nomination",
          employer: "Job offer не является отдельным обязательным условием; нужен Australian nominator с national reputation.",
          evidence: ["Internationally recognised exceptional record", "Recent prominence", "Польза для Australia", "Способность работать или поддерживать себя в поле"],
          routeRole: "Direct permanent visa; самый сильный talent anchor при реальном invitation fit."
        },
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 6500, citizenshipYears: 4,
        spouse: "Family in permanent visa", remoteWork: "yes", localWork: "yes", dual: "yes",
        availability: { RU: { status: "eligible", note: "Nationality-neutral talent visa; security checks and payment route." } },
        metrics: { life: 5, peace: 5, infra: 5, nature: 5, cost: 5, hazard: 4, policy: 2, passport: 5 },
        cities: [{ name: "Мельбурн", budget: [4000, 6000], rent: [1800, 3000], climate: "умеренный / изменчивый", internet: "быстрый", infra: 5, nature: 4, note: "Jobs, culture and healthcare; housing cost and heat/fire exposure." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Talent invitation fit", "All-in visa cost and processing"],
        sources: [
          { label: "Australia — NIV 858", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/national-innovation-visa-858", kind: "official" },
          { label: "Australia — citizenship residence", url: "https://immi.homeaffairs.gov.au/citizenship/become-a-citizen/permanent-resident", kind: "official" }
        ]
      },
      {
        id: "us-eb1a", country: "США", code: "US", flag: "🇺🇸", region: "Северная Америка", outcome: "citizenship", visaType: "talent",
        route: "EB-1A extraordinary ability", entry: "self-petition immigrant route", stay: "LPR", renewable: "green card",
        summary: "Мощный talent path и рынок; высокий доказательный порог, стоимость и policy volatility.",
        talentProfile: {
          gate: "Major internationally recognised award или evidence по нескольким regulatory criteria с final-merits review.",
          model: "criteria + final merits",
          employer: "Self-petition; job offer и labor certification не требуются, но нужно продолжать работу в поле.",
          evidence: ["Awards", "Memberships", "Published material", "Judging", "Original contribution", "Critical role", "High remuneration", "Authorship"],
          routeRole: "Immigrant route → LPR; отдельный от временной O-1."
        },
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 15000, citizenshipYears: 5,
        spouse: "Derivative LPR", remoteWork: "yes", localWork: "yes", dual: "yes",
        availability: { RU: { status: "eligible", note: "No nationality exclusion in statute; consular/security/payment path must be planned." } },
        metrics: { life: 5, peace: 2, infra: 5, nature: 5, cost: 5, hazard: 4, policy: 4, passport: 5 },
        cities: [{ name: "Нью-Йорк", budget: [6000, 9000], rent: [2800, 5000], climate: "четыре сезона", internet: "быстрый", infra: 5, nature: 2, note: "Maximum opportunity and connectivity; housing/healthcare cost and safety variance." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Evidence fit", "Consular processing path", "Healthcare and tax budget"],
        sources: [
          { label: "USCIS — EB-1", url: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", kind: "official" },
          { label: "USCIS — naturalization after 5 years", url: "https://www.uscis.gov/sites/default/files/document/fact-sheets/DO_FactSheet_NaturalizationForLawfulPermanentResidents_wTorUNonimmigrantStatus_V3_508.pdf", kind: "official" }
        ]
      },
      {
        id: "uk-talent", country: "Великобритания", code: "GB", flag: "🇬🇧", region: "Европа", outcome: "citizenship", visaType: "talent",
        route: "Global Talent — digital technology", entry: "endorsement / prize", stay: "visa → ILR", renewable: "да",
        summary: "Гибкий talent route без job offer; дорогой и доказательно требовательный.",
        talentProfile: {
          gate: "Endorsement как exceptional talent/promise за последние 5 лет либо eligible prize.",
          model: "endorsement",
          employer: "Job offer не нужен; разрешены employee, self-employed и company director.",
          evidence: ["CV", "3 независимых recommendation letters", "Минимум 2 evidence items по 2 критериям", "Product-led digital technology track record"],
          routeRole: "ILR обычно через 3 года для talent и через 5 для promise; citizenship — отдельный следующий шаг."
        },
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 10000, citizenshipYears: 5.5,
        spouse: "Dependant with own settlement rules", remoteWork: "yes", localWork: "yes", dual: "yes",
        availability: { RU: { status: "eligible", note: "Formal route is open; payments, endorsement and security checks." } },
        metrics: { life: 5, peace: 4, infra: 5, nature: 3, cost: 5, hazard: 1, policy: 3, passport: 5 },
        cities: [{ name: "Лондон", budget: [5200, 7800], rent: [2400, 4200], climate: "мягкий / дождливый", internet: "быстрый", infra: 5, nature: 2, note: "Global jobs and airports; housing, fees and long commute cost." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Evidence fit", "Exact settlement track", "Family fees"],
        sources: [
          { label: "GOV.UK — Global Talent", url: "https://www.gov.uk/global-talent-digital-technology", kind: "official" },
          { label: "GOV.UK — Appendix Global Talent", url: "https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-global-talent", kind: "official" },
          { label: "GOV.UK — citizenship after ILR", url: "https://www.gov.uk/apply-citizenship-indefinite-leave-to-remain/eligibility-and-fees", kind: "official" }
        ]
      },
      {
        id: "us-o1", country: "США", code: "US", flag: "🇺🇸", region: "Северная Америка", outcome: "temporary", visaType: "talent",
        route: "O-1A extraordinary ability", entry: "U.S. employer / agent petition", stay: "до 3 лет", renewable: "обычно по 1 году под activity",
        summary: "Временная talent-виза для работы по заявленной activity; не green card и не self-petition.",
        talentProfile: {
          gate: "Sustained national/international acclaim и documented U.S. work itinerary/activity.",
          model: "petitioner + criteria",
          employer: "Petition подаёт U.S. employer или U.S. agent; прямой self-petition невозможен.",
          evidence: ["Major award или regulatory evidence", "Consultation/advisory opinion", "Contract or terms", "Itinerary and work in the field"],
          routeRole: "Temporary talent bridge; EB-1A оценивается отдельно."
        },
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 9000, citizenshipYears: null,
        spouse: "O-3 family; spouse work right not assumed", remoteWork: "limited", localWork: "petitioner/itinerary", dual: "n/a",
        availability: { RU: { status: "needs-check", note: "Formal category is nationality-neutral; petition, consular and payment path require current pre-check." } },
        metrics: { life: 5, peace: 2, infra: 5, nature: 5, cost: 5, hazard: 4, policy: 4, passport: 5 },
        cities: [{ name: "Сан-Франциско", budget: [6500, 9500], rent: [3000, 5200], climate: "мягкий / океан", internet: "быстрый", infra: 5, nature: 4, note: "Tech network and capital; extreme housing cost, healthcare and seismic exposure." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Petitioner/agent structure", "Evidence fit", "Consular processing and family cost"],
        sources: [
          { label: "USCIS — O-1 extraordinary ability", url: "https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement", kind: "official" },
          { label: "USCIS Policy Manual — O petitioners", url: "https://www.uscis.gov/policy-manual/volume-2-part-m-chapter-3", kind: "official" }
        ]
      },
      {
        id: "hk-qmas", country: "Гонконг", code: "HK", flag: "🇭🇰", region: "Азия", outcome: "residence", visaType: "talent",
        route: "Quality Migrant Admission Scheme", entry: "GPT / achievement-based selection", stay: "GPT 3 года · APT 8 лет", renewable: "GPT 3+2 при contribution",
        summary: "Talent-residence без job offer на входе и с right of abode после семи лет; не обычный второй паспорт.",
        talentProfile: {
          gate: "Prerequisites → General Points Test или Achievement-based Points Test → merit selection.",
          model: "points / achievement selection",
          employer: "Job offer до въезда не нужен; для GPT extension надо показать settlement и contribution.",
          evidence: ["Образование или proven ability", "Financial self-support", "GPT factors или выдающееся achievement", "Работа/business contribution для продления"],
          routeRole: "Residence → right of abode after 7 years; HKSAR passport requires separate Chinese nationality analysis."
        },
        incomeMin: 0, fundsMin: 15000, investmentMin: 0, applyCost: 1200, citizenshipYears: null,
        spouse: "Dependants linked to sponsor", remoteWork: "yes", localWork: "yes", dual: "no",
        availability: { RU: { status: "eligible", note: "Russia is not among the nationalities excluded on the official QMAS page; practical banking and security pre-check remains." } },
        metrics: { life: 5, peace: 4, infra: 5, nature: 3, cost: 5, hazard: 4, policy: 4, passport: 4 },
        cities: [{ name: "Гонконг", budget: [5000, 7600], rent: [2500, 4500], climate: "субтропический / море", internet: "очень быстрый", infra: 5, nature: 3, note: "Finance, transport and Asia connectivity; housing, typhoons and political/citizenship constraints." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["GPT score under current 12 criteria", "Tax and housing plan", "Chinese nationality consequences"],
        sources: [
          { label: "Hong Kong Immigration — QMAS", url: "https://www.immd.gov.hk/eng/services/visas/quality_migrant_admission_scheme.html", kind: "official" },
          { label: "Hong Kong Immigration — right of abode", url: "https://www.immd.gov.hk/eng/services/right-of-abode-in-hksar/apply.html", kind: "official" }
        ]
      },
      {
        id: "fr-talent", country: "Франция", code: "FR", flag: "🇫🇷", region: "Европа", outcome: "citizenship", visaType: "talent",
        route: "Carte talent — projet / renommée", entry: "category-specific long-stay visa", stay: "до 4 лет", renewable: "при сохранении основания",
        summary: "Несколько talent-категорий с family route; сначала нужно выбрать точную категорию, а не доказывать абстрактную известность.",
        talentProfile: {
          gate: "Подходящая statutory category: innovative project, economic project, researcher, reputation или другая talent ground.",
          model: "category-specific merits",
          employer: "Зависит от категории; для reputation/project обычный местный job offer не всегда является основанием.",
          evidence: ["Репутация или признание", "Французский project and purpose", "Resources", "Category-specific approvals/contracts"],
          routeRole: "Многолетняя residence; обычный naturalisation stage моделируется от 5 лет, сокращение не гарантируется."
        },
        incomeMin: 0, fundsMin: 15000, investmentMin: 0, applyCost: 2200, citizenshipYears: 5,
        spouse: "Simplified talent-family residence", remoteWork: "category-specific", localWork: "yes", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Formal categories exist; exact category, consular filing, payments and sanctions practice require pre-check." } },
        metrics: { life: 5, peace: 3, infra: 5, nature: 5, cost: 5, hazard: 2, policy: 3, passport: 5 },
        cities: [{ name: "Лион", budget: [3200, 4800], rent: [1300, 2200], climate: "умеренный / жаркое лето", internet: "быстрый", infra: 5, nature: 4, note: "Research, industry and transport; housing cost, heat and French-language integration." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Exact carte talent category", "Project and reputation fit", "B2/integration and family budget"],
        sources: [
          { label: "France-Visas — international talents", url: "https://france-visas.gouv.fr/en/web/france-visas/talents-internationaux-et-attractivite-economique", kind: "official" },
          { label: "France — naturalisation procedure", url: "https://www.immigration.interieur.gouv.fr/devenir-francais/procedures-dacces-a-nationalite-francaise", kind: "official" }
        ]
      },
      {
        id: "ae-golden-talent", country: "ОАЭ", code: "AE", flag: "🇦🇪", region: "Ближний Восток", outcome: "residence", visaType: "talent",
        route: "Golden Visa — exceptional talent", entry: "category approval / recommendation", stay: "10 лет", renewable: "да",
        summary: "Длинная self-sponsored talent-residence для отдельных категорий; сильная база, но не citizenship anchor.",
        talentProfile: {
          gate: "Попадание в конкретную exceptional-talent или rare-specialisation subcategory и её approval requirements.",
          model: "category approval",
          employer: "Обычный sponsor не требуется; отдельные категории требуют recommendation or accreditation.",
          evidence: ["Recommendation letters", "Accredited degree/experience where required", "Awards or professional recognition", "Category-specific proof"],
          routeRole: "Renewable 10-year residence; обычного предсказуемого citizenship clock нет."
        },
        incomeMin: 0, fundsMin: 15000, investmentMin: 0, applyCost: 3500, citizenshipYears: null,
        spouse: "Spouse and children can be sponsored", remoteWork: "yes", localWork: "yes", dual: "n/a",
        availability: { RU: { status: "needs-check", note: "Formal route is broad; category authority, security, payment and document practice need direct check." } },
        metrics: { life: 4, peace: 4, infra: 5, nature: 2, cost: 5, hazard: 4, policy: 3, passport: 4 },
        cities: [
          { name: "Дубай", budget: [3800, 6000], rent: [1600, 3000], climate: "пустыня / экстремальная жара", internet: "быстрый", infra: 5, nature: 2, note: "Аэропорт, сервисы и безопасность; высокая стоимость и car dependence." },
          { name: "Абу-Даби", budget: [3600, 5600], rent: [1500, 2700], climate: "пустыня / жара", internet: "быстрый", infra: 5, nature: 2, note: "Спокойнее и зеленее центра Дубая; тот же heat exposure." }
        ],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Exact talent subcategory", "Approving authority", "Tax/healthcare and family all-in cost"],
        sources: [{ label: "UAE Government — Golden Visa", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa", kind: "official" }]
      },
      {
        id: "de-study", country: "Германия", code: "DE", flag: "🇩🇪", region: "Европа", outcome: "citizenship", visaType: "education",
        route: "Учёба → qualifying activity", entry: "student residence", stay: "study + job/self-employment", renewable: "при смене статуса",
        summary: "Реалистичный EU settlement route через второе образование и последующую деятельность.",
        incomeMin: 0, fundsMin: 15000, investmentMin: 0, applyCost: 1200, citizenshipYears: 5,
        spouse: "Family route; naturalisation conditions separate", remoteWork: "limited", localWork: "yes", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Formal route exists; admission, blocked account and payment access." } },
        metrics: { life: 5, peace: 4, infra: 5, nature: 4, cost: 4, hazard: 1, policy: 2, passport: 5 },
        cities: [{ name: "Берлин", budget: [3200, 4800], rent: [1400, 2400], climate: "четыре сезона", internet: "быстрый", infra: 5, nature: 3, note: "Education, jobs and culture; housing search and bureaucracy." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Programme and admission", "Count of study years", "Spouse status"],
        sources: [
          { label: "Make it in Germany — studying", url: "https://www.make-it-in-germany.com/en/visa-residence/types/studying", kind: "official" },
          { label: "Germany — naturalisation", url: "https://www.make-it-in-germany.com/en/visa-residence/living-permanently/naturalisation", kind: "official" }
        ]
      },
      {
        id: "fr-study", country: "Франция", code: "FR", flag: "🇫🇷", region: "Европа", outcome: "citizenship", visaType: "education",
        route: "2 года высшего образования", entry: "student → qualifying status", stay: "legal residence", renewable: "при законном основании",
        summary: "Потенциально короткий reduced stage после французского образования, но решение дискреционное.",
        incomeMin: 0, fundsMin: 14000, investmentMin: 0, applyCost: 2500, citizenshipYears: 2,
        spouse: "Separate residence/integration", remoteWork: "limited", localWork: "yes", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Admission and visa route possible; consular/payment practice current check." } },
        metrics: { life: 5, peace: 3, infra: 5, nature: 5, cost: 5, hazard: 2, policy: 3, passport: 5 },
        cities: [{ name: "Париж", budget: [4300, 6500], rent: [1900, 3300], climate: "умеренный", internet: "быстрый", infra: 5, nature: 2, note: "Universities and market; high cost, housing and urban stress." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Qualifying degree", "B2 and income evidence", "Discretionary reduction"],
        sources: [
          { label: "France — Code civil", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006165459/2026-04-04/", kind: "official" },
          { label: "France — naturalisation/B2", url: "https://www.immigration.interieur.gouv.fr/devenir-francais/procedures-dacces-a-nationalite-francaise", kind: "official" }
        ]
      },
      {
        id: "br-nomad", country: "Бразилия", code: "BR", flag: "🇧🇷", region: "Южная Америка", outcome: "residence", visaType: "nomad",
        route: "Digital Nomad Residence", entry: "temporary residence", stay: "1 год", renewable: "да",
        summary: "Доступный remote residence; citizenship clock требует перехода на indefinite status.",
        incomeMin: 1500, fundsMin: 18000, investmentMin: 0, applyCost: 700, citizenshipYears: null,
        spouse: "Family residence separately", remoteWork: "yes", localWork: "no", dual: "yes",
        availability: { RU: { status: "eligible", note: "General route; consular legalization and payment check." } },
        metrics: { life: 3, peace: 2, infra: 3, nature: 5, cost: 2, hazard: 3, policy: 3, passport: 4 },
        cities: [{ name: "Флорианополис", budget: [1900, 3000], rent: [700, 1300], climate: "субтропический / море", internet: "быстрый", infra: 3, nature: 5, note: "Пляжи и tech; seasonal rents, floods and local transport." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Path to indefinite residence", "Tax consequences"],
        sources: [{ label: "Brazil — Resolução 45", url: "https://portaldeimigracao.mj.gov.br/pt/nav-guiada/rn-45", kind: "official" }]
      },
      {
        id: "br-child", country: "Бразилия", code: "BR", flag: "🇧🇷", region: "Южная Америка", outcome: "citizenship", visaType: "family",
        route: "Brazilian child → family residence", entry: "реальный семейный сценарий", stay: "indefinite family residence", renewable: "поддерживать status",
        summary: "Отдельный семейный route: ребёнок — не визовый инструмент, но последствия для родителей существенны.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 900, citizenshipYears: 1,
        spouse: "Оба родителя могут строить route", remoteWork: "yes", localWork: "yes", dual: "yes",
        availability: { RU: { status: "eligible", note: "Birth/family rules are nationality-neutral; family plan must be independent." } },
        metrics: { life: 3, peace: 2, infra: 3, nature: 5, cost: 2, hazard: 3, policy: 3, passport: 4 },
        cities: [{ name: "Сан-Паулу", budget: [2200, 3500], rent: [850, 1600], climate: "субтропический", internet: "быстрый", infra: 5, nature: 2, note: "Top medicine and jobs; security, pollution and travel time vary sharply." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Medical/insurance plan", "Exact parent residence sequence"],
        sources: [
          { label: "Brazil — family residence", url: "https://www.gov.br/mj/pt-br/assuntos/seus-direitos/migracoes/autorizacao-de-residencia", kind: "official" },
          { label: "Brazil — reduced naturalisation", url: "https://www.gov.br/mj/pt-br/assuntos/seus-direitos/migracoes/naturalizacao/o-que-e-naturalizacao/naturalizacao-ordinaria/ter-residencia-em-territorio-nacional-pelo-prazo-estabelecido-pela-lei-brasileira", kind: "official" }
        ]
      },
      {
        id: "bo-study", country: "Боливия", code: "BO", flag: "🇧🇴", region: "Южная Америка", outcome: "citizenship", visaType: "education",
        route: "Учёба / самостоятельная деятельность", entry: "temporary residence", stay: "продлеваемая residence", renewable: "да",
        summary: "Низкая стоимость и короткий формальный clock; административная практика требует углубления.",
        incomeMin: 0, fundsMin: 7000, investmentMin: 0, applyCost: 600, citizenshipYears: 3.2,
        spouse: "Family temporary residence", remoteWork: "uncertain", localWork: "yes", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Formal route candidate; current consular practice requires verification." } },
        metrics: { life: 2, peace: 3, infra: 2, nature: 5, cost: 1, hazard: 4, policy: 4, passport: 2 },
        cities: [{ name: "Санта-Крус", budget: [1200, 1900], rent: [400, 750], climate: "жаркий тропический", internet: "средний", infra: 3, nature: 3, note: "Ниже altitude and business centre; heat/flood and healthcare depth." }],
        checkedAt: "2026-07-15", confidence: "C", status: "needs-check", unknowns: ["Official residence-to-citizenship practice", "Consular documents", "Healthcare"],
        sources: [{ label: "Canonical route matrix", url: "../routes/route-matrix.md", kind: "canonical" }]
      },
      {
        id: "cv-nomad", country: "Кабо-Верде", code: "CV", flag: "🇨🇻", region: "Африка", outcome: "citizenship", visaType: "nomad",
        route: "Remote-work residence", entry: "remote residence", stay: "legal residence", renewable: "по режиму",
        summary: "Пяти-летняя island-гипотеза; зачёт нового nomad status пока не подтверждён практикой.",
        incomeMin: 0, fundsMin: 0, investmentMin: 0, applyCost: 700, citizenshipYears: 5,
        spouse: "Family route", remoteWork: "yes", localWork: "switch", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Nationality and payment access require current programme check." } },
        metrics: { life: 2, peace: 4, infra: 2, nature: 5, cost: 2, hazard: 4, policy: 3, passport: 2 },
        cities: [{ name: "Прая", budget: [1500, 2400], rent: [500, 950], climate: "сухой тропический остров", internet: "средний", infra: 2, nature: 5, note: "Океан и мягкий климат; island logistics, water and healthcare limits." }],
        checkedAt: "2026-07-15", confidence: "C", status: "needs-check", unknowns: ["Nomad status citizenship count", "Physical presence", "RU application route"],
        sources: [
          { label: "Cabo Verde — Decreto-Lei 13/2025", url: "https://boe.incv.cv/Bulletins/View/85465", kind: "official" },
          { label: "Cabo Verde — nationality law", url: "https://boe.incv.cv/Bulletins/Download/4995", kind: "official" }
        ]
      },
      {
        id: "pt-d8", country: "Португалия", code: "PT", flag: "🇵🇹", region: "Европа", outcome: "citizenship", visaType: "nomad",
        route: "D8 remote residence", entry: "residence visa", stay: "продлеваемая residence", renewable: "да",
        summary: "Качественная remote-база и EU passport, но с 19.05.2026 обычный clock стал десять лет.",
        incomeMin: 4200, fundsMin: 15000, investmentMin: 0, applyCost: 1800, citizenshipYears: 10,
        spouse: "Family reunification", remoteWork: "yes", localWork: "yes", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Formal D8 route; consular appointment and financial access." } },
        metrics: { life: 5, peace: 5, infra: 5, nature: 5, cost: 4, hazard: 4, policy: 4, passport: 5 },
        cities: [{ name: "Лиссабон", budget: [3400, 5000], rent: [1600, 2700], climate: "океанический / солнце", internet: "быстрый", infra: 5, nature: 4, note: "Remote ecosystem and airport; housing, heat/wildfire and seismic coastal exposure." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Exact family threshold", "Implementation of 2026 clock reform"],
        sources: [
          { label: "AIMA — remote residence", url: "https://aima.gov.pt/pt/trabalhar/autorizacao-de-residencia-para-o-exercicio-de-atividade-profissional-prestada-de-forma-remota-com-visto-de-residencia-para-o-exe", kind: "official" },
          { label: "Portugal — nationality reform", url: "https://justica.gov.pt/Noticias/Lei-da-Nacionalidade-novas-regras-entram-em-vigor-a-19-de-maio", kind: "official" }
        ]
      },
      {
        id: "es-nomad", country: "Испания", code: "ES", flag: "🇪🇸", region: "Европа", outcome: "citizenship", visaType: "nomad",
        route: "Digital Nomad Residence", entry: "telework residence", stay: "до 3 лет внутри страны", renewable: "да",
        summary: "Сильная среда и полноценный ВНЖ; для граждан РФ длинный clock и renunciation barrier.",
        incomeMin: 3300, fundsMin: 0, investmentMin: 0, applyCost: 1800, citizenshipYears: 10,
        spouse: "Family included", remoteWork: "yes", localWork: "limited", dual: "no",
        availability: { RU: { status: "needs-check", note: "Formal telework route; consular/payment and renunciation implications." } },
        metrics: { life: 5, peace: 4, infra: 5, nature: 5, cost: 4, hazard: 3, policy: 2, passport: 5 },
        cities: [{ name: "Валенсия", budget: [2700, 4100], rent: [1100, 1900], climate: "средиземноморский", internet: "быстрый", infra: 5, nature: 5, note: "Море, transport and healthcare; flood/heat risk and rising rents." }],
        checkedAt: "2026-07-15", confidence: "A", status: "verified", unknowns: ["Income formula for family", "Dual citizenship outcome"],
        sources: [{ label: "Spain — telework visa", url: "https://www.exteriores.gob.es/Consulados/washington/en/ServiciosConsulares/Paginas/Consular/Telework-visa.aspx", kind: "official" }]
      },
      {
        id: "dm-cbi", country: "Доминика", code: "DM", flag: "🇩🇲", region: "Карибы", outcome: "citizenship", visaType: "investment",
        route: "Citizenship by Investment", entry: "EDF contribution", stay: "прямое гражданство", renewable: "n/a",
        summary: "Паспортная страховка, а не выбор страны жизни; российская доступность требует отдельного pre-check.",
        incomeMin: 0, fundsMin: 0, investmentMin: 250000, applyCost: 25000, citizenshipYears: 0.5,
        spouse: "Family contribution", remoteWork: "n/a", localWork: "n/a", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Programme/compliance acceptance and source of funds must be confirmed before payment." } },
        metrics: { life: 2, peace: 4, infra: 2, nature: 5, cost: 2, hazard: 5, policy: 4, passport: 4 },
        cities: [{ name: "Розо", budget: [1800, 2800], rent: [600, 1100], climate: "тропический остров", internet: "средний", infra: 2, nature: 5, note: "Nature; hurricane/volcanic risk and limited infrastructure." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Current RU acceptance", "All-in family cost", "Banking"],
        sources: [{ label: "Dominica CBIU — EDF", url: "https://www.cbiu.gov.dm/investment-options/economic-diversification-fund/", kind: "official" }]
      },
      {
        id: "gd-cbi", country: "Гренада", code: "GD", flag: "🇬🇩", region: "Карибы", outcome: "citizenship", visaType: "investment",
        route: "Citizenship by Investment", entry: "NTF / approved route", stay: "прямое гражданство", renewable: "n/a",
        summary: "Быстрый backup passport; all-in cost и российская eligibility важнее headline суммы.",
        incomeMin: 0, fundsMin: 0, investmentMin: 235000, applyCost: 30000, citizenshipYears: 0.35,
        spouse: "Family under programme", remoteWork: "n/a", localWork: "n/a", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Confirm programme acceptance, licensed agent and source-of-funds path." } },
        metrics: { life: 2, peace: 4, infra: 2, nature: 5, cost: 2, hazard: 5, policy: 4, passport: 4 },
        cities: [{ name: "Сент-Джорджес", budget: [2000, 3100], rent: [700, 1300], climate: "тропический остров", internet: "средний", infra: 2, nature: 5, note: "Island life; hurricane/seismic/volcanic exposure." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Current RU acceptance", "All-in family cost"],
        sources: [{ label: "Grenada Investment Migration Agency", url: "https://imagrenada.gd/citizenship-by-investment/", kind: "official" }]
      },
      {
        id: "kn-cbi", country: "Сент-Китс и Невис", code: "KN", flag: "🇰🇳", region: "Карибы", outcome: "citizenship", visaType: "investment",
        route: "CBI — SISC", entry: "contribution / approved option", stay: "прямое гражданство", renewable: "n/a",
        summary: "Сильнейший паспорт текущего CBI shortlist; не заменяет residence и требует compliance pre-check.",
        incomeMin: 0, fundsMin: 0, investmentMin: 250000, applyCost: 35000, citizenshipYears: 0.5,
        spouse: "Dependants with fees", remoteWork: "n/a", localWork: "n/a", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Confirm eligibility and mandatory licensed-agent channel." } },
        metrics: { life: 2, peace: 4, infra: 2, nature: 5, cost: 3, hazard: 5, policy: 4, passport: 4 },
        cities: [{ name: "Бастер", budget: [2200, 3400], rent: [800, 1400], climate: "тропический остров", internet: "средний", infra: 2, nature: 5, note: "Island logistics and hurricane/coastal exposure." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Current RU acceptance", "Fees and interview logistics"],
        sources: [{ label: "St Kitts CIU — CBI options", url: "https://ciu.gov.kn/cbi-options/", kind: "official" }]
      },
      {
        id: "nr-cbi", country: "Науру", code: "NR", flag: "🇳🇷", region: "Океания", outcome: "citizenship", visaType: "investment",
        route: "Economic & Climate Resilience CBI", entry: "contribution", stay: "прямое гражданство", renewable: "n/a",
        summary: "Дешёвая CBI-гипотеза с максимальной program, passport и climate uncertainty.",
        incomeMin: 0, fundsMin: 0, investmentMin: 90000, applyCost: 25000, citizenshipYears: 0.35,
        spouse: "Dependants with uplifts", remoteWork: "n/a", localWork: "n/a", dual: "yes",
        availability: { RU: { status: "needs-check", note: "New programme; eligibility, promo and compliance all require direct confirmation." } },
        metrics: { life: 1, peace: 3, infra: 1, nature: 3, cost: 3, hazard: 5, policy: 5, passport: 2 },
        cities: [{ name: "Ярен", budget: [2500, 3900], rent: [900, 1600], climate: "экваториальный остров", internet: "ограниченный", infra: 1, nature: 3, note: "Extreme climate and supply-chain vulnerability; not a lifestyle recommendation." }],
        checkedAt: "2026-07-15", confidence: "C", status: "needs-check", unknowns: ["Current contribution", "RU acceptance", "Long-term programme stability"],
        sources: [{ label: "Nauru ECRCP — contribution", url: "https://www.ecrcp.gov.nr/contribution", kind: "official" }]
      },
      {
        id: "tr-cbi", country: "Турция", code: "TR", flag: "🇹🇷", region: "Европа / Азия", outcome: "citizenship", visaType: "investment",
        route: "Citizenship via real estate", entry: "exceptional investment", stay: "direct decision", renewable: "3-year asset hold",
        summary: "Реальная страна проживания и возвратный asset, но высокий seismic, policy и currency risk.",
        incomeMin: 0, fundsMin: 0, investmentMin: 400000, applyCost: 35000, citizenshipYears: 1,
        spouse: "Family under exceptional procedure", remoteWork: "yes", localWork: "switch", dual: "yes",
        availability: { RU: { status: "needs-check", note: "Formal route; property payment, banking and source-of-funds pre-check." } },
        metrics: { life: 3, peace: 2, infra: 4, nature: 5, cost: 2, hazard: 5, policy: 5, passport: 3 },
        cities: [{ name: "Стамбул", budget: [2100, 3300], rent: [850, 1600], climate: "море / четыре сезона", internet: "быстрый", infra: 5, nature: 2, note: "Global city; earthquake, inflation and policy risk." }],
        checkedAt: "2026-07-15", confidence: "B", status: "partial", unknowns: ["Property valuation", "Banking", "Decision time"],
        sources: [{ label: "Invest in Türkiye — property and citizenship", url: "https://www.invest.gov.tr/en/investmentguide/pages/acquiring-property-and-citizenship.aspx", kind: "official" }]
      }
    ]
  };
}());
