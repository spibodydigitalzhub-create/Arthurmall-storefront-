"use strict";

const WHATSAPP_NUMBER = "233570848484";

let products = [];

let cart = [];
let activeCategory = "All";
let searchTerm = "";
let sortMode = "featured";

const $ = (id) => document.getElementById(id);

const productGrid = $("productGrid");
const cartDrawer = $("cartDrawer");
const cartOverlay = $("cartOverlay");
const cartItems = $("cartItems");
const checkoutModal = $("checkoutModal");
const checkoutForm = $("checkoutForm");

const formatPrice = (amount) =>
  `GH₵${Number(amount).toLocaleString("en-GH")}`;

function trackPixel(event, data = {}) {
  if (typeof window.fbq === "function") {
    window.fbq("track", event, data);
  }
}

// Product rendering
function getVisibleProducts() {
  let result = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    const matchesSearch =
      `${product.name} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (sortMode === "low") {
    result.sort((a, b) => a.price - b.price);
  } else if (sortMode === "high") {
    result.sort((a, b) => b.price - a.price);
  }

  return result;
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();

  $("productResultCount").textContent =
    `${visibleProducts.length} product${visibleProducts.length === 1 ? "" : "s"}`;

  if (!visibleProducts.length) {
    productGrid.innerHTML = `
      <div class="empty-products">
        No products found. Try another search.
      </div>
    `;
    return;
  }

  productGrid.innerHTML = visibleProducts.map((product) => {
    const images = product.images?.length
      ? product.images
      : [product.image];

    return `
      <article class="product-card">
        <div class="product-image">
          <img
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
            data-main-image="${product.id}"
          >

          <span class="product-tag">${product.tag || "Featured"}</span>
        </div>

        ${images.length > 1 ? `
          <div class="product-gallery">
            ${images.map((image, index) => `
              <button
                type="button"
                class="gallery-thumb ${index === 0 ? "active" : ""}"
                data-gallery-image="${product.id}"
                data-image="${image}"
                aria-label="View product image ${index + 1}"
              >
                <img src="${image}" alt="" loading="lazy">
              </button>
            `).join("")}
          </div>
        ` : ""}

        <div class="product-info">
          <span class="product-category">${product.category}</span>

          <h3>${product.name}</h3>

          <p class="product-description">
            ${product.description}
          </p>

          <div class="product-highlights">
            ${(product.highlights || []).map(([value, label]) => `
              <div class="product-highlight">
                <strong>${value}</strong>
                <span>${label}</span>
              </div>
            `).join("")}
          </div>

          <div class="product-assurance">
            <span>✓ ${product.delivery || "Free delivery"}</span>
            <span>✓ ${product.payment || "Pay on delivery"}</span>
          </div>

          <div class="product-bottom">
            <strong class="product-price">
              ${formatPrice(product.price)}
            </strong>

            <button class="add-button" data-add="${product.id}">
              Add to cart +
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}
// Add to cart
function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  trackPixel("AddToCart", {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency: "GHS"
  });

  renderCart();

  const button = productGrid.querySelector(
    `[data-add="${productId}"]`
  );

  if (button) {
    button.textContent = "Added ✓";

    setTimeout(() => {
      if (button.isConnected) {
        button.textContent = "Add to cart +";
      }
    }, 900);
  }
}

// Remove cart item
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  renderCart();
}

