
    (function () {
      var root = document.documentElement;
      var themeToggle = document.querySelector(".theme-toggle");
      var themeLabel = themeToggle.querySelector(".theme-toggle-label");
      var systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

      function currentTheme() {
        return root.getAttribute("data-theme") || (systemTheme.matches ? "dark" : "light");
      }

      function syncThemeButton(theme) {
        var isDark = theme === "dark";
        themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
        themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
        themeLabel.textContent = isDark ? "Dark" : "Light";
      }

      syncThemeButton(currentTheme());

      themeToggle.addEventListener("click", function () {
        var nextTheme = currentTheme() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", nextTheme);
        syncThemeButton(nextTheme);
      });

      if (systemTheme.addEventListener) {
        systemTheme.addEventListener("change", function () {
          if (!root.hasAttribute("data-theme")) syncThemeButton(currentTheme());
        });
      }

      var content = {
        "1": {
          kicker: "Step 1 / Read the listing",
          title: "Start with terms a machine can parse.",
          body: "The service code, price, scope, and deadline are stated before payment. The goal is deterministic commerce: an agent should not need a private conversation to understand the deal.",
          receipt: "FIXED SCOPE / FIXED PRICE"
        },
        "2": {
          kicker: "Step 2 / Pay through the contract",
          title: "The checkout follows published rules.",
          body: "The buyer sends ETH through EdenCheckout instead of relying on a private payment promise. The contract records which listing was purchased and how much was paid.",
          receipt: "PAYMENT RECORDED ONCHAIN"
        },
        "3": {
          kicker: "Step 3 / Keep the receipt",
          title: "The tx hash makes the claim checkable.",
          body: "Every blockchain transaction gets a unique hash. Share that hash with a block explorer or Proof Pilgrim to verify the payment and translate the record into plain language.",
          receipt: "PROOF ANYONE CAN INSPECT"
        }
      };

      var tabs = Array.prototype.slice.call(document.querySelectorAll(".trade-tab"));
      var panel = document.getElementById("trade-panel");

      function activate(tab, focus) {
        var step = tab.getAttribute("data-step");
        var item = content[step];
        tabs.forEach(function (candidate) {
          var selected = candidate === tab;
          candidate.setAttribute("aria-selected", selected ? "true" : "false");
          candidate.setAttribute("tabindex", selected ? "0" : "-1");
        });
        panel.setAttribute("aria-labelledby", tab.id);
        panel.setAttribute("data-step", step);
        panel.querySelector(".stage-kicker").textContent = item.kicker;
        panel.querySelector("h3").textContent = item.title;
        panel.querySelector("p").textContent = item.body;
        panel.querySelector(".receipt").innerHTML = '<span class="receipt-mark">●</span> ' + item.receipt;
        if (focus) tab.focus();
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () { activate(tab, false); });
        tab.addEventListener("keydown", function (event) {
          var next = null;
          if (event.key === "ArrowDown" || event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
          if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
          if (event.key === "Home") next = tabs[0];
          if (event.key === "End") next = tabs[tabs.length - 1];
          if (next) {
            event.preventDefault();
            activate(next, true);
          }
        });
      });
    }());
  
    // Square cards: fly the 3D island to the building, then scroll it into view.
    document.querySelectorAll(".sq-fly").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-focus");
        var target = document.querySelector('#island3d .iplot[data-site="' + key + '"]');
        if (target) target.click();
        var host = document.getElementById("island3d");
        if (host) host.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
