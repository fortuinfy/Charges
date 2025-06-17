let chargesData = {};

fetch("charges.json")
  .then((res) => res.json())
  .then((data) => {
    chargesData = data;
    populateBrokers();
  });

function populateBrokers() {
  const brokerSelect = document.getElementById("broker");
  Object.keys(chargesData).forEach((broker) => {
    const option = document.createElement("option");
    option.value = broker;
    option.text = broker;
    brokerSelect.appendChild(option);
  });
}

document.getElementById("tradeType").addEventListener("change", function () {
  const transactionGroup = document.getElementById("transactionSideGroup");
  if (this.value === "Delivery") {
    transactionGroup.style.display = "block";
  } else {
    transactionGroup.style.display = "none";
    document.getElementById("transactionSide").value = "Both";
    document.getElementById("buyPrice").disabled = false;
    document.getElementById("sellPrice").disabled = false;
  }
});

document.getElementById("transactionSide").addEventListener("change", function () {
  const buyInput = document.getElementById("buyPrice");
  const sellInput = document.getElementById("sellPrice");

  if (this.value === "Buy Only") {
    buyInput.disabled = false;
    sellInput.disabled = true;
  } else if (this.value === "Sell Only") {
    buyInput.disabled = true;
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
  const transactionSide =
    tradeType === "Delivery"
      ? document.getElementById("transactionSide").value
      : "Both";
  const buyPrice = parseFloat(document.getElementById("buyPrice").value) || 0;
  const sellPrice = parseFloat(document.getElementById("sellPrice").value) || 0;
  const quantity = parseInt(document.getElementById("quantity").value) || 0;

  const chargeSet = chargesData[broker][exchange][tradeType];
  let buyValue = buyPrice * quantity;
  let sellValue = sellPrice * quantity;

  let totalCharges = 0;
  let chargeDetails = [];

  function calculateCharges(value, type) {
    let subtotal = 0;
    for (let key in chargeSet[type]) {
      let chargeRate = chargeSet[type][key];
      let chargeAmount = 0;

      if (typeof chargeRate === "string" && chargeRate.includes("%")) {
        let rate = parseFloat(chargeRate) / 100;
        chargeAmount = value * rate;
      } else {
        chargeAmount = parseFloat(chargeRate);
      }

      chargeDetails.push(`${type} ${key}: ₹${chargeAmount.toFixed(2)}`);
      subtotal += chargeAmount;
    }
    return subtotal;
  }

  if (transactionSide === "Both" || transactionSide === "Buy Only") {
    totalCharges += calculateCharges(buyValue, "buy");
  }

  if (transactionSide === "Both" || transactionSide === "Sell Only") {
    totalCharges += calculateCharges(sellValue, "sell");
  }

  const gross = sellValue - buyValue;
  const netProfit = gross - totalCharges;

  document.getElementById("result").innerHTML = `
    <h3>📊 Trade Summary:</h3>
    <p>Buy Value (₹${buyPrice} × ${quantity}): ₹${buyValue.toFixed(2)}</p>
    <p>Sell Value (₹${sellPrice} × ${quantity}): ₹${sellValue.toFixed(2)}</p>
    <h4>🔍 Charges Breakdown:</h4>
    <ul>${chargeDetails.map((c) => `<li>${c}</li>`).join("")}</ul>
    <p><strong>Total Charges:</strong> ₹${totalCharges.toFixed(2)}</p>
    <p><strong>Gross P/L:</strong> ₹${gross.toFixed(2)}</p>
    <p><strong>Net Profit:</strong> ₹${netProfit.toFixed(2)}</p>
  `;
});
