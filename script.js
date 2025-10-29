const slider = document.getElementById("qtd");
const num = document.getElementById("num");
const valor = document.getElementById("valor");
const pagarBtn = document.getElementById("pagarBtn");
const pixForm = document.getElementById("pixForm");
const qrImg = document.getElementById("pixQrCodeImage");
const pixCodeField = document.getElementById("pixCodeField");

const precoUnitario = 3.99;

let pixJaGerado = false; // <- flag de controle para o modal
let currentPaymentId = null;
let pollingInterval = null;
let timeoutTimer = null;
let appConfig = null; // Armazena configurações da aplicação (link do Telegram, etc)
let countdownInterval = null; // Interval do timer visual

// Carrega configurações da API
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            appConfig = await response.json();
            // Atualiza o link do Telegram no DOM
            updateTelegramLink();
        }
    } catch (error) {
        // Silencioso em produção
    }
}

// Função protegida para acessar o grupo do Telegram
function acessarGrupoTelegram() {
    // Verifica se o usuário realmente pagou
    const paymentData = getPaymentData();

    if (!paymentData || !paymentData.paid) {
        alert('Acesso negado! Você precisa concluir o pagamento de 2 ou mais números para acessar o grupo VIP.');
        return;
    }

    // Verifica se tem o link configurado
    if (!appConfig || !appConfig.telegram_group_url) {
        alert('Link do grupo temporariamente indisponível. Entre em contato conosco.');
        return;
    }

    // Redireciona para o Telegram
    window.open(appConfig.telegram_group_url, '_blank');
}

// Atualiza o link do Telegram (não usado mais diretamente, mantido para compatibilidade)
function updateTelegramLink() {
    // Link protegido - não expõe mais diretamente no HTML
}

// Captura o click_id da URL e salva no localStorage
function captureClickId() {
    const urlParams = new URLSearchParams(window.location.search);
    const clickId = urlParams.get('click_id') || urlParams.get('clickId');

    if (clickId) {
        localStorage.setItem('click_id', clickId);
    }
}

// Recupera o click_id do localStorage
function getClickId() {
    return localStorage.getItem('click_id');
}

// Salva os dados do pagamento no localStorage
function savePaymentData() {
    const paymentData = {
        paid: true,
        paymentDate: new Date().toISOString(),
        drawDate: getDrawDate()
    };
    localStorage.setItem('payment_data', JSON.stringify(paymentData));
}

// Recupera os dados do pagamento
function getPaymentData() {
    const data = localStorage.getItem('payment_data');
    return data ? JSON.parse(data) : null;
}

// Calcula a data do sorteio (data do pagamento + 3 dias)
function getDrawDate() {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 3);
    return hoje.toISOString();
}

