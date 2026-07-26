/* MiningFlow — GSAP entrance animations + light parallax */
(function () {
  // Signal that the animation module loaded, cancelling the head-script fallback.
  if (typeof window._miningflowCancelAnimFallback === 'function') {
    window._miningflowCancelAnimFallback();
  }
  window._miningflowAnimationsLoaded = true;

  if (!window.gsap || !window.ScrollTrigger) {
    // GSAP failed to load; fall back to the static layout.
    document.documentElement.classList.remove('js-animations');
    return;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  // Helper: reveal from below, then keep opacity inline and clear transform
  // so CSS hover transforms are not blocked.
  function revealFrom(targets, vars, scrollTrigger) {
    const els = gsap.utils.toArray(targets);
    return gsap.from(els, {
      ...vars,
      scrollTrigger,
      onComplete: () => {
        els.forEach((el) => {
          el.style.transform = '';
        });
      }
    });
  }

  // Strip the legacy CSS reveal class from elements we are animating with GSAP
  document.querySelectorAll('.card, .panel, .hero-copy, .ticker-row').forEach((el) => {
    el.classList.remove('reveal');
  });

  // Hero entrance timeline (staggered children)
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero-copy .hero-eyebrow', { y: 30, opacity: 0, duration: 0.8 }, 0.1)
    .from('.hero-copy .hero-title', { y: 40, opacity: 0, duration: 0.9 }, 0.25)
    .from('.hero-copy .hero-sub', { y: 30, opacity: 0, duration: 0.8 }, 0.4)
    .from('.hero-copy .hero-cta', { y: 20, opacity: 0, duration: 0.7 }, 0.55);

  // Ticker entrance
  revealFrom('.ticker-row', { y: 30, opacity: 0, duration: 0.6, delay: 0.5, ease: 'power2.out' });

  // Summary cards entrance
  revealFrom(
    '.card',
    { y: 50, opacity: 0, scale: 0.96, duration: 0.7, stagger: 0.08, ease: 'power2.out' },
    { trigger: '.cards', start: 'top 85%', toggleActions: 'play none none none' }
  );

  // Panels entrance (one-by-one as they scroll into view)
  gsap.utils.toArray('.panel').forEach((panel) => {
    revealFrom(
      panel,
      { y: 60, opacity: 0, duration: 0.8, ease: 'power2.out' },
      { trigger: panel, start: 'top 85%', toggleActions: 'play none none none' }
    );
  });

  // Footer entrance
  revealFrom('.footer', { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' }, {
    trigger: '.footer',
    start: 'top 90%',
    toggleActions: 'play none none none'
  });

  // Light parallax on ambient mesh orbs
  const orbs = gsap.utils.toArray('.mesh-orb');
  orbs.forEach((orb, i) => {
    gsap.to(orb, {
      yPercent: i === 0 ? -25 : 15,
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });
  });

  // Subtle parallax on hero copy while scrolling past the hero
  gsap.to('.hero-copy', {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    }
  });
})();
