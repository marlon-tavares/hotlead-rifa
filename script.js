const slider = document.getElementById("qtd");
const num = document.getElementById("num");
const valor = document.getElementById("valor");
const pagarBtn = document.getElementById("pagarBtn");

const precoUnitario = 3.99;
const pushinpayToken = "39575|BeCNctiQk9McJHGJaXQfLTPs5uygHA4WVaHwDXQM57b40cc8";
const webhookURL = "https://seu-site.com"; // substitua pela sua URL real

slider.addEventListener("input", () => {
    const qtd = parseInt(slider.value);
    num.textContent = qtd;
    valor.textContent = (qtd * precoUnitario).toFixed(2).replace(".", ",");
});

pagarBtn.addEventListener("click", async () => {
    const qtd = parseInt(slider.value);
    const totalReais = (qtd * precoUnitario).toFixed(2);
    const totalCentavos = Math.round(parseFloat(totalReais) * 100);

    const body = {
        value: totalCentavos,
        webhook_url: webhookURL,
        split_rules: []
    };

    pagarBtn.disabled = true;
    pagarBtn.textContent = "Gerando Pix...";

    try {
        const response = await fetch("https://api.pushinpay.com.br/api/pix/cashIn", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${pushinpayToken}`,
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data?.qr_code_base64 && data?.qr_code) {
            const wrapper = document.createElement("div");
            wrapper.style.marginTop = "1.5rem";
            wrapper.style.textAlign = "center";

            const qrImg = document.createElement("img");
            qrImg.src = data.qr_code_base64.startsWith("data:image")
                ? data.qr_code_base64
                : "data:image/png;base64," + data.qr_code_base64;

            qrImg.alt = "QR Code Pix";
            qrImg.style.maxWidth = "250px";
            qrImg.style.borderRadius = "12px";

            const pixCode = document.createElement("textarea");
            pixCode.value = data.qr_code;
            pixCode.readOnly = true;
            pixCode.rows = 4;
            pixCode.style.width = "100%";
            pixCode.style.marginTop = "1rem";
            pixCode.style.padding = "0.8rem";
            pixCode.style.borderRadius = "10px";
            pixCode.style.fontSize = "0.9rem";
            pixCode.style.resize = "none";

            const copyBtn = document.createElement("button");
            copyBtn.textContent = "Copiar código Pix";
            copyBtn.style.marginTop = "0.5rem";
            copyBtn.style.padding = "0.8rem 1.2rem";
            copyBtn.style.borderRadius = "10px";
            copyBtn.style.border = "none";
            copyBtn.style.cursor = "pointer";
            copyBtn.style.backgroundColor = "#ff007a";
            copyBtn.style.color = "#fff";
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(data.qr_code);
                copyBtn.textContent = "Copiado!";
                setTimeout(() => copyBtn.textContent = "Copiar código Pix", 2000);
            };

            wrapper.appendChild(qrImg);
            wrapper.appendChild(pixCode);
            wrapper.appendChild(copyBtn);

            pagarBtn.insertAdjacentElement("afterend", wrapper);
            pagarBtn.textContent = "Pix gerado!";
        } else {
            alert("Erro ao gerar Pix. Tente novamente.");
            pagarBtn.textContent = "QUERO MINHA NOITE COM A JOYCE! (Pagar via PIX)";
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão com a PushinPay.");
        pagarBtn.textContent = "QUERO MINHA NOITE COM A JOYCE! (Pagar via PIX)";
    }

    pagarBtn.disabled = false;
});

function openOfferModal() {
  document.getElementById("offerModal").style.display = "flex";
}

function closeOfferModal() {
  document.getElementById("offerModal").style.display = "none";
}

async function gerarPixDesconto() {
  closeOfferModal();

  const body = {
    value: 2990, // R$ 29,90 em centavos
    webhook_url: "https://seu-site.com",
    split_rules: []
  };

  pagarBtn.disabled = true;
  pagarBtn.textContent = "Gerando Pix...";

  try {
    const response = await fetch("https://api.pushinpay.com.br/api/pix/cashIn", {
      method: "POST",
      headers: {
        Authorization: `Bearer 39575|BeCNctiQk9McJHGJaXQfLTPs5uygHA4WVaHwDXQM57b40cc8`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data?.pix?.qr_code_base64 && data?.pix?.qr_code) {
      const wrapper = document.createElement("div");
      wrapper.style.marginTop = "1.5rem";
      wrapper.style.textAlign = "center";

      const qrImg = document.createElement("img");
      qrImg.src = data.pix.qr_code_base64.startsWith("data:image")
        ? data.pix.qr_code_base64
        : "data:image/png;base64," + data.pix.qr_code_base64;
      qrImg.alt = "QR Code Pix";
      qrImg.style.maxWidth = "250px";
      qrImg.style.borderRadius = "12px";

      const pixCode = document.createElement("input");
      pixCode.value = data.qr_code;
      pixCode.readOnly = true;
      pixCode.style.marginTop = "1rem";
      pixCode.style.width = "100%";
      pixCode.style.padding = "0.8rem";
      pixCode.style.borderRadius = "8px";
      pixCode.style.border = "1px solid #ccc";

      const copyBtn = document.createElement("button");
      copyBtn.textContent = "Copiar código Pix";
      copyBtn.style.marginTop = "0.5rem";
      copyBtn.style.background = "#00aff0";
      copyBtn.style.color = "#fff";
      copyBtn.style.border = "none";
      copyBtn.style.padding = "0.7rem 1.2rem";
      copyBtn.style.borderRadius = "8px";
      copyBtn.style.cursor = "pointer";
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(data.qr_code);
        copyBtn.textContent = "Copiado!";
        setTimeout(() => (copyBtn.textContent = "Copiar código Pix"), 2000);
      };

      wrapper.appendChild(qrImg);
      wrapper.appendChild(pixCode);
      wrapper.appendChild(copyBtn);

      pagarBtn.insertAdjacentElement("afterend", wrapper);
      pagarBtn.textContent = "Pix gerado!";
    } else {
      alert("Erro ao gerar Pix.");
      pagarBtn.textContent = "QUERO MINHA NOITE COM A JOYCE! (Pagar via PIX)";
    }
  } catch (err) {
    console.error(err);
    alert("Erro de conexão.");
    pagarBtn.textContent = "QUERO MINHA NOITE COM A JOYCE! (Pagar via PIX)";
  }

  pagarBtn.disabled = false;
}

setTimeout(openOfferModal, 10000);