// Cart total
function getCartTotal() {
  return cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

// Render cart
function renderCart() {
  const totalQuantity = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  $("cartCount").textContent = totalQuantity;
  $("cartTotal").textContent = formatPrice(getCartTotal());

  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        Your cart is empty.<br>
        Explore our smartphones to get started.
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h4>${item.name}</h4>
        <p>${formatPrice(item.price)} × ${item.quantity}</p>
      </div>
      <button class="remove-item" data-remove="${item.id}">
        Remove
      </button>
    </div>
  `).join("");
}

// Cart drawer
function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
  document.body.classList.add("no-scroll");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
  document.body.classList.remove("no-scroll");
}

// Checkout
function openCheckout() {
  if (!cart.length) {
    alert("Your cart is empty. Add a smartphone first.");
    return;
  }

  closeCart();

  $("checkoutTotal").textContent = formatPrice(getCartTotal());

  trackPixel("InitiateCheckout", {
    content_ids: cart.map((item) => String(item.id)),
    contents: cart.map((item) => ({
      id: String(item.id),
      quantity: item.quantity
    })),
    content_type: "product",
    num_items: cart.reduce((sum, item) => sum + item.quantity, 0),
    value: getCartTotal(),
    currency: "GHS"
  });

  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function closeCheckout() {
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

// Submit order to WhatsApp
checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!cart.length) {
    alert("Your cart is empty.");
    closeCheckout();
    return;
  }

  if (!checkoutForm.reportValidity()) return;

  const formData = new FormData(checkoutForm);

  const name = formData.get("customerName").trim();
  const phone = formData.get("customerPhone").trim();
  const region = formData.get("region");
  const town = formData.get("town").trim();
  const address = formData.get("address").trim();
  const instructions =
    formData.get("instructions").trim() || "None";

  const lines = cart.map((item) =>
    `${item.name} x ${item.quantity} — ${formatPrice(item.price * item.quantity)}`
  );

  const message = [
    "HELLO ARTHURMALL! I WOULD LIKE TO PLACE AN ORDER.",
    "",
    "CUSTOMER DETAILS",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Region: ${region}`,
    `City/Town: ${town}`,
    `Delivery address: ${address}`,
    `Delivery instructions: ${instructions}`,
    "",
    "ORDER DETAILS",
    ...lines,
    "",
    `TOTAL: ${formatPrice(getCartTotal())}`,
    "",
    "Payment method: Pay on delivery.",
    "Please confirm product availability and delivery arrangements.",
    "",
    "Thank you."
  ].join("\n");

  const whatsappURL =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Do not record Purchase here.
  // Opening WhatsApp does not prove an order was completed.
  window.location.href = whatsappURL;
});

// Search
$("searchToggle").addEventListener("click", () => {
  const panel = $("searchPanel");
  panel.classList.toggle("open");

  if (panel.classList.contains("open")) {
    $("searchInput").focus();
  }
});

$("searchInput").addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderProducts();
});

// Sorting
$("sortProducts").addEventListener("change", (event) => {
  sortMode = event.target.value;
  renderProducts();
});

// Category filtering
document.querySelectorAll("[data-category]").forEach((link) => {
  link.addEventListener("click", () => {
    activeCategory = link.dataset.category;
    renderProducts();
  });
});

// Product actions
productGrid.addEventListener("click", (event) => {
  const galleryButton = event.target.closest("[data-gallery-image]");

  if (galleryButton) {
    const productId = galleryButton.dataset.galleryImage;
    const mainImage = productGrid.querySelector(
      `[data-main-image="${productId}"]`
    );

    if (mainImage) {
      mainImage.src = galleryButton.dataset.image;
    }

    productGrid.querySelectorAll(
      `[data-gallery-image="${productId}"]`
    ).forEach(button => button.classList.remove("active"));

    galleryButton.classList.add("active");
    return;
  }

  const button = event.target.closest("[data-add]");

  if (button) {
    addToCart(Number(button.dataset.add));
  }
});

// Cart actions
cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");

  if (button) {
    removeFromCart(Number(button.dataset.remove));
  }
});

// Cart controls
$("cartToggle").addEventListener("click", openCart);
$("cartClose").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
$("checkoutButton").addEventListener("click", openCheckout);

// Checkout controls
$("checkoutClose").addEventListener("click", closeCheckout);
$("checkoutOverlay").addEventListener("click", closeCheckout);

// Mobile navigation
$("menuToggle").addEventListener("click", () => {
  $("desktopNav").classList.toggle("open");
});

document.querySelectorAll("#desktopNav a").forEach((link) => {
  link.addEventListener("click", () => {
    $("desktopNav").classList.remove("open");
  });
});

// Keyboard support
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    closeCheckout();
    $("desktopNav").classList.remove("open");
    $("searchPanel").classList.remove("open");
  }
});

// Footer year
$("currentYear").textContent = new Date().getFullYear();

// Load product catalogue
async function loadProducts() {
  try {
    const response = await fetch("products.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Could not load product catalogue.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid product catalogue format.");
    }

    products = data;
    renderProducts();
    renderCart();

  } catch (error) {
    console.error("Product loading error:", error);

    productGrid.innerHTML = `
      <div class="empty-products">
        Products are temporarily unavailable.
        Please try again later.
      </div>
    `;

    $("productResultCount").textContent = "Catalogue unavailable";
  }
}

loadProducts();
