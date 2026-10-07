/* ==========================================================================
   NSA Centro Automotivo — main.js
   Sem dependências. Tudo anima apenas transform/opacity.
   ========================================================================== */
(() => {
  'use strict';

  const WA_NUMBER = '5534991346706';
  const WA_DEFAULT_MSG = 'Olá! Vim pelo site da NSA e quero agendar um serviço.';

  const doc = document.documentElement;
  doc.classList.add('js');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesktop = () => window.innerWidth >= 1024;

  /* ===== 1. Links de WhatsApp com mensagem pronta ===== */
  const waMessages = {
    cambio: 'Olá! Quero saber o valor da troca de óleo do câmbio automático. Meu carro é: ',
    'srv-cambio': 'Olá! Quero um orçamento da troca de óleo do câmbio automático. Meu carro é: ',
    pneus: 'Olá! Quero o preço de pneu novo. A medida do meu pneu é: ',
    faq: 'Olá! Tenho uma dúvida: '
  };
  $$('[data-wa]').forEach((a) => {
    const msg = waMessages[a.dataset.wa] || WA_DEFAULT_MSG;
    a.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  });

  /* ===== 2. Status "aberto agora" (horário de Brasília) ===== */
  const getNowBR = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[get('weekday')], minutes: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
  };
  const schedule = { 0: null, 1: [480, 1080], 2: [480, 1080], 3: [480, 1080], 4: [480, 1080], 5: [480, 1080], 6: [480, 840] };
  const fmt = (m) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;

  const updateStatus = () => {
    const el = $('[data-status]');
    if (!el) return;
    let now;
    try { now = getNowBR(); } catch { return; }
    const today = schedule[now.day];
    const txt = $('.status__text', el);
    el.classList.remove('is-open', 'is-closed');
    if (today && now.minutes >= today[0] && now.minutes < today[1]) {
      el.classList.add('is-open');
      txt.textContent = `Aberto agora · fecha às ${fmt(today[1])}`;
    } else {
      el.classList.add('is-closed');
      let next = now.day; let label = '';
      if (today && now.minutes < today[0]) { label = `hoje às ${fmt(today[0])}`; }
      else {
        for (let i = 1; i <= 7; i++) {
          next = (now.day + i) % 7;
          if (schedule[next]) { label = i === 1 ? `amanhã às ${fmt(schedule[next][0])}` : `${['domingo','segunda','terça','quarta','quinta','sexta','sábado'][next]} às ${fmt(schedule[next][0])}`; break; }
        }
      }
      txt.textContent = `Fechado agora · abre ${label}`;
    }
    // destaca o dia no rodapé
    $$('[data-hours] li').forEach((li) => {
      const d = li.dataset.day;
      const match = d === '1-5' ? now.day >= 1 && now.day <= 5 : Number(d) === now.day;
      li.classList.toggle('is-today', match);
    });
  };
  updateStatus();
  setInterval(updateStatus, 60000);

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ===== 3. Hero: vídeo começa sem atrasar o LCP (poster carrega primeiro) ===== */
  const heroVideo = $('.hero__video');
  if (heroVideo) {
    const startVideo = () => {
      if (reduceMotion) return; // respeita movimento reduzido: fica no poster
      heroVideo.preload = 'auto';
      heroVideo.load();
      const p = heroVideo.play();
      if (p && p.catch) p.catch(() => {});
    };
    if (document.readyState === 'complete') startVideo();
    else window.addEventListener('load', startVideo, { once: true });

    // pausa quando sai da tela (economiza bateria no celular)
    new IntersectionObserver(([e]) => {
      if (reduceMotion || heroVideo.readyState === 0) return;
      e.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause();
    }).observe(heroVideo);
  }

  /* ===== 4. Nav: encolhe no scroll + seção ativa ===== */
  const nav = $('[data-nav]');
  const progressBar = $('.progress__bar');
  const sticky = $('[data-sticky]');
  const waFloat = $('.wa-float');
  const stickyLink = sticky && $('a', sticky);

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? y / max : 0;
    nav.classList.toggle('is-scrolled', y > 40);
    if (waFloat) waFloat.classList.toggle('is-hidden', y < window.innerHeight * 0.5);
    if (progressBar) progressBar.style.transform = `scaleX(${p})`;

    // CTA fixo no mobile depois de 40% da página (some no final, onde já há CTA)
    if (sticky) {
      const show = p > 0.4 && p < 0.94;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', String(!show));
      if (stickyLink) stickyLink.tabIndex = show ? 0 : -1;
      document.body.classList.toggle('has-sticky', show && window.innerWidth < 768);
    }
    parallax();
    hscroll();
    timeline();
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  const navLinks = $$('.nav__links a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navIO.observe(s));

  /* ===== 5. Menu mobile fullscreen com trap de foco ===== */
  const burger = $('[data-burger]');
  const menu = $('[data-menu]');
  let lastFocus = null;
  const focusables = () => $$('a, button', menu).concat(burger);

  const openMenu = () => {
    lastFocus = document.activeElement;
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fechar menu');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('a', menu)?.focus(), 50);
  };
  const closeMenu = (restore = true) => {
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
    if (restore && lastFocus) lastFocus.focus();
  };
  burger?.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') closeMenu();
    if (e.key === 'Tab') {
      const f = focusables();
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1100 && !menu.hidden) closeMenu(false); });

  /* ===== 6. Scroll reveal com stagger ===== */
  const revealEls = $$('.reveal');
  // stagger: irmãos .reveal dentro do mesmo pai recebem atraso crescente
  const groups = new Map();
  revealEls.forEach((el) => {
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    el.style.setProperty('--delay', `${Math.min(i * 80, 480)}ms`);
    groups.set(parent, i + 1);
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ===== 7. Contadores animados ===== */
  const counters = $$('[data-count]');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const dur = 1600; const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = (target * ease(p)).toFixed(dec).replace('.', ',');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!reduceMotion) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.3 });
    counters.forEach((c) => { c.textContent = '0'; cio.observe(c); });
  }

  /* ===== 8. Parallax / escala ligados ao scroll (desktop) ===== */
  const heroMedia = $('[data-parallax]');
  const scaleEl = $('[data-scale]');
  const aboutImg = $('[data-parallax-img] img');
  function parallax() {
    if (reduceMotion || !isDesktop()) return;
    const vh = window.innerHeight;
    if (heroMedia && window.scrollY < vh * 1.2) {
      heroMedia.style.transform = `translate3d(0, ${window.scrollY * parseFloat(heroMedia.dataset.parallax)}px, 0)`;
    }
    if (scaleEl) {
      const r = scaleEl.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = 1 - (r.top + r.height) / (vh + r.height); // 0 → 1 enquanto atravessa a tela
        scaleEl.style.transform = `scale(${1.18 - p * 0.18})`;
      }
    }
    if (aboutImg) {
      const r = aboutImg.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        aboutImg.style.transform = `translate3d(0, ${p * -60 - 30}px, 0)`;
      }
    }
  }

  /* ===== 9. Linha da timeline que "se desenha" ===== */
  const tl = $('[data-timeline]');
  const tlLine = tl && $('.timeline__line span', tl);
  const steps = tl ? $$('.step', tl) : [];
  function timeline() {
    if (!tl) return;
    const r = tl.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(Math.max((vh * 0.75 - r.top) / (r.height + vh * 0.2), 0), 1);
    tlLine.style.setProperty('--p', reduceMotion ? 1 : p.toFixed(3));
    steps.forEach((s, i) => s.classList.toggle('is-lit', reduceMotion || p >= (i + 0.2) / steps.length));
  }

  /* ===== 10. Galeria horizontal com scroll travado (desktop) ===== */
  const hs = $('[data-hscroll]');
  const track = hs && $('[data-track]', hs);
  let hsDistance = 0;
  const setupHscroll = () => {
    if (!hs) return;
    const pin = isDesktop() && !reduceMotion;
    hs.classList.toggle('is-pinned', pin);
    if (pin) {
      track.style.transform = '';
      hsDistance = Math.max(track.scrollWidth - window.innerWidth + 80, 0);
      hs.style.height = `${window.innerHeight + hsDistance}px`;
    } else {
      hs.style.height = '';
      track.style.transform = '';
    }
    hscroll();
  };
  function hscroll() {
    if (!hs || !hs.classList.contains('is-pinned')) return;
    const r = hs.getBoundingClientRect();
    const p = Math.min(Math.max(-r.top / (hs.offsetHeight - window.innerHeight), 0), 1);
    track.style.transform = `translate3d(${-p * hsDistance}px, 0, 0)`;
  }
  window.addEventListener('load', setupHscroll);
  let rT;
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { setupHscroll(); onScroll(); }, 150); });
  setupHscroll();

  /* ===== 11. Player do vídeo com som ===== */
  const player = $('[data-player]');
  if (player) {
    const v = $('video', player);
    const btn = $('[data-play]', player);
    btn.addEventListener('click', () => { v.muted = false; v.play().catch(() => {}); });
    v.addEventListener('play', () => player.classList.add('is-playing'));
    v.addEventListener('pause', () => player.classList.remove('is-playing'));
    v.addEventListener('ended', () => player.classList.remove('is-playing'));
  }

  /* ===== 12. Accordion (FAQ) ===== */
  $$('[data-accordion] button[aria-controls]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      if (!open) { panel.classList.remove('is-opening'); void panel.offsetWidth; panel.classList.add('is-opening'); }
    });
  });

  /* ===== 13. Formulário → WhatsApp (validação inline + loading + toast) ===== */
  const form = $('[data-form]');
  const toastEl = $('[data-toast]');
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('is-show'), 3200);
  };
  if (form) {
    const carro = $('#f-carro', form);
    const field = carro.closest('.field');
    const err = $('#f-carro-erro', form);
    const validate = () => {
      const ok = carro.value.trim().length >= 2;
      field.classList.toggle('is-invalid', !ok);
      field.classList.toggle('is-valid', ok);
      carro.setAttribute('aria-invalid', String(!ok));
      err.textContent = ok ? '' : 'Escreva o modelo do seu carro. Ex.: Onix 2019';
      return ok;
    };
    carro.addEventListener('blur', () => { if (carro.value) validate(); });
    carro.addEventListener('input', () => { if (field.classList.contains('is-invalid')) validate(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) { carro.focus(); toast('Falta só o modelo do carro 😉'); return; }
      const btn = $('button[type="submit"]', form);
      const label = $('.btn__label', btn);
      btn.classList.add('is-loading');
      label.textContent = 'Abrindo o WhatsApp';
      const nome = $('#f-nome', form).value.trim();
      const servico = $('#f-servico', form).value;
      const msg = `Olá! ${nome ? `Meu nome é ${nome}. ` : ''}Vim pelo site da NSA.\nCarro: ${carro.value.trim()}\nServiço: ${servico}\nPode me passar o valor e um horário?`;
      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
      setTimeout(() => {
        const w = window.open(url, '_blank', 'noopener');
        if (!w) window.location.href = url;
        btn.classList.remove('is-loading');
        label.textContent = 'Enviar pelo WhatsApp';
        toast('Pronto! É só apertar enviar no WhatsApp.');
      }, 450);
    });
  }

  /* ===== 14. Mapa carregado sob demanda (não pesa a página) ===== */
  const mapBox = $('[data-map]');
  const loadMap = () => {
    if (!mapBox || mapBox.dataset.loaded) return;
    mapBox.dataset.loaded = '1';
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.google.com/maps?q=-18.9077137,-48.2717216&z=17&output=embed';
    iframe.title = 'Mapa: NSA Centro Automotivo, Av. João Pinheiro 1783, Uberlândia';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    mapBox.innerHTML = '';
    mapBox.appendChild(iframe);
  };
  $('[data-map-load]')?.addEventListener('click', loadMap);
  if (mapBox) {
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { loadMap(); o.disconnect(); } }, { rootMargin: '300px' }).observe(mapBox);
  }

  /* ===== 15. Desktop: cursor, botões magnéticos, tilt e brilho nos cards ===== */
  if (finePointer && !reduceMotion) {
    doc.classList.add('has-cursor');
    const cursor = $('.cursor');
    const dot = $('.cursor__dot'); const ring = $('.cursor__ring');
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`; }, { passive: true });
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mouseover', (e) => cursor.classList.toggle('is-hover', !!e.target.closest('a, button, [data-tilt], input, select')));

    // magnetic
    $$('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2; const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate3d(${x * 0.18}px, ${y * 0.3}px, 0)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    // tilt 3D + brilho que segue o mouse
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width; const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        if (!el.classList.contains('is-in') && el.classList.contains('reveal')) return;
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 6}deg)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  onScroll();
})();
