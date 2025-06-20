const amountInput = document.getElementById("amount");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const resultText = document.getElementById("resultText");
const darkModeToggle = document.getElementById("darkModeToggle");

const currencies = ["INR", "USD", "EUR", "JPY", "GBP"];
let history = [];

currencies.forEach(code => {
  const option1 = new Option(code, code);
  const option2 = new Option(code, code);
  fromCurrency.add(option1.cloneNode(true));
  toCurrency.add(option2.cloneNode(true));
});

fromCurrency.value = "INR";
toCurrency.value = "USD";

// Dark Mode Toggle
darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
});

// Convert Currency with real-time API
async function convertCurrency() {
  const amount = parseFloat(amountInput.value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (isNaN(amount) || amount <= 0) {
    resultText.textContent = "Enter a valid amount.";
    return;
  }

  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const data = await response.json();
    const rate = data.rates[to];
    const converted = amount * rate;

    resultText.textContent = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;

    // Save to history
    history.push({ from, to, amount, result: converted.toFixed(2) });
    if (history.length > 5) history.shift(); // keep only last 5
    updateChart();

  } catch (error) {
    resultText.textContent = "Error fetching conversion rate.";
  }
}

// Chart.js Setup
const ctx = document.getElementById("historyChart").getContext("2d");
let chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Converted Amount',
      data: [],
      backgroundColor: '#4e54c8',
      borderRadius: 10
    }]
  },
  options: {
    scales: {
      y: { beginAtZero: true }
    }
  }
});

function updateChart() {
  chart.data.labels = history.map(h => `${h.amount} ${h.from} ➜ ${h.to}`);
  chart.data.datasets[0].data = history.map(h => h.result);
  chart.update();
}
