/* ============================================================
   GLYMPH STUDIO — main.js
   GSAP + ScrollTrigger + Lenis + cursor trail
   Everything degrades gracefully if a CDN fails.
   ============================================================ */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------------------------------------------------------
     1. PRELOADER
     --------------------------------------------------------- */
  const body = document.body;
  body.classList.add('is-loading');
  const loader = $('#loader');
  let loaderDone = false;
  const killLoader = () => {
    if (loaderDone) return;
    loaderDone = true;
    body.classList.remove('is-loading');
    if (loader) {
      loader.classList.add('is-done');
      setTimeout(() => loader.remove(), 700);
    }
    heroIntro();
  };
  window.addEventListener('load', () => setTimeout(killLoader, 900));
  setTimeout(killLoader, 3200);            // hard safety net
  loader && loader.addEventListener('click', killLoader);

  /* ---------------------------------------------------------
     2. SMOOTH SCROLL (Lenis) + ScrollTrigger wiring
     --------------------------------------------------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new window.Lenis({
      duration: 1.15,
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });
    if (hasGSAP && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // anchor links through Lenis
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -10 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  if (hasGSAP && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
  const gsap = window.gsap;

  /* ---------------------------------------------------------
     3. HERO INTRO
     --------------------------------------------------------- */
  const logo = $('.hero__logo');
  function heroIntro() {
    if (logo) logo.classList.add('is-in');
    if (!hasGSAP || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero__eyebrow', { y: 14, opacity: 0, duration: .8 })
      .from('.hero__logo', { scale: .7, opacity: 0, duration: 1 }, '-=.5')
      .from('.wordmark .char', {
        yPercent: 118, opacity: 0, rotate: 8, duration: 1.15, stagger: .06
      }, '-=.75')
      .from('.hero__sub', { y: 16, opacity: 0, duration: .8 }, '-=.7');
  }
  // if the loader was skipped, make sure the logo still draws
  setTimeout(() => logo && logo.classList.add('is-in'), 3400);

  /* ---------------------------------------------------------
     4. STICKERS — float + mouse parallax
     --------------------------------------------------------- */
  const stickers = $$('.sticker');
  if (hasGSAP && !reduced) {
    stickers.forEach((s, i) => {
      const inner = s.firstElementChild || s;
      gsap.to(inner, {
        y: gsap.utils.random(-16, -8),
        rotation: '+=' + gsap.utils.random(1.5, 4).toFixed(2),
        duration: gsap.utils.random(2.6, 4.4),
        repeat: -1, yoyo: true, ease: 'sine.inOut',
        delay: i * 0.12
      });
    });
    if (finePointer) {
      const setters = stickers.map((s) => ({
        x: gsap.quickTo(s, 'x', { duration: .9, ease: 'power3.out' }),
        y: gsap.quickTo(s, 'y', { duration: .9, ease: 'power3.out' }),
        d: parseFloat(s.dataset.depth || 20)
      }));
      window.addEventListener('mousemove', (e) => {
        const nx = (e.clientX / window.innerWidth - .5) * 2;
        const ny = (e.clientY / window.innerHeight - .5) * 2;
        setters.forEach((s) => { s.x(-nx * s.d); s.y(-ny * s.d); });
      }, { passive: true });
    }
  }

  /* ---------------------------------------------------------
     5. CURSOR TRAIL (canvas) + ring
     --------------------------------------------------------- */
  const canvas = $('#trail');
  if (canvas && finePointer && !reduced) {
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener('resize', size);

    const parts = [];
    let drawing = false;
    window.addEventListener('mousemove', (e) => {
      parts.push({ x: e.clientX, y: e.clientY, life: 1, s: gsap ? gsap.utils.random(2, 5) : 3 });
      if (parts.length > 70) parts.shift();
      if (!drawing) { drawing = true; requestAnimationFrame(tick); }
    }, { passive: true });

    function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= 0.035;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        const a = p.life * 0.55;
        ctx.fillStyle = (i % 9 === 0) ? `rgba(255,59,47,${a})` : `rgba(255,255,255,${a})`;
        const s = p.s * p.life;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      if (parts.length) requestAnimationFrame(tick);
      else { drawing = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }
  }

  const ring = $('.cursor-ring');
  if (ring && finePointer && !reduced) {
    let rx = innerWidth / 2, ry = innerHeight / 2, tx = rx, ty = ry, shown = false;
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; if (!shown) { shown = true; ring.style.opacity = 1; } }, { passive: true });
    (function loop() {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    $$('a,button,[data-flip],.mail').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hot'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hot'));
    });
  }

  /* ---------------------------------------------------------
     6. SCROLL PROGRESS
     --------------------------------------------------------- */
  const bar = $('.progress span');
  if (bar) {
    const update = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      const p = h > 0 ? Math.min(scrollY / h, 1) : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------------------------------------------------------
     7. SCROLL REVEALS
     --------------------------------------------------------- */
  if (hasGSAP && window.ScrollTrigger && !reduced) {
    const ST = window.ScrollTrigger;

    /* --- thesis words --- */
    const words = $$('.thesis__line .word');
    gsap.from(words, {
      yPercent: 115, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .045,
      scrollTrigger: { trigger: '.thesis', start: 'top 62%' }
    });

    /* --- section headings --- */
    $$('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        yPercent: 40, opacity: 0, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* --- small mono bits --- */
    $$('.shead__num, .shead__note, .team__foot, .contact .shead__num').forEach((el) => {
      gsap.from(el, {
        y: 24, opacity: 0, duration: .9, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 92%' }
      });
    });

    /* --- team panels: comic slam-in --- */
    gsap.from('.panel', {
      y: 90, opacity: 0, rotate: (i) => [-4, 3, -2][i] || 0, scale: .94,
      duration: 1.15, ease: 'expo.out', stagger: .12,
      scrollTrigger: { trigger: '.panels', start: 'top 82%' }
    });

    /* --- project cards --- */
    gsap.from('.card', {
      y: 80, opacity: 0, scale: .95, duration: 1, ease: 'expo.out', stagger: .1,
      scrollTrigger: { trigger: '.cards', start: 'top 85%' }
    });

    /* --- contact --- */
    gsap.from('.contact__title', {
      yPercent: 45, opacity: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.contact', start: 'top 75%' }
    });
    gsap.from(['.mail', '.socials'], {
      y: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .12,
      scrollTrigger: { trigger: '.mail', start: 'top 92%' }
    });

    /* --- hero parallax out --- */
    gsap.to('.hero__inner', {
      y: -90, opacity: .25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.stickers', {
      y: -140, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    ST.refresh();
  }

  /* ---------------------------------------------------------
     8. CARDS — tap to flip on touch, locked links
     --------------------------------------------------------- */
  $$('[data-flip]').forEach((card) => {
    card.addEventListener('click', () => card.classList.toggle('is-flipped'));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.classList.toggle('is-flipped'); }
    });
  });
  $$('[data-locked]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      a.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
        { duration: 320, easing: 'ease-out' }
      );
    });
  });

  /* ---------------------------------------------------------
     9. EMAIL COPY
     --------------------------------------------------------- */
  const mail = $('.mail');
  const copied = $('.mail__copied');
  if (mail && copied) {
    mail.addEventListener('click', async (e) => {
      const text = mail.dataset.copy || '';
      try { await navigator.clipboard.writeText(text); } catch (_) { /* ignore */ }
      copied.classList.add('is-on');
      setTimeout(() => copied.classList.remove('is-on'), 1600);
    });
  }

  /* ---------------------------------------------------------
     10. FOOTER YEAR
     --------------------------------------------------------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     11. BOOT LOG  (because why not)
     --------------------------------------------------------- */
  console.log(
    '%c GLYMPH STUDIO ',
    'background:#ff3b2f;color:#000;font-weight:700;letter-spacing:.2em;padding:4px 8px'
  );
  console.log('%c built from scratch · no templates · 3 guys from India', 'color:#8c8c8c');
})();
