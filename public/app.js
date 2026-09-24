const API_BASE = "https://novatopup-api.atursaja888999.workers.dev";

const topupModal = document.getElementById("topupModal");
const trackModal = document.getElementById("trackModal");
const topupForm = document.getElementById("topupForm");
const trackForm = document.getElementById("trackForm");
const loaderOverlay = document.getElementById("loaderOverlay");
const loaderText = document.getElementById("loaderText");

const selectedGameInput = document.getElementById("selectedGame");
const selectedProductCodeInput = document.getElementById("selectedProductCode");
const selectedGameLogo = document.getElementById("selectedGameLogo");
const modalTitle = document.getElementById("modalTitle");
const summaryGame = document.getElementById("summaryGame");
const summaryProduct = document.getElementById("summaryProduct");
const summaryPrice = document.getElementById("summaryPrice");

const userIdInput = document.getElementById("userId");
const zoneIdInput = document.getElementById("zoneId");
const zoneGroup = document.getElementById("zoneGroup");
const accountResult = document.getElementById("accountResult");
const nominalGrid = document.getElementById("nominalGrid");
const gameGrid = document.getElementById("gameGrid");
const gameSearch = document.getElementById("gameSearch");
const emptySearch = document.getElementById("emptySearch");

let allGames = [];
let selectedGameData = null;
let selectedNominal = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function initials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "GM"
  );
}

function showLoader(message = "Memproses...") {
  if (!loaderOverlay || !loaderText) return;
  loaderText.textContent = message;
  loaderOverlay.hidden = false;
}

function hideLoader() {
  if (loaderOverlay) loaderOverlay.hidden = true;
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");

  if (!container) {
    alert(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`;

  toast.innerHTML = `
    <i class="fa-solid ${
      type === "error" ? "fa-circle-xmark" : "fa-circle-check"
    }"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";

    setTimeout(() => toast.remove(), 250);
  }, 4500);
}

function openModal(modal) {
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");

  if (
    !topupModal.classList.contains("active") &&
    !trackModal.classList.contains("active")
  ) {
    document.body.style.overflow = "";
  }
}

function resetAccountResult() {
  accountResult.hidden = true;
  accountResult.className = "account-result";
  accountResult.textContent = "";
  delete accountResult.dataset.inquiryId;
}

function updateSummary() {
  if (!selectedGameData || !selectedNominal) return;

  selectedGameInput.value = selectedGameData.id;
  selectedProductCodeInput.value = selectedNominal.id;
  selectedGameLogo.textContent = initials(selectedGameData.name);
  modalTitle.textContent = selectedGameData.name;
  summaryGame.textContent = selectedGameData.name;
  summaryProduct.textContent = selectedNominal.package;
  summaryPrice.textContent = formatRupiah(selectedNominal.price);
}

function selectNominal(denom) {
  selectedNominal = denom;

  nominalGrid.querySelectorAll(".nominal-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.denomId === denom.id);
  });

  resetAccountResult();
  updateSummary();
}

function renderNominals(game) {
  const denoms = Array.isArray(game.denom) ? game.denom : [];

  if (!denoms.length) {
    nominalGrid.innerHTML =
      '<p class="empty-search">Nominal belum tersedia untuk game ini.</p>';
    selectedNominal = null;
    updateSummary();
    return;
  }

  nominalGrid.innerHTML = denoms
    .map(
      (denom, index) => `
        <button
          type="button"
          class="nominal-card ${index === 0 ? "active" : ""}"
          data-denom-id="${escapeHtml(denom.id)}"
        >
          <strong>${escapeHtml(denom.package)}</strong>
          <span>${formatRupiah(denom.price)}</span>
        </button>
      `
    )
    .join("");

  nominalGrid.querySelectorAll(".nominal-card").forEach((card) => {
    card.addEventListener("click", () => {
      const denom = denoms.find((item) => item.id === card.dataset.denomId);
      if (denom) selectNominal(denom);
    });
  });

  selectNominal(denoms[0]);
}

function selectGame(game) {
  selectedGameData = game;

  userIdInput.value = "";
  zoneIdInput.value = "";
  resetAccountResult();

  const requiresZone = /mobile legends|mlbb|genshin/i.test(game.name || "");
  zoneGroup.hidden = !requiresZone;
  zoneIdInput.required = requiresZone;

  renderNominals(game);
  openModal(topupModal);
}

