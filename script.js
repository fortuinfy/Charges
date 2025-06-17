let chargesData = {};

fetch('charges.json')
  .then(response => response.json())
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

function toggleSideOptions() {
  const tradeType = document.getElementById("tradeTypeSelect").value;
  const sideSection = document.getElementById("sideSection");
  const sideSelect = document.getElementById("sideSelect");

  if (tradeType === "Delivery") {
    sideSection.style.display = "block";
  } else {
    sideSection.style.display = "none";
    sideSelect.value = "Both"; // Default to Both
    document.getElementById("buyPrice").disabled = false;
    document.getElementById("sellPrice").disabled = false;
  }
  toggleInputFields();
}

function toggleInputFields() {
  const tradeType = document.getElementById("tradeTypeSelect").value;
  const side = document.getElementById("sideSelect").value;
  const buyInput = document.getElementById("buyPrice");
  const sellInput = document.getElementById("sellPrice");

  if (tradeType === "Delivery") {
    if (side === "Buy") {
      buyInput.disabled = false;
      sellInput.disabled = true;
    } else if (side === "Sell") {
      buyInput.disabled = true;
      sellInput.disabled = false;
    } else {
      buyInput.disabled = false;
      sellInput.disabled = false;
    }
  } else {
    buyInput.disabled = false;
    sellInput.disabled = false;
  }
}

function getPercent(str) {
  if (str.toLowerCase().includes("free")) return 0;
  const match = str.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function getFlatFee(str) {
  const match = str.match(/₹(\d+)/);
  return match ? parseFloat(match[1]) : null;
}

function calculate() {
  const broker = document.getElementById("brokerSelect").value;
  const exchange = document.getElementById("exchangeSelect").value;
  const tradeType = document.getElementById("tradeTypeSelect").value;
  const side = tradeType === "Delivery" ? document.getElementById("sideSelect").value : "Both";
  const buyPrice = parseFloat(document.getElementById("buyPrice").value);
  const sellPrice = parseFloat(document.getElementById("sellPrice").value);
  const quantity = parseInt(document.getElementById("quantity").value);

  if (!broker || isNaN(quantity) || (side !== "Sell" && isNaN(buyPrice)) || (side !== "Buy" && isNaN(sellPrice))) {
    document.getElementById("result").innerText = "Please fill all inputs correctly.";
    return;
  }

  const data = chargesData[broker];
  const buyValue = side !== "Sell" ? buyPrice * quantity : 0;
  const sellValue = side !== "Buy" ? sellPrice * quantity : 0;
  const turnover = buyValue + sellValue;
  const profitLoss = sellValue - buyValue;

  // Brokerage
  const brokerageText = data[`${tradeType} Brokerage`];
  let brokerage = 0;
  const flatFee = getFlatFee(brokerageText);
  if (flatFee !== null) {
    brokerage = flatFee * (side === "Both" ? 2 : 1);
  } else {
    brokerage = turnover * getPercent(brokerageText) / 100;
  }

  // STT
  const sttRate = getPercent(data[`STT ${tradeType}`]);
  const stt = (side === "Sell" || side === "Both") ? sellValue * sttRate / 100 : 0;

  // Exchange Charges
  const exchangeKey = `Exchange Transaction Charges ${exchange}`;
  const exchangeRate = getPercent(data[exchangeKey]);
  const exchangeTxn = turnover * exchangeRate / 100;

  // SEBI Charges
  const sebiRate = getPercent(data["SEBI Turnover Charges"]);
  const sebi = turnover * sebiRate / 100;

  // GST
  const gst = (brokerage + exchangeTxn) * 0.18;

  // Stamp Duty
  const stampKey = `Stamp Duty (Buy-side) ${tradeType}`;
  const stampRate = getPercent(data[stampKey]);
  const stampDuty = (side === "Buy" || side === "Both") ? buyValue * stampRate / 100 : 0;

  const totalCharges = brokerage + stt + exchangeTxn + sebi + gst + stampDuty;
  const netProfit = profitLoss - totalCharges;

  document.getElementById("result").innerHTML = `
    <strong>🔍 Trade Summary:</strong><br>
    ${side !== "Sell" ? `Buy Value (₹${buyPrice} × ${quantity}): ₹${buyValue.toFixed(2)}<br>` : ""}
    ${side !== "Buy" ? `Sell Value (₹${sellPrice} × ${quantity}): ₹${sellValue.toFixed(2)}<br>` : ""}
    Turnover: ₹${turnover.toFixed(2)}<br><br>

    <strong>📋 Charge Breakdown:</strong><br>
    Brokerage (${brokerageText}): ₹${brokerage.toFixed(2)}<br>
    STT (${sttRate}% on Sell): ₹${stt.toFixed(2)}<br>
    Exchange Charges (${exchangeRate}%): ₹${exchangeTxn.toFixed(2)}<br>
    SEBI Charges (${sebiRate}%): ₹${sebi.toFixed(2)}<br>
    GST (18% on Brokerage + Exchange): ₹${gst.toFixed(2)}<br>
    Stamp Duty (${stampRate}% on Buy): ₹${stampDuty.toFixed(2)}<br><br>

    <strong>🧮 Total Charges:</strong> ₹${totalCharges.toFixed(2)}<br>
    <strong>📈 Gross P/L:</strong> ₹${profitLoss.toFixed(2)}<br>
    <strong>💰 Net Profit:</strong> ₹${netProfit.toFixed(2)}
  `;
}
