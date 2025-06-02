document.addEventListener("DOMContentLoaded", () => {
  let chargesData = null;

  // 1️⃣ FETCH charges.json on load
  fetch("charges.json")
    .then((resp) => {
      if (!resp.ok) throw new Error("charges.json not found");
      return resp.json();
    })
    .then((json) => {
      chargesData = json;
    })
    .catch((err) => {
      alert("Error loading charges.json: " + err.message);
    });

  // Get references to DOM elements
  const tradeModeSelect = document.getElementById("tradeMode");
  const buyInput = document.getElementById("buy");
  const sellInput = document.getElementById("sell");
  const resultsContainer = document.getElementById("results");

  // 2️⃣ Trade Mode: enable/disable Buy or Sell inputs
  tradeModeSelect.addEventListener("change", function () {
    const mode = this.value;
    if (mode === "buy") {
      sellInput.value = "";
      sellInput.disabled = true;
      buyInput.disabled = false;
    } else if (mode === "sell") {
      buyInput.value = "";
      buyInput.disabled = true;
      sellInput.disabled = false;
    } else {
      buyInput.disabled = false;
      sellInput.disabled = false;
    }
  });
  // Trigger on load
  tradeModeSelect.dispatchEvent(new Event("change"));

  // 3️⃣ Calculate Button
  document.getElementById("calculate").addEventListener("click", () => {
    // Ensure chargesData is loaded
    if (!chargesData) {
      alert("Charges data not loaded yet. Please wait a moment and try again.");
      return;
    }

    // Read input values
    const scriptName = document.getElementById("script").value.trim() || "N/A";
    const exchange = document.getElementById("exchange").value;
    const brokerName = document.getElementById("broker").value;
    const tradeTypeRaw = document.getElementById("type").value; // "intraday" or "delivery"
    const tradeModeRaw = tradeModeSelect.value; // "buy", "sell", "both"
    const qty = Number(document.getElementById("qty").value);
    const buyPrice = Number(buyInput.value);
    const sellPrice = Number(sellInput.value);

    // Basic validations
    if (!qty || qty <= 0) {
      alert("Please enter a valid Quantity.");
      return;
    }
    if (
      (tradeModeRaw === "buy" || tradeModeRaw === "both") &&
      (!buyPrice || buyPrice <= 0)
    ) {
      alert("Please enter a valid Buy Price.");
      return;
    }
    if (
      (tradeModeRaw === "sell" || tradeModeRaw === "both") &&
      (!sellPrice || sellPrice <= 0)
    ) {
      alert("Please enter a valid Sell Price.");
      return;
    }

    // Capitalize helper
    const capitalize = (str) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    const tradeType = capitalize(tradeTypeRaw); // "Intraday" or "Delivery"
    const tradeMode =
      tradeModeRaw === "both" ? "Buy & Sell" : capitalize(tradeModeRaw);

    // 4️⃣ Retrieve broker‐specific charge parameters
    const brokerData = chargesData[brokerName];
    if (!brokerData) {
      alert(`No charge data found for broker "${brokerName}".`);
      return;
    }
    const params = brokerData[tradeTypeRaw]; // e.g. brokerData["intraday"]
    if (!params) {
      alert(`No ${tradeType} data for ${brokerName}.`);
      return;
    }

    // Helper to calculate charges for a given price and quantity
    function calcChargesForSide(price, qty, params) {
      const txnValue = price * qty; // Transaction value
      // ❖ BROKERAGE: txnValue * percentage, capped by max_brokerage (if not null)
      let brokerage = txnValue * params.brokerage_pct;
      if (
        params.max_brokerage !== null &&
        brokerage > params.max_brokerage
      ) {
        brokerage = params.max_brokerage;
      }
      // ❖ SEBI FEES:
      const sebiCharge = txnValue * params.sebi_pct;
      // ❖ GST: on brokerage
      const gstCharge = brokerage * params.gst_pct;
      // ❖ STAMP DUTY: txnValue * stamp_duty_pct
      const stampDutyCharge = txnValue * params.stamp_duty_pct;
      // ❖ STT: txnValue * stt_pct (only on sell side, logic applied outside)
      // Return an object (STT alone is handled separately)
      return {
        txnValue,
        brokerage,
        gstCharge,
        stampDutyCharge,
        sebiCharge,
      };
    }

    let totalBrokerage = 0,
      totalGST = 0,
      totalStampDuty = 0,
      totalSTT = 0,
      totalSEBI = 0,
      totalDP = 0,
      totalCharges = 0;
    let buyCharges = null,
      sellCharges = null;

    // ❖ BUY SIDE
    if (tradeModeRaw === "buy" || tradeModeRaw === "both") {
      buyCharges = calcChargesForSide(buyPrice, qty, params);
      totalBrokerage += buyCharges.brokerage;
      totalGST += buyCharges.gstCharge;
      totalStampDuty += buyCharges.stampDutyCharge;
      totalSEBI += buyCharges.sebiCharge;
      // No STT on buy
    }

    // ❖ SELL SIDE
    if (tradeModeRaw === "sell" || tradeModeRaw === "both") {
      sellCharges = calcChargesForSide(sellPrice, qty, params);
      totalBrokerage += sellCharges.brokerage;
      totalGST += sellCharges.gstCharge;
      totalStampDuty += sellCharges.stampDutyCharge;
      totalSEBI += sellCharges.sebiCharge;
      // STT on sell side:
      const sttCharge = sellCharges.txnValue * params.stt_pct;
      totalSTT += sttCharge;
    }

    // ❖ DP CHARGES (only if delivery)
    if (tradeTypeRaw === "delivery") {
      totalDP += params.dp_charges;
    }

    // Sum up all charges:
    totalCharges =
      totalBrokerage +
      totalGST +
      totalStampDuty +
      totalSTT +
      totalSEBI +
      totalDP;

    // ❖ GROSS & NET P/L (only if both sides)
    let grossProfitLoss = null;
    if (tradeModeRaw === "both") {
      grossProfitLoss = (sellPrice - buyPrice) * qty;
    }
    const netProfitLoss =
      grossProfitLoss !== null
        ? grossProfitLoss - totalCharges
        : null;

    // 5️⃣ Build result card and inject into DOM
    const div = document.createElement("div");
    div.classList.add("result-card");

    const formatINR = (num) =>
      "₹" +
      num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");

    div.innerHTML = `
      <table class="export-table">
        <thead>
          <tr><th colspan="2">${scriptName} - ${exchange}</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Broker:</strong></td><td>${brokerName}</td></tr>
          <tr><td><strong>Trade Type:</strong></td><td>${tradeType}</td></tr>
          <tr><td><strong>Trade Mode:</strong></td><td>${tradeMode}</td></tr>
          <tr><td><strong>Quantity:</strong></td><td>${qty}</td></tr>
          <tr><td><strong>Buy Price:</strong></td><td>${buyPrice > 0 ? formatINR(buyPrice) : "N/A"}</td></tr>
          <tr><td><strong>Sell Price:</strong></td><td>${sellPrice > 0 ? formatINR(sellPrice) : "N/A"}</td></tr>
          ${buyCharges ? `<tr><td><strong>Buy Brokerage:</strong></td><td>${formatINR(buyCharges.brokerage)}</td></tr>` : ""}
          ${sellCharges ? `<tr><td><strong>Sell Brokerage:</strong></td><td>${formatINR(sellCharges.brokerage)}</td></tr>` : ""}
          <tr><td><strong>Total Brokerage:</strong></td><td>${formatINR(totalBrokerage)}</td></tr>
          <tr><td><strong>STT:</strong></td><td>${formatINR(totalSTT)}</td></tr>
          <tr><td><strong>Stamp Duty:</strong></td><td>${formatINR(totalStampDuty)}</td></tr>
          <tr><td><strong>SEBI Fees:</strong></td><td>${formatINR(totalSEBI)}</td></tr>
          <tr><td><strong>GST:</strong></td><td>${formatINR(totalGST)}</td></tr>
          ${tradeTypeRaw === "delivery"
            ? `<tr><td><strong>DP Charges:</strong></td><td>${formatINR(totalDP)}</td></tr>`
            : ""
          }
          <tr><td><strong>Total Charges:</strong></td><td>${formatINR(totalCharges)}</td></tr>
          ${grossProfitLoss !== null ? `<tr><td><strong>Gross P/L:</strong></td><td>${formatINR(grossProfitLoss)}</td></tr>` : ""}
          ${netProfitLoss !== null ? `<tr><td><strong>Net P/L after Charges:</strong></td><td>${formatINR(netProfitLoss)}</td></tr>` : ""}
        </tbody>
      </table>`;

    resultsContainer.appendChild(div);
  });

  // 6️⃣ Erase Inputs Button
  document.getElementById("erase").addEventListener("click", () => {
    document.getElementById("script").value = "";
    document.getElementById("qty").value = "";
    buyInput.value = "";
    sellInput.value = "";
    buyInput.disabled = false;
    sellInput.disabled = false;
  });

  // 7️⃣ Clear All Results Button
  document.getElementById("clearResults").addEventListener("click", () => {
    resultsContainer.innerHTML = "";
  });

  // 8️⃣ Export to Excel
  document.getElementById("exportExcel").addEventListener("click", () => {
    const tables = resultsContainer.querySelectorAll("table");
    if (tables.length === 0) {
      alert("No results to export.");
      return;
    }

    const wb = XLSX.utils.book_new();
    tables.forEach((table, index) => {
      const ws = XLSX.utils.table_to_sheet(table);
      XLSX.utils.book_append_sheet(wb, ws, `Result${index + 1}`);
    });
    XLSX.writeFile(wb, "brokerage-results.xlsx");
  });

  // 9️⃣ Export to PDF
  document.getElementById("exportPDF").addEventListener("click", async () => {
    const tables = resultsContainer.querySelectorAll("table");
    if (tables.length === 0) {
      alert("No results to export.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    tables.forEach((table, index) => {
      if (index > 0) doc.addPage();
      doc.autoTable({ html: table });
    });
    doc.save("brokerage-results.pdf");
  });
});
