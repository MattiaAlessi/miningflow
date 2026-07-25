# 📋 MININGFLOW — Piano di Sviluppo

> **Creato:** 25 Luglio 2026  
> **Ispirato da:** GMT Optimizer (OLD_INSPIRATION/)  
> **Stato:** ✅ v1.0-v2.0 completate; v1.5-v1.6 in corso

---

## 1. Panoramica

| Cosa | Valore |
|------|--------|
| **Nome brand** | MiningFlow |
| **Stile** | Dark Premium (glassmorphism, minimal, elegante) |
| **Lingua** | Inglese |
| **Hosting** | GitHub Pages |
| **Licenza** | MIT |
| **Tipo** | SPA (single-page application) |

## 2. Dati dell'utente (da personalizzare)

### Wallet Donazioni
| Asset | Indirizzo |
|-------|-----------|
| **BTC** | `bc1qcqycagy7p0tf4vc682ygdq522jee0cterllcv6` |
| **ETH/GMT** | `0x0a6415FcBf54A46C4b21851493a0B387e8c23c94` |

### GoMining Referral
| Cosa | Valore |
|------|--------|
| **Codice referral** | `ZG54KF1` |
| **Link signup** | `https://gomining.com/?ref=ZG54KF1` |
| **Bonus** | 5% bonus TH sul primo miner |

---

## 3. Struttura del Progetto

```
miningflow/
├── index.html           # Landing page + Dashboard (SPA unica)
├── assets/
│   ├── style.css        # Tutto lo stile dark premium
│   └── app.js           # Logica: calcoli, API, UI, interazioni
├── CNAME                # (dominio personalizzato opzionale)
├── LICENSE              # MIT License
├── PLAN.md              # Questo file (piano di sviluppo)
└── .gitignore
```

**Una sola pagina** — landing + dashboard tutto in una SPA minimal. Le pagine SEO multiple verranno dopo (v2+).

---

## 4. Layout della Pagina (MVP)

```
┌──────────────────────────────────────────────────┐
│  🌊 MiningFlow              [Donate]             │ ← Nav minimale, sticky
├──────────────────────────────────────────────────┤
│  BTC $84,210 │ GMT $0.285 │ Diff 121.5T │ Sats 412│ ← Live ticker (scrolling)
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ Daily Net     │  │ Monthly Earn │  ← Hero cards (glassmorphism)
│  │   $43.10      │  │   $1,284     │              │
│  │ +0.00064 BTC  │  │ ~$15.4k/yr  │              │
│  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ Discount     │  │ VIP Level    │              │
│  │   20%        │  │ Diamond I    │              │
│  └──────────────┘  └──────────────┘              │
│                                                   │
│  ┌─ YOUR SETUP ───────────────────────────────┐  │
│  │                                              │  │
│  │  Hashrate     [1,926.76]    TH     ⚡       │  │
│  │  Efficiency   [16.46]       W/TH   🔋       │  │
│  │  Locked GMT   [9,354]       GMT    🔒       │  │
│  │  Liquid GMT   [2,625]       GMT    💰       │  │
│  │                                              │  │
│  │  Options:  ☑ Click streak  ☑ Pay in GMT     │  │
│  │                                              │  │
│  │  [RECALCULATE]                               │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ DAILY BREAKDOWN ──────────────────────────┐  │
│  │                                              │  │
│  │  Gross Revenue     $58.20    ████████░░     │  │
│  │  Electricity Fee   -$9.80    ██░░░░░░░░     │  │
│  │  Service Fee       -$4.30    █░░░░░░░░░     │  │
│  │  Conversion Fee    -$1.00    ░░░░░░░░░░     │  │
│  │  ─────────────────────────────────────────  │  │
│  │  NET PROFIT         $43.10   ███████░░░     │  │
│  │  Net (BTC)         0.00064                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ REFERRAL ─────────────────────────────────┐  │
│  │                                              │  │
│  │  🎯 New to GoMining?                        │  │
│  │  Use code  ZG54KF1  [+5% bonus TH]         │  │
│  │  [📋 Copy code]  [🚀 Sign Up →]            │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ SUPPORT MININGFLOW ───────────────────────┐  │
│  │                                              │  │
│  │  BTC:  bc1qcqycagy7...  [Copy]              │  │
│  │  ETH:  0x0a6415FcBf5...  [Copy]            │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  © 2026 MiningFlow · MIT License                  │
└──────────────────────────────────────────────────┘
```