// Calcula quantos dias faltam para o sorteio
function getDaysUntilDraw() {
    const paymentData = getPaymentData();
    if (!paymentData) return null;

    const drawDate = new Date(paymentData.drawDate);
    const hoje = new Date();

    // Zera as horas para comparar apenas as datas
    hoje.setHours(0, 0, 0, 0);
    drawDate.setHours(0, 0, 0, 0);

    const diffTime = drawDate - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

// Formata data para exibição (DD/MM/YYYY)
function formatDate(dateString) {
    const date = new Date(dateString);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// A captura do click_id será feita na inicialização junto com as configurações

slider.addEventListener("input", () => {
    const qtd = parseInt(slider.value);
    num.textContent = qtd;
    valor.textContent = (qtd * precoUnitario).toFixed(2).replace(".", ",");

    // Atualiza preenchimento visual da barra (WebKit)
    const percentual = (qtd / parseInt(slider.max)) * 100;
    slider.style.setProperty("--progress", `${percentual}%`);
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

    const clickId = getClickId();
    if (!clickId) {
        alert("Erro: Click ID não encontrado. Por favor, acesse através do link correto.");
        pagarBtn.disabled = false;
        pagarBtn.textContent = "QUERO MINHA NOITE COM A DAISY! (Pagar via PIX)";
        return;
    }

    try {
        // Chama a API serverless da Vercel
        const response = await fetch('/api/create-pix', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                click_id: clickId,
                value_cents: valorCentavos,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const pixCode = data?.pix_code || data?.qr_code;
        const paymentId = data?.payment_id || data?.id;

        if (pixCode && paymentId) {
            pixJaGerado = true;
            currentPaymentId = paymentId;

            document.getElementById("compraSection").style.display = "none";

            // Preenche o campo com o código Pix Copia e Cola
            pixCodeField.value = pixCode;
            pixForm.style.display = "block";

            pixForm.scrollIntoView({ behavior: "smooth", block: "start" });

            pagarBtn.textContent = "Pix gerado!";

            // Inicia o timer visual de 5 minutos
            startCountdownTimer();

            // Inicia o polling do status do pagamento
            startPaymentPolling(paymentId);
        } else {
            alert("Erro ao gerar Pix: resposta incompleta.");
            pagarBtn.textContent = "QUERO MINHA NOITE COM A DAISY! (Pagar via PIX)";
        }
    } catch (error) {
        alert("Erro de conexão com a API. Tente novamente.");
        pagarBtn.textContent = "QUERO MINHA NOITE COM A DAISY! (Pagar via PIX)";
    }

    pagarBtn.disabled = false;
}

// Timer visual de contagem regressiva (5 minutos)
function startCountdownTimer() {
    // Limpa qualquer timer anterior
    if (countdownInterval) clearInterval(countdownInterval);

    const TOTAL_SECONDS = 300; // 5 minutos = 300 segundos
    let remainingSeconds = TOTAL_SECONDS;

    const timerDisplay = document.getElementById("timerDisplay");
    const timerContainer = document.getElementById("pixTimer");

    // Atualiza o timer imediatamente
    updateTimerDisplay();

    // Atualiza a cada segundo
    countdownInterval = setInterval(() => {
        remainingSeconds--;

        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            return;
        }

        updateTimerDisplay();
    }, 1000);

    function updateTimerDisplay() {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        timerDisplay.textContent = timeString;

        // Muda a cor quando falta menos de 1 minuto
        if (remainingSeconds <= 60) {
            timerContainer.style.background = "linear-gradient(135deg, #FF4757, #FF3838)";
            timerDisplay.style.animation = "blink 1s infinite";
        } else if (remainingSeconds <= 120) {
            timerContainer.style.background = "linear-gradient(135deg, #FFA502, #FF6348)";
        }
    }
}

// Função para verificar status do pagamento
async function checkPaymentStatus(paymentId) {
    try {
        // Chama a API serverless da Vercel
        const response = await fetch(`/api/check-payment?payment_id=${paymentId}`, {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        return null;
    }
}

// Inicia o polling do pagamento (5 minutos, verificando a cada 10 segundos)
function startPaymentPolling(paymentId) {
    const POLLING_INTERVAL = 10000; // 10 segundos
    const TIMEOUT_DURATION = 300000; // 5 minutos

    // Limpa qualquer polling anterior
    if (pollingInterval) clearInterval(pollingInterval);
    if (timeoutTimer) clearTimeout(timeoutTimer);

    // Configura o timeout de 5 minutos
    timeoutTimer = setTimeout(() => {
        clearInterval(pollingInterval);
        handlePaymentTimeout();
    }, TIMEOUT_DURATION);

    // Inicia o polling a cada 10 segundos
    pollingInterval = setInterval(async () => {
        const paymentData = await checkPaymentStatus(paymentId);

        // Verifica o status - pode estar em data.status ou direto em status
        const status = paymentData?.data?.status || paymentData?.status;

        if (status === "paid" || status === "approved") {
            clearInterval(pollingInterval);
            clearTimeout(timeoutTimer);
            handlePaymentSuccess();
        }
    }, POLLING_INTERVAL);

    // Faz a primeira verificação imediatamente
    setTimeout(async () => {
        const paymentData = await checkPaymentStatus(paymentId);

        // Verifica o status - pode estar em data.status ou direto em status
        const status = paymentData?.data?.status || paymentData?.status;

        if (status === "paid" || status === "approved") {
            clearInterval(pollingInterval);
            clearTimeout(timeoutTimer);
            handlePaymentSuccess();
        }
    }, 1000);
}

// Tratamento quando o pagamento é aprovado
function handlePaymentSuccess() {
    const qtd = parseInt(slider.value);

    // Para o timer visual
    if (countdownInterval) clearInterval(countdownInterval);

    // Salva os dados do pagamento no localStorage
    savePaymentData();

    if (qtd === 1) {
        // Se comprou apenas 1 número, vai para tela de agradecimento
        showThankYouScreen();
    } else {
        // Se comprou 2 ou mais, vai para tela de entrega
        showDeliveryScreen();
    }
}

// Tratamento quando o tempo expira
function handlePaymentTimeout() {
    // Para o timer visual
    if (countdownInterval) clearInterval(countdownInterval);

    pixForm.style.display = "none";
    document.getElementById("timeoutScreen").style.display = "block";
    document.getElementById("timeoutScreen").scrollIntoView({ behavior: "smooth", block: "start" });
}

// Exibe a tela de agradecimento (1 número)
function showThankYouScreen() {
    pixForm.style.display = "none";
    const thankYouScreen = document.getElementById("thankYouScreen");
    thankYouScreen.style.display = "block";

    // Preenche a data do sorteio na tela de agradecimento usando os dados salvos
    const paymentData = getPaymentData();
    if (paymentData && paymentData.drawDate) {
        const dataFormatada = formatDate(paymentData.drawDate);
        document.getElementById("thankYouSorteioData").textContent = dataFormatada;
    }

    thankYouScreen.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Exibe a tela de entrega (2+ números)
function showDeliveryScreen() {
    pixForm.style.display = "none";
    document.getElementById("deliveryScreen").style.display = "block";
    document.getElementById("deliveryScreen").scrollIntoView({ behavior: "smooth", block: "start" });
}

// Função para tentar novamente após timeout
function tryAgain() {
    document.getElementById("timeoutScreen").style.display = "none";
    document.getElementById("compraSection").style.display = "block";
    pixJaGerado = false;
    currentPaymentId = null;
    pagarBtn.textContent = "QUERO MINHA NOITE COM A DAISY! (Pagar via PIX)";
    document.getElementById("compraSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

// Modal
function openOfferModal() {
    if (pixJaGerado) return; // <- evita exibir se já gerou Pix
    document.getElementById("offerModal").style.display = "flex";
}

function closeOfferModal() {
    document.getElementById("offerModal").style.display = "none";
}

async function gerarPixDesconto() {
    await gerarPix(2990); // R$ 29,90
    closeOfferModal();
}

function copiarPix() {
    const campo = document.getElementById("pixCodeField");

    // Tenta usar a API moderna do clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(campo.value).then(() => {
            mostrarFeedbackCopia();
        }).catch(() => {
            // Fallback para método antigo
            copiarPixFallback();
        });
    } else {
        // Fallback para método antigo
        copiarPixFallback();
    }
}

function copiarPixFallback() {
    const campo = document.getElementById("pixCodeField");
    campo.select();
    campo.setSelectionRange(0, 99999); // Para mobile
    document.execCommand("copy");
    mostrarFeedbackCopia();
}

function mostrarFeedbackCopia() {
    // Encontra o botão de copiar
    const botoes = document.querySelectorAll('button[onclick="copiarPix()"]');
    if (botoes.length > 0) {
        const botao = botoes[0];
        const textoOriginal = botao.innerHTML;

        // Muda o texto do botão temporariamente
        botao.innerHTML = "✅ Código Copiado!";
        botao.style.background = "linear-gradient(135deg, #2196F3, #1976D2)";

        // Volta ao normal após 2 segundos
        setTimeout(() => {
            botao.innerHTML = textoOriginal;
            botao.style.background = "linear-gradient(135deg, #4CAF50, #45a049)";
        }, 2000);
    }
}

function setSorteioData() {
    const paymentData = getPaymentData();

    if (paymentData) {
        // Usuário já pagou - verifica se o sorteio já foi realizado
        const daysRemaining = getDaysUntilDraw();

        if (daysRemaining <= 0) {
            // Sorteio já foi realizado
            showDrawFinishedScreen();
            return;
        }

        // Mostra a data do sorteio e dias restantes
        const dataFormatada = formatDate(paymentData.drawDate);
        const sorteioDataElement = document.getElementById("sorteioData");
        sorteioDataElement.textContent = `${dataFormatada} (faltam ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''})`;

        // Atualiza a cada minuto
        setInterval(() => {
            const daysNow = getDaysUntilDraw();
            if (daysNow <= 0) {
                showDrawFinishedScreen();
            } else {
                const dataFormatada = formatDate(paymentData.drawDate);
                sorteioDataElement.textContent = `${dataFormatada} (faltam ${daysNow} dia${daysNow > 1 ? 's' : ''})`;
            }
        }, 60000); // Atualiza a cada 1 minuto
    } else {
        // Usuário ainda não pagou - mostra data futura
        const hoje = new Date();
        hoje.setDate(hoje.getDate() + 3);
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        const dataFormatada = `${dia}/${mes}/${ano}`;
        document.getElementById("sorteioData").textContent = dataFormatada;
    }

    // Atualiza também a data nas regras
    const regraSorteioElement = document.getElementById("regraSorteioData");
    if (regraSorteioElement) {
        regraSorteioElement.textContent = document.getElementById("sorteioData").textContent;
    }
}

// Redireciona para página de sorteio encerrado
function showDrawFinishedScreen() {
    // Redireciona para página dedicada de encerramento
    window.location.href = '/sorteio-encerrado.html';
}

function voltarEscolha() {
  // Para o timer visual e polling
  if (countdownInterval) clearInterval(countdownInterval);
  if (pollingInterval) clearInterval(pollingInterval);
  if (timeoutTimer) clearTimeout(timeoutTimer);

  pixForm.style.display = "none";
  document.getElementById("compraSection").style.display = "block";
  pagarBtn.textContent = "QUERO MINHA NOITE COM A DAISY! (Pagar via PIX)";
  pixJaGerado = false;
  currentPaymentId = null;
}

// Proteção contra acesso via Desktop
function checkDeviceAndRedirect() {
    // Detecta se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Se não for mobile, redireciona para Google
    if (!isMobile) {
        window.location.href = 'https://www.google.com.br';
        return false;
    }

    return true;
}

// Executa a verificação antes de qualquer coisa
if (!checkDeviceAndRedirect()) {
    // Para a execução se não for mobile
    throw new Error('Desktop access not allowed');
}

// Inicialização
loadConfig(); // Carrega configurações (link do Telegram)
captureClickId();
setSorteioData();
setTimeout(openOfferModal, 15000);
slider.dispatchEvent(new Event("input")); // inicializa preenchimento
