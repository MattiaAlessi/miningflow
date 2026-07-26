/* MiningFlow — GSAP entrance animations + light parallax */
(function () {
  // If GSAP isn't available, bail out — elements are already visible by default.
  if (!window.gsap || !window.ScrollTrigger) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  // Helper: set hidden state immediately, then animate to visible
  function revealFrom(targets, vars, scrollTrigger) {
    const els = gsap.utils.toArray(targets);
    const fromY = vars.y || 40;
    const fromOpacity = vars.opacity !== undefined ? vars.opacity : 0;
    const fromScale = vars.scale || 1;
    // Immediately set hidden state via gsap.set
    gsap.set(els, { opacity: fromOpacity, y: fromY, scale: fromScale });
    // Animate TO visible (y: 0, opacity: 1, scale: 1)
    return gsap.to(els, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: vars.duration || 0.7,
      ease: vars.ease || 'power2.out',
      stagger: vars.stagger,
      delay: vars.delay,
      scrollTrigger,
      onComplete: () => {
        els.forEach((el) => {
          el.style.transform = '';
          el.style.opacity = '';
          el.classList.remove('reveal');
        });
      }
    });
  }

  // ---- Hero entrance (instant hide, then animate in) ----
  const heroEls = gsap.utils.toArray('.hero-copy > *');
  gsap.set(heroEls, { opacity: 0, y: 20 });

  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('.hero-copy .hero-eyebrow', { y: 0, opacity: 1, duration: 0.8 }, 0.1)
    .to('.hero-copy .hero-title', { y: 0, opacity: 1, duration: 0.9 }, 0.25)
    .to('.hero-copy .hero-sub', { y: 0, opacity: 1, duration: 0.8 }, 0.4)
    .to('.hero-copy .hero-cta', { y: 0, opacity: 1, duration: 0.7 }, 0.55);

  // ---- Ticker entrance ----
  revealFrom('.ticker-row', { y: 30, opacity: 0, duration: 0.6, delay: 0.5, ease: 'power2.out' });

  // ---- Summary cards entrance ----
  gsap.set('.card', { opacity: 0, y: 50, scale: 0.96 });
  revealFrom(
    '.card',
    { y: 50, opacity: 0, scale: 0.96, duration: 0.7, stagger: 0.08, ease: 'power2.out' },
    { trigger: '.cards', start: 'top 85%', toggleActions: 'play none none none' }
  );

  // ---- Panels entrance (one-by-one as they scroll into view) ----
  gsap.utils.toArray('.panel').forEach((panel) => {
    gsap.set(panel, { opacity: 0, y: 60 });
    revealFrom(
      panel,
      { y: 60, opacity: 0, duration: 0.8, ease: 'power2.out' },
      { trigger: panel, start: 'top 85%', toggleActions: 'play none none none' }
    );
  });

  // ---- Footer entrance ----
  gsap.set('.footer', { opacity: 0, y: 30 });
  revealFrom('.footer', { y: 30, opacity: 0, duration: 0.6, ease: 'power2.out' }, {
    trigger: '.footer',
    start: 'top 90%',
    toggleActions: 'play none none none'
  });

  // ---- Light parallax on ambient mesh orbs ----
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

  // ---- Subtle parallax on hero copy while scrolling past the hero ----
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