---

## 5. Design System (Dark Premium)

### Colori

| Ruolo | Colore | Uso |
|-------|--------|-----|
| **Sfondo** | `#0a0a0f` | Body background |
| **Card bg** | `rgba(255,255,255,0.03)` | Glassmorphism cards |
| **Card border** | `rgba(255,255,255,0.06)` | Bordi subtle |
| **Testo primario** | `#f0f0f4` | Headings, valori |
| **Testo secondario** | `#8888a0` | Labels, descrizioni |
| **Testo terziario** | `#55556a` | Note, hint |
| **Oro** | `#F5A623` | Accento primario (profitto) |
| **Ciano** | `#4ecffa` | Accento secondario (earnings) |
| **Viola** | `#8b5cf6` | Accento VIP/discount |
| **Verde** | `#22c55e` | Numeri positivi |
| **Rosso** | `#ef4444` | Fee, negativi |

### Tipografia

| Tipo | Font | Peso |
|------|------|------|
| **Headings** | `Space Grotesk` | 600, 700 |
| **Body** | `Inter` | 400, 500 |
| **Numeri/mono** | `JetBrains Mono` | 400, 700 |

### Componenti UI

- **Cards**: `background: rgba(255,255,255,0.03)`, `backdrop-filter: blur(12px)`, `border-radius: 16px`, bordo subtle `rgba(255,255,255,0.06)`
- **Input**: Minimali, sfondo scuro semitrasparente, glow `#F5A623` al focus
- **Bottoni**: Pill shape (`border-radius: 50px`), gradienti, `box-shadow` glow al hover
- **Toggle**: Switch animati stile iOS
- **Barre progresso**: Gradient orizzontali con animazione
- **Animazioni**: `fadeIn` + `slideUp` allo scroll, `countUp` numerico, micro-interazioni hover

---

## 6. API e Dati Live

### Fonti API (con fallback)

| Dato | Primario | Fallback 1 | Fallback 2 |
|------|----------|------------|------------|
| **BTC Price** | `api.coinpaprika.com/v1/tickers/btc-bitcoin` | `api.coingecko.com/api/v3/simple/price?ids=bitcoin` | `mempool.space/api/v1/prices` |
| **GMT Price** | `api.coinpaprika.com/v1/tickers/gomining-gomining-token` | `api.coingecko.com/api/v3/simple/price?ids=gmt-token` | — |
| **Difficulty** | `mempool.space/api/v1/mining/hashrate/3d` | — | Valori fallback hardcoded |
| **Forex** | `api.frankfurter.dev/v1/latest?base=USD` | — | — |

### Valori Fallback

```javascript
const FALLBACK = {
  btcPrice: 84000,
  gmtPrice: 0.28,
  difficulty: 113e12,
  avgTxFees: 0.15
};
```

---

## 7. Formule Mining (dal codice originale)

### Formula Principale
```
satsPerTHDay = ((1e12 × 86400 × BLOCK_SUBSIDY) / (difficulty × 2^32)) × 1e8
dailyBTCperTH = satsPerTHDay / 1e8
```

