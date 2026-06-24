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
function applyCursorHover(el) {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
}
document.querySelectorAll(hoverTargets).forEach(applyCursorHover);

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
function init3DTilt(card) {
  card.addEventListener('mousemove', (e) => {
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;
    const y = (e.clientY - top)  / height - 0.5;
    card.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateZ(6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
}
document.querySelectorAll('.project-card, .exp-entry, .about-right').forEach(init3DTilt);

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

/* ─── Medium latest posts ────────────────────────────────── */
(async function fetchLatestPosts() {
  const FEED    = 'https://nisarg-research.medium.com/feed';
  const API     = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED)}`;

  const loading = document.getElementById('writingLoading');
  const grid    = document.getElementById('writingGrid');
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

    const posts = data.items.slice(0, 2);
    
    posts.forEach((post, index) => {
      const badgeText = index === 0 ? 'Latest' : 'Article';
      const card = document.createElement('article');
      card.className = 'writing-card reveal-up';
      card.dataset.delay = index * 80;
      
      card.innerHTML = `
        <div class="writing-eyebrow">
          <span class="writing-badge">${badgeText}</span>
          <span class="writing-sep">·</span>
          <span class="writing-meta-text">${fmtDate(post.pubDate)}</span>
          <span class="writing-sep">·</span>
          <span class="writing-meta-text">${readTime(post.content || post.description)}</span>
        </div>
        <h3 class="writing-title liquid-text">${post.title}</h3>
        <div class="writing-footer">
          <a
            href="${post.link}"
            class="card-link writing-link"
            target="_blank"
            rel="noopener"
          >
            <span>Read on Medium</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
        </div>
      `;
      
      grid.appendChild(card);
      init3DTilt(card);
      applyCursorHover(card);
      const link = card.querySelector('.writing-link');
      if (link) applyCursorHover(link);
      revealObserver.observe(card);
    });

    loading.style.display = 'none';
    grid.style.display    = 'grid';

    /* run liquid text on the newly populated elements */
    grid.querySelectorAll('.liquid-text').forEach((el) => {
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

/* ─── Mobile navigation menu ─────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const navLinksContainer = document.querySelector('.nav-links');
const navLinksArray = document.querySelectorAll('.nav-link');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinksContainer.classList.toggle('active');
  });

  navLinksArray.forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinksContainer.classList.remove('active');
    });
  });
}

/* ─── Gravity Dot Grid Background ────────────────────────── */
(function initGravityGrid() {
  const canvas = document.getElementById('gravityGrid');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let dots = [];
  const spacing = 36;
  const dotColor = 'rgba(143, 142, 255, 0.08)';
  const activeDotColor = 'rgba(143, 142, 255, 0.18)';
  const warpRadius = 136.5;
  const warpForce = 15;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupDots();
  }

  function setupDots() {
    dots = [];
    const cols = Math.floor(canvas.width / spacing) + 2;
    const rows = Math.floor(canvas.height / spacing) + 2;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = c * spacing;
        const y = r * spacing;
        dots.push({
          x: x,
          y: y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0
        });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (document.body.classList.contains('research-mode')) {
      requestAnimationFrame(draw);
      return;
    }

    dots.forEach((dot) => {
      const dx = mx - dot.x;
      const dy = my - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < warpRadius && dist > 0) {
        const force = (warpRadius - dist) / warpRadius;
        const angle = Math.atan2(dy, dx);
        
        const targetX = dot.baseX - Math.cos(angle) * force * warpForce;
        const targetY = dot.baseY - Math.sin(angle) * force * warpForce;

        dot.x += (targetX - dot.x) * 0.12;
        dot.y += (targetY - dot.y) * 0.12;
      } else {
        dot.x += (dot.baseX - dot.x) * 0.08;
        dot.y += (dot.baseY - dot.y) * 0.08;
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = dist < warpRadius ? activeDotColor : dotColor;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
  
  window.triggerMatrixGlitch = function() {
    dots.forEach((dot) => {
      dot.x += (Math.random() - 0.5) * 120;
      dot.y += (Math.random() - 0.5) * 120;
    });
  };
})();

/* ─── Command Palette ────────────────────────────────────── */
(function initCommandPalette() {
  const backdrop = document.getElementById('cmdBackdrop');
  const input = document.getElementById('cmdInput');
  const suggestions = document.getElementById('cmdSuggestions');
  if (!backdrop || !input || !suggestions) return;

  const commands = [
    { input: '/about', label: 'Go to About', desc: 'Scroll to about section', action: () => scrollToId('#about') },
    { input: '/experience', label: 'Go to Experience', desc: 'Scroll to resume timeline', action: () => scrollToId('#experience') },
    { input: '/work', label: 'Go to Selected Work', desc: 'Scroll to projects grid', action: () => scrollToId('#work') },
    { input: '/writing', label: 'Go to Writing', desc: 'Scroll to Medium articles', action: () => scrollToId('#writing') },
    { input: '/contact', label: 'Go to Contact', desc: 'Scroll to links and email', action: () => scrollToId('#contact') },
    { input: '/research', label: 'Toggle Research Mode', desc: 'Toggle LaTeX academic draft theme', action: () => toggleResearchMode() },
    { input: '/matrix', label: 'Matrix Grid Glitch', desc: 'Glitch the background dot alignment', action: () => { if (window.triggerMatrixGlitch) window.triggerMatrixGlitch(); } }
  ];

  let selectedIndex = 0;
  let filtered = [...commands];

  function scrollToId(id) {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  function openPalette() {
    backdrop.classList.add('active');
    input.value = '';
    input.focus();
    filterCommands('');
  }

  function closePalette() {
    backdrop.classList.remove('active');
    input.blur();
  }

  function filterCommands(query) {
    filtered = commands.filter(cmd => 
      cmd.input.toLowerCase().includes(query.toLowerCase()) || 
      cmd.label.toLowerCase().includes(query.toLowerCase())
    );
    selectedIndex = 0;
    renderSuggestions();
  }

  function renderSuggestions() {
    suggestions.innerHTML = '';
    filtered.forEach((cmd, idx) => {
      const div = document.createElement('div');
      div.className = `cmd-item ${idx === selectedIndex ? 'selected' : ''}`;
      div.innerHTML = `
        <div class="cmd-item-left">
          <span class="cmd-item-label">${cmd.label}</span>
          <span class="cmd-item-desc">${cmd.desc}</span>
        </div>
        <span class="cmd-item-shortcut">${cmd.input}</span>
      `;
      div.addEventListener('click', () => {
        cmd.action();
        closePalette();
      });
      if (typeof applyCursorHover === 'function') {
        applyCursorHover(div);
      }
      suggestions.appendChild(div);
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (backdrop.classList.contains('active')) {
        closePalette();
      } else {
        openPalette();
      }
    }

    if (!backdrop.classList.contains('active')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filtered.length;
      renderSuggestions();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
      renderSuggestions();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        closePalette();
      }
    }
  });

  input.addEventListener('input', (e) => {
    filterCommands(e.target.value);
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closePalette();
    }
  });

  console.log("Welcome to Nisarg's Portfolio! Press Ctrl+K (or Cmd+K) to open the Command Palette.");
})();

/* ─── Research Mode (LaTeX Style Theme) ───────────────────── */
function toggleResearchMode() {
  const isResearch = document.body.classList.toggle('research-mode');
  localStorage.setItem('researchMode', isResearch ? 'true' : 'false');
  
  document.querySelectorAll('.reveal-up, .reveal-fade').forEach((el) => {
    if (isResearch) {
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
      if (typeof revealObserver !== 'undefined') {
        revealObserver.observe(el);
      }
    }
  });
}

(function initResearchMode() {
  const toggleBtn = document.getElementById('researchToggle');
  
  if (localStorage.getItem('researchMode') === 'true') {
    document.body.classList.add('research-mode');
    document.querySelectorAll('.reveal-up, .reveal-fade').forEach(el => el.classList.add('visible'));
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleResearchMode();
    });
  }
})();
