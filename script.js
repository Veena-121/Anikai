const searchBtn = document.getElementById("searchBtn");
const animeInput = document.getElementById("animeInput");
const resultsDiv = document.getElementById("results");
const resultsTitle = document.getElementById("resultsTitle");

searchBtn.addEventListener("click", () => {
  const query = animeInput.value.trim();
  if (query) {
    getRecommendations(query);
  }
});

async function getRecommendations(animeName) {
  resultsDiv.innerHTML = "<p>Loading...</p>";
  resultsTitle.textContent = "";
  try {
    // Search anime
    const searchResp = await fetch(`https://api.jikan.moe/v4/anime?q=${animeName}`);
    const searchData = await searchResp.json();
    if (!searchData.data.length) {
      resultsDiv.innerHTML = "<p>No anime found.</p>";
      return;
    }

    const animeId = searchData.data[0].mal_id;
    resultsTitle.textContent = `Recommendations for "${searchData.data[0].title}"`;

    // Get recommendations
    const recResp = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/recommendations`);
    const recData = await recResp.json();

    if (!recData.data.length) {
      resultsDiv.innerHTML = "<p>No recommendations found.</p>";
      return;
    }

    // Display top 5 recommendations
    resultsDiv.innerHTML = "";
    recData.data.slice(0, 5).forEach(rec => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <img src="https://cdn.myanimelist.net/images/anime/${rec.entry.mal_id}.jpg" alt="${rec.entry.title}">
        <h3>${rec.entry.title}</h3>
      `;
      resultsDiv.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = "<p>Error fetching data. Try again later.</p>";
  }
}
