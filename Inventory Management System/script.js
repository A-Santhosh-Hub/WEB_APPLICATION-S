let items = JSON.parse(localStorage.getItem("inventory")) || [];

const form = document.getElementById("itemForm");
const table = document.getElementById("inventoryTable");
const searchBox = document.getElementById("searchBox");
const exportBtn = document.getElementById("exportBtn");
const toggle = document.getElementById("themeToggle");
const imageInput = document.getElementById("itemImage");

function saveToStorage() {
  localStorage.setItem("inventory", JSON.stringify(items));
}

function renderTable(data = items) {
  table.innerHTML = "";
  data.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Image"><img src="${item.image || ''}" alt="No Image" /></td>
      <td data-label="ID">${item.id}</td>
      <td data-label="Name">${item.name}</td>
      <td data-label="Qty">${item.quantity}</td>
      <td data-label="Price">₹${item.price}</td>
      <td data-label="Actions">
        <button class="edit" onclick="editItem(${index})">Edit</button>
        <button class="delete" onclick="deleteItem(${index})">Delete</button>
      </td>`;
    table.appendChild(row);
  });
}

function editItem(index) {
  const item = items[index];
  document.getElementById("itemId").value = item.id;
  document.getElementById("itemName").value = item.name;
  document.getElementById("itemQty").value = item.quantity;
  document.getElementById("itemPrice").value = item.price;
}

function deleteItem(index) {
  if (confirm("Are you sure you want to delete this item?")) {
    items.splice(index, 1);
    saveToStorage();
    refresh();
  }
}

function resetForm() {
  form.reset();
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const id = document.getElementById("itemId").value.trim();
  const name = document.getElementById("itemName").value.trim();
  const quantity = parseInt(document.getElementById("itemQty").value);
  const price = parseFloat(document.getElementById("itemPrice").value);

  if (!id || !name || isNaN(quantity) || isNaN(price)) return;

  const file = imageInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      saveItem(id, name, quantity, price, reader.result);
    };
    reader.readAsDataURL(file);
  } else {
    const index = items.findIndex(i => i.id === id);
    const image = index >= 0 ? items[index].image : "";
    saveItem(id, name, quantity, price, image);
  }

  resetForm();
});

function saveItem(id, name, quantity, price, image) {
  const index = items.findIndex(i => i.id === id);
  if (index >= 0) {
    items[index] = { id, name, quantity, price, image };
  } else {
    items.push({ id, name, quantity, price, image });
  }

  saveToStorage();
  refresh();
}

searchBox.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const filtered = items.filter(item =>
    item.id.toLowerCase().includes(keyword) ||
    item.name.toLowerCase().includes(keyword)
  );
  renderTable(filtered);
  updateChart(filtered);
});

// -------- Chart.js ----------
const ctx = document.getElementById("quantityChart").getContext("2d");
let chart;

function updateChart(data = items) {
  const labels = data.map(i => i.name);
  const values = data.map(i => i.quantity);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Stock Quantity',
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

// -------- CSV Export ----------
exportBtn.addEventListener("click", () => {
  let csv = "ID,Name,Quantity,Price\n";
  items.forEach(item => {
    csv += `${item.id},${item.name},${item.quantity},${item.price}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory.csv";
  a.click();
});

// -------- Dark Mode ----------
function applyTheme() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    toggle.checked = true;
  } else {
    document.body.classList.remove("dark");
    toggle.checked = false;
  }
}

toggle.addEventListener("change", () => {
  localStorage.setItem("darkMode", toggle.checked);
  applyTheme();
});

function refresh() {
  renderTable();
  updateChart();
}

window.addEventListener("load", () => {
  applyTheme();
  refresh();
});
