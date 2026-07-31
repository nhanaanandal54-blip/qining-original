const defaultData = {
  posts: [],
  moments: [],
  photos: [],
  projects: [],
};

let siteData = structuredClone(defaultData);

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  route: location.hash.replace("#", "") || "home",
  query: "",
  seconds: 0,
  timer: null,
};

function setRoute(route) {
  state.route = route || "home";
  $$(".view").forEach((view) => view.classList.toggle("active", view.dataset.view === state.route));
  $$(".nav a").forEach((link) => link.classList.toggle("active", link.dataset.route === state.route));
}

function empty(label) {
  return `<div class="empty">暂无${label}。等你发自己的资料后，我会把这里填上。</div>`;
}

function renderStats() {
  $("#postCount").textContent = siteData.posts.length;
  $("#momentCount").textContent = siteData.moments.length;
  $("#photoCount").textContent = siteData.photos.length;
  $("#projectCount").textContent = siteData.projects.length;
}

function matchQuery(item) {
  if (!state.query) return true;
  const text = JSON.stringify(item).toLowerCase();
  return text.includes(state.query.toLowerCase());
}

function renderPosts() {
  const posts = siteData.posts.filter(matchQuery);
  $("#postsList").innerHTML = posts.length
    ? posts.map((post) => `
      <article class="card">
        <p class="meta">${post.date || ""}</p>
        <h3>${post.title}</h3>
        <p>${post.summary || ""}</p>
      </article>
    `).join("")
    : empty("文章");

  $("#homePosts").innerHTML = siteData.posts.slice(0, 3).length
    ? siteData.posts.slice(0, 3).map((post) => `<article class="card"><h3>${post.title}</h3><p>${post.summary || ""}</p></article>`).join("")
    : empty("文章");
}

function renderMoments() {
  const moments = siteData.moments.filter(matchQuery);
  $("#momentsList").innerHTML = moments.length
    ? moments.map((moment) => `
      <article class="moment">
        <p>${moment.content}</p>
        <p class="meta">${moment.date || ""}</p>
      </article>
    `).join("")
    : empty("说说");

  $("#homeMoments").innerHTML = siteData.moments.slice(0, 3).length
    ? siteData.moments.slice(0, 3).map((moment) => `<article class="moment"><p>${moment.content}</p></article>`).join("")
    : empty("说说");
}

function renderPhotos() {
  const photos = siteData.photos.filter(matchQuery);
  $("#photosList").innerHTML = photos.length
    ? photos.map((photo) => `
      <figure class="photo-cell">
        <img src="${photo.url}" alt="${photo.caption || ""}" />
        <figcaption>${photo.caption || ""}</figcaption>
      </figure>
    `).join("")
    : empty("照片");
}

function renderProjects() {
  const projects = siteData.projects.filter(matchQuery);
  $("#projectsList").innerHTML = projects.length
    ? projects.map((project) => `
      <article class="card">
        <p class="meta">${project.status || ""}</p>
        <h3>${project.name}</h3>
        <p>${project.description || ""}</p>
      </article>
    `).join("")
    : empty("项目");
}

function renderAll() {
  renderStats();
  renderPosts();
  renderMoments();
  renderPhotos();
  renderProjects();
}

function setupTheme() {
  const saved = localStorage.getItem("qining-theme");
  if (saved === "dark") document.body.classList.add("dark");
  $("#themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("qining-theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
}

function setupTools() {
  const dialog = $("#toolsDialog");
  $("#toolsBtn").addEventListener("click", () => dialog.showModal());

  $$(".tool-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tool-tab").forEach((item) => item.classList.toggle("active", item === tab));
      $$(".tool-view").forEach((view) => view.classList.toggle("active", view.dataset.toolView === tab.dataset.tool));
    });
  });

  const noteBox = $("#noteBox");
  noteBox.value = localStorage.getItem("qining-note") || "";
  noteBox.addEventListener("input", () => localStorage.setItem("qining-note", noteBox.value));

  $("#timerStart").addEventListener("click", () => {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
      $("#timerStart").textContent = "开始";
      return;
    }
    $("#timerStart").textContent = "暂停";
    state.timer = setInterval(() => {
      state.seconds += 1;
      updateTimer();
    }, 1000);
  });

  $("#timerReset").addEventListener("click", () => {
    clearInterval(state.timer);
    state.timer = null;
    state.seconds = 0;
    $("#timerStart").textContent = "开始";
    updateTimer();
  });

  $("#randomBtn").addEventListener("click", () => {
    $("#randomResult").textContent = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  });
}

