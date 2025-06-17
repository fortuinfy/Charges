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
  const turnover = buyValue + sellValue;

  const getPercent = (str, fallback = 0) => {
    if (str.toLowerCase().includes('free')) return 0;
    const match = str.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : fallback;
  };

  // Special case for flat-fee brokers (e.g., "₹10 per order")
  const getFlatFee = (str) => {
    const match = str.match(/₹(\d+)/);
    return match ? parseFloat(match[1]) : null;
  };

  let brokerage = 0;
  const brokerageStr = brokerCharges[`${tradeType} Brokerage`];
  const flatFee = getFlatFee(brokerageStr);
  if (flatFee !== null) {
    brokerage = flatFee * 2; // Buy + Sell
  } else {
    const percent = getPercent(brokerageStr, 0.03);
    brokerage = turnover * percent / 100;
  }

  const stt = sellValue * getPercent(brokerCharges[`STT ${tradeType}`], 0.1) / 100;
  const exchKey = `Exchange Transaction Charges ${exchange}`;
  const exchangeTxn = turnover * getPercent(brokerCharges[exchKey], 0.00325) / 100;
  const sebi = turnover * getPercent(brokerCharges['SEBI Turnover Charges'], 0.0001) / 100;
  const gst = (brokerage + exchangeTxn) * 0.18;
  const stampKey = `Stamp Duty (Buy-side) ${tradeType}`;
  const stampDuty = buyValue * getPercent(brokerCharges[stampKey], 0.015) / 100;

  const totalCharges = brokerage + stt + exchangeTxn + sebi + gst + stampDuty;
  const profitLoss = sellValue - buyValue;
  const netProfit = profitLoss - totalCharges;

  document.getElementById("result").innerHTML = `
    <strong>Buy Value:</strong> ₹${buyValue.toFixed(2)}<br>
    <strong>Sell Value:</strong> ₹${sellValue.toFixed(2)}<br>
    <strong>Turnover:</strong> ₹${turnover.toFixed(2)}<br><br>

    <strong>Brokerage:</strong> ₹${brokerage.toFixed(2)} (${brokerageStr})<br>
    <strong>STT:</strong> ₹${stt.toFixed(2)} (${brokerCharges[`STT ${tradeType}`]})<br>
    <strong>Exchange Txn Charges:</strong> ₹${exchangeTxn.toFixed(2)} (${brokerCharges[exchKey]})<br>
    <strong>SEBI Charges:</strong> ₹${sebi.toFixed(2)} (${brokerCharges['SEBI Turnover Charges']})<br>
    <strong>GST:</strong> ₹${gst.toFixed(2)} (18% on brokerage + exchange)<br>
    <strong>Stamp Duty:</strong> ₹${stampDuty.toFixed(2)} (${brokerCharges[stampKey]})<br><br>

    <strong>Total Charges:</strong> ₹${totalCharges.toFixed(2)}<br>
    <strong>Gross P/L:</strong> ₹${profitLoss.toFixed(2)}<br>
    <strong>Net Profit:</strong> ₹${netProfit.toFixed(2)}
  `;
}
