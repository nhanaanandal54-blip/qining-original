const backgroundImages = [
  "./assets/backgrounds/bg-01.jpg",
  "./assets/backgrounds/bg-02.jpg",
  "./assets/backgrounds/bg-03.jpg",
  "./assets/backgrounds/bg-04.jpg",
  "./assets/backgrounds/bg-05.jpg",
];

const backgroundState = {
  index: Number(localStorage.getItem("qining-bg-index") || 0),
  blur: Number(localStorage.getItem("qining-bg-blur") || 10),
  autoplay: localStorage.getItem("qining-bg-autoplay") !== "false",
  timer: null,
};

function clampBackgroundIndex(index) {
  return (index + backgroundImages.length) % backgroundImages.length;
}

function persistBackground() {
  localStorage.setItem("qining-bg-index", String(backgroundState.index));
  localStorage.setItem("qining-bg-blur", String(backgroundState.blur));
  localStorage.setItem("qining-bg-autoplay", String(backgroundState.autoplay));
}

function applyBackground() {
  backgroundState.index = clampBackgroundIndex(backgroundState.index);
  document.body.style.setProperty("--site-bg-image", `url("${backgroundImages[backgroundState.index]}")`);
  document.body.style.setProperty("--site-bg-blur", `${backgroundState.blur}px`);
  const preview = document.querySelector("#backgroundPreview");
  if (preview) preview.src = backgroundImages[backgroundState.index];
  document.querySelector("#backgroundBlurValue").textContent = `${backgroundState.blur}px`;
  document.querySelector("#backgroundBlur").value = String(backgroundState.blur);
  document.querySelector("#backgroundAutoplay").checked = backgroundState.autoplay;
  document.querySelector("#backgroundCurrent").textContent = `${backgroundState.index + 1} / ${backgroundImages.length}`;
  document.querySelectorAll(".background-thumb").forEach((button, index) => {
    button.classList.toggle("active", index === backgroundState.index);
  });
  persistBackground();
}

function setBackground(index) {
  backgroundState.index = clampBackgroundIndex(index);
  applyBackground();
}

function startBackgroundAutoplay() {
  clearInterval(backgroundState.timer);
  if (!backgroundState.autoplay) return;
  backgroundState.timer = setInterval(() => setBackground(backgroundState.index + 1), 6500);
}

function buildBackgroundPanel() {
  const panel = document.createElement("dialog");
  panel.id = "backgroundDialog";
  panel.className = "background-dialog";
  panel.innerHTML = `
    <form method="dialog">
      <header>
        <div>
          <p class="widget-label">背景设置</p>
          <h2>背景</h2>
        </div>
        <button class="icon-btn" value="close" aria-label="关闭">×</button>
      </header>

      <div class="background-preview" aria-hidden="true">
        <img id="backgroundPreview" src="${backgroundImages[backgroundState.index]}" alt="" />
        <span id="backgroundCurrent">1 / ${backgroundImages.length}</span>
      </div>

      <div class="background-controls">
        <button type="button" id="backgroundPrev" aria-label="上一张">‹</button>
        <button type="button" id="backgroundNext" aria-label="下一张">›</button>
      </div>

      <label class="toggle-row">
        <input id="backgroundAutoplay" type="checkbox" />
        自动轮播背景图
      </label>

      <label class="range-row">
        <span>背景模糊度</span>
        <input id="backgroundBlur" type="range" min="0" max="24" step="1" />
        <strong id="backgroundBlurValue">10px</strong>
      </label>

      <div class="background-thumbs">
        ${backgroundImages.map((image, index) => `
          <button class="background-thumb" type="button" data-bg-index="${index}" aria-label="选择背景 ${index + 1}">
            <img src="${image}" alt="" />
          </button>
        `).join("")}
      </div>
    </form>
  `;
  document.body.append(panel);
}

function setupBackgroundControls() {
  const openButton = document.querySelector("#backgroundBtn");
  if (!openButton) return;

  const backgroundLayer = document.createElement("div");
  backgroundLayer.className = "site-background";
  backgroundLayer.innerHTML = `<div class="site-background-image"></div><div class="site-background-shade"></div>`;
  document.body.prepend(backgroundLayer);

  buildBackgroundPanel();
  const dialog = document.querySelector("#backgroundDialog");

  openButton.addEventListener("click", () => dialog.showModal());
  document.querySelector("#backgroundPrev").addEventListener("click", () => setBackground(backgroundState.index - 1));
  document.querySelector("#backgroundNext").addEventListener("click", () => setBackground(backgroundState.index + 1));
  document.querySelector("#backgroundBlur").addEventListener("input", (event) => {
    backgroundState.blur = Number(event.target.value);
    applyBackground();
  });
  document.querySelector("#backgroundAutoplay").addEventListener("change", (event) => {
    backgroundState.autoplay = event.target.checked;
    persistBackground();
    startBackgroundAutoplay();
  });
  document.querySelectorAll(".background-thumb").forEach((button) => {
    button.addEventListener("click", () => setBackground(Number(button.dataset.bgIndex)));
  });

  applyBackground();
  startBackgroundAutoplay();
}

setupBackgroundControls();