### Calcolo Giornaliero
```
dailyRevenueBTC   = dailyBTCperTH × TH
dailyRevenueUSD   = dailyRevenueBTC × BTCprice

electricityFee    = (W/TH × TH × 24) × $0.05/kWh / 1000
serviceFee        = $0.0089 × TH
grossFees         = electricityFee + serviceFee

discount          = min(VIP_discount + token_discount, 20%)
discountedFees    = grossFees × (1 - discount)

conversionFee     = (dailyRevenueUSD - discountedFees) × 0.0225  // 2.25% BTC→GMT skim

dailyNetUSD       = dailyRevenueUSD - discountedFees - conversionFee
dailyNetBTC       = dailyNetUSD / BTCprice

monthlyNetUSD     = dailyNetUSD × 30
```

### Staking GMT
```
stakingDailyUSD   = lockedGMT × (APR / 100) / 365 × GMTprice
stakingMonthlyUSD = stakingDailyUSD × 30
```

### TOTALI
```
totalDailyUSD  = dailyNetUSD + stakingDailyUSD
totalMonthlyUSD = totalDailyUSD × 30
```

### Costanti Mining
| Costante | Valore |
|----------|--------|
| `BLOCK_SUBSIDY` | `3.125` BTC (post-2024 halving) |
| `ELECTRICITY_RATE` | `0.05` $/kWh |
| `SERVICE_RATE` | `0.0089` $/TH/day |
| `CONVERSION_FEE` | `0.0225` (2.25%) |
| `GMT_STAKING_APR` | `18.69`% |

---

## 8. VIP Tiers

22 tiers da Bronze I a Elite:

| Tier | TH Min | GMT Locked Min | Discount | Ref Bonus |
|------|--------|---------------|----------|-----------|
| Bronze I | 0 | 0 | 0% | 0% |
| Bronze II | 5 | 50 | 0.3% | 0% |
| Silver I | 10 | 100 | 0.6% | 5% |
| Silver II | 25 | 250 | 0.9% | 0% |
| Silver III | 50 | 500 | 1.2% | 0% |
| Gold I | 100 | 1,000 | 1.5% | 0% |
| Gold II | 200 | 2,000 | 1.8% | 0% |
| Platinum I | 500 | 5,000 | 2.1% | 0% |
| Platinum II | 1,000 | 10,000 | 2.4% | 0% |
| Platinum III | 2,500 | 25,000 | 2.7% | 0% |
| Diamond I | 5,000 | 50,000 | 3.0% | 10% |
| Diamond II | 7,000 | 70,000 | 3.3% | 0% |
| Diamond III | 9,000 | 90,000 | 3.6% | 0% |
| Diamond IV | 12,000 | 120,000 | 3.9% | 0% |
| Diamond V | 20,000 | 200,000 | 4.2% | 0% |
| Legend I | 50,000 | 500,000 | 4.5% | 0% |
| Legend II | 100,000 | 1,000,000 | 4.8% | 0% |
| Legend III | 250,000 | 2,500,000 | 5.1% | 0% |
| Legend IV | 400,000 | 4,000,000 | 5.4% | 0% |
| Legend V | 750,000 | 7,500,000 | 5.7% | 0% |
| Elite | 1,000,000 | 10,000,000 | 6.0% | 0% |

**Regola**: Il tier è determinato dal valore più alto tra TH posseduti o GMT locked.
**Token discount**: 18 giorni di copertura fee per ogni 1%, massimo 20% (360 giorni).

---

## 9. Funzionalità — Versioni

### ✅ v1.0 — MVP (completata)
- [x] Landing page + Dashboard unica
- [x] Live ticker (BTC, GMT, difficulty, sats/TH/day)
- [x] Hero cards (daily net, monthly, discount, VIP)
- [x] Input form (TH, W/TH, locked GMT)
- [x] Calcolo profitto giornaliero/mensile
- [x] Breakdown visuale con barre di progresso
- [x] Calcolo automatico VIP tier
- [x] Calcolo sconto (VIP + token coverage)
- [x] Staking GMT
- [x] Sezione referral (ZG54KF1)
- [x] Sezione donazioni (BTC + ETH)
- [x] Design dark premium completo
- [x] Responsive mobile/tablet/desktop
- [x] Opzioni (click streak, pay in GMT)
- [x] Licenza MIT

