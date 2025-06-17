let chargesData;

document.addEventListener("DOMContentLoaded", () => {
  fetch("charges.json")
    .then(res => res.json())
    .then(data => {
      chargesData = data;
      populateBrokers();
    });

  const tradeType = document.getElementById("tradeType");
  const transactionSideGroup = document.getElementById("transactionSideGroup");
  const transactionSide = document.getElementById("transactionSide");
  const buyPriceInput = document.getElementById("buyPrice");
  const sellPriceInput = document.getElementById("sellPrice");

  tradeType.addEventListener("change", () => {
    if (tradeType.value === "Delivery") {
      transactionSideGroup.style.display = "block";
      handleTransactionSide(transactionSide.value);
    } else {
      transactionSideGroup.style.display = "none";
      buyPriceInput.disabled = false;
      sellPriceInput.disabled = false;
    }
  });

  transactionSide.addEventListener("change", () => {
    handleTransactionSide(transactionSide.value);
  });

  document.getElementById("calculateBtn").addEventListener("click", calculateCharges);
});

function populateBrokers() {
  const brokerSelect = document.getElementById("broker");
  Object.keys(chargesData).forEach(broker => {
    const option = document.createElement("option");
    option.value = broker;
    option.textContent = broker;
    brokerSelect.appendChild(option);
  });
}

function handleTransactionSide(side) {
  const buyPriceInput = document.getElementById("buyPrice");
  const sellPriceInput = document.getElementById("sellPrice");

  if (side === "Buy Only") {
    sellPriceInput.value = "";
    sellPriceInput.disabled = true;
    buyPriceInput.disabled = false;
  } else if (side === "Sell Only") {
    buyPriceInput.value = "";
    buyPriceInput.disabled = true;
    sellPriceInput.disabled = false;
  } else {
    buyPriceInput.disabled = false;
    sellPriceInput.disabled = false;
  }
}

function calculateCharges() {
  const broker = document.getElementById("broker").value;
  const exchange = document.getElementById("exchange").value;
  const tradeType = document.getElementById("tradeType").value;
  const transactionSide = tradeType === "Delivery"
    ? document.getElementById("transactionSide").value
    : "Both";

  const buyPrice = parseFloat(document.getElementById("buyPrice").value) || 0;
  const sellPrice = parseFloat(document.getElementById("sellPrice").value) || 0;
  const quantity = parseInt(document.getElementById("quantity").value) || 0;

  if (!chargesData[broker]) {
    document.getElementById("result").innerHTML = "<p>Broker data not found.</p>";
    return;
  }

  const brokerData = chargesData[broker][exchange]?.[tradeType];
  if (!brokerData) {
    document.getElementById("result").innerHTML = "<p>Broker data not found for selected type.</p>";
    return;
  }

  const buyValue = transactionSide === "Sell Only" ? 0 : buyPrice * quantity;
  const sellValue = transactionSide === "Buy Only" ? 0 : sellPrice * quantity;
  const turnover = buyValue + sellValue;

  const brokerage = Math.min(turnover * brokerData.brokerage, brokerData.brokerage_max || Infinity);
  const stt = (transactionSide === "Buy Only" ? buyValue : sellValue) * brokerData.stt;
  const etc = turnover * brokerData.etc;
  const sebi = turnover * brokerData.sebi;
  const gst = (brokerage + etc) * brokerData.gst;
  const stampDuty = (transactionSide === "Sell Only" ? 0 : buyValue * brokerData.stamp_duty);

  const totalCharges = brokerage + stt + etc + sebi + gst + stampDuty;
  const grossPL = sellValue - buyValue;
  const netPL = grossPL - totalCharges;

  document.getElementById("result").innerHTML = `
    <h3>📊 Trade Summary:</h3>
    <p>Buy Value (₹${buyPrice} × ${quantity}): ₹${buyValue.toFixed(2)}</p>
    <p>Sell Value (₹${sellPrice} × ${quantity}): ₹${sellValue.toFixed(2)}</p>

    <h3>💰 Charges Breakdown:</h3>
    <ul>
      <li>Brokerage: ₹${brokerage.toFixed(2)}</li>
      <li>STT: ₹${stt.toFixed(2)}</li>
      <li>Exchange Transaction Charges: ₹${etc.toFixed(2)}</li>
      <li>SEBI Charges: ₹${sebi.toFixed(2)}</li>
      <li>GST: ₹${gst.toFixed(2)}</li>
      <li>Stamp Duty: ₹${stampDuty.toFixed(2)}</li>
    </ul>

    <h3>🧾 Summary:</h3>
    <p>Total Charges: ₹${totalCharges.toFixed(2)}</p>
    <p>Gross P/L: ₹${grossPL.toFixed(2)}</p>
    <p><strong>Net P/L: ₹${netPL.toFixed(2)}</strong></p>
  `;
}
