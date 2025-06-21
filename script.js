let chargesData = {};

fetch('charges.json')
  .then(res => res.json())
  .then(data => {
    chargesData = data;
    populateBrokers();
  });

function populateBrokers() {
  const brokerSelect = document.getElementById("broker");
  brokerSelect.innerHTML = '<option value="">Select Broker</option>';
  Object.keys(chargesData).forEach(broker => {
    const option = document.createElement("option");
    option.value = broker;
    option.textContent = broker;
    brokerSelect.appendChild(option);
  });
}

document.getElementById("tradeType").addEventListener("change", function() {
  const sideGroup = document.getElementById("transactionSideGroup");
  if (this.value === "Delivery") {
    sideGroup.style.display = "block";
  } else {
    sideGroup.style.display = "none";
    document.getElementById("transactionSide").value = "Both";
  }
});

document.getElementById("transactionSide").addEventListener("change", function () {
  const side = this.value;
  const buyInput = document.getElementById("buyPrice");
  const sellInput = document.getElementById("sellPrice");

  if (side === "Buy Only") {
    sellInput.disabled = true;
    sellInput.value = '';
    buyInput.disabled = false;
  } else if (side === "Sell Only") {
    buyInput.disabled = true;
    buyInput.value = '';
    sellInput.disabled = false;
  } else {
    buyInput.disabled = false;
    sellInput.disabled = false;
  }
});

document.getElementById("calculateBtn").addEventListener("click", () => {
  const broker = document.getElementById("broker").value;
  const exchange = document.getElementById("exchange").value;
  const tradeType = document.getElementById("tradeType").value;
  const transactionSide = document.getElementById("transactionSide").value;
  const buyPrice = parseFloat(document.getElementById("buyPrice").value) || 0;
  const sellPrice = parseFloat(document.getElementById("sellPrice").value) || 0;
  const quantity = parseFloat(document.getElementById("quantity").value);

  const resultDiv = document.getElementById("result");

  if (!chargesData[broker] || !chargesData[broker][tradeType] || !chargesData[broker][tradeType][exchange]) {
    resultDiv.innerHTML = "Broker data not found.";
    return;
  }

  const charges = chargesData[broker][tradeType][exchange];

  const turnover = ((transactionSide !== "Sell Only" ? buyPrice : 0) + (transactionSide !== "Buy Only" ? sellPrice : 0)) * quantity;
  const brokerage = charges.brokerage.includes('%') ? Math.min(turnover * parseFloat(charges.brokerage.replace('%','')) / 100, 20) : parseFloat(charges.brokerage.replace(/[₹,]/g, ''));

  const stt = (transactionSide === "Buy Only")
    ? buyPrice * quantity * charges.stt / 100
    : sellPrice * quantity * charges.stt / 100;

  const exchangeTxn = turnover * charges.exchange_txn / 100;
  const sebiCharges = turnover * charges.sebi / 100;
  const ipftCharges = turnover * (charges.ipft || 0) / 100;
  const gst = (brokerage + exchangeTxn) * charges.gst / 100;
  const stampDuty = (transactionSide === "Buy Only" || transactionSide === "Both")
    ? buyPrice * quantity * charges.stamp_duty / 100
    : 0;

  const dpCharges = (tradeType === "Delivery" && (transactionSide === "Sell Only" || transactionSide === "Both")) ? charges.dp_charges : 0;

  const totalCharges = brokerage + stt + exchangeTxn + sebiCharges + gst + stampDuty + dpCharges + ipftCharges;

  resultDiv.innerHTML = `
    <strong>Total Charges:</strong> ₹${totalCharges.toFixed(2)}<br/><br/>
    <strong>Breakdown:</strong><br/>
    Brokerage: ₹${brokerage.toFixed(2)}<br/>
    STT: ₹${stt.toFixed(2)}<br/>
    Exchange Txn: ₹${exchangeTxn.toFixed(2)}<br/>
    SEBI: ₹${sebiCharges.toFixed(2)}<br/>
    GST: ₹${gst.toFixed(2)}<br/>
    Stamp Duty: ₹${stampDuty.toFixed(2)}<br/>
    IPFT Charges: ₹${ipftCharges.toFixed(2)}<br/>
    DP Charges: ₹${dpCharges.toFixed(2)}<br/>
  `;
});
fetch('charges.json')
  .then(res => res.json())
  .then(data => {
    chargesData = data;
    populateBrokers();
  });

