let chargesData;

fetch("charges.json")
  .then(response => response.json())
  .then(data => {
    chargesData = data;
    populateBrokerSelect();
  });

function populateBrokerSelect() {
  const brokerSelect = document.getElementById("brokerSelect");
  Object.keys(chargesData).forEach(broker => {
    const option = document.createElement("option");
    option.value = broker;
    option.textContent = broker;
    brokerSelect.appendChild(option);
  });
}

function toggleSideOptions() {
  const tradeType = document.getElementById("tradeTypeSelect").value;
  const sideSection = document.getElementById("sideSection");

  if (tradeType === "Delivery") {
    sideSection.style.display = "block";
  } else {
    sideSection.style.display = "none";
    document.getElementById("sideSelect").value = "Both";
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
      sellInput.value = "";
    } else if (side === "Sell") {
      buyInput.disabled = true;
      buyInput.value = "";
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

function calculate() {
  const broker = document.getElementById("brokerSelect").value;
  const exchange = document.getElementById("exchangeSelect").value;
  const tradeType = document.getElementById("tradeTypeSelect").value;
  const side = document.getElementById("sideSelect").value;
  const buyPrice = parseFloat(document.getElementById("buyPrice").value) || 0;
  const sellPrice = parseFloat(document.getElementById("sellPrice").value) || 0;
  const quantity = parseInt(document.getElementById("quantity").value) || 0;
  const resultDiv = document.getElementById("result");

  if (!chargesData[broker] || !chargesData[broker][exchange] || !chargesData[broker][exchange][tradeType]) {
    resultDiv.innerHTML = "Broker data not found.";
    return;
  }

  const rate = chargesData[broker][exchange][tradeType];
  let buyValue = buyPrice * quantity;
  let sellValue = sellPrice * quantity;
  let turnover = 0;

  if (tradeType === "Intraday" || side === "Both") {
    turnover = buyValue + sellValue;
  } else if (side === "Buy") {
    turnover = buyValue;
    sellValue = 0;
  } else if (side === "Sell") {
    turnover = sellValue;
    buyValue = 0;
  }

  const brokerage = Math.min((rate.brokerage / 100) * turnover, rate.brokerage_cap || Infinity);
  const stt = ((rate.stt / 100) * (side === "Sell" ? sellValue : turnover));
  const exchangeTxn = (rate.exchange_txn / 100) * turnover;
  const sebi = (rate.sebi / 100) * turnover;
  const gst = (rate.gst / 100) * (brokerage + exchangeTxn);
  const stamp = side === "Buy" || side === "Both" ? (rate.stamp_duty / 100) * buyValue : 0;

  const totalCharges = brokerage + stt + exchangeTxn + sebi + gst + stamp;
  const grossPL = sellValue - buyValue;
  const netPL = grossPL - totalCharges;

  resultDiv.innerHTML = `
    <h3>📊 Trade Summary:</h3>
    <p>Buy Value (₹${buyPrice} × ${quantity}): ₹${buyValue.toFixed(2)}</p>
    <p>Sell Value (₹${sellPrice} × ${quantity}): ₹${sellValue.toFixed(2)}</p>
    <p>Brokerage: ₹${brokerage.toFixed(2)}</p>
    <p>STT: ₹${stt.toFixed(2)}</p>
    <p>Exchange Txn: ₹${exchangeTxn.toFixed(2)}</p>
    <p>SEBI Charges: ₹${sebi.toFixed(2)}</p>
    <p>GST: ₹${gst.toFixed(2)}</p>
    <p>Stamp Duty: ₹${stamp.toFixed(2)}</p>
    <hr/>
    <p><strong>Total Charges:</strong> ₹${totalCharges.toFixed(2)}</p>
    <p><strong>Gross P/L:</strong> ₹${grossPL.toFixed(2)}</p>
    <p><strong>Net P/L:</strong> ₹${netPL.toFixed(2)}</p>
  `;
}
