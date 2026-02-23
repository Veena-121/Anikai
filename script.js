const BASE_URL = "https://api.jikan.moe/v4";

/* ELEMENTS */
const listView = document.getElementById("listView");
const detailsView = document.getElementById("detailsView");
const grid = document.getElementById("animeGrid");
const hero = document.getElementById("animeHero");

const diaryBtn = document.getElementById("diaryBtn");
const diaryModal = document.getElementById("diaryModal");

const watchingList = document.getElementById("watchingList");
const watchedList = document.getElementById("watchedList");
const planList = document.getElementById("planList");

const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreSelect");
const yearSelect = document.getElementById("yearSelect");
const typeSelect = document.getElementById("typeSelect");
const applyFiltersBtn = document.getElementById("applyFilters");

const backBtn = document.getElementById("backBtn");
const similarGrid = document.getElementById("similarAnime");



const DIARY_KEY = "animeDiary";


/* DIARY  */
let diary = JSON.parse(localStorage.getItem(DIARY_KEY)) || {
  watching: [],
  watched: [],
  plan: []
};

function saveDiary() {
  localStorage.setItem(DIARY_KEY, JSON.stringify(diary));
}

function isInDiary(cat, id) {
  return diary[cat].some(a => a.mal_id === id);
}

function toggleDiary(cat, anime) {
  const idx = diary[cat].findIndex(a => a.mal_id === anime.mal_id);
  if (idx >= 0) {
    diary[cat].splice(idx, 1); // remove
  } else {
    diary[cat].push({
      mal_id: anime.mal_id,
      title: anime.title,
      image: anime.images.jpg.image_url,
      score: anime.score ?? "N/A"
    });
  }
  saveDiary();
  renderDiary();
  updateDetailButtons(anime);
}

function updateDetailButtons(anime) {
  ["watching", "watched", "plan"].forEach(cat => {
    const btn = document.getElementById(cat + "Btn");
    if (!btn) return;
    if (isInDiary(cat, anime.mal_id)) {
      btn.classList.add("marked");
      btn.textContent = cat === "watching" ? "▶️ Watching" : cat === "watched" ? "✅ Watched" : "📝 Plan";
    } else {
      btn.classList.remove("marked");
      btn.textContent = cat === "watching" ? "▶️ Watching" : cat === "watched" ? "✅ Watched" : "📝 Plan";
    }
  });
}

/* FETCH*/
async function fetchTopAnime() {
  const res = await fetch(`${BASE_URL}/top/anime`);
  const data = await res.json();
  renderAnime(data.data);
}

/* SEARCH + FILTER */
async function fetchFilteredAnime() {
  let url = `${BASE_URL}/anime?limit=24`;

  if (searchInput.value)
    url += `&q=${encodeURIComponent(searchInput.value)}`;
  if (genreSelect.value)
    url += `&genres=${genreSelect.value}`;
  if (typeSelect.value)
    url += `&type=${typeSelect.value}`;
  if (yearSelect.value)
    url += `&start_date=${yearSelect.value}-01-01&end_date=${yearSelect.value}-12-31`;

  const res = await fetch(url);
  const data = await res.json();
  renderAnime(data.data || []);
}

applyFiltersBtn.onclick = fetchFilteredAnime;
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") fetchFilteredAnime();
});

/*  GRID  */
function renderAnime(list) {
  grid.innerHTML = "";

  if (!list || list.length === 0) {
    grid.innerHTML = "<p>No anime found.</p>";
    return;
  }

  list.forEach(anime => {
    const card = document.createElement("div");
    card.className = "anime-card";
    card.innerHTML = `
      <img src="${anime.images.jpg.image_url}">
      <div class="anime-info">
        <h3>${anime.title}</h3>
        <span>⭐ ${anime.score ?? "N/A"}</span>
      </div>
    `;
    card.onclick = () => openDetails(anime);
    grid.appendChild(card);
  });
}

/* DETAILS */
async function openDetails(anime) {
  listView.classList.add("hidden");
  detailsView.classList.remove("hidden");

  hero.innerHTML = `
    <img src="${anime.images.jpg.image_url}">
    <div class="hero-info">
      <h1>${anime.title}</h1>
      <p>⭐ ${anime.score ?? "N/A"}</p>
      <p>${anime.synopsis || "No description available."}</p>

      <button id="watchingBtn">▶️ Watching</button>
      <button id="watchedBtn">✅ Watched</button>
      <button id="planBtn">📝 Plan</button>
    </div>
  `;

  const wBtn = document.getElementById("watchingBtn");
  const wdBtn = document.getElementById("watchedBtn");
  const pBtn = document.getElementById("planBtn");

  updateDetailButtons(anime);

  // toggle on click
  wBtn.onclick = () => toggleDiary("watching", anime);
  wdBtn.onclick = () => toggleDiary("watched", anime);
  pBtn.onclick = () => toggleDiary("plan", anime);

  // fetch similar anime
  fetchSimilarAnime(anime.mal_id);
}

async function fetchSimilarAnime(id) {
  similarGrid.innerHTML = "<p>Loading similar anime...</p>";
  try {
    const res = await fetch(`${BASE_URL}/anime/${id}/recommendations`);
    const data = await res.json();
    const recs = data.data || [];

    similarGrid.innerHTML = "";
    if (recs.length === 0) {
      similarGrid.innerHTML = "<p>No similar anime found.</p>";
      return;
    }

    recs.forEach(r => {
      if (!r.entry) return;
      r.entry.forEach(anime => {
        const card = document.createElement("div");
        card.className = "anime-card";
        card.innerHTML = `
          <img src="${anime.images.jpg.image_url}">
          <div class="anime-info">
            <h3>${anime.title}</h3>
          </div>
        `;
        card.onclick = () => openDetails(anime);
        similarGrid.appendChild(card);
      });
    });
  } catch (err) {
    similarGrid.innerHTML = "<p>Error fetching similar anime.</p>";
    console.error(err);
  }
}

/*  DIARY  */
function renderDiary() {
  watchingList.innerHTML = "";
  watchedList.innerHTML = "";
  planList.innerHTML = "";

  ["watching", "watched", "plan"].forEach(cat => {
    const list = document.getElementById(`${cat}List`);

    if (diary[cat].length === 0) {
      list.innerHTML = `<p class="empty">Empty</p>`;
      return;
    }

    diary[cat].forEach((anime, i) => {
      const li = document.createElement("li");
      li.className = "diary-card";
      li.innerHTML = `
        <img src="${anime.image}">
        <h4>${anime.title}</h4>
        <button onclick="removeFromDiary('${cat}', ${i})">✖</button>
      `;
      list.appendChild(li);
    });
  });
}

function removeFromDiary(cat, index) {
  diary[cat].splice(index, 1);
  saveDiary();
  renderDiary();
}

/* MODAL  */
diaryBtn.onclick = () => {
  diaryModal.classList.remove("hidden");
  renderDiary();
};

document.getElementById("diaryCloseTop").onclick = () => {
  diaryModal.classList.add("hidden");
};

/* BACK BUTTON  */
backBtn.onclick = () => {
  detailsView.classList.add("hidden");
  listView.classList.remove("hidden");
};

/*  FILTER DATA  */
async function loadGenres() {
  const res = await fetch(`${BASE_URL}/genres/anime`);
  const data = await res.json();

  data.data.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.mal_id;
    opt.textContent = g.name;
    genreSelect.appendChild(opt);
  });
}

function loadYears() {
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1980; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

/* ================= INIT ================= */
loadGenres();
loadYears();
fetchTopAnime();
