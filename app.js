const state = {
  colors: [],
  filtered: [],
  activeCode: "",
  view: "palette",
  query: "",
  group: "all",
  tone: "all"
};

const els = {
  totalCount: document.getElementById("totalCount"),
  resultCount: document.getElementById("resultCount"),
  searchInput: document.getElementById("searchInput"),
  groupFilter: document.getElementById("groupFilter"),
  toneFilter: document.getElementById("toneFilter"),
  paletteGrid: document.getElementById("paletteGrid"),
  inspector: document.getElementById("inspector"),
  searchSummary: document.getElementById("searchSummary"),
  navButtons: Array.from(document.querySelectorAll(".nav-btn")),
  panels: Array.from(document.querySelectorAll(".view")),
  viewTitle: document.getElementById("viewTitle"),
  viewEyebrow: document.getElementById("viewEyebrow"),
  themeToggle: document.getElementById("themeToggle")
};

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function numeric(value) {
  return Number.parseFloat(value);
}

function sortCode(a, b) {
  const ga = a.code[0];
  const gb = b.code[0];
  const na = Number.parseInt(a.code.slice(1), 10);
  const nb = Number.parseInt(b.code.slice(1), 10);
  return ga.localeCompare(gb) || na - nb;
}

function getTone(color) {
  const h = numeric(color.hsv_h);
  const s = numeric(color.hsv_s);
  const v = numeric(color.hsv_v);
  if (s < 10) {
    if (v > 90) return "白色";
    if (v < 18) return "黑色";
    return "灰色";
  }
  if (h < 16 || h >= 345) return "红色";
  if (h < 45) return "橘色";
  if (h < 75) return "黄色";
  if (h < 165) return "绿色";
  if (h < 205) return "青色";
  if (h < 250) return "蓝色";
  if (h < 292) return "紫色";
  if (h < 335) return "粉色";
  return "红色";
}

function enrichColor(row) {
  return {
    ...row,
    tone: getTone(row),
    group: row.code[0],
    imagePath: `./assets/positions/${row.code}.png`
  };
}

function setView(view) {
  state.view = view;
  els.navButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  els.panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === view));
  const titleMap = {
    palette: ["Palette Browser", "色卡浏览"],
    guide: ["Position Guide", "调色说明"],
    about: ["Reference", "参考来源"]
  };
  const [eyebrow, title] = titleMap[view] || titleMap.palette;
  els.viewEyebrow.textContent = eyebrow;
  els.viewTitle.textContent = title;
}

function filterColors() {
  const query = state.query.trim().toLowerCase();
  state.filtered = state.colors.filter((color) => {
    if (state.group !== "all" && color.group !== state.group) return false;
    if (state.tone !== "all" && color.tone !== state.tone) return false;
    if (!query) return true;
    const haystack = [
      color.code,
      color.hex,
      color.r,
      color.g,
      color.b,
      color.tone
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function renderPalette() {
  els.resultCount.textContent = `${state.filtered.length} 色`;
  els.searchSummary.textContent = state.filtered.length === state.colors.length
    ? "显示全部 221 色。"
    : `当前筛选出 ${state.filtered.length} 色。`;

  if (!state.filtered.length) {
    els.paletteGrid.innerHTML = `<div class="empty-state">没有找到匹配的色号。</div>`;
    return;
  }

  els.paletteGrid.innerHTML = state.filtered.map((color) => `
    <button class="swatch-btn ${color.code === state.activeCode ? "is-active" : ""}" type="button" data-code="${color.code}">
      <span class="swatch-color" style="background:${color.hex}"></span>
      <span class="swatch-meta">
        <strong>${color.code}</strong>
        <span>${color.tone}</span>
      </span>
    </button>
  `).join("");
}

function renderInspector() {
  const color = state.colors.find((item) => item.code === state.activeCode);
  if (!color) {
    els.inspector.innerHTML = `<div class="empty-state">选择一个色号后，这里会显示游戏色盘定位图。</div>`;
    return;
  }

  els.inspector.innerHTML = `
    <div class="inspector-hero">
      <div class="big-swatch" style="background:${color.hex}"></div>
      <div>
        <h3>${color.code}</h3>
        <p>${color.tone} / ${color.hex.toUpperCase()}</p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span>RGB</span>
        <strong>${color.r}, ${color.g}, ${color.b}</strong>
      </div>
      <div class="meta-item">
        <span>HSV</span>
        <strong>${color.hsv_h}°, ${color.hsv_s}%, ${color.hsv_v}%</strong>
      </div>
      <div class="meta-item">
        <span>底部色相条</span>
        <strong>${color.game_hue_x_pct}%</strong>
      </div>
      <div class="meta-item">
        <span>上方色盘</span>
        <strong>X ${color.game_palette_x_pct_colorcraftlab}% / Y ${color.game_palette_y_pct_colorcraftlab}%</strong>
      </div>
    </div>

    <img class="position-image" src="${color.imagePath}" alt="${color.code} 游戏色盘位置图">

    <div class="image-actions">
      <a class="soft-btn" href="${color.imagePath}" target="_blank" rel="noreferrer">查看大图</a>
    </div>
  `;
}

function update() {
  filterColors();
  if (!state.colors.find((item) => item.code === state.activeCode)) {
    state.activeCode = state.filtered[0]?.code || "";
  }
  renderPalette();
  renderInspector();
}

async function init() {
  const response = await fetch("./assets/data/colors.csv");
  const text = await response.text();
  state.colors = parseCsv(text).map(enrichColor).sort(sortCode);
  state.activeCode = "A1";
  els.totalCount.textContent = `${state.colors.length} 色`;
  update();
}

els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  update();
});

els.groupFilter.addEventListener("change", (event) => {
  state.group = event.target.value;
  update();
});

els.toneFilter.addEventListener("change", (event) => {
  state.tone = event.target.value;
  update();
});

els.paletteGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-code]");
  if (!button) return;
  state.activeCode = button.dataset.code;
  renderPalette();
  renderInspector();
});

els.navButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

els.themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("tomodachi-color-guide:theme", document.body.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("tomodachi-color-guide:theme") === "dark") {
  document.body.classList.add("dark");
}

init().catch((error) => {
  console.error(error);
  els.paletteGrid.innerHTML = `<div class="empty-state">色卡数据读取失败。请确认 assets/data/colors.csv 已存在。</div>`;
  els.resultCount.textContent = "读取失败";
});