function persistData() {
  localStorage.setItem("qining-data", JSON.stringify(siteData));
}

function setupCompose() {
  const dialog = $("#composeDialog");
  const open = () => dialog.showModal();
  $("#composeBtn").addEventListener("click", open);
  $("#heroComposeBtn").addEventListener("click", open);

  $("#composeType").addEventListener("change", (event) => {
    $("#composeUrlWrap").classList.toggle("hidden", event.target.value !== "photos");
  });

  $("#saveContentBtn").addEventListener("click", () => {
    const type = $("#composeType").value;
    const title = $("#composeTitle").value.trim();
    const body = $("#composeBody").value.trim();
    const url = $("#composeUrl").value.trim();
    const now = new Date().toLocaleDateString("zh-CN");

    if (type === "posts") {
      siteData.posts.unshift({ title: title || "未命名文章", summary: body, date: now });
    }
    if (type === "moments") {
      siteData.moments.unshift({ content: body || title || "一条新的说说", date: now });
    }
    if (type === "photos") {
      if (!url) {
        alert("请先填写图片地址。");
        return;
      }
      siteData.photos.unshift({ url, caption: title || body || "未命名照片" });
    }
    if (type === "projects") {
      siteData.projects.unshift({ name: title || "未命名项目", description: body, status: "草稿" });
    }

    persistData();
    renderAll();
    $("#composeTitle").value = "";
    $("#composeBody").value = "";
    $("#composeUrl").value = "";
    dialog.close();
  });

  $("#clearDataBtn").addEventListener("click", () => {
    siteData.posts.length = 0;
    siteData.moments.length = 0;
    siteData.photos.length = 0;
    siteData.projects.length = 0;
    persistData();
    renderAll();
  });

  $("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(siteData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qining-data.json";
    link.click();
    URL.revokeObjectURL(url);
  });
}

async function loadPublicData() {
  try {
    const response = await fetch("./data.json", { cache: "no-store" });
    if (response.ok) {
      const publicData = await response.json();
      siteData = {
        posts: Array.isArray(publicData.posts) ? publicData.posts : [],
        moments: Array.isArray(publicData.moments) ? publicData.moments : [],
        photos: Array.isArray(publicData.photos) ? publicData.photos : [],
        projects: Array.isArray(publicData.projects) ? publicData.projects : [],
      };
    }
  } catch {
    siteData = structuredClone(defaultData);
  }

  const draftData = localStorage.getItem("qining-data");
  if (draftData) {
    try {
      siteData = JSON.parse(draftData);
    } catch {
      localStorage.removeItem("qining-data");
    }
  }
}

function updateTimer() {
  const minutes = Math.floor(state.seconds / 60).toString().padStart(2, "0");
  const seconds = (state.seconds % 60).toString().padStart(2, "0");
  $("#timerText").textContent = `${minutes}:${seconds}`;
}

function setupSearch() {
  $("#searchInput").addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderAll();
  });
}

function setupClockText() {
  const date = new Date();
  const text = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
  $("#todayText").textContent = `${text}，内容等待填充。`;
}

async function init() {
  await loadPublicData();
  setupTheme();
  setupTools();
  setupCompose();
  setupSearch();
  setupClockText();
  renderAll();
  setRoute(state.route);
}

window.addEventListener("hashchange", () => setRoute(location.hash.replace("#", "")));
init();
