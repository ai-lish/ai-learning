(() => {
  const currentScript = document.currentScript;
  const cssUrl = currentScript ? new URL("practice-overrides.css", currentScript.src).href : "practice-overrides.css";
  if (!document.querySelector(`link[data-practice-overrides="${cssUrl}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssUrl;
    link.dataset.practiceOverrides = cssUrl;
    document.head.appendChild(link);
  }

  if (document.querySelector(".app")) document.body.classList.add("practice-enhanced-viewport");
  document.querySelectorAll(".side-kicker").forEach((node) => {
    if (node.textContent.trim() === "CURRENT MISSION") node.textContent = "本題重點";
  });
  document.querySelectorAll(".note").forEach((node) => {
    node.textContent = node.textContent.replace("不用鍵盤", "直接按選項");
  });
  document.querySelectorAll('[data-view="guide"]').forEach((node) => node.remove());
  document.querySelectorAll("#guide-view").forEach((node) => node.remove());

  window.MathJax = window.MathJax || {
    tex: {
      inlineMath: [["\\(", "\\)"]],
      displayMath: [["$$", "$$"]],
      packages: { "[+]": ["ams"] }
    },
    options: { skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"] },
    startup: { typeset: false }
  };

  const mathJaxReady = new Promise((resolve) => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      resolve(window.MathJax);
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
    script.onload = () => resolve(window.MathJax);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const superscripts = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
  function toLatex(value) {
    let text = String(value).trim()
      .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}")
      .replace(/π/g, "\\pi")
      .replace(/×/g, "\\times ")
      .replace(/÷/g, "\\div ")
      .replace(/−/g, "-")
      .replace(/²|³|⁰|¹|⁴|⁵|⁶|⁷|⁸|⁹/g, (value) => `^{${superscripts[value]}}`);
    text = text.replace(/(^|[^A-Za-z0-9}])(-?\d+)\s*\/\s*(-?\d+)(?=$|[^A-Za-z0-9])/g, "$1\\frac{$2}{$3}");
    return text;
  }

  function looksLikeMath(value) {
    return /(?:\d|[√πi²³⁴⁵⁶⁷⁸⁹]|[+\-=×÷/()])/.test(String(value));
  }

  function markMath(node, value) {
    if (!value || node.dataset.practiceLatex === "1") return false;
    node.innerHTML = `\\(${escapeHtml(toLatex(value))}\\)`;
    node.dataset.practiceLatex = "1";
    return true;
  }

  function markPrompt(node) {
    if (node.children.length) return;
    const value = node.textContent.trim();
    if (!value) return;
    const match = value.match(/^([^\u3400-\u9fff]+)(.*)$/u);
    if (!match) return;
    const formula = match[1].trim();
    if (!looksLikeMath(formula) || !/[\d√πi/+=×÷−-]/.test(formula)) return;
    node.innerHTML = `<span data-practice-inline-latex="1">${escapeHtml(formula)}</span>${escapeHtml(match[2])}`;
    node.dataset.practicePrompt = "1";
  }

  function scan(root = document) {
    const changed = [];
    root.querySelectorAll?.(".math, .formula, .mini-example, .calc-expression").forEach((node) => {
      if (node.children.length) return;
      const value = node.textContent.trim();
      if (node.dataset.practiceLatex === "1" && value.startsWith("\\(") && value.endsWith("\\)")) return;
      if (node.dataset.practiceLatex === "1") delete node.dataset.practiceLatex;
      if (value && markMath(node, value)) changed.push(node);
    });
    root.querySelectorAll?.(".question h3").forEach((node) => markPrompt(node));
    root.querySelectorAll?.(".choice").forEach((node) => {
      if (node.querySelector("mjx-container")) return;
      if (node.children.length) return;
      const value = node.textContent.trim();
      if (node.dataset.practiceLatex === "1" && value.startsWith("\\(") && value.endsWith("\\)")) return;
      if (node.dataset.practiceLatex === "1") delete node.dataset.practiceLatex;
      if (looksLikeMath(value) && markMath(node, value)) changed.push(node);
    });
    root.querySelectorAll?.("[data-practice-inline-latex]").forEach((node) => {
      if (node.children.length) return;
      const value = node.textContent.trim();
      if (node.dataset.practiceLatex === "1" && value.startsWith("\\(") && value.endsWith("\\)")) return;
      if (node.dataset.practiceLatex === "1") delete node.dataset.practiceLatex;
      if (value && markMath(node, value)) changed.push(node);
    });
    if (!changed.length) return;
    mathJaxReady.then((mathJax) => {
      if (!mathJax || typeof mathJax.typesetPromise !== "function") {
        changed.forEach((node) => {
          node.textContent = node.textContent.replace(/^\\\(|\\\)$/g, "");
          delete node.dataset.practiceLatex;
        });
        return;
      }
      if (typeof mathJax.typesetClear === "function") mathJax.typesetClear(changed);
      return mathJax.typesetPromise(changed);
    }).catch(() => changed.forEach((node) => {
      node.textContent = node.textContent.replace(/^\\\(|\\\)$/g, "");
      delete node.dataset.practiceLatex;
    }));
  }

  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      scan();
    });
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  scheduleScan();
})();
