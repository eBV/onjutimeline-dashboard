
    /* Tohseno interaction layer — motion engine.
       Magnetic spring buttons, 3D-tilt cards, price count-ups and
       the checkout stage's content-swap animation. Pointer-fine
       devices only; everything stands down for reduced motion. */
    (function () {
      "use strict";
      var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      /* Price count-ups: the menu's stats tick up when they scroll in. */
      var prices = document.querySelectorAll(".price");
      function countUp(el) {
        var target = parseFloat(el.textContent);
        if (isNaN(target)) return;
        var start = null, duration = 950;
        function frame(ts) {
          if (!start) start = ts;
          var t = Math.min(1, (ts - start) / duration);
          var eased = 1 - Math.pow(1 - t, 4);
          el.textContent = (target * eased).toFixed(3) + " ETH";
          if (t < 1) requestAnimationFrame(frame);
          else el.classList.add("counted");
        }
        requestAnimationFrame(frame);
      }
      if ("IntersectionObserver" in window && prices.length) {
        var watcher = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              watcher.unobserve(entry.target);
              countUp(entry.target);
            }
          });
        }, { threshold: 0.4 });
        prices.forEach(function (p) { watcher.observe(p); });
      }

      /* Checkout stage: replay the S-curve rise whenever the step changes. */
      var panel = document.getElementById("trade-panel");
      if (panel && "MutationObserver" in window) {
        var stageKids = panel.querySelectorAll(".stage-kicker, h3, p, .receipt");
        new MutationObserver(function () {
          stageKids.forEach(function (el) {
            el.classList.remove("swap-in");
            void el.offsetWidth;
            el.classList.add("swap-in");
          });
        }).observe(panel, { attributes: true, attributeFilter: ["data-step"] });
      }

      var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (!finePointer) return;

      /* One rAF loop drives every spring and tilt; it sleeps when settled. */
      var magnets = [], tilts = [], rafId = null;
      function loop() {
        var alive = false;
        magnets.forEach(function (m) {
          m.vx += (m.tx - m.x) * 0.16;
          m.vy += (m.ty - m.y) * 0.16;
          m.vx *= 0.68;
          m.vy *= 0.68;
          m.x += m.vx;
          m.y += m.vy;
          if (Math.abs(m.tx - m.x) > 0.05 || Math.abs(m.ty - m.y) > 0.05 ||
              Math.abs(m.vx) > 0.05 || Math.abs(m.vy) > 0.05) alive = true;
          m.el.style.transform = "translate3d(" + m.x.toFixed(2) + "px," + m.y.toFixed(2) + "px,0)";
        });
        tilts.forEach(function (t) {
          t.rx += (t.trx - t.rx) * 0.12;
          t.ry += (t.try_ - t.ry) * 0.12;
          if (Math.abs(t.trx - t.rx) > 0.02 || Math.abs(t.try_ - t.ry) > 0.02) alive = true;
          t.el.style.transform = t.base + " perspective(950px) rotateX(" + t.rx.toFixed(2) + "deg) rotateY(" + t.ry.toFixed(2) + "deg)";
        });
        rafId = alive ? requestAnimationFrame(loop) : null;
      }
      function kick() { if (!rafId) rafId = requestAnimationFrame(loop); }

      /* Magnetic buttons: drift toward the cursor, spring home on leave. */
      function addMagnet(el, strength) {
        if (!el) return;
        var m = { el: el, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          m.tx = (e.clientX - r.left - r.width / 2) * strength;
          m.ty = (e.clientY - r.top - r.height / 2) * strength;
          kick();
        });
        el.addEventListener("pointerleave", function () { m.tx = 0; m.ty = 0; kick(); });
        magnets.push(m);
      }
      addMagnet(document.querySelector(".visit-island"), 0.2);
      addMagnet(document.querySelector(".theme-toggle"), 0.3);
      document.querySelectorAll(".trade-tab").forEach(function (tab) { addMagnet(tab, 0.16); });

      /* 3D-tilt cards: lean toward the cursor, settle flat on leave. */
      function addTilt(el, base, maxDeg) {
        if (!el) return;
        var t = { el: el, base: base, rx: 0, ry: 0, trx: 0, try_: 0 };
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          t.try_ = px * maxDeg;
          t.trx = -py * maxDeg;
          kick();
        });
        el.addEventListener("pointerleave", function () { t.trx = 0; t.try_ = 0; kick(); });
        tilts.push(t);
      }
      addTilt(document.querySelector(".map-card"), "rotate(1deg)", 7);
      document.querySelectorAll(".story-main, .story-side").forEach(function (card) { addTilt(card, "", 5); });
    }());
  