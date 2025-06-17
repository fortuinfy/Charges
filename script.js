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
  const buyPrice = parseFloat(document.getElementById("buyPrice").value);
  const sellPrice = parseFloat(document.getElementById("sellPrice").value);
  const quantity = parseInt(document.getElementById("quantity").value);

  if (!broker || isNaN(buyPrice) || isNaN(sellPrice) || isNaN(quantity)) {
    document.getElementById("result").innerText = "Please fill all inputs correctly.";
    return;
  }

  const data = chargesData[broker];
  const buyValue = buyPrice * quantity;
  const sellValue = sellPrice * quantity;
  const turnover = buyValue + sellValue;
  const profitLoss = sellValue - buyValue;

  // Brokerage
  const brokerageText = data[`${tradeType} Brokerage`];
  let brokerage = 0;
  const flatFee = getFlatFee(brokerageText);
  if (flatFee !== null) {
    brokerage = flatFee * 2;
  } else {
    brokerage = turnover * getPercent(brokerageText) / 100;
  }

  // STT
  const sttRate = getPercent(data[`STT ${tradeType}`]);
  const stt = sellValue * sttRate / 100;

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
  const stampDuty = buyValue * stampRate / 100;

  // Total Charges & Net Profit
  const totalCharges = brokerage + stt + exchangeTxn + sebi + gst + stampDuty;
  const netProfit = profitLoss - totalCharges;

  document.getElementById("result").innerHTML = `
    <strong>🔍 Trade Summary:</strong><br>
    Buy Value (₹${buyPrice} × ${quantity}): ₹${buyValue.toFixed(2)}<br>
    Sell Value (₹${sellPrice} × ${quantity}): ₹${sellValue.toFixed(2)}<br>
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
