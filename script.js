let chargesData = {};

fetch('charges.json')
  .then(response => {
    if (!response.ok) throw new Error("Failed to load charges.json");
    return response.json();
  })
  .then(data => {
    chargesData = data;
    populateBrokers(Object.keys(data));
  })
  .catch(error => {
    console.error("Error loading charges.json:", error);
    alert("Could not load charges data.");
  });

function populateBrokers(brokers) {
  const select = document.getElementById("brokerSelect");
  brokers.forEach(broker => {
    const option = document.createElement("option");
    option.value = broker;
    option.textContent = broker;
    select.appendChild(option);
  });
}

function calculate() {
  const broker = document.getElementById("brokerSelect").value;
  const exchange = document.getElementById("exchangeSelect").value;
  const tradeType = document.getElementById("tradeTypeSelect").value;
  const buyPrice = parseFloat(document.getElementById("buyPrice").value);
  const sellPrice = parseFloat(document.getElementById("sellPrice").value);
  const quantity = parseInt(document.getElementById("quantity").value);

  if (!broker || isNaN(buyPrice) || isNaN(sellPrice) || isNaN(quantity)) {
    document.getElementById("result").innerText = "Please fill all inputs correctly.";
    return;
  }

  const brokerCharges = chargesData[broker];

  const buyValue = buyPrice * quantity;
  const sellValue = sellPrice * quantity;

  // Extract % values
  const getPercent = (str, fallback = 0) => {
    const match = str.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : fallback;
  };

  const brokeragePercent = getPercent(brokerCharges[`${tradeType} Brokerage`], 0.03);
  const sttPercent = getPercent(brokerCharges[`STT ${tradeType}`], 0.1);
  const exchKey = `Exchange Transaction Charges ${exchange}`;
  const exchPercent = getPercent(brokerCharges[exchKey], 0.00325);
  const sebiPercent = getPercent(brokerCharges['SEBI Turnover Charges'], 0.0001);
  const stampKey = `Stamp Duty (Buy-side) ${tradeType}`;
  const stampPercent = getPercent(brokerCharges[stampKey], 0.015);

  const brokerage = ((buyValue + sellValue) * brokeragePercent) / 100;
  const stt = (sellValue * sttPercent) / 100;
  const exchangeTxn = ((buyValue + sellValue) * exchPercent) / 100;
  const sebi = ((buyValue + sellValue) * sebiPercent) / 100;
  const gst = ((brokerage + exchangeTxn) * 18) / 100;
  const stampDuty = (buyValue * stampPercent) / 100;

  const totalCharges = brokerage + stt + exchangeTxn + sebi + gst + stampDuty;
  const profitLoss = sellValue - buyValue;
  const netProfit = profitLoss - totalCharges;

  document.getElementById("result").innerHTML = `
    <strong>Gross P/L:</strong> ₹${profitLoss.toFixed(2)}<br>
    <strong>Total Charges:</strong> ₹${totalCharges.toFixed(2)}<br>
    <strong>Net Profit:</strong> ₹${netProfit.toFixed(2)}
  `;
}