### ✅ v1.1 — Capital Planner (completata)
- [x] Allocatore split ottimale TH/GMT (greedy 4-strategia)
- [x] Budget input e suggerimento allocazione

### ✅ v1.2 — Growth Projection (completata)
- [x] Proiezione multi-anno con halving e difficoltà
- [x] Grafico crescita con reinvestimento e break-even

### ✅ v1.3 — Live Charts (completata)
- [x] Grafico prezzo BTC (canvas)
- [x] Grafico prezzo GMT
- [x] Selettore timeframe 7d/30d/90d
- [x] Cache localStorage con fallback dati vecchi
- [x] Gestione errori API e overlay informativo

### ✅ v1.4 — Persistenza & Sharing (completata)
- [x] Salvataggio setup in localStorage
- [x] Link condivisibile con parametri URL
- [x] Caricamento setup da URL con fallback localStorage
- [x] Bottone "Copy share link" nel pannello setup

### ✅ v1.5 — Controllo funzionalità OLD_INSPIRATION (completata)
- [x] Multi-valuta (USD/EUR/GBP) con tassi live
- [x] Override manuale dello sconto
- [x] Pannello dettaglio VIP & discount stack
- [x] Profili setup salvabili
- [x] Segnale di reinvestimento (TH vs GMT)
- [x] Opzioni avanzate (Greedy Machine, Avatar discount, Ambassador TH)
- [x] Pagina "Claim funded first TH"
- [x] Wizard onboarding per nuovi utenti
- [x] UX review generale

### ✅ v1.6 — Miglioria Grafica
- [x] Ricerca online su psicologia delle donazioni, siti premium e micro-interazioni
- [x] Piano cromatico e direzione stile premium (palette raffinata, gradienti sottili, bordi glow, animazioni leggere)
- [x] Implementazione modifiche al sito:
  - Nuova palette e sfondo aurora animato in `style.css`
  - Animazioni `.reveal` (scroll reveal), `.shimmer-btn` (transform-based), `.pulse-glow`, `.floating`
  - Supporto `prefers-reduced-motion`
  - Sezione Donate rinnovata con CTA più coinvolgente, card premium e pulsanti shimmer/pulse
  - Count-up animato dei valori principanti al primo render in `app.js`
  - Scroll reveal via IntersectionObserver con attivazione immediata per elementi above-the-fold
- [x] Validazione `node --check` e code review superate 

### ✅ v2.0 — SEO & Content (completata)
- [x] Meta tags avanzati (Open Graph, Twitter, canonical, keywords)
- [x] robots.txt e sitemap.xml
- [x] Pagina "How GoMining Works"
- [x] Pagina FAQ
- [x] Navigazione condivisa tra le pagine
- [x] Stili CSS riutilizzabili per articoli

---

## 10. Deployment

### GitHub Pages
1. Creare repo `miningflow` su GitHub
2. Pushare il progetto sul branch `main`
3. Abilitare GitHub Pages: `Settings → Pages → Deploy from main`
4. Il sito sarà live su `https://<username>.github.io/miningflow/`

### Dominio Personalizzato (opzionale)
1. Aggiungere file `CNAME` con il dominio
2. Puntare i DNS del dominio a GitHub Pages

---

## 11. Licenza MIT

```
MIT License

Copyright (c) 2026 MiningFlow

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

Full text da includere nel file `LICENSE`.

---

## 12. Note tecniche

- **Niente framework**: Solo HTML/CSS/JS vanilla
- **Niente build tools**: Vanno bene così per GitHub Pages
- **Dati live**: Refresh ogni 60 secondi (con polling API)
- **Fallback dati**: Se API non rispondono, usare valori hardcoded
- **Compatibilità**: Browser moderni (Chrome, Firefox, Safari, Edge)
- **Accessibilità**: Contrasto colori WCAG AA, label per input, aria-label

---

*Piano generato il 25 Luglio 2026 — da implementare in sessione successiva.*
