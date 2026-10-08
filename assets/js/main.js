(function() {
  "use strict";
  var doc = document.documentElement;
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fineMQ = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reduced = reduceMQ.matches;
  var fine = fineMQ.matches;
  var EASE = "cubic-bezier(.2,.8,.2,1)";
  var $ = function(s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var clamp = function(v, a, b) {
    return Math.min(b, Math.max(a, v));
  };
  var themeBtn = $(".theme-toggle");
  function syncThemeLabel() {
    var light = doc.getAttribute("data-theme") === "light";
    themeBtn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", light ? "#f3f5fb" : "#070b18");
  }
  if (themeBtn) {
    syncThemeLabel();
    themeBtn.addEventListener("click", function() {
      var next = doc.getAttribute("data-theme") === "light" ? "dark" : "light";
      doc.setAttribute("data-theme", next);
      try {
        localStorage.setItem("jb-theme", next);
      } catch (e) {}
      syncThemeLabel();
      if (hero.refreshColors) hero.refreshColors();
    });
  }
  $$("[data-print]").forEach(function(el) {
    el.addEventListener("click", function(e) {
      e.preventDefault();
      closeMenu();
      setTimeout(function() {
        window.print();
      }, 50);
    });
  });
  var nav = $("#nav");
  var bar = $(".progress__bar");
  var timeline = $(".timeline");
  var tlFill = $(".timeline__fill");
  var tlItems = $$(".tl");
  var tlOffsets = [];
  function measureTimeline() {
    if (!timeline) return;
    tlOffsets = tlItems.map(function(it) {
      return it.offsetTop + 14;
    });
  }
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (max > 0 ? clamp(y / max, 0, 1) : 0) + ")";
    if (nav) nav.classList.toggle("is-scrolled", y > 24);
    if (timeline && tlFill) {
      var r = timeline.getBoundingClientRect();
      var p = reduced ? 1 : clamp((window.innerHeight * .62 - r.top) / r.height, 0, 1);
      tlFill.style.transform = "scaleY(" + p + ")";
      var reach = p * r.height;
      tlItems.forEach(function(it, i) {
        it.classList.toggle("is-active", tlOffsets[i] <= reach + 1);
      });
    }
    ticking = false;
  }
  window.addEventListener("scroll", function() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, {
    passive: true
  });
  window.addEventListener("resize", function() {
    measureTimeline();
    onScroll();
    positionPill();
  }, {
    passive: true
  });
  measureTimeline();
  onScroll();
  var navLinks = $$(".nav__links a");
  if ("IntersectionObserver" in window && navLinks.length) {
    var secIO = new IntersectionObserver(function(entries) {
      entries.forEach(function(en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        navLinks.forEach(function(a) {
          var on = a.getAttribute("href") === "#" + id;
          a.classList.toggle("is-active", on);
          if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
        });
      });
    }, {
      rootMargin: "-45% 0px -50% 0px"
    });
    [ "top", "about", "projects", "experience", "skills", "contact" ].forEach(function(id) {
      var s = document.getElementById(id);
      if (s) secIO.observe(s);
    });
  }
  var burger = $(".burger");
  var menu = $("#mobile-menu");
  var inertTargets = [ $("#main"), $(".footer") ];
  function openMenu() {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Close menu");
    doc.classList.add("menu-open");
    inertTargets.forEach(function(t) {
      if (t) t.inert = true;
    });
    var first = $("a", menu);
    if (first) setTimeout(function() {
      first.focus({
        preventScroll: true
      });
    }, 200);
  }
  function closeMenu() {
    if (!menu || !menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    doc.classList.remove("menu-open");
    inertTargets.forEach(function(t) {
      if (t) t.inert = false;
    });
  }
  if (burger && menu) {
    burger.addEventListener("click", function() {
      if (menu.classList.contains("is-open")) {
        closeMenu();
        burger.focus();
      } else openMenu();
    });
    $$("a", menu).forEach(function(a) {
      a.addEventListener("click", function() {
        if (!a.hasAttribute("data-print")) closeMenu();
      });
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        closeMenu();
        burger.focus();
      }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function(m) {
      if (m.matches) closeMenu();
    });
  }
  var nameEl = $("[data-split]");
  if (nameEl && !reduced) {
    var full = nameEl.textContent.replace(/\s+/g, " ").trim();
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = full;
    var lines = $$(".hero__line", nameEl);
    var originals = [];
    var idx = 0;
    var lastCh = null;
    lines.forEach(function(line) {
      var text = line.textContent.trim();
      originals.push(text);
      var accent = line.classList.contains("hero__line--accent");
      line.textContent = "";
      line.setAttribute("aria-hidden", "true");
      line.classList.add("is-split");
      var chars = text.replace(/\s/g, "").length;
      var k = 0;
      text.split(" ").forEach(function(w, wi) {
        if (wi) line.appendChild(document.createTextNode(" "));
        var word = document.createElement("span");
        word.className = "word";
        Array.prototype.forEach.call(w, function(c) {
          var s = document.createElement("span");
          s.className = "ch";
          s.textContent = c;
          s.style.setProperty("--i", idx++);
          if (accent) {
            var t = chars > 1 ? Math.round(k / (chars - 1) * 100) : 0;
            s.style.color = "color-mix(in oklab, var(--a2) " + t + "%, var(--a1))";
          }
          k++;
          word.appendChild(s);
          lastCh = s;
        });
        line.appendChild(word);
      });
    });
    nameEl.insertBefore(sr, nameEl.firstChild);
    if (lastCh) {
      lastCh.addEventListener("animationend", function() {
        lines.forEach(function(line, i) {
          line.textContent = originals[i];
          line.classList.remove("is-split");
          line.removeAttribute("aria-hidden");
        });
        sr.remove();
      }, {
        once: true
      });
    }
  }
  var slot = $(".role__slot");
  if (slot && !reduced) {
    var words = [ "Full-stack developer", "Android apps", "Discord bots", "Computer vision", "Game add-ons" ];
    var wi = 0;
    var cur = $(".role__word", slot);
    var setW = function(el) {
      slot.style.width = Math.ceil(el.getBoundingClientRect().width) + "px";
    };
    var startSlot = function() {
      setW(cur);
      setInterval(function() {
        if (document.hidden) return;
        wi = (wi + 1) % words.length;
        var next = document.createElement("span");
        next.className = "role__word";
        next.textContent = words[wi];
        next.style.position = "absolute";
        next.style.left = "0";
        next.style.top = "0";
        slot.appendChild(next);
        setW(next);
        var opts = {
          duration: 650,
          easing: "cubic-bezier(.7,0,.2,1)",
          fill: "forwards"
        };
        cur.animate([ {
          transform: "translateY(0)",
          opacity: 1,
          filter: "blur(0)"
        }, {
          transform: "translateY(-110%)",
          opacity: 0,
          filter: "blur(4px)"
        } ], opts);
        var a = next.animate([ {
          transform: "translateY(110%)",
          opacity: 0,
          filter: "blur(4px)"
        }, {
          transform: "translateY(0)",
          opacity: 1,
          filter: "blur(0)"
        } ], opts);
        var old = cur;
        cur = next;
        a.onfinish = function() {
          old.remove();
          next.style.position = "";
          a.cancel();
        };
      }, 2600);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(startSlot); else startSlot();
  }
  var hero = {
    refreshColors: null
  };
  (function initCanvas() {
    var canvas = $(".hero__canvas");
    var section = $(".hero");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = 1, pts = [], running = false, visible = true, raf = 0;
    var mouse = {
      x: -9999,
      y: -9999,
      tx: -9999,
      ty: -9999,
      on: false
    };
    var col = {
      a: "46,230,197",
      b: "140,170,255"
    };
    function hexToRgb(h) {
      h = h.trim().replace("#", "");
      if (h.length === 3) h = h.split("").map(function(c) {
        return c + c;
      }).join("");
      var n = parseInt(h, 16);
      return [ n >> 16 & 255, n >> 8 & 255, n & 255 ].join(",");
    }
    hero.refreshColors = function() {
      var cs = getComputedStyle(doc);
      try {
        col.a = hexToRgb(cs.getPropertyValue("--a1"));
        col.b = doc.getAttribute("data-theme") === "light" ? "40,70,160" : "150,175,235";
      } catch (e) {}
      if (!running) draw();
    };
    function resize() {
      var r = section.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp(W * H / 15e3, 28, 95));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: 0,
          vy: 0,
          a: Math.random() * Math.PI * 2,
          sp: .18 + Math.random() * .32,
          r: Math.random() * 1.4 + .5,
          tw: Math.random() * Math.PI * 2
        });
      }
      if (!running) draw();
    }
    var LINK = 128, MR = 170;
    function step() {
      mouse.x += (mouse.tx - mouse.x) * .12;
      mouse.y += (mouse.ty - mouse.y) * .12;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (mouse.on) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < MR * MR && d2 > 1) {
            var d = Math.sqrt(d2), f = (1 - d / MR) * .6;
            p.x += dx / d * f;
            p.y += dy / d * f;
          }
        }
        p.a += (Math.random() - .5) * .03;
        var k = reduced ? .35 : 1;
        p.vx += (Math.cos(p.a) * p.sp * k - p.vx) * .05;
        p.vy += (Math.sin(p.a) * p.sp * k - p.vy) * .05;
        p.x += p.vx;
        p.y += p.vy;
        p.tw += .02;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var i, j, p, q, dx, dy, d2;
      ctx.lineWidth = 1;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        for (j = i + 1; j < pts.length; j++) {
          q = pts[j];
          dx = p.x - q.x;
          dy = p.y - q.y;
          d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = "rgba(" + col.b + "," + (.16 * (1 - Math.sqrt(d2) / LINK)).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
        if (mouse.on) {
          dx = p.x - mouse.x;
          dy = p.y - mouse.y;
          d2 = dx * dx + dy * dy;
          if (d2 < (MR + 40) * (MR + 40)) {
            ctx.strokeStyle = "rgba(" + col.a + "," + (.35 * (1 - Math.sqrt(d2) / (MR + 40))).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        var a = .45 + Math.sin(p.tw) * .25;
        ctx.fillStyle = "rgba(" + (p.r > 1.5 ? col.a : col.b) + "," + a.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    function loop() {
      if (!running) return;
      step();
      draw();
      raf = requestAnimationFrame(loop);
    }
    function setRunning() {
      var should = visible && !document.hidden;
      if (should && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }
    hero.refreshColors();
    resize();
    if ("ResizeObserver" in window) {
      var lastW = 0;
      new ResizeObserver(function() {
        var w = section.getBoundingClientRect().width;
        if (Math.abs(w - lastW) > 40 || !lastW) {
          lastW = w;
          resize();
        }
      }).observe(section);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function(en) {
        visible = en[0].isIntersecting;
        setRunning();
      }).observe(section);
    }
    document.addEventListener("visibilitychange", setRunning);
    if (fine) {
      section.addEventListener("pointermove", function(e) {
        var r = section.getBoundingClientRect();
        mouse.tx = e.clientX - r.left;
        mouse.ty = e.clientY - r.top;
        if (!mouse.on) {
          mouse.x = mouse.tx;
          mouse.y = mouse.ty;
        }
        mouse.on = true;
      }, {
        passive: true
      });
      section.addEventListener("pointerleave", function() {
        mouse.on = false;
      });
    }
    setRunning();
  })();
  var revealEls = $$("[data-reveal]");
  $$(".skill-row").forEach(function(row) {
    $$(".skill-chips li", row).forEach(function(li, i) {
      li.style.setProperty("--ci", i);
    });
  });
  if ("IntersectionObserver" in window && !reduced) {
    var rIO = new IntersectionObserver(function(entries) {
      var batch = entries.filter(function(e) {
        return e.isIntersecting;
      }).map(function(e) {
        return e.target;
      });
      batch.sort(function(a, b) {
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return ra.top - rb.top || ra.left - rb.left;
      });
      batch.forEach(function(el, i) {
        el.style.setProperty("--rd", Math.min(i, 6) * 90 + "ms");
        el.classList.add("is-in");
        rIO.unobserve(el);
        setTimeout(function() {
          el.style.removeProperty("--rd");
        }, 1600);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0
    });
    revealEls.forEach(function(el) {
      rIO.observe(el);
    });
  } else {
    revealEls.forEach(function(el) {
      el.classList.add("is-in");
    });
  }
  var nums = $$(".stat__num[data-count]");
  if (nums.length && "IntersectionObserver" in window && !reduced) {
    nums.forEach(function(n) {
      n.textContent = "0" + (n.dataset.suffix || "");
    });
    var cIO = new IntersectionObserver(function(entries) {
      entries.forEach(function(en) {
        if (!en.isIntersecting) return;
        cIO.unobserve(en.target);
        var el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = null, dur = 1700 + end * 2;
        (function tick(t) {
          if (t0 === null) t0 = t;
          var k = clamp((t - t0) / dur, 0, 1);
          var e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
          el.textContent = Math.round(end * e) + suf;
          if (k < 1) requestAnimationFrame(tick);
        })(performance.now());
      });
    }, {
      threshold: .6
    });
    nums.forEach(function(n) {
      cIO.observe(n);
    });
  }
  var grid = $("#project-grid");
  var cards = $$(".card", grid);
  var filtersEl = $(".filters");
  var chips = $$(".chip", filtersEl);
  var statusEl = $("#filter-status");
  var pill = null;
  var filterToken = 0;
  function positionPill(instant) {
    if (!pill) return;
    var a = $(".chip.is-active", filtersEl);
    if (!a) return;
    if (instant) pill.style.transition = "none";
    pill.style.width = a.offsetWidth + "px";
    pill.style.height = a.offsetHeight + "px";
    pill.style.transform = "translate(" + a.offsetLeft + "px," + a.offsetTop + "px)";
    if (instant) {
      pill.offsetWidth;
      pill.style.transition = "";
    }
  }
  if (filtersEl) {
    pill = document.createElement("span");
    pill.className = "filters__pill";
    pill.setAttribute("aria-hidden", "true");
    filtersEl.insertBefore(pill, filtersEl.firstChild);
    filtersEl.classList.add("has-pill");
    positionPill(true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function() {
      positionPill(true);
    });
  }
  function matches(card, f) {
    return f === "all" || card.dataset.cat.split(" ").indexOf(f) !== -1;
  }
  function applyFilter(f) {
    var token = ++filterToken;
    chips.forEach(function(c) {
      var on = c.dataset.filter === f;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    positionPill();
    cards.forEach(function(c) {
      c.classList.add("is-in");
      c.style.removeProperty("--rd");
    });
    var showing = cards.filter(function(c) {
      return matches(c, f);
    });
    if (statusEl) statusEl.textContent = "Showing " + showing.length + " project" + (showing.length === 1 ? "" : "s");
    var layout = function() {
      cards.forEach(function(c) {
        c.hidden = !matches(c, f);
      });
      grid.classList.toggle("is-filtered", f !== "all");
    };
    if (reduced || !grid.animate) {
      layout();
      return;
    }
    var leaving = cards.filter(function(c) {
      return !c.hidden && !matches(c, f);
    });
    var outAnims = leaving.map(function(c) {
      return c.animate([ {
        opacity: 1,
        transform: "none"
      }, {
        opacity: 0,
        transform: "scale(.94)"
      } ], {
        duration: 200,
        easing: "ease-in",
        fill: "forwards"
      });
    });
    Promise.all(outAnims.map(function(a) {
      return a.finished.catch(function() {});
    })).then(function() {
      if (token !== filterToken) return;
      var before = new Map;
      cards.forEach(function(c) {
        if (!c.hidden) before.set(c, c.getBoundingClientRect());
      });
      layout();
      outAnims.forEach(function(a) {
        a.cancel();
      });
      var n = 0;
      cards.forEach(function(c) {
        if (c.hidden) return;
        var last = c.getBoundingClientRect();
        var first = before.get(c);
        if (first) {
          var dx = first.left - last.left, dy = first.top - last.top;
          if (Math.abs(dx) > .5 || Math.abs(dy) > .5) {
            c.animate([ {
              transform: "translate(" + dx + "px," + dy + "px)"
            }, {
              transform: "none"
            } ], {
              duration: 620,
              easing: EASE
            });
          }
        } else {
          c.animate([ {
            opacity: 0,
            transform: "translateY(26px) scale(.95)"
          }, {
            opacity: 1,
            transform: "none"
          } ], {
            duration: 560,
            delay: 60 + n++ * 55,
            easing: EASE,
            fill: "backwards"
          });
        }
      });
    });
  }
  chips.forEach(function(c) {
    c.addEventListener("click", function() {
      if (!c.classList.contains("is-active")) applyFilter(c.dataset.filter);
    });
  });
  if (filtersEl) {
    filtersEl.addEventListener("keydown", function(e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var i = chips.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      chips[(i + (e.key === "ArrowRight" ? 1 : chips.length - 1)) % chips.length].focus();
    });
  }
  if (fine) {
    cards.forEach(function(card) {
      var inner = $(".card__inner", card);
      card.addEventListener("pointermove", function(e) {
        var r = inner.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        inner.style.setProperty("--mx", x + "px");
        inner.style.setProperty("--my", y + "px");
        if (!reduced) {
          inner.classList.add("is-tilting");
          inner.style.setProperty("--rx", (y / r.height - .5) * -6 + "deg");
          inner.style.setProperty("--ry", (x / r.width - .5) * 8 + "deg");
        }
      }, {
        passive: true
      });
      card.addEventListener("pointerleave", function() {
        inner.classList.remove("is-tilting");
        inner.style.setProperty("--rx", "0deg");
        inner.style.setProperty("--ry", "0deg");
      });
    });
  }
  var dialog = $("#project-modal");
  var panel = dialog && $(".modal__panel", dialog);
  var carousel = dialog && $(".carousel", dialog);
  var dotsEl = dialog && $(".carousel__dots", dialog);
  var prevBtn = dialog && $(".carousel__prev", dialog);
  var nextBtn = dialog && $(".carousel__next", dialog);
  var galleryEl = dialog && $(".modal__gallery", dialog);
  var activeCard = null;
  var closing = false;
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function fillModal(card) {
    var pc = card.style.getPropertyValue("--pc") || "";
    panel.style.setProperty("--pc", pc.trim() || "var(--a1)");
    carousel.innerHTML = "";
    var tpl = $("template.card__gallery", card);
    if (tpl) {
      carousel.appendChild(tpl.content.cloneNode(true));
      $$("img", carousel).forEach(function(im) {
        im.loading = "eager";
      });
    } else {
      var media = $(".card__media", card);
      var slide = el("figure", "slide");
      var mock = $(".mock", media);
      if (mock) {
        slide.classList.add("slide--mock");
        slide.style.background = getComputedStyle(media).backgroundImage + ", #0c1222";
        slide.appendChild(mock.cloneNode(true));
      } else {
        slide.classList.add("slide--wide");
        slide.appendChild($("img", media).cloneNode(true));
      }
      carousel.appendChild(slide);
    }
    var slides = $$(".slide", carousel);
    galleryEl.classList.toggle("is-single", slides.length < 2);
    dotsEl.innerHTML = "";
    slides.forEach(function() {
      dotsEl.appendChild(document.createElement("span"));
    });
    carousel.scrollLeft = 0;
    var meta = $(".modal__meta", dialog);
    meta.innerHTML = "";
    meta.appendChild(el("span", "cat", $(".card__cat", card).textContent));
    meta.appendChild($(".badge", card).cloneNode(true));
    meta.appendChild(el("span", null, $("time", card).textContent));
    $("#modal-title").textContent = $(".card__open", card).textContent;
    $(".modal__pitch", dialog).innerHTML = $(".card__pitch", card).innerHTML;
    var links = $(".modal__links", dialog);
    links.innerHTML = "";
    $$(".card__links a", card).forEach(function(a) {
      links.appendChild(a.cloneNode(true));
    });
    var more = $(".card__more", card);
    var desc = $(".modal__desc", dialog);
    desc.innerHTML = "";
    $$("p:not(.card__stack)", more).forEach(function(p) {
      desc.appendChild(p.cloneNode(true));
    });
    var hl = $(".modal__hl", dialog);
    hl.innerHTML = "";
    $$("ul li", more).forEach(function(li) {
      hl.appendChild(el("li", null, li.innerHTML));
    });
    var stack = $(".modal__stack", dialog);
    stack.innerHTML = "";
    var st = $(".card__stack", more);
    (st ? st.textContent.split("·") : []).forEach(function(t) {
      t = t.trim();
      if (t) stack.appendChild(el("li", null, t));
    });
    panel.scrollTop = 0;
    updateCarousel();
  }
  function flipRect(from, to) {
    return "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) scale(" + from.width / to.width + "," + from.height / to.height + ")";
  }
  function openModal(card) {
    if (!dialog || closing) return;
    activeCard = card;
    fillModal(card);
    doc.classList.add("modal-open");
    dialog.showModal();
    $(".modal__close", dialog).focus({
      preventScroll: true
    });
    if (reduced || !panel.animate) return;
    var inner = $(".card__inner", card);
    var from = inner.getBoundingClientRect();
    var to = panel.getBoundingClientRect();
    dialog.classList.add("is-animating");
    card.style.visibility = "hidden";
    panel.animate([ {
      transform: flipRect(from, to),
      borderRadius: "30px",
      opacity: .85
    }, {
      transform: "none",
      borderRadius: "22px",
      opacity: 1
    } ], {
      duration: 600,
      easing: EASE
    });
    setTimeout(function() {
      dialog.classList.remove("is-animating");
    }, 280);
  }
  function finishClose() {
    if (dialog.open) dialog.close();
    dialog.classList.remove("is-closing", "is-animating");
    doc.classList.remove("modal-open");
    closing = false;
    if (activeCard) {
      activeCard.style.visibility = "";
      var btn = $(".card__open", activeCard);
      if (btn) btn.focus({
        preventScroll: true
      });
    }
  }
  function closeModal() {
    if (!dialog || !dialog.open || closing) return;
    closing = true;
    var inner = activeCard && $(".card__inner", activeCard);
    var to = inner && inner.getBoundingClientRect();
    var onScreen = to && to.width > 0 && to.bottom > 0 && to.top < window.innerHeight;
    if (reduced || !panel.animate || !onScreen) {
      finishClose();
      return;
    }
    dialog.classList.add("is-closing", "is-animating");
    var from = panel.getBoundingClientRect();
    var anim = panel.animate([ {
      transform: "none",
      opacity: 1
    }, {
      transform: flipRect(to, from),
      opacity: .6,
      borderRadius: "30px"
    } ], {
      duration: 460,
      easing: "cubic-bezier(.6,0,.2,1)",
      fill: "forwards"
    });
    anim.onfinish = function() {
      if (activeCard) activeCard.style.visibility = "";
      finishClose();
      anim.cancel();
    };
  }
  if (dialog) {
    cards.forEach(function(card) {
      var btn = $(".card__open", card);
      if (btn) btn.addEventListener("click", function() {
        openModal(card);
      });
    });
    $(".modal__close", dialog).addEventListener("click", closeModal);
    dialog.addEventListener("cancel", function(e) {
      e.preventDefault();
      closeModal();
    });
    dialog.addEventListener("click", function(e) {
      if (e.target === dialog) closeModal();
    });
    dialog.addEventListener("close", function() {
      doc.classList.remove("modal-open");
      if (activeCard) activeCard.style.visibility = "";
    });
  }
  function slideIndex() {
    var slides = $$(".slide", carousel);
    var x = carousel.scrollLeft, best = 0, bd = Infinity;
    var base = slides.length ? slides[0].offsetLeft : 0;
    slides.forEach(function(s, i) {
      var d = Math.abs(s.offsetLeft - base - x);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  }
  function updateCarousel() {
    if (!carousel) return;
    var i = slideIndex();
    var maxScroll = carousel.scrollWidth - carousel.clientWidth - 2;
    if (carousel.scrollLeft >= maxScroll) i = $$(".slide", carousel).length - 1;
    $$("span", dotsEl).forEach(function(d, k) {
      d.classList.toggle("is-active", k === i);
    });
    prevBtn.disabled = carousel.scrollLeft <= 2;
    nextBtn.disabled = carousel.scrollLeft >= maxScroll;
  }
  function go(dir) {
    var slides = $$(".slide", carousel);
    var i = clamp(slideIndex() + dir, 0, slides.length - 1);
    var base = slides[0].offsetLeft;
    carousel.scrollTo({
      left: slides[i].offsetLeft - base,
      behavior: reduced ? "auto" : "smooth"
    });
  }
  if (carousel) {
    var cTick = false;
    carousel.addEventListener("scroll", function() {
      if (!cTick) {
        cTick = true;
        requestAnimationFrame(function() {
          updateCarousel();
          cTick = false;
        });
      }
    }, {
      passive: true
    });
    prevBtn.addEventListener("click", function() {
      go(-1);
    });
    nextBtn.addEventListener("click", function() {
      go(1);
    });
    carousel.addEventListener("keydown", function(e) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    });
    carousel.addEventListener("load", updateCarousel, true);
  }
  if (fine && !reduced) {
    $$(".magnetic").forEach(function(m) {
      m.addEventListener("pointermove", function(e) {
        var r = m.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        m.style.setProperty("--bx", (dx * .22).toFixed(1) + "px");
        m.style.setProperty("--by", (dy * .32).toFixed(1) + "px");
      }, {
        passive: true
      });
      m.addEventListener("pointerleave", function() {
        m.style.setProperty("--bx", "0px");
        m.style.setProperty("--by", "0px");
      });
    });
  }
  var glow = $(".cursor-glow");
  if (glow && fine && !reduced) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 3, tx = gx, ty = gy, gRaf = 0;
    var follow = function() {
      gx += (tx - gx) * .14;
      gy += (ty - gy) * .14;
      glow.style.transform = "translate3d(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px,0)";
      gRaf = Math.abs(tx - gx) + Math.abs(ty - gy) > .5 ? requestAnimationFrame(follow) : 0;
    };
    window.addEventListener("pointermove", function(e) {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      doc.classList.add("has-cursor");
      if (!gRaf) gRaf = requestAnimationFrame(follow);
    }, {
      passive: true
    });
    document.addEventListener("pointerleave", function() {
      doc.classList.remove("has-cursor");
    });
  }
  var toast = $(".toast");
  var toastTimer = 0;
  function showToast(msg) {
    if (!toast) return;
    $("span", toast).textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      toast.classList.remove("is-visible");
    }, 2400);
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {}
    ta.remove();
    return ok;
  }
  $$("[data-copy]").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var text = btn.getAttribute("data-copy");
      var done = function(ok) {
        if (!ok) {
          showToast("Couldn't copy. Address: " + text);
          return;
        }
        btn.classList.add("is-copied");
        btn.setAttribute("aria-label", "Email address copied");
        showToast("Email copied to clipboard");
        setTimeout(function() {
          btn.classList.remove("is-copied");
          btn.setAttribute("aria-label", "Copy email address");
        }, 2e3);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function() {
          done(true);
        }, function() {
          done(fallbackCopy(text));
        });
      } else done(fallbackCopy(text));
    });
  });
  reduceMQ.addEventListener && reduceMQ.addEventListener("change", function(m) {
    reduced = m.matches;
    onScroll();
  });
})();