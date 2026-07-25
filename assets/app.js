/* MiningFlow v1.1 — GoMining profit calculator + Capital Planner */

(() => {
  'use strict';

  // ---- Constants ----
  const BLOCK_SUBSIDY = 3.125;
  const ELECTRICITY_RATE = 0.05; // $/kWh
  const SERVICE_RATE = 0.0089;   // $/TH/day
  const CONVERSION_FEE = 0.0225; // 2.25%
  const GMT_STAKING_APR = 18.69; // %
  const COV_DAYS_PER_PCT = 18;
  const MAX_TOKEN_DISCOUNT = 20;

  // ---- TH COST TIERS (inspired by OLD_INSPIRATION) ----
  const TH_TIERS = [
    {th:1,cpt:14.99},{th:2,cpt:14},{th:4,cpt:14},{th:8,cpt:13.75},
    {th:16,cpt:13.56},{th:32,cpt:13.44},{th:48,cpt:13.29},{th:64,cpt:13.16},
    {th:96,cpt:13.03},{th:128,cpt:12.90},{th:192,cpt:12.77},{th:256,cpt:12.64},
    {th:384,cpt:12.51},{th:512,cpt:12.39},{th:768,cpt:12.27},{th:1024,cpt:12.14},
    {th:1536,cpt:12.02},{th:2560,cpt:11.90},{th:3584,cpt:11.78},{th:5000,cpt:11.67}
  ];
  const TH_TIERS_12W = [
    {th:1,cpt:21.99},{th:2,cpt:21.50},{th:4,cpt:21.00},{th:8,cpt:20.75},
    {th:16,cpt:20.50},{th:32,cpt:20.28},{th:48,cpt:20.06},{th:64,cpt:19.86},
    {th:96,cpt:19.66},{th:128,cpt:19.46},{th:192,cpt:19.27},{th:256,cpt:19.07},
    {th:384,cpt:18.88},{th:512,cpt:18.69},{th:768,cpt:18.51},{th:1024,cpt:18.32},
    {th:1536,cpt:18.14},{th:2560,cpt:17.96},{th:3584,cpt:17.78},{th:5000,cpt:17.60}
  ];
  const MINER_CAP = 5000;      // TH per machine before a new 12W machine is required
  const EFF_UPGRADE_STEP = 2.67; // $/TH per 1 W/TH efficiency improvement
  const EFF_BEST = 12;         // best available efficiency
  const EFF_BASE_MAX = 15;       // ≥15 W/TH priced as 15 for upgrades
  const USD_GMT_FEE = 0.02;    // 2% fee when deploying fiat into TH/GMT
  const AMBASSADOR_RATE = 0.005; // 0.5% of referred TH revenue
  const AVATAR_DISCOUNT = 0.95; // 5% off upgrades / new-machine creation

  const FALLBACK = {
    btcPrice: 84000,
    gmtPrice: 0.285,
    difficulty: 113e12,
    avgTxFees: 0.15
  };
  const FX_FALLBACK = { USD: 1, EUR: 0.92, GBP: 0.79 };

  // ---- VIP Tiers ----
  const TIERS = [
    { n: 'Bronze I', th: 0, veg: 0, d: 0, rb: 0 },
    { n: "Bronze II", th: 5, veg: 50, d: 0.3, rb: 0 },
    { n: "Silver I", th: 10, veg: 100, d: 0.6, rb: 5 },
    { n: "Silver II", th: 25, veg: 250, d: 0.9, rb: 0 },
    { n: "Silver III", th: 50, veg: 500, d: 1.2, rb: 0 },
    { n: "Gold I", th: 100, veg: 1000, d: 1.5, rb: 0 },
    { n: "Gold II", th: 200, veg: 2000, d: 1.8, rb: 0 },
    { n: "Platinum I", th: 500, veg: 5000, d: 2.1, rb: 0 },
    { n: "Platinum II", th: 1000, veg: 10000, d: 2.4, rb: 0 },
    { n: "Platinum III", th: 2500, veg: 25000, d: 2.7, rb: 0 },
    { n: "Diamond I", th: 5000, veg: 50000, d: 3.0, rb: 10 },
    { n: "Diamond II", th: 7000, veg: 70000, d: 3.3, rb: 0 },
    { n: "Diamond III", th: 9000, veg: 90000, d: 3.6, rb: 0 },
    { n: "Diamond IV", th: 12000, veg: 120000, d: 3.9, rb: 0 },
    { n: "Diamond V", th: 20000, veg: 200000, d: 4.2, rb: 0 },
    { n: "Legend I", th: 50000, veg: 500000, d: 4.5, rb: 0 },
    { n: "Legend II", th: 100000, veg: 1000000, d: 4.8, rb: 0 },
    { n: "Legend III", th: 250000, veg: 2500000, d: 5.1, rb: 0 },
    { n: "Legend IV", th: 400000, veg: 4000000, d: 5.4, rb: 0 },
    { n: "Legend V", th: 750000, veg: 7500000, d: 5.7, rb: 0 },
    { n: "Elite", th: 1000000, veg: 10000000, d: 6.0, rb: 0 }
  ];

  // ---- State ----
  const state = {
    btcPrice: 0,
    gmtPrice: 0,
    difficulty: 0,
    satsPerTHDay: 0,
    lastUpdated: null,
    currency: 'USD',
    fx: { ...FX_FALLBACK }
  };

  // ---- Profiles ----
  let profiles = [];
  let activeProfileName = 'Default';

  // ---- DOM helpers ----
  const $ = (id) => document.getElementById(id);
  const CURRENCY_LOCALES = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };
  const formatCurrency = (v, digits = 2) => {
    const rate = (state.fx && state.fx[state.currency]) || 1;
    const locale = CURRENCY_LOCALES[state.currency] || 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: state.currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(v * rate);
  };
  const fmtUSD = formatCurrency;
  const fmtBTC = (v) => v.toFixed(8) + ' BTC';
  const fmtNum = (v, digits = 2) =>
    v.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });

  // ---- Animations ----
  let firstRenderDone = false;

  function parseNumberFromText(text) {
    if (!text) return 0;
    const cleaned = text.replace(/[^\d.\-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  function animateValue(el, endValue, formatter, duration = 800) {
    if (!el) return;
    const startValue = parseNumberFromText(el.textContent);
    if (startValue === endValue && el.textContent === formatter(endValue)) return;
    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = startValue + (endValue - startValue) * eased;
      el.textContent = formatter(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('active'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

    const revealEls = document.querySelectorAll('.reveal');
    // Activate above-the-fold elements immediately to avoid any flash
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        el.classList.add('active');
      } else {
        observer.observe(el);
      }
    });
  }

  // ---- Calculations ----
  function satsPerTHDay(difficulty) {
    return ((1e12 * 86400 * BLOCK_SUBSIDY) / (difficulty * 2 ** 32)) * 1e8;
  }

  function dailyBTCperTH(difficulty) {
    return Math.round(satsPerTHDay(difficulty)) / 1e8;
  }

  function vipTier(th, lockedGMT) {
    let t = TIERS[0];
    for (const x of TIERS) {
      if (th >= x.th || lockedGMT >= x.veg) t = x;
    }
    return t;
  }

  // ---- TH cost helpers ----
  function cptTier(tiers, th) {
    if (th <= 0) return tiers[0].cpt;
    const last = tiers[tiers.length - 1];
    if (th >= last.th) return last.cpt;
    for (let i = 0; i < tiers.length - 1; i++) {
      const lo = tiers[i], hi = tiers[i + 1];
      if (th >= lo.th && th <= hi.th) {
        const pct = (th - lo.th) / (hi.th - lo.th);
        return lo.cpt + (hi.cpt - lo.cpt) * pct;
      }
    }
    return tiers[0].cpt;
  }

  function estimateCPT(th, avatarDisc = false) {
    return cptTier(TH_TIERS, th) * (avatarDisc ? AVATAR_DISCOUNT : 1);
  }

  function thForBudget(budget, avatarDisc = false) {
    if (budget <= 0) return 0;
    const maxCpt = TH_TIERS[TH_TIERS.length - 1].cpt;
    let lo = 0, hi = budget / maxCpt;
    for (let k = 0; k < 50; k++) {
      const mid = (lo + hi) / 2;
      if (mid * estimateCPT(mid, avatarDisc) < budget) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function estimateCPT12(th, avatarDisc = false) {
    return cptTier(TH_TIERS_12W, th) * (avatarDisc ? AVATAR_DISCOUNT : 1);
  }

  function thForBudgetTiers(budget, tiers, avatarDisc = false) {
    if (budget <= 0) return 0;
    const maxCpt = tiers[tiers.length - 1].cpt;
    let lo = 0, hi = budget / maxCpt;
    for (let k = 0; k < 50; k++) {
      const mid = (lo + hi) / 2;
      if (mid * cptTier(tiers, mid) * (avatarDisc ? AVATAR_DISCOUNT : 1) < budget) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function effUpgradeCostPerTH(curW, avatarDisc = false) {
    return EFF_UPGRADE_STEP * Math.max(0, Math.min(curW, EFF_BASE_MAX) - EFF_BEST) * (avatarDisc ? AVATAR_DISCOUNT : 1);
  }

  function tokenDiscount(lockedGMT, gmtPrice, dailyGrossFee) {
    if (dailyGrossFee <= 0) return 0;
    const lockedUSD = lockedGMT * gmtPrice;
    const daysCovered = lockedUSD / dailyGrossFee;
    const pct = daysCovered / COV_DAYS_PER_PCT;
    return Math.min(MAX_TOKEN_DISCOUNT, Math.max(0, pct));
  }

  // Stateless calculation used by both dashboard and planner
  function calculateState({ th, wth, lockedGMT, streak = false, payGMT = false, discOverride = null, greedyInitial = 0, avatarDisc = false, ambassadorTH = 0 }) {
    const bp = state.btcPrice || FALLBACK.btcPrice;
    const gp = state.gmtPrice || FALLBACK.gmtPrice;
    const diff = state.difficulty || FALLBACK.difficulty;

    const dbt = dailyBTCperTH(diff);
    const dailyRevBTC = dbt * th;
    const dailyRevUSD = dailyRevBTC * bp;

    // Fees (pay-in-GMT gives a flat 8% reduction on gross fees)
    const gmtFeeMult = payGMT ? 0.92 : 1;
    const electricityFee = ((wth * th * 24 * ELECTRICITY_RATE) / 1000) * gmtFeeMult;
    const serviceFee = SERVICE_RATE * th * gmtFeeMult;
    const grossFeeUSD = electricityFee + serviceFee;

    // Greedy Machine initial marketplace TH does not count toward VIP tier
    const vipTh = Math.max(0, th - greedyInitial);
    const vip = vipTier(vipTh, lockedGMT);
    const vipDisc = vip.d;
    const tokDisc = tokenDiscount(lockedGMT, gp, grossFeeUSD);
    let totalDiscount;
    if (discOverride !== null && discOverride >= 0) {
      totalDiscount = Math.min(MAX_TOKEN_DISCOUNT, discOverride) / 100;
    } else {
      totalDiscount = Math.min(MAX_TOKEN_DISCOUNT, vipDisc + tokDisc) / 100;
    }

    const discountedFees = grossFeeUSD * (1 - totalDiscount);
    const conversionFee = Math.max(0, dailyRevUSD - discountedFees) * CONVERSION_FEE;

    let dailyNetUSD = dailyRevUSD - discountedFees - conversionFee;
    if (streak) dailyNetUSD *= 1.005; // approximates a 7-day login click-streak loyalty bonus

    const dailyNetBTC = bp > 0 ? dailyNetUSD / bp : 0;

    // Staking on locked GMT
    const stakingDailyUSD = lockedGMT * (GMT_STAKING_APR / 100) / 365 * gp;

    // Ambassador reward from referred TH (USDT per day)
    const ambassadorDailyUSD = (ambassadorTH || 0) * dbt * bp * AMBASSADOR_RATE;

    const totalDailyUSD = dailyNetUSD + stakingDailyUSD + ambassadorDailyUSD;
    const totalMonthlyUSD = totalDailyUSD * 30;

    return {
      th,
      wth,
      lockedGMT,
      bp,
      gp,
      dbt,
      dailyRevBTC,
      dailyRevUSD,
      electricityFee,
      serviceFee,
      grossFeeUSD,
      vip,
      vipDisc,
      tokDisc,
      totalDiscount,
      discountedFees,
      conversionFee,
      dailyNetUSD,
      dailyNetBTC,
      stakingDailyUSD,
      ambassadorDailyUSD,
      totalDailyUSD,
      totalMonthlyUSD
    };
  }

  // Read dashboard inputs and compute
  function calculate() {
    const discOverride = parseFloat($('inDiscOverride')?.value);
    return calculateState({
      th: parseFloat($('inTH').value) || 0,
      wth: parseFloat($('inWTH').value) || 0,
      lockedGMT: parseFloat($('inLocked').value) || 0,
      streak: $('inStreak').checked,
      payGMT: $('inPayGMT').checked,
      discOverride: isNaN(discOverride) ? null : discOverride,
      greedyInitial: getGreedyInitial(),
      avatarDisc: getAvatarDisc(),
      ambassadorTH: getAmbassadorTH()
    });
  }

  function getGreedyInitial() {
    if (!$('inHasGreedy')?.checked) return 0;
    const th = parseFloat($('inTH')?.value) || 0;
    const initial = parseFloat($('inGreedyInitial')?.value) || 0;
    return Math.min(initial, th);
  }

  function getGreedyGrowth() {
    return $('inHasGreedy')?.checked ? (parseFloat($('inGreedyGrowth')?.value) || 0) : 0;
  }

  function getAvatarDisc() {
    return !!$('inAvatarDisc')?.checked;
  }

  function getAmbassadorTH() {
    return $('inAmbassador')?.checked ? (parseFloat($('inReferredTH')?.value) || 0) : 0;
  }

  // ---- Planner ----
  // Greedy marginal allocation inspired by OLD_INSPIRATION optimalSplit().
  // At each small step we evaluate four paths and pick the one with the highest
  // monthly uplift: lock GMT, buy 15 W/TH upgrade, buy new 12 W/TH, upgrade efficiency.
  function findOptimalAllocation({ usdCash = 0, gmtBalance = 0, targetMinerTH, avatarDisc = false }) {
    const base = calculate();
    const gp = state.gmtPrice || FALLBACK.gmtPrice;
    const streak = $('inStreak').checked;
    const payGMT = $('inPayGMT').checked;

    // Guard against invalid price feeds to avoid divide-by-zero
    const safeGp = gp > 0 ? gp : (FALLBACK.gmtPrice || 0.285);

    // Effective purchasing power: existing GMT has no fee, fiat pays 2% to enter GMT/TH
    const gmtUSD = Math.max(0, gmtBalance) * safeGp;
    const usdUSD = Math.max(0, usdCash) * (1 - USD_GMT_FEE);
    const K = gmtUSD + usdUSD;

    if (K <= 0) return null;

    const minerTH = Math.max(0, targetMinerTH || base.th);
    const cptU = effUpgradeCostPerTH(base.wth, avatarDisc);
    const STEPS = 60;
    const incr = K / STEPS;

    // s tracks incremental changes on top of the base farm
    const s = { th: base.th, wth: base.wth, lockedGMT: base.lockedGMT, th15: 0, th12: 0, effTH: 0 };
    const spent = { lock: 0, th15: 0, th12: 0, eff: 0 }; // effective USD
    const greedyInitial = getGreedyInitial();
    const ambassadorTH = getAmbassadorTH();

    const resultOf = (st) => calculateState({
      th: st.th,
      wth: st.wth,
      lockedGMT: st.lockedGMT,
      streak,
      payGMT,
      greedyInitial,
      avatarDisc,
      ambassadorTH
    });

    const baseResult = resultOf(s);
    let cur = baseResult;

    for (let step = 0; step < STEPS; step++) {
      let bestROI = -Infinity;
      let winner = null;
      let winnerState = null;
      let winnerSpent = 0;
      let winnerKey = '';

      // 1) Lock GMT
      const lockSt = { ...s, lockedGMT: s.lockedGMT + incr / safeGp };
      const lockRes = resultOf(lockSt);
      const lockROI = lockRes.totalMonthlyUSD - cur.totalMonthlyUSD;
      if (lockROI > bestROI) {
        bestROI = lockROI;
        winner = lockSt;
        winnerSpent = incr;
        winnerKey = 'lock';
      }

      // 2) Buy 15 W/TH upgrade (existing machine) while there is room under MINER_CAP
      const room = Math.max(0, MINER_CAP - s.th15);
      if (room > 0.01) {
        const dth = Math.min(room, thForBudget(incr, avatarDisc));
        if (dth > 0.01) {
          const newTH = s.th + dth;
          const newWth = (s.th * s.wth + dth * EFF_BASE_MAX) / newTH;
          const th15St = { ...s, th: newTH, wth: newWth, th15: s.th15 + dth };
          const th15Res = resultOf(th15St);
          const th15ROI = th15Res.totalMonthlyUSD - cur.totalMonthlyUSD;
          if (th15ROI > bestROI) {
            bestROI = th15ROI;
            winner = th15St;
            winnerSpent = incr;
            winnerKey = 'th15';
          }
        }
      }

      // 3) Buy new 12 W/TH miner
      const dth12 = thForBudgetTiers(incr, TH_TIERS_12W, avatarDisc);
      if (dth12 > 0.01) {
        const newTH = s.th + dth12;
        const newWth = (s.th * s.wth + dth12 * EFF_BEST) / newTH;
        const th12St = { ...s, th: newTH, wth: newWth, th12: s.th12 + dth12 };
        const th12Res = resultOf(th12St);
        const th12ROI = th12Res.totalMonthlyUSD - cur.totalMonthlyUSD;
        if (th12ROI > bestROI) {
          bestROI = th12ROI;
          winner = th12St;
          winnerSpent = incr;
          winnerKey = 'th12';
        }
      }

      // 4) Upgrade efficiency of the target miner toward 12 W/TH
      if (cptU > 0 && s.th > 0 && s.effTH < minerTH - 0.01) {
        const effDth = Math.min(minerTH - s.effTH, incr / cptU);
        if (effDth > 0.01) {
          // Reduce the farm's average W/TH by upgrading effDth TH from current W/TH to EFF_BEST
          const newWth = (s.th * s.wth - effDth * (s.wth - EFF_BEST)) / s.th;
          const effSt = { ...s, wth: Math.max(EFF_BEST, newWth), effTH: s.effTH + effDth };
          const effRes = resultOf(effSt);
          const effROI = effRes.totalMonthlyUSD - cur.totalMonthlyUSD;
          if (effROI > bestROI) {
            bestROI = effROI;
            winner = effSt;
            winnerSpent = incr;
            winnerKey = 'eff';
          }
        }
      }

      if (!winner || bestROI <= -Infinity) break;

      // Commit winner
      Object.assign(s, winner);
      if (winnerKey === 'lock') spent.lock += winnerSpent;
      else if (winnerKey === 'th15') spent.th15 += winnerSpent;
      else if (winnerKey === 'th12') spent.th12 += winnerSpent;
      else if (winnerKey === 'eff') spent.eff += winnerSpent;
      cur = resultOf(s);
    }

    const final = resultOf(s);

    return {
      baseMonthly: baseResult.totalMonthlyUSD,
      finalMonthly: final.totalMonthlyUSD,
      uplift: final.totalMonthlyUSD - baseResult.totalMonthlyUSD,
      finalTH: final.th,
      finalWth: final.wth,
      finalLockedGMT: final.lockedGMT,
      finalTier: final.vip.n,
      finalDiscount: final.totalDiscount,
      addedTH15: s.th15,
      addedTH12: s.th12,
      upgradedEffTH: s.effTH,
      lockedGMTAdd: s.lockedGMT - base.lockedGMT,
      spent
    };
  }

  // ---- Rendering ----
  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function updateTicker() {
    const bp = state.btcPrice || FALLBACK.btcPrice;
    const gp = state.gmtPrice || FALLBACK.gmtPrice;
    const diff = state.difficulty || FALLBACK.difficulty;
    const sats = state.satsPerTHDay || satsPerTHDay(diff);

    const items = {
      btc: `BTC <strong>${fmtUSD(bp, bp >= 10000 ? 0 : 2)}</strong>`,
      gmt: `GMT <strong>$${gp.toFixed(4)}</strong>`,
      diff: `Diff <strong>${(diff / 1e12).toFixed(2)}T</strong>`,
      sats: `Sats/TH/day <strong>${Math.round(sats).toLocaleString()}</strong>`
    };

    document.querySelectorAll('.ticker-item').forEach((el) => {
      const key = el.dataset.key;
      if (items[key]) el.innerHTML = items[key];
    });
  }

  function updateBreakdown(r) {
    const max = Math.max(r.dailyRevUSD, 1);
    const pct = (v) => Math.min(100, (Math.abs(v) / max) * 100);

    setText('rowGross', fmtUSD(r.dailyRevUSD));
    setText('rowElec', '-' + fmtUSD(r.electricityFee));
    setText('rowSvc', '-' + fmtUSD(r.serviceFee));
    setText('rowConv', '-' + fmtUSD(r.conversionFee));
    setText('rowStaking', '+' + fmtUSD(r.stakingDailyUSD));
    setText('rowTotal', fmtUSD(r.totalDailyUSD));

    const bars = [
      ['rowGross', 100],
      ['rowElec', pct(r.electricityFee)],
      ['rowSvc', pct(r.serviceFee)],
      ['rowConv', pct(r.conversionFee)],
      ['rowStaking', pct(r.stakingDailyUSD)],
      ['rowTotal', pct(r.totalDailyUSD)]
    ];

    bars.forEach(([id, w]) => {
      const row = $(id)?.closest('.breakdown-row');
      const bar = row?.querySelector('.breakdown-bar span');
      if (bar) bar.style.width = w + '%';
    });
  }

  function render() {
    const r = calculate();

    if (!firstRenderDone) {
      animateValue($('outDailyNet'), r.dailyNetUSD, fmtUSD, 900);
      animateValue($('outDailyBTC'), r.dailyNetBTC, fmtBTC, 900);
      animateValue($('outMonthlyNet'), r.totalMonthlyUSD, fmtUSD, 900);
      animateValue($('outDiscount'), r.totalDiscount * 100, (v) => v.toFixed(1) + '%', 900);
      firstRenderDone = true;
    } else {
      setText('outDailyNet', fmtUSD(r.dailyNetUSD));
      setText('outDailyBTC', fmtBTC(r.dailyNetBTC));
      setText('outMonthlyNet', fmtUSD(r.totalMonthlyUSD));
      setText('outDiscount', (r.totalDiscount * 100).toFixed(1) + '%');
    }
    setText('outTier', r.vip.n);
    setText('outTierSub', `${fmtNum(r.th, 0)} TH · ${fmtNum(r.lockedGMT, 0)} GMT`);

    updateBreakdown(r);
    renderProjection();
    renderVipStack(r);
    renderReinvestmentSignal();
  }

  function renderReinvestmentSignal() {
    const th = parseFloat($('inTH').value) || 0;
    const wth = parseFloat($('inWTH').value) || 0;
    const locked = parseFloat($('inLocked').value) || 0;
    const streak = $('inStreak')?.checked ?? false;
    const payGMT = $('inPayGMT')?.checked ?? false;
    const greedyInitial = getGreedyInitial();
    const avatarDisc = getAvatarDisc();
    const ambassadorTH = getAmbassadorTH();

    const discOverride = parseFloat($('inDiscOverride')?.value);
    const override = isNaN(discOverride) ? null : discOverride;
    const common = { lockedGMT: locked, streak, payGMT, discOverride: override, greedyInitial, avatarDisc, ambassadorTH };
    const base = calculateState({ th, wth, ...common });
    const invest = 1000;
    const gp = state.gmtPrice || FALLBACK.gmtPrice;

    const thAdded = thForBudget(invest * (1 - USD_GMT_FEE), avatarDisc);
    const simTH = calculateState({ th: th + thAdded, wth, ...common });
    const gmtAdded = invest / (gp || FALLBACK.gmtPrice);
    const simGMT = calculateState({ th, wth, lockedGMT: locked + gmtAdded, ...common });

    const gainTH = Math.max(0, simTH.totalMonthlyUSD - base.totalMonthlyUSD);
    const gainGMT = Math.max(0, simGMT.totalMonthlyUSD - base.totalMonthlyUSD);

    let signal = 'Hold / Balanced';
    if (gainTH > gainGMT * 1.1) signal = 'Buy TH';
    else if (gainGMT > gainTH * 1.1) signal = 'Lock GMT';

    setText('outReinvestSignal', signal);
    setText('outReinvestThGain', '+' + fmtUSD(gainTH) + ' / mo');
    setText('outReinvestGmtGain', '+' + fmtUSD(gainGMT) + ' / mo');
  }

  function nextTierProgress(th, lockedGMT) {
    const current = vipTier(th, lockedGMT);
    const idx = TIERS.indexOf(current);
    const next = TIERS[idx + 1];
    if (!next) return null;
    const thNeed = Math.max(0, next.th - th);
    const gmtNeed = Math.max(0, next.veg - lockedGMT);
    const thProgress = next.th > 0 ? Math.min(1, th / next.th) : 1;
    const gmtProgress = next.veg > 0 ? Math.min(1, lockedGMT / next.veg) : 1;
    return { next, thNeed, gmtNeed, thProgress, gmtProgress };
  }

  function renderVipStack(r) {
    const prog = nextTierProgress(r.th, r.lockedGMT);
    const overrideVal = parseFloat($('inDiscOverride')?.value);
    const overrideActive = !isNaN(overrideVal) && overrideVal >= 0;

    setText('outVipTier', r.vip.n);
    setText('outVipDisc', r.vip.d.toFixed(1) + '%');
    setText('outTokenDisc', r.tokDisc.toFixed(1) + '%');
    setText('outTotalDisc', (r.totalDiscount * 100).toFixed(1) + '%');
    setText('outDiscOverrideStatus', overrideActive ? 'Override attivo' : 'Automatico');

    const nextEl = $('outNextTier');
    if (nextEl) {
      if (prog) {
        nextEl.textContent = `${prog.next.n} — serve ${fmtNum(prog.thNeed, 0)} TH oppure ${fmtNum(prog.gmtNeed, 0)} GMT`;
        const thBar = $('nextTierThProg')?.querySelector('span');
        const gmtBar = $('nextTierGmtProg')?.querySelector('span');
        if (thBar) thBar.style.width = (prog.thProgress * 100).toFixed(1) + '%';
        if (gmtBar) gmtBar.style.width = (prog.gmtProgress * 100).toFixed(1) + '%';
      } else {
        nextEl.textContent = 'Tier massimo raggiunto';
      }
    }
  }

  function renderPlanner() {
    const usdCash = parseFloat($('plUsdCash').value) || 0;
    const gmtBalance = parseFloat($('plGmtBalance').value) || 0;
    const targetMinerTH = parseFloat($('plTargetMinerTH').value) || 0;

    if (usdCash <= 0 && gmtBalance <= 0) {
      setText('plResultTitle', 'Enter capital to see the optimal allocation step-by-step.');
      $('plResult')?.classList.add('empty');
      return;
    }

    $('plResult')?.classList.remove('empty');
    const best = findOptimalAllocation({ usdCash, gmtBalance, targetMinerTH, avatarDisc: getAvatarDisc() });
    if (!best) return;

    const totalSpent = best.spent.lock + best.spent.th15 + best.spent.th12 + best.spent.eff;
    const pct = (val) => totalSpent > 0 ? (val / totalSpent * 100) : 0;

    const barLock = $('plBarLock');
    const barTH15 = $('plBarTH15');
    const barTH12 = $('plBarTH12');
    const barEff = $('plBarEff');
    if (barLock) barLock.style.width = pct(best.spent.lock) + '%';
    if (barTH15) barTH15.style.width = pct(best.spent.th15) + '%';
    if (barTH12) barTH12.style.width = pct(best.spent.th12) + '%';
    if (barEff) barEff.style.width = pct(best.spent.eff) + '%';

    setText('plPctLock', pct(best.spent.lock).toFixed(1) + '%');
    setText('plPctTH15', pct(best.spent.th15).toFixed(1) + '%');
    setText('plPctTH12', pct(best.spent.th12).toFixed(1) + '%');
    setText('plPctEff', pct(best.spent.eff).toFixed(1) + '%');

    setText('plAddedTH', fmtNum(best.addedTH15 + best.addedTH12, 1) + ' TH');
    setText('plFinalTH', `Final: ${fmtNum(best.finalTH, 1)} TH`);
    setText('plAddedGMT', fmtNum(best.lockedGMTAdd, 0) + ' GMT');
    setText('plFinalGMT', `Final: ${fmtNum(best.finalLockedGMT, 0)} GMT`);
    setText('plEffUp', fmtNum(best.upgradedEffTH, 1) + ' TH');
    setText('plFinalWth', `Final: ${best.finalWth.toFixed(2)} W/TH`);
    setText('plMonthly', fmtUSD(best.finalMonthly));
    setText('plUplift', best.uplift <= 0 ? 'No uplift' : '+' + fmtUSD(best.uplift));
    setText('plNewTier', best.finalTier);
    setText('plNewDiscount', (best.finalDiscount * 100).toFixed(1) + '%');

    setText('plResultTitle', best.uplift <= 0
      ? 'Best move: hold cash — no allocation improves income within limits.'
      : 'Optimal allocation for $' + fmtNum(totalSpent, 0));
  }

  // ---- API ----
  async function fetchWithTimeout(url, ms = 10000) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  }

  async function fetchBTCPrice() {
    try {
      const data = await fetchWithTimeout('https://api.coinpaprika.com/v1/tickers/btc-bitcoin');
      const price = data?.quotes?.USD?.price;
      if (price) return price;
    } catch { /* try next source */ }
    try {
      const data = await fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', 8000);
      const price = data?.bitcoin?.usd;
      if (price) return price;
    } catch { /* try next source */ }
    try {
      const data = await fetchWithTimeout('https://mempool.space/api/v1/prices', 8000);
      const price = data?.USD;
      if (price) return price;
    } catch { /* fall through */ }
    return FALLBACK.btcPrice;
  }

  async function fetchGMTPrice() {
    try {
      const data = await fetchWithTimeout('https://api.coinpaprika.com/v1/tickers/gomining-gomining-token');
      const price = data?.quotes?.USD?.price;
      if (price) return price;
    } catch { /* try next source */ }
    try {
      const data = await fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=gmt-token&vs_currencies=usd', 8000);
      const price = data?.['gmt-token']?.usd;
      if (price) return price;
    } catch { /* fall through */ }
    return FALLBACK.gmtPrice;
  }

  async function fetchDifficulty() {
    try {
      const data = await fetchWithTimeout('https://mempool.space/api/v1/mining/hashrate/3d');
      const diff = data?.currentDifficulty;
      if (diff) return diff;
    } catch { /* fall through */ }
    return FALLBACK.difficulty;
  }

  async function fetchExchangeRates() {
    try {
      const data = await fetchWithTimeout('https://api.frankfurter.dev/v1/latest?from=USD&to=EUR,GBP', 8000);
      if (data && data.rates) {
        state.fx = { USD: 1, ...data.rates };
        return;
      }
    } catch { /* fall through */ }
    state.fx = { ...FX_FALLBACK };
  }

  async function refreshData() {
    try {
      const [btc, gmt, diff] = await Promise.all([
        fetchBTCPrice(),
        fetchGMTPrice(),
        fetchDifficulty()
      ]);

      state.btcPrice = btc;
      state.gmtPrice = gmt;
      state.difficulty = diff;
      state.satsPerTHDay = satsPerTHDay(diff);
      state.lastUpdated = new Date();

      updateTicker();
      render();
      renderPlanner();
    } catch (e) {
      console.warn('MiningFlow: failed to refresh live data, using fallbacks.', e);
      state.btcPrice = FALLBACK.btcPrice;
      state.gmtPrice = FALLBACK.gmtPrice;
      state.difficulty = FALLBACK.difficulty;
      state.satsPerTHDay = satsPerTHDay(FALLBACK.difficulty);
      updateTicker();
      render();
      renderPlanner();
    }
  }

  // ---- Projection ----
  function halvingMultiplier(date) {
    // Approximate halving dates (post-2024 halvings)
    if (date >= new Date('2040-04-15')) return 0.0625;
    if (date >= new Date('2036-04-15')) return 0.125;
    if (date >= new Date('2032-04-15')) return 0.25;
    if (date >= new Date('2028-04-15')) return 0.5;
    return 1;
  }

  function projectGrowth({ years = 3, btcGrowth = 0, reinvest = false, useDiff = true }) {
    const base = calculate();
    if (base.th <= 0 && base.lockedGMT <= 0) return null;

    const gmtPrice = base.gp || FALLBACK.gmtPrice;
    const avatarDisc = getAvatarDisc();
    const initialCapital = base.th * estimateCPT(base.th, avatarDisc) + base.lockedGMT * gmtPrice;
    const greedyGrowth = getGreedyGrowth() / 100;
    const ambassadorTH = getAmbassadorTH();

    let curTH = base.th;
    let curTotalW = base.th * base.wth;
    let curGMT = base.lockedGMT;
    let diffMult = 1;
    let cumProfit = 0;
    let breakEvenMonth = -1;
    const monthlyData = [];
    const date = new Date();
    const halvingYears = [2028, 2032, 2036, 2040];
    const WEEKS_PER_MONTH = 30.44 / 7;

    for (let m = 1; m <= years * 12; m++) {
      date.setMonth(date.getMonth() + 1);
      const Y = m / 12;
      const halvingMult = halvingMultiplier(date);

      // Greedy Machine passive weekly growth compounds each month
      if (greedyGrowth > 0) {
        curTH *= Math.pow(1 + greedyGrowth, WEEKS_PER_MONTH);
        curTotalW = curTH * base.wth;
      }

      const curBP = base.bp * Math.pow(1 + btcGrowth / 100, Y);
      const marginalDailyBTC = (0.0012 * EFF_BASE_MAX + SERVICE_RATE) / curBP;

      if (useDiff) {
        const g = 0.05 + 0.2 * Math.exp(-Y / 4);
        diffMult *= (1 + g / 12);
      }

      let dailyBTCperTH = (base.dbt * halvingMult) / diffMult;
      if (useDiff && dailyBTCperTH < marginalDailyBTC) {
        dailyBTCperTH = marginalDailyBTC;
      }

      const sim = calculateState({
        th: curTH,
        wth: curTH > 0 ? (curTotalW / curTH) : EFF_BASE_MAX,
        lockedGMT: curGMT,
        streak: $('inStreak')?.checked,
        payGMT: $('inPayGMT')?.checked,
        greedyInitial: getGreedyInitial(),
        avatarDisc
      });

      const dailyRevUSD = dailyBTCperTH * curTH * curBP;
      const conversionFee = Math.max(0, dailyRevUSD - sim.discountedFees) * CONVERSION_FEE;
      let dailyNetUSD = dailyRevUSD - sim.discountedFees - conversionFee;
      if ($('inStreak')?.checked) dailyNetUSD *= 1.005;

      const stakingDaily = (curGMT * (GMT_STAKING_APR / 100) / 365) * gmtPrice;
      // Ambassador reward is kept outside calculateState in projections to avoid double-counting
      const ambassadorDaily = ambassadorTH * dailyBTCperTH * curBP * AMBASSADOR_RATE;
      const monthProfit = (dailyNetUSD + stakingDaily + ambassadorDaily) * 30;
      cumProfit += monthProfit;

      if (breakEvenMonth === -1 && cumProfit >= initialCapital && initialCapital > 0) {
        breakEvenMonth = m;
      }

      if (reinvest && monthProfit > 0) {
        const thCost = estimateCPT(curTH, avatarDisc);
        const gmtPriceSafe = gmtPrice > 0 ? gmtPrice : FALLBACK.gmtPrice;
        // 90% TH, 10% GMT keeps discount coverage growing; new TH modeled at 15 W/TH
        const thBought = (monthProfit * 0.9) / (thCost || 1);
        const gmtBought = (monthProfit * 0.1) / (gmtPriceSafe || 1);
        curTotalW += thBought * EFF_BASE_MAX;
        curTH += thBought;
        curGMT += gmtBought;
      }

      monthlyData.push({
        m,
        income: monthProfit,
        cumProfit,
        isHalving: halvingYears.includes(date.getFullYear()) && date.getMonth() === 3
      });
    }

    return { monthlyData, breakEvenMonth, initialCapital };
  }

  function drawProjChart(data) {
    const canvas = $('projChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = 200;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!data.length) return;

    const maxInc = Math.max(...data.map((d) => d.income), 10);
    const maxCum = Math.max(...data.map((d) => d.cumProfit), 10);
    const barW = Math.max(2, (w / data.length) - 2);

    // Halving markers
    data.forEach((d, i) => {
      if (d.isHalving) {
        const x = (i / (data.length - 1)) * (w - barW) + barW / 2;
        ctx.fillStyle = 'rgba(245, 166, 35, 0.15)';
        ctx.fillRect(x - 1, 0, 2, h);
      }
    });

    // Income bars
    data.forEach((d, i) => {
      const x = (i / (data.length - 1)) * (w - barW);
      const barH = (Math.max(0, d.income) / maxInc) * h * 0.75;
      ctx.fillStyle = 'rgba(78, 207, 250, 0.6)';
      ctx.fillRect(x, h - barH, barW, barH);
    });

    // Cumulative profit line
    ctx.beginPath();
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    data.forEach((d, i) => {
      const x = (i / (data.length - 1)) * (w - barW) + barW / 2;
      const y = h - (Math.max(0, d.cumProfit) / maxCum) * h * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function renderProjection() {
    const years = parseInt($('pjYears')?.value) || 3;
    const btcGrowth = parseFloat($('pjBtcGrowth')?.value) || 0;
    const reinvest = $('pjReinvest')?.checked || false;
    const useDiff = $('pjDiffGrowth')?.checked ?? true;

    const result = projectGrowth({ years, btcGrowth, reinvest, useDiff });
    if (!result || !result.monthlyData.length) return;

    drawProjChart(result.monthlyData);

    const last = result.monthlyData[result.monthlyData.length - 1];
    setText('pjResultBE', result.breakEvenMonth > 0 ? `Month ${result.breakEvenMonth}` : 'Never');
    setText('pjResultCum', fmtUSD(last.cumProfit));
    setText('pjResultFinalInc', fmtUSD(last.income) + '/mo');
  }

  // ---- Interactions ----
  function showToast(message) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function copyToClipboard(text, triggerBtn = null) {
    const copyAction = () => {
      if (triggerBtn) {
        const original = triggerBtn.textContent;
        triggerBtn.classList.add('copied');
        triggerBtn.textContent = 'Copied';
        setTimeout(() => {
          triggerBtn.classList.remove('copied');
          triggerBtn.textContent = original;
        }, 2000);
      } else {
        showToast('Copied to clipboard');
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(copyAction).catch(() => showToast('Copy failed'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        copyAction();
      } catch {
        showToast('Copy failed');
      }
      document.body.removeChild(ta);
    }
  }

  function updateAdvancedVisibility() {
    const hasGreedy = $('inHasGreedy')?.checked ?? false;
    const ambassador = $('inAmbassador')?.checked ?? false;
    const greedyFields = $('greedyFields');
    const ambassadorFields = $('ambassadorFields');
    if (greedyFields) greedyFields.style.display = hasGreedy ? '' : 'none';
    if (ambassadorFields) ambassadorFields.style.display = ambassador ? '' : 'none';
  }

  // ---- Persistence & Sharing ----
  function getSetupParams() {
    const params = {
      th: $('inTH').value,
      wth: $('inWTH').value,
      locked: $('inLocked').value,
      streak: $('inStreak').checked ? '1' : '0',
      paygmt: $('inPayGMT').checked ? '1' : '0'
    };
    if ($('inCurrency')) params.cur = $('inCurrency').value;
    const disc = parseFloat($('inDiscOverride')?.value);
    if (!isNaN(disc)) params.disc = disc;

    // Advanced options
    const hasGreedy = $('inHasGreedy')?.checked ?? false;
    params.hasgreedy = hasGreedy ? '1' : '0';
    if (hasGreedy) {
      params.gth = $('inGreedyTH')?.value || '0';
      params.ginitial = $('inGreedyInitial')?.value || '0';
      params.ggrowth = $('inGreedyGrowth')?.value || '0';
    }
    const avatarDisc = $('inAvatarDisc')?.checked ?? false;
    params.avatar = avatarDisc ? '1' : '0';
    const ambassador = $('inAmbassador')?.checked ?? false;
    params.ambassador = ambassador ? '1' : '0';
    if (ambassador) params.refth = $('inReferredTH')?.value || '0';

    return new URLSearchParams(params);
  }

  function saveSetup() {
    try {
      const disc = parseFloat($('inDiscOverride')?.value);
      const setup = {
        th: parseFloat($('inTH').value) || 0,
        wth: parseFloat($('inWTH').value) || 0,
        locked: parseFloat($('inLocked').value) || 0,
        streak: $('inStreak').checked,
        payGMT: $('inPayGMT').checked,
        currency: state.currency,
        discOverride: isNaN(disc) ? null : disc,
        hasGreedy: $('inHasGreedy')?.checked ?? false,
        greedyTH: parseFloat($('inGreedyTH')?.value) || 0,
        greedyInitial: parseFloat($('inGreedyInitial')?.value) || 0,
        greedyGrowth: parseFloat($('inGreedyGrowth')?.value) || 0,
        avatarDisc: $('inAvatarDisc')?.checked ?? false,
        ambassador: $('inAmbassador')?.checked ?? false,
        referredTH: parseFloat($('inReferredTH')?.value) || 0
      };
      localStorage.setItem('miningflow_setup', JSON.stringify(setup));
    } catch { /* ignore storage errors */ }
  }

  function loadSetup({ skipLegacy = false } = {}) {
    // Load saved setup first so URL params can selectively override it.
    if (!skipLegacy) {
      try {
        const raw = localStorage.getItem('miningflow_setup');
        if (raw) {
          const setup = JSON.parse(raw);
          if (setup.th !== undefined) $('inTH').value = setup.th;
          if (setup.wth !== undefined) $('inWTH').value = setup.wth;
          if (setup.locked !== undefined) $('inLocked').value = setup.locked;
          if (setup.streak !== undefined) $('inStreak').checked = setup.streak;
          if (setup.payGMT !== undefined) $('inPayGMT').checked = setup.payGMT;
          if (setup.currency && $('inCurrency')) {
            state.currency = setup.currency;
            $('inCurrency').value = setup.currency;
          }
          if (setup.discOverride !== null && setup.discOverride !== undefined && $('inDiscOverride')) {
            $('inDiscOverride').value = setup.discOverride;
          }
          if ($('inHasGreedy')) $('inHasGreedy').checked = !!setup.hasGreedy;
          if ($('inGreedyTH')) $('inGreedyTH').value = setup.greedyTH ?? 0;
          if ($('inGreedyInitial')) $('inGreedyInitial').value = setup.greedyInitial ?? 0;
          if ($('inGreedyGrowth')) $('inGreedyGrowth').value = setup.greedyGrowth ?? 0.3;
          if ($('inAvatarDisc')) $('inAvatarDisc').checked = !!setup.avatarDisc;
          if ($('inAmbassador')) $('inAmbassador').checked = !!setup.ambassador;
          if ($('inReferredTH')) $('inReferredTH').value = setup.referredTH ?? 0;
          updateAdvancedVisibility();
        }
      } catch { /* ignore parse errors */ }
    }

    // Apply URL params on top (selective override).
    const params = new URLSearchParams(window.location.search);
    const th = parseFloat(params.get('th'));
    const wth = parseFloat(params.get('wth'));
    const locked = parseFloat(params.get('locked'));
    const streak = params.get('streak');
    const paygmt = params.get('paygmt');
    const cur = params.get('cur');
    const disc = parseFloat(params.get('disc'));

    if (!isNaN(th)) $('inTH').value = th;
    if (!isNaN(wth)) $('inWTH').value = wth;
    if (!isNaN(locked)) $('inLocked').value = locked;
    if (streak !== null) $('inStreak').checked = streak === '1';
    if (paygmt !== null) $('inPayGMT').checked = paygmt === '1';
    if (cur && ['USD', 'EUR', 'GBP'].includes(cur)) {
      state.currency = cur;
      if ($('inCurrency')) $('inCurrency').value = cur;
    }
    if (!isNaN(disc) && $('inDiscOverride')) $('inDiscOverride').value = disc;

    // Advanced options from URL
    const hasgreedy = params.get('hasgreedy');
    if (hasgreedy !== null && $('inHasGreedy')) $('inHasGreedy').checked = hasgreedy === '1';
    const gth = parseFloat(params.get('gth'));
    if (!isNaN(gth) && $('inGreedyTH')) $('inGreedyTH').value = gth;
    const ginitial = parseFloat(params.get('ginitial'));
    if (!isNaN(ginitial) && $('inGreedyInitial')) $('inGreedyInitial').value = ginitial;
    const ggrowth = parseFloat(params.get('ggrowth'));
    if (!isNaN(ggrowth) && $('inGreedyGrowth')) $('inGreedyGrowth').value = ggrowth;
    const avatar = params.get('avatar');
    if (avatar !== null && $('inAvatarDisc')) $('inAvatarDisc').checked = avatar === '1';
    const ambassador = params.get('ambassador');
    if (ambassador !== null && $('inAmbassador')) $('inAmbassador').checked = ambassador === '1';
    const refth = parseFloat(params.get('refth'));
    if (!isNaN(refth) && $('inReferredTH')) $('inReferredTH').value = refth;
    updateAdvancedVisibility();
  }

  function getShareableURL() {
    const params = getSetupParams();
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  // ---- Profiles ----
  function getCurrentSetup() {
    const disc = parseFloat($('inDiscOverride')?.value);
    return {
      th: parseFloat($('inTH').value) || 0,
      wth: parseFloat($('inWTH').value) || 0,
      locked: parseFloat($('inLocked').value) || 0,
      streak: $('inStreak')?.checked ?? false,
      payGMT: $('inPayGMT')?.checked ?? false,
      currency: state.currency,
      discOverride: isNaN(disc) ? null : disc,
      hasGreedy: $('inHasGreedy')?.checked ?? false,
      greedyTH: parseFloat($('inGreedyTH')?.value) || 0,
      greedyInitial: parseFloat($('inGreedyInitial')?.value) || 0,
      greedyGrowth: parseFloat($('inGreedyGrowth')?.value) || 0,
      avatarDisc: $('inAvatarDisc')?.checked ?? false,
      ambassador: $('inAmbassador')?.checked ?? false,
      referredTH: parseFloat($('inReferredTH')?.value) || 0
    };
  }

  function loadProfiles() {
    try {
      const raw = localStorage.getItem('miningflow_profiles');
      if (raw) profiles = JSON.parse(raw);
      const active = localStorage.getItem('miningflow_active_profile');
      if (active) activeProfileName = active;
    } catch { /* ignore parse errors */ }
    if (!Array.isArray(profiles)) profiles = [];
    if (!profiles.find(p => p.name === activeProfileName)) {
      activeProfileName = profiles[0]?.name || 'Default';
    }
  }

  function saveProfiles() {
    try {
      localStorage.setItem('miningflow_profiles', JSON.stringify(profiles));
      localStorage.setItem('miningflow_active_profile', activeProfileName);
    } catch { /* ignore storage errors */ }
  }

  function updateProfileSelect() {
    const sel = $('profileSelect');
    if (!sel) return;
    sel.innerHTML = '';
    profiles.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = p.name;
      if (p.name === activeProfileName) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function applyProfile(name, { silent = false } = {}) {
    const p = profiles.find(x => x.name === name);
    if (!p) return;
    $('inTH').value = p.th ?? 0;
    $('inWTH').value = p.wth ?? 0;
    $('inLocked').value = p.locked ?? 0;
    $('inStreak').checked = p.streak ?? false;
    $('inPayGMT').checked = p.payGMT ?? false;
    state.currency = p.currency || 'USD';
    if ($('inCurrency')) $('inCurrency').value = state.currency;
    if ($('inDiscOverride')) {
      $('inDiscOverride').value = (p.discOverride !== null && p.discOverride !== undefined) ? p.discOverride : '';
    }
    if ($('inHasGreedy')) $('inHasGreedy').checked = p.hasGreedy ?? false;
    if ($('inGreedyTH')) $('inGreedyTH').value = p.greedyTH ?? 0;
    if ($('inGreedyInitial')) $('inGreedyInitial').value = p.greedyInitial ?? 0;
    if ($('inGreedyGrowth')) $('inGreedyGrowth').value = p.greedyGrowth ?? 0.3;
    if ($('inAvatarDisc')) $('inAvatarDisc').checked = p.avatarDisc ?? false;
    if ($('inAmbassador')) $('inAmbassador').checked = p.ambassador ?? false;
    if ($('inReferredTH')) $('inReferredTH').value = p.referredTH ?? 0;
    updateAdvancedVisibility();
    activeProfileName = name;
    updateProfileSelect();
    render();
    if (!silent) showToast('Profile loaded: ' + name);
  }

  function saveCurrentProfile() {
    const p = profiles.find(x => x.name === activeProfileName);
    if (!p) return;
    Object.assign(p, getCurrentSetup());
    saveProfiles();
  }

  function createProfile(name) {
    if (!name || profiles.find(p => p.name === name)) return;
    profiles.push({ name, ...getCurrentSetup() });
    activeProfileName = name;
    saveProfiles();
    updateProfileSelect();
    showToast('Profile created: ' + name);
  }

  function deleteProfile(name) {
    if (profiles.length <= 1) { showToast('Cannot delete last profile'); return; }
    profiles = profiles.filter(p => p.name !== name);
    if (activeProfileName === name) activeProfileName = profiles[0].name;
    saveProfiles();
    applyProfile(activeProfileName);
    showToast('Profile deleted: ' + name);
  }

  function bindEvents() {
    const form = $('setupForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        render();
        saveSetup();
        showToast('Recalculated');
      });
    }

    ['inTH', 'inWTH', 'inLocked'].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener('input', () => { render(); saveSetup(); saveCurrentProfile(); });
    });

    ['inStreak', 'inPayGMT'].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener('change', () => { render(); saveSetup(); });
    });

    $('inCurrency')?.addEventListener('change', () => {
      state.currency = $('inCurrency').value;
      render();
      saveSetup();
    });

    $('inDiscOverride')?.addEventListener('input', () => { render(); saveSetup(); });

    // Advanced options events
    ['inHasGreedy', 'inAvatarDisc', 'inAmbassador'].forEach((id) => {
      const el = $(id);
      if (el) {
        el.addEventListener('change', () => {
          updateAdvancedVisibility();
          render();
          saveSetup();
          saveCurrentProfile();
        });
      }
    });
    ['inGreedyTH', 'inGreedyInitial', 'inGreedyGrowth', 'inReferredTH'].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener('input', () => { render(); saveSetup(); saveCurrentProfile(); });
    });

    $('copyRef')?.addEventListener('click', () => {
      copyToClipboard('ZG54KF1');
    });

    $('shareSetup')?.addEventListener('click', () => {
      copyToClipboard(getShareableURL());
    });

    document.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => copyToClipboard(btn.dataset.copy, btn));
    });

    // Profile events
    $('profileSelect')?.addEventListener('change', () => {
      const name = $('profileSelect').value;
      const p = profiles.find(x => x.name === name);
      if (p) {
        saveCurrentProfile();
        applyProfile(p.name);
      }
    });
    $('saveProfileBtn')?.addEventListener('click', () => { saveCurrentProfile(); showToast('Profile saved'); });
    $('newProfileBtn')?.addEventListener('click', () => {
      const name = (prompt('Profile name') || '').trim();
      if (!name) return;
      if (profiles.find(p => p.name === name)) { showToast('Profile name already exists'); return; }
      saveCurrentProfile();
      createProfile(name);
    });
    $('deleteProfileBtn')?.addEventListener('click', () => { deleteProfile(activeProfileName); });

    // Planner events
    ['plUsdCash', 'plGmtBalance', 'plTargetMinerTH'].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener('input', renderPlanner);
    });

    $('plannerForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      renderPlanner();
      showToast('Capital Planner updated');
    });

    // Projection events
    ['pjYears', 'pjBtcGrowth'].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener('input', renderProjection);
    });
    ['pjReinvest', 'pjDiffGrowth'].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener('change', renderProjection);
    });
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderProjection, 200);
    });

    // Live chart timeframe controls
    const chartTimeframes = $('chartTimeframes');
    if (chartTimeframes) {
      chartTimeframes.querySelectorAll('button[data-days]').forEach((btn) => {
        btn.addEventListener('click', () => {
          chartTimeframes.querySelectorAll('button[data-days]').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          renderCharts(parseInt(btn.dataset.days, 10));
        });
      });
    }
  }

  // ---- Live Charts ----
  let btcChartInstance = null;
  let gmtChartInstance = null;
  let currentChartDays = 7;

  const CHART_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  function normalizeChartPrices(prices) {
    return prices.map(([timestamp, price]) => ({ date: new Date(timestamp), price }));
  }

  function getChartCache(coin, days, allowStale = false) {
    try {
      const key = `miningflow_chart_${coin}_${days}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const cache = JSON.parse(raw);
      if (!cache || !cache.prices) return null;
      const age = Date.now() - (cache.timestamp || 0);
      if (!allowStale && age > CHART_CACHE_TTL) return null;
      return normalizeChartPrices(cache.prices);
    } catch {
      return null;
    }
  }

  function setChartCache(coin, days, prices) {
    try {
      const key = `miningflow_chart_${coin}_${days}`;
      localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), prices }));
    } catch { /* ignore storage errors */ }
  }

  async function fetchChartData(coin, days) {
    // Fresh cached data avoids hammering the API and gives instant charts on repeat visits.
    const fresh = getChartCache(coin, days, false);
    if (fresh) return fresh;

    const baseUrl = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${days}`;

    const parseAndCache = async (url) => {
      const res = await fetchWithTimeout(url, 12000);
      if (!res || !res.prices || res.prices.length === 0) throw new Error('No data');
      setChartCache(coin, days, res.prices);
      return normalizeChartPrices(res.prices);
    };

    try {
      return await parseAndCache(baseUrl);
    } catch { /* fall through to CORS proxy */ }

    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(baseUrl)}`;
      return await parseAndCache(proxyUrl);
    } catch { /* fall through */ }

    // If all live sources fail, use stale cached data so returning visitors still see a chart.
    const stale = getChartCache(coin, days, true);
    if (stale) return stale;

    throw new Error('No data');
  }

  function downsample(data, targetPoints = 40) {
    if (data.length <= targetPoints) return data;
    const step = Math.ceil(data.length / targetPoints);
    const out = [];
    for (let i = 0; i < data.length; i += step) out.push(data[i]);
    return out;
  }

  function destroyCharts() {
    if (btcChartInstance) { btcChartInstance.destroy(); btcChartInstance = null; }
    if (gmtChartInstance) { gmtChartInstance.destroy(); gmtChartInstance = null; }
  }

  function toRgba(color, alpha) {
    // color is in the form 'rgb(r, g, b)'
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }

  function chartConfig(label, color, data) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 220);
    gradientFill.addColorStop(0, toRgba(color, 0.35));
    gradientFill.addColorStop(1, toRgba(color, 0.0));

    return {
      type: 'line',
      data: {
        labels: data.map(d => d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{
          label,
          data: data.map(d => d.price),
          borderColor: color,
          backgroundColor: gradientFill,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 10, 15, 0.95)',
            titleColor: '#f0f0f4',
            bodyColor: '#f0f0f4',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => `${label}: $${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: ctx.parsed.y >= 1000 ? 0 : 4 })}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: { color: '#8888a0', maxTicksLimit: 6, maxRotation: 0 }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            ticks: {
              color: '#8888a0',
              callback: (v) => v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + v.toFixed(v >= 1 ? 0 : 4)
            }
          }
        }
      }
    };
  }

  function setChartError(id, show) {
    const el = $(id);
    if (el) el.classList.toggle('show', show);
  }

  // ---- Bitcoin Rainbow Chart (power-law regression bands) ----
  let _rainbowData = null;
  let _rainbowLoading = false;
  let _rbView = null;
  let _rbDrag = null;
  let _rbPinch = null;
  let _rbBound = false;
  let _rbFit = null;
  let _rbHover = null;
  let _rbRaf = null;

  const RB_COLORS = ['#b11717', '#e23b25', '#ef7b2a', '#f3a93a', '#ecd24b', '#bcd64a', '#5fb85a', '#2fa39a', '#3f7cc4'];
  const RB_LABELS = ['Maximum Bubble Territory', 'Sell. Seriously, SELL!', 'FOMO intensifies', 'Is this a bubble?', 'HODL!', 'Still cheap', 'Accumulate', 'BUY!', 'Basically a Fire Sale'];
  const RB_OFFSETS = [0.45, 0.35, 0.25, 0.15, 0.05, -0.05, -0.15, -0.25, -0.35, -0.45];
  const RB_DAY = 86400000;
  const RB_GEN = Date.UTC(2009, 0, 3);
  const RB_T0 = Date.UTC(2012, 0, 1);
  const RB_T1 = Date.UTC(2041, 5, 1);
  const RB_HALVINGS = [
    { t: Date.UTC(2012, 10, 28), label: 'Halving', est: false },
    { t: Date.UTC(2016, 6, 9), label: 'Halving', est: false },
    { t: Date.UTC(2020, 4, 11), label: 'Halving', est: false },
    { t: Date.UTC(2024, 3, 20), label: 'Halving', est: false },
    { t: Date.UTC(2028, 3, 15), label: 'Halving 2028 (Est)', est: true },
    { t: Date.UTC(2032, 3, 15), label: 'Halving 2032 (Est)', est: true },
    { t: Date.UTC(2036, 3, 15), label: 'Halving 2036 (Est)', est: true },
    { t: Date.UTC(2040, 3, 15), label: 'Halving 2040 (Est)', est: true }
  ];

  async function fetchRainbowHistory() {
    try {
      const r = await fetchWithTimeout('https://api.blockchain.info/charts/market-price?timespan=all&format=json&cors=true', 18000);
      const v = (r && r.values) || [];
      const out = v.map(p => ({ t: p.x * 1000, v: p.y })).filter(p => p.v > 0);
      if (out.length > 100) return out;
    } catch (e) {}
    try {
      const r = await fetchWithTimeout('https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=10080', 15000);
      const res = r && r.result;
      if (res) {
        const key = Object.keys(res).find(k => k !== 'last');
        const arr = res[key];
        if (arr && arr.length > 20) return arr.map(c => ({ t: c[0] * 1000, v: +c[4] })).filter(p => p.v > 0);
      }
    } catch (e) {}
    try {
      const r = await fetchWithTimeout('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=1000', 15000);
      if (Array.isArray(r) && r.length > 20) return r.map(c => ({ t: c[0], v: +c[4] })).filter(p => p.v > 0);
    } catch (e) {}
    try {
      const r = await fetchWithTimeout('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max', 15000);
      const pr = (r && r.prices) || [];
      if (pr.length > 20) return pr.map(p => ({ t: p[0], v: p[1] })).filter(p => p.v > 0);
    } catch (e) {}
    throw new Error('no rainbow source');
  }

  function loadBtcRainbow() {
    drawBtcRainbow();
    if (_rainbowData || _rainbowLoading) return;
    _rainbowLoading = true;
    const msg = $('btcRainbowMsg');
    if (msg) { msg.textContent = 'Loading price history…'; msg.style.display = ''; }
    fetchRainbowHistory()
      .then(data => {
        const trimmed = data.filter(p => p.t >= Date.UTC(2012, 0, 1));
        _rainbowData = (trimmed.length > 50 ? trimmed : data).sort((a, b) => a.t - b.t);
        _rbFit = null;
        _rainbowLoading = false;
        if (msg) msg.style.display = 'none';
        drawBtcRainbow();
      })
      .catch(() => {
        _rainbowLoading = false;
        if (msg) { msg.textContent = 'Couldn\'t load price history right now — try again shortly.'; msg.style.display = ''; }
        drawBtcRainbow();
      });
  }

  function rbDayOf(t) { return Math.max(1, (t - RB_GEN) / RB_DAY); }
  function rbView() { return _rbView || { t0: RB_T0, t1: RB_T1 }; }
  function rbPads(W) { return W < 480 ? { l: 8, r: 56, t: 12, b: 48 } : { l: 10, r: 76, t: 14, b: 50 }; }
  function rbAxisLabel(val, sm) {
    if (!sm) return rbFmtUSD(val);
    return val >= 1e6 ? '$' + (val / 1e6).toFixed(0) + 'M' : val >= 1e3 ? '$' + (val / 1e3).toFixed(0) + 'K' : '$' + val.toFixed(0);
  }
  function rbFmtUSD(v) { return '$' + Math.round(v).toLocaleString('en-US'); }

  function rbClamp(t0, t1) {
    let span = t1 - t0;
    const full = RB_T1 - RB_T0;
    if (span >= full) return { t0: RB_T0, t1: RB_T1 };
    if (span < RB_DAY * 60) span = RB_DAY * 60;
    if (t0 < RB_T0) { t0 = RB_T0; t1 = t0 + span; }
    if (t1 > RB_T1) { t1 = RB_T1; t0 = t1 - span; }
    if (t0 < RB_T0) t0 = RB_T0;
    return { t0, t1 };
  }

  function rbComputeFit(series) {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const p of series) {
      if (p.v > 0) {
        const lx = Math.log(rbDayOf(p.t));
        const ly = Math.log10(p.v);
        n++; sx += lx; sy += ly; sxx += lx * lx; sxy += lx * ly;
      }
    }
    let m = 2.9, b = -19.0;
    if (n > 2 && (n * sxx - sx * sx) !== 0) {
      m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      b = (sy - m * sx) / n;
    }
    const meanY = sy / n;
    let ssr = 0, sst = 0;
    for (const p of series) {
      if (p.v > 0) {
        const lx = Math.log(rbDayOf(p.t));
        const ly = Math.log10(p.v);
        const pred = m * lx + b;
        ssr += (ly - pred) * (ly - pred);
        sst += (ly - meanY) * (ly - meanY);
      }
    }
    const r2 = sst > 0 ? 1 - ssr / sst : 0;
    return { m, b, r2 };
  }

  function rbPriceAt(series, t) {
    if (t <= series[0].t) return null;
    if (t >= series[series.length - 1].t) return series[series.length - 1].v;
    let lo = 0, hi = series.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (series[mid].t < t) lo = mid;
      else hi = mid;
    }
    const a = series[lo], c = series[hi], f = (t - a.t) / ((c.t - a.t) || 1);
    return a.v * Math.pow(c.v / a.v, f);
  }

  function renderRainbowLegend(active) {
    const el = $('btcRainbowLegend');
    if (!el) return;
    el.innerHTML = RB_LABELS.map((l, i) => `<span class="rb-pill${i === active ? ' active' : ''}" style="border-left-color:${RB_COLORS[i]}">${l}</span>`).join('');
  }

  function rbHideTip() {
    const t = $('btcRainbowTip');
    if (t) t.style.display = 'none';
  }

  function rbShowTip(t, wx, wy) {
    const tip = $('btcRainbowTip');
    if (!tip || !_rbFit || !_rainbowData) return;
    const center = _rbFit.m * Math.log(rbDayOf(t)) + _rbFit.b;
    const ds = new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const last = _rainbowData[_rainbowData.length - 1];
    const actual = (t <= last.t) ? rbPriceAt(_rainbowData, t) : null;
    let html = `<div class="rb-tip-date">${ds}</div>`;
    html += actual ? `<div class="rb-tip-actual">BTC price: ${rbFmtUSD(actual)}</div>`
                   : `<div class="rb-tip-actual" style="color:var(--text3)">Projected band prices</div>`;
    for (let i = 0; i < RB_LABELS.length; i++) {
      const mid = (RB_OFFSETS[i] + RB_OFFSETS[i + 1]) / 2;
      html += `<div class="rb-tip-row"><span class="rb-tip-sw" style="background:${RB_COLORS[i]}"></span><span class="rb-tip-lbl">${RB_LABELS[i]}</span><span class="rb-tip-px">${rbFmtUSD(Math.pow(10, center + mid))}</span></div>`;
    }
    tip.innerHTML = html;
    tip.style.display = 'block';
    const vw = window.innerWidth, vh = window.innerHeight;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let lx = wx + 14;
    if (lx + tw > vw - 8) lx = wx - tw - 14;
    if (lx < 8) lx = 8;
    let ty = wy + 12;
    if (ty + th > vh - 8) ty = wy - th - 12;
    if (ty < 8) ty = 8;
    tip.style.left = lx + 'px';
    tip.style.top = ty + 'px';
  }

  function rbRequestDraw() {
    if (_rbRaf) return;
    _rbRaf = requestAnimationFrame(() => { _rbRaf = null; drawBtcRainbow(); });
  }

  function drawBtcRainbow() {
    const wrap = $('btcRainbowWrap');
    const cv = $('btcRainbowCanvas');
    if (!cv || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth || wrap.clientWidth, H = cv.clientHeight;
    if (W < 10 || H < 10) { requestAnimationFrame(drawBtcRainbow); return; }
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const x = cv.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, W, H);

    const series = _rainbowData;
    if (!series || series.length < 2) return;
    if (!_rbFit) _rbFit = rbComputeFit(series);
    const { m, b, r2 } = _rbFit;
    const centerAt = t => m * Math.log(rbDayOf(t)) + b;
    const dataT0 = series[0].t, dataT1 = series[series.length - 1].t;
    const v = rbView();

    let yLo = centerAt(v.t0) + RB_OFFSETS[9] - 0.08;
    let yHi = centerAt(v.t1) + RB_OFFSETS[0] + 0.08;
    for (const p of series) {
      if (p.t >= v.t0 && p.t <= v.t1 && p.v > 0) {
        const lv = Math.log10(p.v);
        if (lv < yLo) yLo = lv;
        if (lv > yHi) yHi = lv;
      }
    }
    const sm = W < 480;
    const P = rbPads(W);
    const plotL = P.l, plotR = W - P.r, plotT = P.t, plotB = H - P.b;
    const plotW = plotR - plotL, plotH = plotB - plotT;
    const X = t => plotL + plotW * ((t - v.t0) / ((v.t1 - v.t0) || 1));
    const Y = lv => plotT + plotH * (1 - ((lv - yLo) / ((yHi - yLo) || 1)));

    x.save();
    x.beginPath();
    x.rect(plotL, plotT, plotW, plotH);
    x.clip();
    const steps = 140;
    for (let bi = 0; bi < RB_OFFSETS.length - 1; bi++) {
      x.beginPath();
      for (let s = 0; s <= steps; s++) {
        const t = v.t0 + (v.t1 - v.t0) * s / steps;
        x.lineTo(X(t), Y(centerAt(t) + RB_OFFSETS[bi]));
      }
      for (let s = steps; s >= 0; s--) {
        const t = v.t0 + (v.t1 - v.t0) * s / steps;
        x.lineTo(X(t), Y(centerAt(t) + RB_OFFSETS[bi + 1]));
      }
      x.closePath();
      x.fillStyle = hexA(RB_COLORS[bi], 0.82);
      x.fill();
    }

    x.lineWidth = 1;
    for (let e = Math.ceil(yLo); e <= Math.floor(yHi); e++) {
      const yy = Y(e);
      x.strokeStyle = 'rgba(255,255,255,0.10)';
      x.beginPath();
      x.moveTo(plotL, yy);
      x.lineTo(plotR, yy);
      x.stroke();
    }

    const yr0 = new Date(v.t0).getUTCFullYear(), yr1 = new Date(v.t1).getUTCFullYear();
    for (let yr = yr0; yr <= yr1 + 1; yr++) {
      const t = Date.UTC(yr, 0, 1);
      if (t < v.t0 || t > v.t1) continue;
      const xx = X(t);
      x.strokeStyle = 'rgba(255,255,255,0.06)';
      x.beginPath();
      x.moveTo(xx, plotT);
      x.lineTo(xx, plotB);
      x.stroke();
    }
    for (const h of RB_HALVINGS) {
      if (h.t < v.t0 || h.t > v.t1) continue;
      const xx = X(h.t);
      x.strokeStyle = h.est ? 'rgba(244,143,177,0.7)' : 'rgba(255,255,255,0.45)';
      x.lineWidth = 1;
      x.setLineDash(h.est ? [5, 4] : [2, 3]);
      x.beginPath();
      x.moveTo(xx, plotT);
      x.lineTo(xx, plotB);
      x.stroke();
      x.setLineDash([]);
    }

    x.beginPath();
    let first = true;
    for (const p of series) {
      if (p.v <= 0) continue;
      const xx = X(p.t), yy = Y(Math.log10(p.v));
      if (first) { x.moveTo(xx, yy); first = false; }
      else x.lineTo(xx, yy);
    }
    x.strokeStyle = 'rgba(10,10,12,0.92)';
    x.lineWidth = 1.6;
    x.stroke();

    for (const h of RB_HALVINGS) {
      if (h.est || h.t < dataT0 || h.t > dataT1 || h.t < v.t0 || h.t > v.t1) continue;
      const pv = rbPriceAt(series, h.t);
      if (!pv) continue;
      const xx = X(h.t), yy = Y(Math.log10(pv));
      x.fillStyle = '#ffd54a';
      x.beginPath();
      x.arc(xx, yy, 4.5, 0, 7);
      x.fill();
      x.strokeStyle = '#7a5c00';
      x.lineWidth = 1.4;
      x.stroke();
    }

    const cur = state.btcPrice || series[series.length - 1].v;
    let curBand = 8;
    if (cur > 0) {
      const tNow = Math.min(Date.now(), dataT1);
      const xx = X(tNow), yy = Y(Math.log10(cur));
      if (tNow >= v.t0 && tNow <= v.t1) {
        x.fillStyle = '#fff';
        x.beginPath();
        x.arc(xx, yy, 4.5, 0, 7);
        x.fill();
        x.strokeStyle = '#0a0a0a';
        x.lineWidth = 1.6;
        x.stroke();
      }
      const cl = Math.log10(cur) - centerAt(tNow);
      if (cl >= RB_OFFSETS[0]) curBand = 0;
      else {
        curBand = 8;
        for (let bi = 0; bi < RB_OFFSETS.length - 1; bi++) {
          if (cl < RB_OFFSETS[bi] && cl >= RB_OFFSETS[bi + 1]) { curBand = bi; break; }
        }
      }
    }
    x.restore();

    x.font = (sm ? '9px ' : '10px ') + (getComputedStyle(document.body).getPropertyValue('--mono') || 'monospace');
    x.textBaseline = 'middle';
    x.textAlign = 'left';
    x.fillStyle = 'rgba(255,255,255,0.6)';
    for (let e = Math.ceil(yLo); e <= Math.floor(yHi); e++) {
      const yy = Y(e);
      if (yy < plotT - 2 || yy > plotB + 2) continue;
      x.fillText(rbAxisLabel(Math.pow(10, e), sm), plotR + 5, yy);
    }

    x.textAlign = 'center';
    x.textBaseline = 'top';
    x.fillStyle = 'rgba(255,255,255,0.6)';
    x.font = (sm ? '9px ' : '10px ') + (getComputedStyle(document.body).getPropertyValue('--sans') || 'sans-serif');
    const span = v.t1 - v.t0;
    const yrStep = span > RB_DAY * 365 * (sm ? 6 : 12) ? 2 : 1;
    for (let yr = yr0; yr <= yr1 + 1; yr++) {
      if (yr % yrStep !== 0) continue;
      const t = Date.UTC(yr, 0, 1);
      if (t < v.t0 || t > v.t1) continue;
      x.fillText(sm ? "'" + String(yr).slice(2) : String(yr), X(t), plotB + 16);
    }

    for (const h of RB_HALVINGS) {
      if (h.t < v.t0 || h.t > v.t1) continue;
      const xx = X(h.t);
      const lab = sm ? (h.est ? String(new Date(h.t).getUTCFullYear()) : '⌗') : h.label;
      x.font = (h.est ? 'bold ' : '') + (sm ? '8px ' : '9px ') + (getComputedStyle(document.body).getPropertyValue('--sans') || 'sans-serif');
      const tw = x.measureText(lab).width;
      if (h.est) {
        x.fillStyle = 'rgba(244,143,177,0.18)';
        x.fillRect(xx - tw / 2 - 4, plotB + 1, tw + 8, 12);
        x.fillStyle = '#f48fb1';
      } else {
        x.fillStyle = 'rgba(255,255,255,0.55)';
      }
      x.textAlign = 'center';
      x.textBaseline = 'top';
      x.fillText(lab, xx, plotB + 2);
    }

    if (_rbHover != null && _rbHover >= v.t0 && _rbHover <= v.t1) {
      const xx = X(_rbHover);
      x.save();
      x.beginPath();
      x.rect(plotL, plotT, plotW, plotH);
      x.clip();
      x.strokeStyle = 'rgba(255,255,255,0.55)';
      x.setLineDash([4, 4]);
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(xx, plotT);
      x.lineTo(xx, plotB);
      x.stroke();
      x.setLineDash([]);
      x.restore();
    }

    renderRainbowLegend(curBand);
    const foot = $('btcRainbowFoot');
    if (foot) foot.textContent = `Power-Law regression fitted to BTC since ${new Date(dataT0).getUTCFullYear()} (R² ${(r2 * 100).toFixed(1)}% fit strength). Scroll to zoom, drag to pan, double-click to reset.`;

    rbBindInteractions(cv);
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function rbBindInteractions(cv) {
    if (_rbBound) return;
    _rbBound = true;
    cv.style.cursor = 'grab';
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const r = cv.getBoundingClientRect(), W = cv.clientWidth, P = rbPads(W);
      const frac = Math.max(0, Math.min(1, ((e.clientX - r.left) - P.l) / ((W - P.l - P.r) || 1)));
      const v = rbView(), anchor = v.t0 + (v.t1 - v.t0) * frac;
      const f = e.deltaY < 0 ? 0.82 : 1 / 0.82;
      _rbView = rbClamp(anchor - (anchor - v.t0) * f, anchor + (v.t1 - anchor) * f);
      drawBtcRainbow();
    }, { passive: false });
    cv.addEventListener('mousemove', e => {
      if (_rbDrag) { rbHideTip(); return; }
      const cr = cv.getBoundingClientRect(), W = cv.clientWidth, P = rbPads(W);
      const frac = ((e.clientX - cr.left) - P.l) / ((W - P.l - P.r) || 1);
      if (frac < 0 || frac > 1) { _rbHover = null; rbHideTip(); rbRequestDraw(); return; }
      const v = rbView();
      _rbHover = v.t0 + (v.t1 - v.t0) * frac;
      rbShowTip(_rbHover, e.clientX, e.clientY);
      rbRequestDraw();
    });
    cv.addEventListener('mouseleave', () => { _rbHover = null; rbHideTip(); rbRequestDraw(); });
    cv.addEventListener('mousedown', e => { _rbDrag = { x: e.clientX, v: rbView() }; cv.style.cursor = 'grabbing'; _rbHover = null; rbHideTip(); });
    window.addEventListener('mousemove', e => {
      if (!_rbDrag) return;
      const W = cv.clientWidth, P = rbPads(W), pw = (W - P.l - P.r) || 1;
      const span = _rbDrag.v.t1 - _rbDrag.v.t0, dt = ((e.clientX - _rbDrag.x) / pw) * span;
      _rbView = rbClamp(_rbDrag.v.t0 - dt, _rbDrag.v.t1 - dt);
      drawBtcRainbow();
    });
    window.addEventListener('mouseup', () => { if (_rbDrag) { _rbDrag = null; cv.style.cursor = 'grab'; } });
    cv.addEventListener('dblclick', e => { e.preventDefault(); _rbView = null; drawBtcRainbow(); });
    cv.addEventListener('touchstart', e => {
      if (e.touches.length === 1) _rbDrag = { x: e.touches[0].clientX, v: rbView() };
      else if (e.touches.length === 2) {
        const a = e.touches[0], c = e.touches[1];
        _rbPinch = { d: Math.abs(a.clientX - c.clientX) || 1, v: rbView(), mx: (a.clientX + c.clientX) / 2 };
        _rbDrag = null;
      }
    }, { passive: true });
    cv.addEventListener('touchmove', e => {
      const W = cv.clientWidth, P = rbPads(W), pw = (W - P.l - P.r) || 1, r = cv.getBoundingClientRect();
      if (e.touches.length === 2 && _rbPinch) {
        e.preventDefault();
        const a = e.touches[0], c = e.touches[1], d = Math.abs(a.clientX - c.clientX) || 1;
        const frac = Math.max(0, Math.min(1, ((_rbPinch.mx - r.left) - P.l) / pw));
        const vv = _rbPinch.v, anchor = vv.t0 + (vv.t1 - vv.t0) * frac, f = _rbPinch.d / d;
        _rbView = rbClamp(anchor - (anchor - vv.t0) * f, anchor + (vv.t1 - anchor) * f);
        drawBtcRainbow();
      } else if (e.touches.length === 1 && _rbDrag) {
        e.preventDefault();
        const span = _rbDrag.v.t1 - _rbDrag.v.t0, dt = ((e.touches[0].clientX - _rbDrag.x) / pw) * span;
        _rbView = rbClamp(_rbDrag.v.t0 - dt, _rbDrag.v.t1 - dt);
        drawBtcRainbow();
      }
    }, { passive: false });
    cv.addEventListener('touchend', e => { if (e.touches.length === 0) { _rbDrag = null; _rbPinch = null; } });
  }

  async function renderCoinChart(canvasId, errorId, coin, days, color, label) {
    const canvas = $(canvasId);
    if (!canvas) return null;
    setChartError(errorId, false);

    try {
      const raw = await fetchChartData(coin, days);
      const data = downsample(raw, 40);
      const ctx = canvas.getContext('2d');
      return new Chart(ctx, chartConfig(label, color, data));
    } catch (err) {
      setChartError(errorId, true);
      return null;
    }
  }

  async function renderCharts(days = currentChartDays) {
    if (typeof Chart === 'undefined') {
      setChartError('btcChartError', true);
      setChartError('gmtChartError', true);
      return;
    }
    currentChartDays = days;
    destroyCharts();

    const [btcChart, gmtChart] = await Promise.all([
      renderCoinChart('btcChart', 'btcChartError', 'bitcoin', days, 'rgb(245, 166, 35)', 'BTC'),
      renderCoinChart('gmtChart', 'gmtChartError', 'gmt-token', days, 'rgb(78, 207, 250)', 'GMT')
    ]);
    if (btcChart) btcChartInstance = btcChart;
    if (gmtChart) gmtChartInstance = gmtChart;
  }

  // ---- Wizard Onboarding ----
  const wizardSteps = [
    {
      title: "Welcome to MiningFlow 🌊",
      text: "Your GoMining command center. Use live market data, instant net-profit estimates, and automatic VIP tier detection to plan your farm."
    },
    {
      title: "1. Enter your setup",
      text: "In Your Setup, enter your Hashrate (TH), Efficiency (W/TH) and Locked GMT. Use the toggles for click-streak and Pay in GMT, or open Advanced Options for Greedy Machine, Avatar discount and Ambassador."
    },
    {
      title: "2. Explore the dashboard",
      text: "Check the hero cards for daily and monthly estimates. Use Capital Planner to find the best budget split, Growth Projection for multi-year forecasts, and the VIP & Discount Stack to see your next tier."
    },
    {
      title: "3. Save and share",
      text: "Create multiple profiles to switch between farm setups, copy the share link to send your exact parameters to a friend, or use the referral code ZG54KF1 for +5% bonus TH."
    }
  ];
  let currentStep = 0;
  const wOverlay = $('wizardOverlay');
  const wTitle = $('wizardTitle');
  const wText = $('wizardText');
  const wDots = $('wizardDots');
  const wPrev = $('wizardPrev');
  const wNext = $('wizardNext');
  const wClose = $('wizardClose');
  const tourBtn = $('navTourBtn');

  function renderWizard() {
    const step = wizardSteps[currentStep];
    wTitle.textContent = step.title;
    wText.textContent = step.text;
    wPrev.hidden = currentStep === 0;
    wNext.textContent = currentStep === wizardSteps.length - 1 ? 'Finish' : 'Next';
    wDots.innerHTML = wizardSteps.map((_, i) => `<span class="wizard-dot ${i === currentStep ? 'active' : ''}"></span>`).join('');
  }

  function openWizard() {
    if (!wOverlay) return;
    currentStep = 0;
    wOverlay.hidden = false;
    renderWizard();
    wNext.focus();
  }

  function closeWizard() {
    if (!wOverlay) return;
    wOverlay.hidden = true;
    tourBtn?.focus();
    try { localStorage.setItem('miningflow_tour_completed', '1'); } catch { /* ignore */ }
  }

  function initWizard() {
    if (!wOverlay) return;
    wNext?.addEventListener('click', () => {
      if (currentStep < wizardSteps.length - 1) { currentStep++; renderWizard(); }
      else { closeWizard(); }
    });
    wPrev?.addEventListener('click', () => {
      if (currentStep > 0) { currentStep--; renderWizard(); }
    });
    wClose?.addEventListener('click', closeWizard);
    tourBtn?.addEventListener('click', openWizard);

    // Close on overlay click and Escape
    wOverlay?.addEventListener('click', (e) => {
      if (e.target === wOverlay) closeWizard();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !wOverlay.hidden) closeWizard();
    });

    // Basic focus trap: keep tab cycling inside the modal
    wOverlay?.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusables = wOverlay.querySelectorAll('button:not([hidden]):not([disabled])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  function maybeShowWizard() {
    if (!wOverlay) return;
    try {
      if (!localStorage.getItem('miningflow_tour_completed')) {
        setTimeout(openWizard, 800);
      }
    } catch { /* ignore storage errors */ }
  }

  // ---- Init ----
  async function init() {
    await fetchExchangeRates();
    updateTicker();
    bindEvents();
    initWizard();

    // Prepare scroll reveal (add class here so content stays visible if JS fails)
    document.querySelectorAll('.card, .panel, .hero-copy, .ticker').forEach((el) => el.classList.add('reveal'));
    initReveal();

    loadProfiles();
    if (profiles.length) {
      applyProfile(activeProfileName, { silent: true });
      loadSetup({ skipLegacy: true });
    } else {
      loadSetup();
      profiles.push({ name: 'Default', ...getCurrentSetup() });
      activeProfileName = 'Default';
      saveProfiles();
    }
    saveSetup();
    render();
    renderPlanner();
    renderCharts();
    loadBtcRainbow();
    let rbResizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(rbResizeTimer);
      rbResizeTimer = setTimeout(() => drawBtcRainbow(), 150);
    });
    maybeShowWizard();
    refreshData().then(() => {
      // Refresh live data every 60 seconds
      setInterval(refreshData, 60000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
