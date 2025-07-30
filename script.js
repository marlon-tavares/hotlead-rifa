const slider = document.getElementById("qtd");
const num = document.getElementById("num");
const valor = document.getElementById("valor");
const pagarBtn = document.getElementById("pagarBtn");
const pixForm = document.getElementById("pixForm");
const qrImg = document.getElementById("pixQrCodeImage");
const pixCodeField = document.getElementById("pixCodeField");

const precoUnitario = 3.99;
const pushinpayToken = "39575|BeCNctiQk9McJHGJaXQfLTPs5uygHA4WVaHwDXQM57b40cc8";
const webhookURL = "https://seu-site.com/pushinpay-webhook"; // substitua pela sua URL

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
            // Oculta o bloco de compra
            document.getElementById("compraSection").style.display = "none";

            // Mostra o QR Code no bloco fixo
            qrImg.src = qrCodeImage.startsWith("data:image")
                ? qrCodeImage
                : "data:image/png;base64," + qrCodeImage;

            pixCodeField.value = qrCode;
            pixForm.style.display = "block";

            pagarBtn.textContent = "Pix gerado!";
        } else {
            alert("Erro ao gerar Pix: resposta incompleta.");
            pagarBtn.textContent = "QUERO MINHA NOITE COM A REEH! (Pagar via PIX)";
        }
    } catch (error) {
        console.error("Erro ao gerar Pix:", error);
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

// Pix com desconto (botão verde do modal)
async function gerarPixDesconto() {
    await gerarPix(2990); // R$ 29,90
    closeOfferModal();
}

// Copiar código Pix do bloco fixo
function copiarPix() {
    const campo = document.getElementById("pixCodeField");
    campo.select();
    document.execCommand("copy");
    alert("Código Pix copiado!");
}

function setSorteioData() {
  const hoje = new Date();
  hoje.setDate(hoje.getDate() + 3); // adiciona 3 dias

  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();

  const dataFormatada = `${dia}/${mes}/${ano}`;
  document.getElementById("sorteioData").textContent = dataFormatada;
}

setSorteioData();

// Exibe o modal após 15s
setTimeout(openOfferModal, 15000);