function renderGames(games) {
  if (!games.length) {
    gameGrid.innerHTML = "";
    emptySearch.hidden = false;
    emptySearch.textContent = "Game tidak ditemukan. Coba kata kunci lain.";
    return;
  }

  emptySearch.hidden = true;

  gameGrid.innerHTML = games
    .map((game, index) => {
      const firstDenom = game.denom?.[0];

      const priceText = firstDenom
        ? `${firstDenom.package} mulai ${formatRupiah(firstDenom.price)}`
        : "Nominal belum tersedia";

      const image = game.image
        ? `<img src="${escapeHtml(game.image)}" alt="" loading="lazy" />`
        : `<span>${escapeHtml(initials(game.name))}</span>`;

      return `
        <button
          class="game-card ${index === 0 ? "featured" : ""} reveal"
          type="button"
          data-game-id="${escapeHtml(game.id)}"
        >
          <div class="game-cover api-game-cover">
            ${image}
            <div class="cover-glow"></div>
          </div>

          <div class="game-info">
            <span class="game-category">${escapeHtml(
              game.publisher || "GAME"
            )}</span>
            <h3>${escapeHtml(game.name)}</h3>
            <p>${escapeHtml(priceText)}</p>
          </div>

          <span class="arrow-circle" aria-hidden="true">
            <i class="fa-solid fa-arrow-right"></i>
          </span>
        </button>
      `;
    })
    .join("");

  gameGrid.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => {
      const game = allGames.find((item) => item.id === card.dataset.gameId);
      if (game) selectGame(game);
    });
  });
}

async function loadCatalog() {
  gameGrid.innerHTML =
    '<p class="empty-search">Memuat katalog game UniPlay...</p>';

  try {
    const response = await fetch(`${API_BASE}/api/dtu`);
    const data = await response.json();

    if (!response.ok || String(data.status) !== "200") {
      throw new Error(data.message || "Katalog UniPlay tidak dapat dimuat.");
    }

    allGames = Array.isArray(data.list_dtu) ? data.list_dtu : [];
    renderGames(allGames);
  } catch (error) {
    gameGrid.innerHTML = "";
    emptySearch.hidden = false;
    emptySearch.textContent =
      "Katalog game sedang tidak dapat dimuat. Silakan muat ulang halaman.";
    showToast(error.message, "error");
  }
}

document.getElementById("closeModalButton").addEventListener("click", () => {
  closeModal(topupModal);
});

document.getElementById("openTrackButton").addEventListener("click", () => {
  openModal(trackModal);
});

document.getElementById("heroTrackButton").addEventListener("click", () => {
  openModal(trackModal);
});

document.getElementById("closeTrackButton").addEventListener("click", () => {
  closeModal(trackModal);
});

[topupModal, trackModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal(topupModal);
    closeModal(trackModal);
  }
});

document.getElementById("checkIdButton").addEventListener("click", async () => {
  const userId = userIdInput.value.trim();
  const serverId = zoneIdInput.value.trim();

  if (!selectedGameData || !selectedNominal) {
    showToast("Pilih game dan nominal terlebih dahulu.", "error");
    return;
  }

  if (!userId) {
    showToast("Masukkan User ID terlebih dahulu.", "error");
    userIdInput.focus();
    return;
  }

  if (zoneIdInput.required && !serverId) {
    showToast("Masukkan Zone/Server ID terlebih dahulu.", "error");
    zoneIdInput.focus();
    return;
  }

  const body = {
    entitas_id: selectedGameData.id,
    denom_id: selectedNominal.id,
    user_id: userId
  };

  if (serverId) {
    body.server_id = serverId;
  }

  resetAccountResult();
  showLoader("Memeriksa data akun...");

  try {
    const response = await fetch(`${API_BASE}/api/inquiry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok || String(result.status) !== "200") {
      throw new Error(result.message || "Data akun tidak ditemukan.");
    }

    const nickname =
      result.inquiry_info?.username || "Akun terverifikasi";

    accountResult.hidden = false;
    accountResult.className = "account-result";
    accountResult.innerHTML = `
      <i class="fa-solid fa-circle-check"></i>
      Akun ditemukan: <strong>${escapeHtml(nickname)}</strong>
    `;

    accountResult.dataset.inquiryId = result.inquiry_id || "";
    showToast("ID akun berhasil diverifikasi.");
  } catch (error) {
    accountResult.hidden = false;
    accountResult.className = "account-result error";
    accountResult.textContent
