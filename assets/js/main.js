const WHATSAPP_NUMBER = "233570848484";

const productGrid = document.getElementById("productGrid");
const productSelect = document.getElementById("productSelect");
const orderForm = document.getElementById("orderForm");

let products = [];

const formatPrice = price =>
  `GH₵${Number(price).toLocaleString("en-GH")}`;

function renderProducts() {
  productGrid.innerHTML = "";
  productSelect.innerHTML =
    '<option value="">Select your preferred phone</option>';

  products.forEach(product => {
    const images = product.images?.length
      ? product.images
      : [product.image];

    const option = document.createElement("option");
    option.value = product.id;
    option.textContent =
      `${product.name} — ${formatPrice(product.price)}`;

    productSelect.appendChild(option);

    const card = document.createElement("article");
    card.className = "product-card";

    const gallery = document.createElement("div");
    gallery.className = "product-gallery";

    const mainImage = document.createElement("img");
    mainImage.className = "product-main-image";
    mainImage.src = images[0];
    mainImage.alt = product.name;
    mainImage.loading = "lazy";

mainImage.addEventListener("click", () => {
  if (typeof window.fbq === "function") {
    window.fbq("track", "ViewContent", {
      content_name: product.name,
      content_ids: [String(product.id)],
      content_type: "product",
      value: Number(product.price),
      currency: "GHS"
    });
  }
});

    gallery.appendChild(mainImage);

    const thumbnails = document.createElement("div");
    thumbnails.className = "product-thumbnails";

    images.forEach((image, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "product-thumbnail";

      if (index === 0) button.classList.add("active");

      button.setAttribute(
        "aria-label",
        `View ${product.name} image ${index + 1}`
      );

      const thumbnailImage = document.createElement("img");
      thumbnailImage.src = image;
      thumbnailImage.alt = "";

      button.appendChild(thumbnailImage);

      button.addEventListener("click", () => {
        mainImage.src = image;

        thumbnails.querySelectorAll("button").forEach(item =>
          item.classList.remove("active")
        );

        button.classList.add("active");
      });

      thumbnails.appendChild(button);
    });

    gallery.appendChild(thumbnails);

    const content = document.createElement("div");
    content.className = "product-card-content";

    const tag = document.createElement("span");
    tag.className = "product-tag";
    tag.textContent = product.tag || "Smartphone";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = product.description || "";

    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = formatPrice(product.price);

    const highlights = document.createElement("div");
    highlights.className = "product-highlights";

    (product.highlights || []).forEach(item => {
      const highlight = document.createElement("span");
      highlight.textContent = `${item[0]} ${item[1]}`;
      highlights.appendChild(highlight);
    });

    const delivery = document.createElement("p");
    delivery.className = "product-delivery";
    delivery.textContent = product.delivery || "";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-button product-order-button";
    button.textContent = "ORDER NOW";

    button.addEventListener("click", () => {
  productSelect.value = String(product.id);

  if (typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", {
      content_name: product.name,
      content_ids: [String(product.id)],
      content_type: "product",
      value: Number(product.price),
      currency: "GHS"
    });
  }

  document.getElementById("order").scrollIntoView({
    behavior: "smooth"
  });

  productSelect.focus({ preventScroll: true });
});
    content.append(
      tag,
      name,
      description,
      price,
      highlights,
      delivery,
      button
    );

    card.append(gallery, content);
    productGrid.appendChild(card);
  });
}

async function loadProducts() {
  try {
    const response = await fetch("products.json");

    if (!response.ok) {
      throw new Error("Unable to load products.");
    }

    products = await response.json();

    if (!Array.isArray(products) || !products.length) {
      throw new Error("No products found.");
    }

    renderProducts();
  } catch (error) {
    console.error(error);
    productGrid.textContent =
      "Products could not load. Please refresh the page.";
  }
}

function getFieldValue(id) {
  return document.getElementById(id)?.value.trim() || "";
}

orderForm.addEventListener("submit", event => {
  event.preventDefault();

  const product = products.find(
    item => String(item.id) === productSelect.value
  );

  const phone = getFieldValue("customerPhone");

  if (!product) {
    alert("Please select a phone.");
    productSelect.focus();
    return;
  }

  if (!phone) {
    alert("Please enter your phone number.");
    document.getElementById("customerPhone").focus();
    return;
  }

  const name = getFieldValue("customerName");
  const region = getFieldValue("customerRegion");
  const town = getFieldValue("customerTown");
  const address = getFieldValue("customerAddress");

  const message = [
    "Hello Arthur Mall! I would like to place an order.",
    "",
    `Product: ${product.name}`,
    `Price: ${formatPrice(product.price)}`,
    `Customer phone: ${phone}`,
    name && `Customer name: ${name}`,
    region && `Region: ${region}`,
    town && `Town/City: ${town}`,
    address && `Delivery address: ${address}`,
    "",
    "Please contact me to confirm my order."
  ].filter(Boolean).join("\n");

  if (typeof window.fbq === "function") {
  window.fbq("track", "Lead", {
    content_name: product.name,
    content_ids: [String(product.id)],
    content_type: "product",
    value: Number(product.price),
    currency: "GHS"
  });
}

  const url =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
});

document.getElementById("currentYear").textContent =
  new Date().getFullYear();

loadProducts();
