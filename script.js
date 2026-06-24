/* ─── Always start at top on reload ─────────────────────── */
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ─── Noise texture ──────────────────────────────────────── */
(function () {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const d = ctx.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255 | 0;
    d.data[i] = d.data[i+1] = d.data[i+2] = v;
    d.data[i+3] = 255;
  }
  ctx.putImageData(d, 0, 0);
  document.body.style.setProperty('--noise-url', `url(${c.toDataURL()})`);
})();

/* ─── Loader ─────────────────────────────────────────────── */
const loader = document.getElementById('loader');
window.addEventListener('load', () => {
  setTimeout(() => {
    loader.classList.add('done');
    runHeroReveal();
  }, 950);
});

/* ─── Hero reveal ─────────────────────────────────────────── */
function runHeroReveal() {
  const words = document.querySelectorAll('.hero-word');
  words.forEach((el) => {
    const delay = parseInt(el.dataset.delay || 0, 10);
    setTimeout(() => el.classList.add('revealed'), delay);
  });

  setTimeout(() => {
    document.querySelector('.hero-rule').classList.add('revealed');
  }, 300);

  document.querySelectorAll('.reveal-fade').forEach((el) => {
    const delay = parseInt(el.dataset.delay || 0, 10);
    setTimeout(() => el.classList.add('visible'), delay);
  });
}

/* ─── Custom cursor ──────────────────────────────────────── */
const dot  = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx = -100, my = -100, rx = -100, ry = -100;

document.addEventListener('mousemove', (e) => {
  mx = e.clientX;
  my = e.clientY;
  dot.style.transform = `translate(${mx}px,${my}px)`;
});

(function animateRing() {
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  ring.style.transform = `translate(${rx}px,${ry}px)`;
  requestAnimationFrame(animateRing);
})();

const hoverTargets = 'a, button, .project-card, .card-link, .contact-email, .social-link, .nav-link, .nav-logo';
document.querySelectorAll(hoverTargets).forEach((el) => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ─── Mouse aura ─────────────────────────────────────────── */
const aura = document.createElement('div');
aura.id = 'mouseAura';
document.body.appendChild(aura);
let auraX = window.innerWidth / 2, auraY = window.innerHeight / 2;
(function animateAura() {
  auraX += (mx - auraX) * 0.07;
  auraY += (my - auraY) * 0.07;
  aura.style.transform = `translate(${auraX}px,${auraY}px)`;
  requestAnimationFrame(animateAura);
})();

/* ─── Nav scroll behaviour ───────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ─── Scroll reveal (IntersectionObserver) ───────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el    = entry.target;
    const delay = parseInt(el.dataset.delay || 0, 10);
    setTimeout(() => el.classList.add('visible'), delay);
    revealObserver.unobserve(el);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal-up').forEach((el) => revealObserver.observe(el));

/* ─── 3-D card tilt ──────────────────────────────────────── */
document.querySelectorAll('.project-card, .writing-card, .exp-entry, .about-right').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;
    const y = (e.clientY - top)  / height - 0.5;
    card.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateZ(6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ─── Liquid text reveal ─────────────────────────────────── */
(function initLiquidText() {
  document.querySelectorAll('.liquid-text').forEach((el) => {
    // Split text nodes into per-word spans, preserving element children untouched
    const fragment = document.createDocumentFragment();
    el.childNodes.forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) {
        fragment.appendChild(node.cloneNode(true));
        return;
      }
      node.textContent.split(/(\s+)/).forEach((chunk) => {
        if (/^\s+$/.test(chunk)) {
          fragment.appendChild(document.createTextNode(chunk));
        } else if (chunk) {
          const s = document.createElement('span');
          s.className = 'lw';
          s.textContent = chunk;
          fragment.appendChild(s);
        }
      });
    });
    el.innerHTML = '';
    el.appendChild(fragment);
  });

  const lo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.lw').forEach((w, i) => {
        setTimeout(() => w.classList.add('lw-in'), i * 48);
      });
      lo.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.liquid-text').forEach((el) => lo.observe(el));
})();

/* ─── Medium latest post ─────────────────────────────────── */
(async function fetchLatestPost() {
  const FEED    = 'https://nisarg-research.medium.com/feed';
  const API     = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED)}`;

  const loading = document.getElementById('writingLoading');
  const content = document.getElementById('writingContent');
  const error   = document.getElementById('writingError');

  function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || '';
  }
  function fmtDate(str) {
    return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function readTime(html) {
    const words = stripHtml(html).split(/\s+/).length;
    return Math.max(1, Math.round(words / 200)) + ' min read';
  }

  try {
    const res  = await fetch(API);
    const data = await res.json();
    if (data.status !== 'ok' || !data.items?.length) throw new Error('empty');

    const post = data.items[0];
    document.getElementById('postDate').textContent     = fmtDate(post.pubDate);
    document.getElementById('postReadTime').textContent = readTime(post.content || post.description);
    document.getElementById('postTitle').textContent    = post.title;
    document.getElementById('postExcerpt').textContent  =
      stripHtml(post.description).replace(/\s+/g, ' ').trim().slice(0, 220) + '…';
    document.getElementById('postLink').href = post.link;

    loading.style.display = 'none';
    content.style.display = 'block';

    /* re-run liquid text on the newly populated elements */
    content.querySelectorAll('.liquid-text').forEach((el) => {
      const raw = el.textContent;
      el.innerHTML = raw.split(/(\s+)/).map(chunk =>
        /^\s+$/.test(chunk) ? chunk : `<span class="lw lw-in">${chunk}</span>`
      ).join('');
    });
  } catch (err) {
    console.error('[writing fetch]', err);
    loading.style.display = 'none';
    error.style.display   = 'flex';
  }
})();

/* ─── Active nav link highlight ──────────────────────────── */
const sections   = document.querySelectorAll('section[id]');
const navLinks   = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.style.color = link.getAttribute('href') === `#${entry.target.id}`
        ? 'var(--text-1)' : '';
    });
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach((s) => sectionObserver.observe(s));
