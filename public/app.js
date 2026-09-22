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

let selectedGameData = {
  name: "Mobile Legends",
  image: "ML",
  requiresZone: true
};

let selectedNominal = {
  code: "ML86",
  product: "86 Diamond",
  price: 20000
};

const defaultProducts = {
  "Mobile Legends": [
    { code: "ML86", name: "86 Diamond", price: 20000 },
    { code: "ML172", name: "172 Diamond", price: 40000 },
    { code: "ML257", name: "257 Diamond", price: 60000 },
    { code: "ML514", name: "514 Diamond", price: 120000 }
  ],
  "Free Fire": [
    { code: "FF70", name: "70 Diamond", price: 10000 },
    { code: "FF140", name: "140 Diamond", price: 20000 },
    { code: "FF355", name: "355 Diamond", price: 50000 },
    { code: "FF720", name: "720 Diamond", price: 100000 }
  ],
  "PUBG Mobile": [
    { code: "PUBG60", name: "60 UC", price: 16000 },
    { code: "PUBG325", name: "325 UC", price: 75000 },
    { code: "PUBG660", name: "660 UC", price: 145000 },
    { code: "PUBG1800", name: "1800 UC", price: 370000 }
  ],
  "Valorant": [
    { code: "VAL125", name: "125 Points", price: 18000 },
    { code: "VAL420", name: "420 Points", price: 57000 },
    { code: "VAL700", name: "700 Points", price: 92000 },
    { code: "VAL1375", name: "1.375 Points", price: 176000 }
  ],
  "Genshin Impact": [
    { code: "GI60", name: "60 Genesis Crystal", price: 16000 },
    { code: "GI330", name: "330 Genesis Crystal", price: 79000 },
    { code: "GI1090", name: "1.090 Genesis Crystal", price: 239000 },
    { code: "GI2240", name: "2.240 Genesis Crystal", price: 469000 }
  ],
  "Honor of Kings": [
    { code: "HOK80", name: "80 Token", price: 18000 },
    { code: "HOK240", name: "240 Token", price: 52000 },
    { code: "HOK400", name: "400 Token", price: 86000 },
    { code: "HOK800", name: "800 Token", price: 169000 }
  ]
};

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
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

function showLoader(message = "Memproses transaksi...") {
  loaderText.textContent = message;
  loaderOverlay.hidden = false;
}

function hideLoader() {
  loaderOverlay.hidden = true;
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
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

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateSummary() {
  selectedGameInput.value = selectedGameData.name;
  selectedProductCodeInput.value = selectedNominal.code;
  selectedGameLogo.textContent = selectedGameData.image;
  modalTitle.textContent = selectedGameData.name;
  summaryGame.textContent = selectedGameData.name;
  summaryProduct.textContent = selectedNominal.product;
  summaryPrice.textContent = formatRupiah(selectedNominal.price);
}

function renderNominals(gameName) {
  const products = defaultProducts[gameName] || defaultProducts["Mobile Legends"];

  nominalGrid.innerHTML = products
    .map((product, index) => {
      return `
        <button
          type="button"
          class="nominal-card ${index === 0 ? "active" : ""}"
          data-code="${escapeHtml(product.code)}"
          data-name="${escapeHtml(product.name)}"
          data-price="${product.price}"
        >
          <strong>${escapeHtml(product.name)}</strong>
          <span>${formatRupiah(product.price)}</span>
        </button>
      `;
    })
    .join("");

  selectedNominal = {
    code: products[0].code,
    product: products[0].name,
    price: products[0].price
  };

  updateSummary();
}

function resetAccountResult() {
  accountResult.hidden = true;
  accountResult.className = "account-result";
  accountResult.textContent = "";
}

function openTopupFromCard(card) {
  selectedGameData = {
    name: card.dataset.game,
    image: card.dataset.image,
    requiresZone: card.dataset.requiresZone === "true"
  };

  userIdInput.value = "";
  zoneIdInput.value = "";
  resetAccountResult();

  zoneGroup.hidden = !selectedGameData.requiresZone;
  zoneIdInput.required = selectedGameData.requiresZone;

  renderNominals(selectedGameData.name);
  openModal(topupModal);
}

document.querySelectorAll(".game-card").forEach((card) => {
  card.addEventListener("click", () => openTopupFromCard(card));
});

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

nominalGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".nominal-card");
  if (!card) return;

  nominalGrid.querySelectorAll(".nominal-card").forEach((item) => {
    item.classList.remove("active");
  });

  card.classList.add("active");

  selectedNominal = {
    code: card.dataset.code,
    product: card.dataset.name,
    price: Number(card.dataset.price)
  };

  updateSummary();
});

