/* ============================================================
   GLYMPH STUDIO — main.js
   GSAP + ScrollTrigger + Draggable + Lenis
   Custom bolt cursor · draggable stickers · magnetic UI
   Everything degrades gracefully if a CDN fails.
   ============================================================ */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const gsap = window.gsap;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (min, max, v) => Math.max(min, Math.min(max, v));

  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  const ST = window.ScrollTrigger;

  /* ---------------------------------------------------------
     1. PRELOADER
     --------------------------------------------------------- */
  const body = document.body;
  body.classList.add('is-loading');
  const loader = $('#loader');
  const pctEl = $('#pct'), msgEl = $('#bootmsg');
  const bootMsgs = ['initialising', 'loading pixels', 'waking the devs', 'compiling the sauce', 'almost peak'];
  let pct = 0;
  const tick = setInterval(() => {
    pct = Math.min(100, pct + Math.random() * 9 + 3);
    if (pctEl) pctEl.textContent = Math.round(pct);
    if (msgEl) msgEl.textContent = bootMsgs[Math.min(bootMsgs.length - 1, Math.floor(pct / 21))];
  }, 90);

  let loaderDone = false;
  function killLoader() {
    if (loaderDone) return;
    loaderDone = true;
    clearInterval(tick);
    if (pctEl) pctEl.textContent = 100;
    setTimeout(() => {
      body.classList.remove('is-loading');
      if (loader) { loader.classList.add('is-done'); setTimeout(() => loader.remove(), 700); }
      heroIntro();
    }, 260);
  }
  window.addEventListener('load', () => setTimeout(killLoader, 700));
  setTimeout(killLoader, 2800);
  loader && loader.addEventListener('click', killLoader);

  /* ---------------------------------------------------------
     2. SMOOTH SCROLL
     --------------------------------------------------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new window.Lenis({ duration: 1.15, lerp: 0.09, smoothWheel: true, touchMultiplier: 1.6 });
    if (hasGSAP && ST) {
      lenis.on('scroll', ST.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const scrollTo = (target, offset = -10) => {
    if (lenis) lenis.scrollTo(target, { offset });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      closeMenu();
      scrollTo(t);
    });
  });

  /* ---------------------------------------------------------
     3. HERO INTRO
     --------------------------------------------------------- */
  const logo = $('.hero__logo');
  function heroIntro() {
    if (logo) logo.classList.add('is-in');
    if (!hasGSAP || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero__logo', { scale: .65, opacity: 0, duration: 1 })
      .from('.wordmark .char', { yPercent: 120, opacity: 0, rotate: 9, duration: 1.15, stagger: .06 }, '-=.7')
      .from('.hero__sub', { y: 18, opacity: 0, duration: .8 }, '-=.75')
      .from('.sticker', {
        scale: 0, opacity: 0, rotation: () => gsap.utils.random(-40, 40),
        duration: 1.1, stagger: { each: .07, from: 'random' }, ease: 'back.out(1.8)'
      }, '-=.9')
      .from('.hero__scroll', { opacity: 0, y: 14, duration: .6 }, '-=.4');
  }
  setTimeout(() => logo && logo.classList.add('is-in'), 3000);

  /* ---------------------------------------------------------
     4. STICKERS — wrap, float, parallax, DRAG
     --------------------------------------------------------- */
  const stickers = $$('.sticker');
  stickers.forEach((s) => {
    const drag = document.createElement('div');
    drag.className = 'sticker__drag';
    while (s.firstChild) drag.appendChild(s.firstChild);
    s.appendChild(drag);
  });

  if (hasGSAP && !reduced) {
    // gentle float (on the artwork, so dragging can own the wrapper)
    stickers.forEach((s, i) => {
      const inner = s.querySelector('.sticker__drag > *');
      if (!inner) return;
      gsap.to(inner, {
        y: gsap.utils.random(-16, -8),
        rotation: '+=' + gsap.utils.random(1.5, 4).toFixed(2),
        duration: gsap.utils.random(2.6, 4.4),
        repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * .12
      });
    });

    // mouse parallax (on the outer wrapper)
    if (finePointer) {
      const setters = stickers.map((s) => ({
        x: gsap.quickTo(s, 'x', { duration: .9, ease: 'power3.out' }),
        y: gsap.quickTo(s, 'y', { duration: .9, ease: 'power3.out' }),
        d: parseFloat(s.dataset.depth || 20)
      }));
      window.addEventListener('mousemove', (e) => {
        const nx = (e.clientX / innerWidth - .5) * 2;
        const ny = (e.clientY / innerHeight - .5) * 2;
        setters.forEach((s) => { s.x(-nx * s.d); s.y(-ny * s.d); });
      }, { passive: true });
    }

    // DRAG IT
    if (window.Draggable) {
      const hint = $('.dragme');
      stickers.forEach((s) => {
        const drag = s.querySelector('.sticker__drag');
        const inner = drag && drag.firstElementChild;
        let px = 0, py = 0, vx = 0, vy = 0;

        window.Draggable.create(drag, {
          type: 'x,y',
          bounds: '.hero',
          edgeResistance: .72,
          dragClickables: true,
          minimumMovement: 3,
          zIndexBoost: false,
          allowNativeTouchScrolling: true,
          onPress() {
            stickers.forEach((o) => { o.style.zIndex = ''; });
            s.style.zIndex = 60;
            s.classList.add('is-dragging');
            px = this.x; py = this.y;
            gsap.to(inner, { scale: 1.07, duration: .25, ease: 'power2.out' });
            if (hint) { gsap.to(hint, { opacity: 0, scale: .6, duration: .3, onComplete: () => hint.remove() }); }
          },
          onDrag() {
            vx = this.x - px; vy = this.y - py;
            px = this.x; py = this.y;
          },
          onRelease() {
            const d = this;
            s.classList.remove('is-dragging');
            gsap.to(inner, { scale: 1, duration: .6, ease: 'elastic.out(1,.55)' });
            gsap.to(inner, { rotation: '+=6', duration: .13, yoyo: true, repeat: 1, ease: 'sine.inOut' });
            // hand-rolled momentum (InertiaPlugin is a paid plugin)
            const tx = d.x + vx * 7, ty = d.y + vy * 7;
            gsap.to(drag, {
              x: Number.isFinite(d.minX) ? clamp(d.minX, d.maxX, tx) : tx,
              y: Number.isFinite(d.minY) ? clamp(d.minY, d.maxY, ty) : ty,
              duration: 1, ease: 'power3.out'
            });
          }
        });
      });
    }
  } else {
    $$('.dragme').forEach((h) => h.remove());
  }

  /* ---------------------------------------------------------
     5. CUSTOM CURSOR (the bolt) + trail
     --------------------------------------------------------- */
  const cursor = $('#cursor');
  const canvas = $('#trail');

  if (cursor && finePointer && !reduced) {
    body.classList.add('has-cursor');
    const bolt = cursor.querySelector('.cursor__bolt');
    const ring = cursor.querySelector('.cursor__ring');
    const label = cursor.querySelector('.cursor__label');
    let lastX = innerWidth / 2, first = true;

    const bx = hasGSAP ? gsap.quickTo(bolt, 'x', { duration: .1, ease: 'power3' }) : null;
    const by = hasGSAP ? gsap.quickTo(bolt, 'y', { duration: .1, ease: 'power3' }) : null;
    const br = hasGSAP ? gsap.quickTo(bolt, 'rotation', { duration: .4, ease: 'power2' }) : null;
    const rx = hasGSAP ? gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' }) : null;
    const ry = hasGSAP ? gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' }) : null;
    const lx = hasGSAP ? gsap.quickTo(label, 'x', { duration: .22, ease: 'power3' }) : null;
    const ly = hasGSAP ? gsap.quickTo(label, 'y', { duration: .22, ease: 'power3' }) : null;

    const move = (x, y) => {
      if (hasGSAP) { bx(x); by(y); rx(x); ry(y); lx(x); ly(y); }
      else {
        bolt.style.transform = ring.style.transform = label.style.transform = `translate(${x}px,${y}px)`;
      }
    };

    window.addEventListener('mousemove', (e) => {
      move(e.clientX, e.clientY);
      if (!first && br) br(clamp(-32, 32, (e.clientX - lastX) * 1.7));
      lastX = e.clientX; first = false;
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      cursor.classList.add('is-down');
      if (hasGSAP) gsap.to(bolt, { scale: .78, duration: .16, ease: 'power2.out' });
    });
    window.addEventListener('mouseup', () => {
      cursor.classList.remove('is-down');
      if (hasGSAP) gsap.to(bolt, { scale: 1, duration: .35, ease: 'back.out(2)' });
    });
    document.addEventListener('mouseleave', () => { cursor.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = 1; });

    const HOT = '[data-cursor],a,button,[data-flip]';
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest && e.target.closest(HOT);
      if (!t) { cursor.classList.remove('is-hot'); return; }
      cursor.classList.add('is-hot');
      let txt = t.dataset ? t.dataset.cursor : '';
      if (!txt) txt = t.tagName === 'A' ? 'open' : '';
      label.textContent = txt;
    });
    document.addEventListener('mouseout', (e) => {
      const to = e.relatedTarget;
      if (!to || !to.closest || !to.closest(HOT)) cursor.classList.remove('is-hot');
    });
  }

  // trail
  if (canvas && finePointer && !reduced) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener('resize', size);

    const parts = [];
    let drawing = false;
    window.addEventListener('mousemove', (e) => {
      parts.push({ x: e.clientX, y: e.clientY, life: 1, s: 1.6 + Math.random() * 3.4, c: Math.random() });
      if (parts.length > 80) parts.shift();
      if (!drawing) { drawing = true; requestAnimationFrame(tick2); }
    }, { passive: true });

    function tick2() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= .032;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        const a = p.life * .5;
        ctx.fillStyle = p.c > .86 ? `rgba(255,59,47,${a})` : (p.c > .78 ? `rgba(45,91,255,${a})` : `rgba(255,255,255,${a})`);
        const s = p.s * p.life;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      if (parts.length) requestAnimationFrame(tick2);
      else { drawing = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }
  }

  /* ---------------------------------------------------------
     6. CLICK RIPPLE
     --------------------------------------------------------- */
  if (hasGSAP && !reduced) {
    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.sticker')) return;
      const r = document.createElement('div');
      r.className = 'ripple';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      body.appendChild(r);
      gsap.fromTo(r, { scale: .2, opacity: 1 }, { scale: 1.4, opacity: 0, duration: .7, ease: 'power2.out', onComplete: () => r.remove() });
    });
  }

  /* ---------------------------------------------------------
     7. HEADER behaviour + mobile menu
     --------------------------------------------------------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');
  let menuOpen = false;

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    body.classList.add('menu-open');
    nav.classList.remove('is-hidden');
    lenis && lenis.stop();
    if (hasGSAP) {
      gsap.fromTo('.menu__nav a', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .07, ease: 'expo.out', delay: .1 });
      gsap.fromTo('.menu__foot', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .6, delay: .45, ease: 'expo.out' });
    }
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
    lenis && lenis.start();
  }
  burger && burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  $('#menuClose') && $('#menuClose').addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  let prevY = window.scrollY;
  const bar = $('.progress span');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-solid', y > 30);
      if (!menuOpen) nav.classList.toggle('is-hidden', y > prevY && y > 320);
    }
    if (bar) {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? clamp(0, 1, y / h) : 0})`;
    }
    prevY = y;
  }, { passive: true });

  // active nav link
  const navLinks = $$('[data-nav]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['thesis', 'team', 'work', 'contact'].forEach((id) => { const el = document.getElementById(id); el && io.observe(el); });
  }

  /* ---------------------------------------------------------
     8. MARQUEES (scroll-reactive)
     --------------------------------------------------------- */
  const marquees = $$('[data-marquee]');
  const mTweens = [];
  if (hasGSAP && !reduced && marquees.length) {
    marquees.forEach((t, i) => {
      t.style.animation = 'none';
      mTweens.push(i % 2
        ? gsap.fromTo(t, { xPercent: -50 }, { xPercent: 0, duration: 34, ease: 'none', repeat: -1 })
        : gsap.fromTo(t, { xPercent: 0 }, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 }));
    });
  }

  // scroll velocity → marquee speed + cheeky skew
  let vel = 0, lastScroll = window.scrollY, ts = 1;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    vel = y - lastScroll; lastScroll = y;
  }, { passive: true });

  const skewOK = hasGSAP && !reduced && finePointer && innerWidth >= 900;
  const sPanels = skewOK ? gsap.quickTo('.panels', 'skewY', { duration: .6, ease: 'power3' }) : null;
  const sCards = skewOK ? gsap.quickTo('.cards', 'skewY', { duration: .6, ease: 'power3' }) : null;

  if (hasGSAP && !reduced) {
    gsap.ticker.add(() => {
      vel *= .92;
      const target = clamp(-3.5, 3.5, 1 + vel * .06);
      ts += (target - ts) * .12;
      mTweens.forEach((t) => t.timeScale(ts));
      if (sPanels) { const s = clamp(-2, 2, vel * .05); sPanels(s); sCards(-s * .7); }
    });
  }

  /* ---------------------------------------------------------
     9. SPLIT TEXT + SCROLL REVEALS
     --------------------------------------------------------- */
  function split(el) {
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    nodes.forEach((n) => {
      if (n.nodeType === 3) {
        Array.from(n.textContent).forEach((ch) => {
          if (ch === ' ') { el.appendChild(document.createTextNode(' ')); return; }
          if (ch === '\n') return;
          const o = document.createElement('span'); o.className = 'ch';
          const i = document.createElement('span'); i.className = 'ch__i'; i.textContent = ch;
          o.appendChild(i); el.appendChild(o);
        });
      } else el.appendChild(n.cloneNode(true));
    });
    return Array.from(el.querySelectorAll('.ch__i'));
  }

  if (hasGSAP && ST && !reduced) {
    $$('[data-split]').forEach((el) => {
      const chars = split(el);
      gsap.from(chars, {
        yPercent: 118, opacity: 0, duration: 1, ease: 'expo.out', stagger: .022,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    gsap.from($$('.thesis__line .word'), {
      yPercent: 115, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .045,
      scrollTrigger: { trigger: '.thesis', start: 'top 62%' }
    });

    $$('.shead__num, .shead__note, .team__foot').forEach((el) => {
      gsap.from(el, { y: 24, opacity: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
    });

    gsap.from('.panel', {
      y: 90, opacity: 0, rotate: (i) => [-4, 3, -2][i] || 0, scale: .94,
      duration: 1.15, ease: 'expo.out', stagger: .12,
      scrollTrigger: { trigger: '.panels', start: 'top 82%' }
    });

    gsap.from('.card', {
      y: 80, opacity: 0, scale: .95, duration: 1, ease: 'expo.out', stagger: .1,
      scrollTrigger: { trigger: '.cards', start: 'top 85%' }
    });

    gsap.from('.contact__title', {
      yPercent: 45, opacity: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.contact', start: 'top 75%' }
    });
    gsap.from(['.mail', '.socials'], {
      y: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .12,
      scrollTrigger: { trigger: '.mail', start: 'top 92%' }
    });

    gsap.to('.hero__inner', {
      y: -90, opacity: .25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.stickers', {
      y: -140, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.contact__mark', {
      rotate: 22, y: -40, ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    window.addEventListener('load', () => ST.refresh());
    setTimeout(() => ST.refresh(), 1200);
  }

  /* ---------------------------------------------------------
     10. PANEL 3D TILT
     --------------------------------------------------------- */
  const panels = $$('.panel');
  if (hasGSAP && finePointer && innerWidth > 900 && !reduced) {
    panels.forEach((p) => {
      const rx = gsap.quickTo(p, 'rotationX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(p, 'rotationY', { duration: .6, ease: 'power3' });
      const ty = gsap.quickTo(p, 'y', { duration: .6, ease: 'power3' });
      p.addEventListener('pointermove', (e) => {
        const r = p.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        rx(-py * 9); ry(px * 13); ty(-10);
      });
      p.addEventListener('pointerleave', () => { rx(0); ry(0); ty(0); });
    });
  }

  /* ---------------------------------------------------------
     11. CARDS — spotlight, tap-flip, locked links
     --------------------------------------------------------- */
  $$('.card').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });
  $$('[data-flip]').forEach((card) => {
    const toggle = () => card.classList.toggle('is-flipped');
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
  $$('[data-locked]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      a.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
        { duration: 320, easing: 'ease-out' }
      );
    });
  });

  /* ---------------------------------------------------------
     12. MAGNETIC ELEMENTS
     --------------------------------------------------------- */
  if (hasGSAP && finePointer && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: .4, ease: 'power3' });
      const y = gsap.quickTo(el, 'y', { duration: .4, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        // clamped so wide elements can never slide out from under the pointer
        x(clamp(-16, 16, (e.clientX - (r.left + r.width / 2)) * .35));
        y(clamp(-12, 12, (e.clientY - (r.top + r.height / 2)) * .55));
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  /* ---------------------------------------------------------
     13. EMAIL COPY + BACK TO TOP
     --------------------------------------------------------- */
  const mail = $('.mail'), copied = $('.mail__copied');
  if (mail && copied) {
    mail.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(mail.dataset.copy || ''); } catch (_) {}
      copied.classList.add('is-on');
      setTimeout(() => copied.classList.remove('is-on'), 1600);
    });
  }
  const toTop = $('#toTop');
  toTop && toTop.addEventListener('click', () => scrollTo(0));

  /* ---------------------------------------------------------
     14. MISC
     --------------------------------------------------------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  // easter egg: press G
  if (hasGSAP && !reduced) {
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() !== 'g' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      stickers.forEach((s, i) => {
        const inner = s.querySelector('.sticker__drag > *');
        if (inner) gsap.to(inner, { y: -46, duration: .28, yoyo: true, repeat: 1, ease: 'power2.out', delay: i * .035 });
      });
    });
  }

  console.log('%c GLYMPH STUDIO ', 'background:#ff3b2f;color:#000;font-weight:700;letter-spacing:.2em;padding:4px 8px');
  console.log('%c drag the stickers. press G. built from scratch.', 'color:#8c8c8c');
})();
