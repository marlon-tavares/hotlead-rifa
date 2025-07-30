const slider = document.getElementById("qtd");
const num = document.getElementById("num");
const valor = document.getElementById("valor");
const pagarBtn = document.getElementById("pagarBtn");

const precoUnitario = 3.99;
const pushinpayToken = "39575|BeCNctiQk9McJHGJaXQfLTPs5uygHA4WVaHwDXQM57b40cc8";
const webhookURL = "https://seu-site.com/pushinpay-webhook"; // substitua pela URL real

slider.addEventListener("input", () => {
  const qtd = parseInt(slider.value);
  num.textContent = qtd;
  valor.textContent = (qtd * precoUnitario).toFixed(2).replace(".", ",");
});

pagarBtn.addEventListener("click", async () => {
  const qtd = parseInt(slider.value);
  const totalReais = (qtd * precoUnitario).toFixed(2);
  const totalCentavos = Math.round(parseFloat(totalReais) * 100);

  await gerarPix(totalCentavos);
});

async function gerarPix(valorCentavos) {
  pagarBtn.disabled = true;
  pagarBtn.textContent = "Gerando Pix...";

  try {
    const response = await fetch("https://api.pushinpay.com.br/api/pix/cashIn", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pushinpayToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: valorCentavos,
        webhook_url: webhookURL,
        split_rules: [],
      }),
    });

    const data = await response.json();
    console.log("Resposta da PushinPay:", data);

    const qrCode = data?.qr_code;
    const qrCodeImage = data?.qr_code_base64;

    if (qrCode && qrCodeImage) {
      const wrapper = document.createElement("div");
      wrapper.style.marginTop = "1.5rem";
      wrapper.style.textAlign = "center";

      const qrImg = document.createElement("img");
      qrImg.src = qrCodeImage;
      qrImg.alt = "QR Code Pix";
      qrImg.style.maxWidth = "250px";
      qrImg.style.borderRadius = "12px";

      const pixCode = document.createElement("textarea");
      pixCode.value = qrCode;
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
        navigator.clipboard.writeText(qrCode);
        copyBtn.textContent = "Copiado!";
        setTimeout(() => (copyBtn.textContent = "Copiar código Pix"), 2000);
      };

      wrapper.appendChild(qrImg);
      wrapper.appendChild(pixCode);
      wrapper.appendChild(copyBtn);

      pagarBtn.insertAdjacentElement("afterend", wrapper);
      pagarBtn.textContent = "Pix gerado!";
    } else {
      alert("Erro ao gerar Pix: resposta incompleta.");
      pagarBtn.textContent = "QUERO MINHA NOITE COM A REEH! (Pagar via PIX)";
    }
  } catch (error) {
    console.error(error);
    alert("Erro de conexão com a PushinPay.");
    pagarBtn.textContent = "QUERO MINHA NOITE COM A REEH! (Pagar via PIX)";
  }

  pagarBtn.disabled = false;
}

// Modal
function openOfferModal() {
  document.getElementById("offerModal").style.display = "flex";
}

function closeOfferModal() {
  document.getElementById("offerModal").style.display = "none";
}

// Geração de Pix com desconto via botão verde do modal
async function gerarPixDesconto() {
  await gerarPix(2990); // R$ 29,90 em centavos
  closeOfferModal();
}

// Cópia para modal fixo (caso use em outro lugar)
function copiarPix() {
  const campo = document.getElementById("pixCodeField");
  campo.select();
  document.execCommand("copy");
  alert("Código Pix copiado!");
}

// Mostrar modal com atraso
setTimeout(openOfferModal, 15000);