document.getElementById("checkIdButton").addEventListener("click", async () => {
  const userId = userIdInput.value.trim();
  const zoneId = zoneIdInput.value.trim();

  if (!userId) {
    showToast("Masukkan User ID terlebih dahulu.", "error");
    userIdInput.focus();
    return;
  }

  if (selectedGameData.requiresZone && !zoneId) {
    showToast("Masukkan Zone/Server ID terlebih dahulu.", "error");
    zoneIdInput.focus();
    return;
  }

  resetAccountResult();
  showLoader("Memeriksa data akun...");

  try {
    const response = await fetch("/api/inquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product_code: selectedNominal.code,
        user_id: userId,
        zone_id: zoneId
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Data akun tidak ditemukan.");
    }

    const apiData = result.data || {};
    const nickname =
      apiData.nickname ||
      apiData.data?.nickname ||
      apiData.data?.username ||
      apiData.customer_name ||
      "Akun terverifikasi";

    accountResult.hidden = false;
    accountResult.className = "account-result";
    accountResult.innerHTML = `
      <i class="fa-solid fa-circle-check"></i>
      Akun ditemukan: <strong>${escapeHtml(nickname)}</strong>
    `;

    showToast("ID akun berhasil diverifikasi.");
  } catch (error) {
    accountResult.hidden = false;
    accountResult.className = "account-result error";
    accountResult.textContent = error.message;

    showToast(error.message, "error");
  } finally {
    hideLoader();
  }
});

topupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userId = userIdInput.value.trim();
  const zoneId = zoneIdInput.value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!userId) {
    showToast("User ID wajib diisi.", "error");
    return;
  }

  if (selectedGameData.requiresZone && !zoneId) {
    showToast("Zone/Server ID wajib diisi.", "error");
    return;
  }

  showLoader("Mengirim pesanan ke UniPlay...");

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product_code: selectedNominal.code,
        user_id: userId,
        zone_id: zoneId,
        email,
        phone
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Pesanan gagal dibuat.");
    }

    const reference = result.ref_id || "-";

    showToast(
      `Pesanan terkirim. Nomor referensi: ${reference}`
    );

    document.getElementById("trackingRef").value = reference;
    topupForm.reset();
    resetAccountResult();
    closeModal(topupModal);

    setTimeout(() => openModal(trackModal), 350);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    hideLoader();
  }
});

trackForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const refId = document.getElementById("trackingRef").value.trim();
  const trackingResult = document.getElementById("trackingResult");

  if (!refId) return;

  trackingResult.hidden = true;
  showLoader("Mengecek status pesanan...");

  try {
    const response = await fetch("/api/orders/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ref_id: refId
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Status pesanan tidak ditemukan.");
    }

    const data = result.data || {};
    const status =
      data.status ||
      data.data?.status ||
      data.transaction_status ||
      "Data status diterima";

    trackingResult.hidden = false;
    trackingResult.className = "tracking-result";
    trackingResult.innerHTML = `
      <strong>Status: ${escapeHtml(status)}</strong>
      <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
    `;
  } catch (error) {
    trackingResult.hidden = false;
    trackingResult.className = "tracking-result error";
    trackingResult.textContent = error.message;
  } finally {
    hideLoader();
  }
});

document.getElementById("gameSearch").addEventListener("input", (event) => {
  const keyword = event.target.value.trim().toLowerCase();
  const cards = [...document.querySelectorAll(".game-card")];
  let visibleCount = 0;

  cards.forEach((card) => {
    const gameName = card.dataset.game.toLowerCase();
    const category = card.dataset.category.toLowerCase();
    const isVisible = gameName.includes(keyword) || category.includes(keyword);

    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  document.getElementById("emptySearch").hidden = visibleCount !== 0;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12
  }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

document.getElementById("year").textContent = new Date().getFullYear();

async function checkApiHealth() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error();
  } catch {
    showToast(
      "Backend belum aktif. Jalankan server Node.js terlebih dahulu.",
      "error"
    );
  }
}

checkApiHealth();
