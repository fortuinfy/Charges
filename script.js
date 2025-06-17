let brokersData = {};

document.addEventListener("DOMContentLoaded", () => {
  loadBrokers();

  document.getElementById("tradeType").addEventListener("change", toggleSideOptions);
  document.getElementById("transactionSide").addEventListener("change", toggleInputFields);
  document.getElementById("calculateBtn").addEventListener("click", calculateCharges);
});

async function loadBrokers() {
  try {
    const res = await fetch("charges.json");
    brokersData = await res.json();

    const brokerSelect = document.getElementById("broker");
    brokerSelect.innerHTML = '<option value="">-- Select Broker --</option>';
    Object.keys(brokersData).forEach(broker => {
      const opt = document.createElement("option");
      opt.value = broker;
      opt.textContent = broker;
      brokerSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading broker data:", err);
  }
}

function toggleSideOptions() {
  const tradeType = document.getElementById("tradeType").value;
  const sideGroup = document.getElementById("transactionSideGroup");

  if (tradeType === "Delivery") {
    sideGroup.style.display = "block";
  } else {
    sideGroup.style.display = "none";
    document.getElementById("transactionSide").value = "Both";
    enableInputs("Both");
  }
}

function toggleInputFields() {
  const side = document.getElementById("transactionSide").value;
  enableInputs(side);
}

function enableInputs(side) {
  const buy = document.getElementById("buyPrice");
  const sell = document.getElementById("sellPrice");

  buy.disabled = (side === "Sell Only");
  sell.disabled = (side === "Buy Only");
}

function calculateCharges() {
  const broker = document.getElementById("broker").value;
  const exchange = document.getElementById("exchange").value;
  const tradeType = document.getElementById("tradeType").value;
  const transactionSide = (tradeType === "Delivery")
    ? document.getElementById("transactionSide").value
    : "Both";
  const buyPrice = parseFloat(document.getElementById("buyPrice").value) || 0;
  const sellPrice = parseFloat(document.getElementById("sellPrice").value) || 0;
  const quantity = parseInt(document.getElementById("quantity").value) || 0;

  const resultDiv = document.getElementById("result");

  if (!broker || !brokersData[broker]) {
    resultDiv.innerHTML = "<p style='color:red'>Broker data not found.</p>";
    return;
  }

  const brokerInfo = brokersData[broker][exchange][tradeType];
  const buyValue = (transactionSide !== "Sell Only") ? buyPrice * quantity : 0;
  const sellValue = (transactionSide !== "Buy Only") ? sellPrice * quantity : 0;
  const turnover = buyValue + sellValue;

  const brokerage = Math.min(
    (brokerInfo.brokerage / 100) * turnover,
    brokerInfo.brokerage_cap
  );

  const stt = brokerInfo.stt_rate / 100 * (transactionSide === "Buy Only" ? buyValue : sellValue);
  const exchangeTxn = brokerInfo.exchange_txn_charge / 100 * turnover;
  const sebiCharges = brokerInfo.sebi_charges / 100 * turnover;
  const gst = brokerInfo.gst_rate / 100 * (brokerage + exchangeTxn);
  const stampDuty = (transactionSide !== "Sell Only")
    ? brokerInfo.stamp_duty / 100 * buyValue
    : 0;

  const totalCharges = brokerage + stt + exchangeTxn + sebiCharges + gst + stampDuty;
  const grossPL = sellValue - buyValue;
  const netPL = grossPL - totalCharges;

  resultDiv.innerHTML = `
    <h3>📊 Trade Summary:</h3>
    <p>Buy Value (₹${buyPrice} × ${quantity}): ₹${buyValue.toFixed(2)}</p>
    <p>Sell Value (₹${sellPrice} × ${quantity}): ₹${sellValue.toFixed(2)}</p>
    <h3>💰 Charges Breakdown:</h3>
    <ul>
      <li>Brokerage: ₹${brokerage.toFixed(2)}</li>
      <li>STT: ₹${stt.toFixed(2)}</li>
      <li>Exchange Transaction Charges: ₹${exchangeTxn.toFixed(2)}</li>
      <li>SEBI Charges: ₹${sebiCharges.toFixed(2)}</li>
      <li>GST: ₹${gst.toFixed(2)}</li>
      <li>Stamp Duty: ₹${stampDuty.toFixed(2)}</li>
    </ul>
    <h3>🧾 Summary:</h3>
    <p>Total Charges: ₹${totalCharges.toFixed(2)}</p>
    <p>Gross P/L: ₹${grossPL.toFixed(2)}</p>
    <p><strong>Net P/L: ₹${netPL.toFixed(2)}</strong></p>
  `;
}
