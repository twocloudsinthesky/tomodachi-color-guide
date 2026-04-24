const state = {
  colors: [],
  filtered: [],
  activeCode: "",
  compareA: "A1",
  compareB: "A2",
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
  compareASelect: document.getElementById("compareASelect"),
  compareBSelect: document.getElementById("compareBSelect"),
  swapCompareButton: document.getElementById("swapCompareButton"),
  compareToneHint: document.getElementById("compareToneHint"),
  compareSwatches: document.getElementById("compareSwatches"),
  compareCanvas: document.getElementById("compareCanvas"),
  compareDirections: document.getElementById("compareDirections"),
  compareTable: document.getElementById("compareTable"),
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
    compare: ["Color Compare", "色彩对比"],
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

function getColor(code) {
  return state.colors.find((item) => item.code === code);
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function hsvToRgb(h, s, v) {
  const hue = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function rgbToCss(rgb) {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function getCompareMetrics(a, b) {
  const ax = numeric(a.game_palette_x_pct_colorcraftlab);
  const ay = numeric(a.game_palette_y_pct_colorcraftlab);
  const ah = numeric(a.game_hue_x_pct);
  const bx = numeric(b.game_palette_x_pct_colorcraftlab);
  const by = numeric(b.game_palette_y_pct_colorcraftlab);
  const bh = numeric(b.game_hue_x_pct);
  const hueDirect = bh - ah;
  const hueWrapped = hueDirect > 50 ? hueDirect - 100 : hueDirect < -50 ? hueDirect + 100 : hueDirect;
  const rgbA = hexToRgb(a.hex);
  const rgbB = hexToRgb(b.hex);
  const rgbDistance = Math.sqrt(
    (rgbA.r - rgbB.r) ** 2 +
    (rgbA.g - rgbB.g) ** 2 +
    (rgbA.b - rgbB.b) ** 2
  );
  return {
    dx: bx - ax,
    dy: by - ay,
    dh: hueWrapped,
    rawHueDelta: hueDirect,
    rgbDistance
  };
}

function describeDelta(value, axis) {
  const amount = Math.abs(value).toFixed(1);
  if (Math.abs(value) < 0.6) return `${axis} 基本不动`;
  if (axis === "色相条") return `${axis}${value > 0 ? "向右" : "向左"}移动 ${amount}%`;
  if (axis === "X") return `上方色盘向${value > 0 ? "右" : "左"}移动 ${amount}%`;
  return `上方色盘向${value > 0 ? "下" : "上"}移动 ${amount}%`;
}

function getHueMoveLabel(delta) {
  if (Math.abs(delta) < 0.6) return "色相几乎相同";
  return delta > 0 ? "色相条向右，接近黄/橘方向" : "色相条向左，接近蓝/紫/粉方向";
}

function drawArrow(ctx, x1, y1, x2, y2, color) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 14;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCompareMarker(ctx, x, y, color, label) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#1b1f28";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#1b1f28";
  ctx.font = "700 16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y - 34);
  ctx.restore();
}

function drawCompareCanvas(a, b, metrics) {
  const canvas = els.compareCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const styles = getComputedStyle(document.body);
  const canvasBg = styles.getPropertyValue("--surface-strong").trim() || "#fff";
  const textColor = styles.getPropertyValue("--text").trim() || "#22252c";
  const borderColor = styles.getPropertyValue("--line").trim() || "#2c2f36";
  const accentColor = styles.getPropertyValue("--accent").trim() || "#ff7a1a";
  const accentTwo = styles.getPropertyValue("--accent-2").trim() || "#27786e";
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = canvasBg;
  ctx.fillRect(0, 0, w, h);

  const plot = { x: 54, y: 42, w: 620, h: 360 };
  const hue = { x: 54, y: 462, w: 620, h: 34 };
  const hueForField = numeric(a.hsv_h);
  const field = ctx.createImageData(plot.w, plot.h);
  for (let py = 0; py < plot.h; py += 1) {
    for (let px = 0; px < plot.w; px += 1) {
      const sat = px / (plot.w - 1);
      const val = 1 - (py / (plot.h - 1));
      const gray = Math.round(val * 255);
      const hueRgb = hsvToRgb(hueForField, 0.18 + sat * 0.82, 0.12 + val * 0.88);
      const rgb = {
        r: Math.round(gray * (1 - sat) + hueRgb.r * sat),
        g: Math.round(gray * (1 - sat) + hueRgb.g * sat),
        b: Math.round(gray * (1 - sat) + hueRgb.b * sat)
      };
      const offset = (py * plot.w + px) * 4;
      field.data[offset] = rgb.r;
      field.data[offset + 1] = rgb.g;
      field.data[offset + 2] = rgb.b;
      field.data[offset + 3] = 255;
    }
  }
  ctx.putImageData(field, plot.x, plot.y);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);

  const ax = plot.x + numeric(a.game_palette_x_pct_colorcraftlab) / 100 * plot.w;
  const ay = plot.y + numeric(a.game_palette_y_pct_colorcraftlab) / 100 * plot.h;
  const bx = plot.x + numeric(b.game_palette_x_pct_colorcraftlab) / 100 * plot.w;
  const by = plot.y + numeric(b.game_palette_y_pct_colorcraftlab) / 100 * plot.h;
  drawArrow(ctx, ax, ay, bx, by, accentColor);
  drawCompareMarker(ctx, ax, ay, a.hex, "A");
  drawCompareMarker(ctx, bx, by, b.hex, "B");

  ctx.fillStyle = textColor;
  ctx.font = "700 17px Arial";
  ctx.textAlign = "left";
  ctx.fillText("上方色盘坐标：X 越右越鲜艳，Y 越下越暗", plot.x, 28);

  for (let x = 0; x < hue.w; x += 1) {
    const percent = x / (hue.w - 1);
    const actualHue = (360 - percent * 360) % 360;
    ctx.fillStyle = rgbToCss(hsvToRgb(actualHue, 1, 1));
    ctx.fillRect(hue.x + x, hue.y, 1, hue.h);
  }
  ctx.strokeStyle = borderColor;
  ctx.strokeRect(hue.x, hue.y, hue.w, hue.h);
  const ahx = hue.x + numeric(a.game_hue_x_pct) / 100 * hue.w;
  const bhx = hue.x + numeric(b.game_hue_x_pct) / 100 * hue.w;
  drawArrow(ctx, ahx, hue.y + 58, bhx, hue.y + 58, accentTwo);
  drawCompareMarker(ctx, ahx, hue.y + hue.h / 2, a.hex, "A");
  drawCompareMarker(ctx, bhx, hue.y + hue.h / 2, b.hex, "B");
  ctx.fillStyle = textColor;
  ctx.fillText("底部色相条", hue.x, hue.y - 14);

  const sideX = 724;
  ctx.fillStyle = textColor;
  ctx.font = "800 28px Arial";
  ctx.fillText(`${a.code} -> ${b.code}`, sideX, 62);
  ctx.font = "18px Arial";
  const lines = [
    describeDelta(metrics.dh, "色相条"),
    describeDelta(metrics.dx, "X"),
    describeDelta(metrics.dy, "Y"),
    getHueMoveLabel(metrics.dh)
  ];
  lines.forEach((line, index) => {
    ctx.fillText(line, sideX, 112 + index * 38);
  });
}

function renderCompareOptions() {
  if (!els.compareASelect || !els.compareBSelect) return;
  const options = state.colors.map((color) =>
    `<option value="${color.code}">${color.code} ${color.hex.toUpperCase()} ${color.tone}</option>`
  ).join("");
  els.compareASelect.innerHTML = options;
  els.compareBSelect.innerHTML = options;
  els.compareASelect.value = state.compareA;
  els.compareBSelect.value = state.compareB;
}

function renderCompare() {
  const a = getColor(state.compareA);
  const b = getColor(state.compareB);
  if (!a || !b || !els.compareTable) return;
  const metrics = getCompareMetrics(a, b);
  els.compareToneHint.textContent = `${a.code} / ${b.code}`;
  els.compareSwatches.innerHTML = [a, b].map((color, index) => `
    <div class="compare-swatch-card">
      <div class="compare-swatch" style="background:${color.hex}"></div>
      <div>
        <strong>${index === 0 ? "A" : "B"} · ${color.code}</strong>
        <span>${color.hex.toUpperCase()} / ${color.tone}</span>
      </div>
    </div>
  `).join("");
  els.compareDirections.innerHTML = [
    ["色相条", describeDelta(metrics.dh, "色相条")],
    ["上方 X", describeDelta(metrics.dx, "X")],
    ["上方 Y", describeDelta(metrics.dy, "Y")]
  ].map(([label, text]) => `
    <div class="direction-card">
      <span>${label}</span>
      <strong>${text}</strong>
    </div>
  `).join("");
  els.compareTable.innerHTML = `
    <div class="compare-row head"><span>项目</span><span>${a.code}</span><span>${b.code}</span><span>B - A</span></div>
    <div class="compare-row"><span>底部色相条</span><span>${a.game_hue_x_pct}%</span><span>${b.game_hue_x_pct}%</span><strong>${metrics.dh.toFixed(1)}%</strong></div>
    <div class="compare-row"><span>色盘 X</span><span>${a.game_palette_x_pct_colorcraftlab}%</span><span>${b.game_palette_x_pct_colorcraftlab}%</span><strong>${metrics.dx.toFixed(1)}%</strong></div>
    <div class="compare-row"><span>色盘 Y</span><span>${a.game_palette_y_pct_colorcraftlab}%</span><span>${b.game_palette_y_pct_colorcraftlab}%</span><strong>${metrics.dy.toFixed(1)}%</strong></div>
    <div class="compare-row"><span>HSV</span><span>${a.hsv_h}°, ${a.hsv_s}%, ${a.hsv_v}%</span><span>${b.hsv_h}°, ${b.hsv_s}%, ${b.hsv_v}%</span><strong>RGB 距离 ${metrics.rgbDistance.toFixed(1)}</strong></div>
  `;
  drawCompareCanvas(a, b, metrics);
}

function update() {
  filterColors();
  if (!state.colors.find((item) => item.code === state.activeCode)) {
    state.activeCode = state.filtered[0]?.code || "";
  }
  renderPalette();
  renderInspector();
  renderCompare();
}

async function init() {
  const response = await fetch("./assets/data/colors.csv");
  const text = await response.text();
  state.colors = parseCsv(text).map(enrichColor).sort(sortCode);
  state.activeCode = "A1";
  state.compareA = "A1";
  state.compareB = "A2";
  els.totalCount.textContent = `${state.colors.length} 色`;
  renderCompareOptions();
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

els.compareASelect?.addEventListener("change", (event) => {
  state.compareA = event.target.value;
  renderCompare();
});

els.compareBSelect?.addEventListener("change", (event) => {
  state.compareB = event.target.value;
  renderCompare();
});

els.swapCompareButton?.addEventListener("click", () => {
  [state.compareA, state.compareB] = [state.compareB, state.compareA];
  els.compareASelect.value = state.compareA;
  els.compareBSelect.value = state.compareB;
  renderCompare();
});

els.themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("tomodachi-color-guide:theme", document.body.classList.contains("dark") ? "dark" : "light");
  renderCompare();
});

if (localStorage.getItem("tomodachi-color-guide:theme") === "dark") {
  document.body.classList.add("dark");
}

init().catch((error) => {
  console.error(error);
  els.paletteGrid.innerHTML = `<div class="empty-state">色卡数据读取失败。请确认 assets/data/colors.csv 已存在。</div>`;
  els.resultCount.textContent = "读取失败";
});
