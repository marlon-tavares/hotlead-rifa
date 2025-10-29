# Hotlead Rifa

Sistema de rifas com pagamento via PIX usando a API Pipfy.

## Estrutura do Projeto

```
hotlead-rifa/
├── api/                    # Serverless Functions (Vercel)
│   ├── create-pix.js      # Cria pagamento PIX
│   └── check-payment.js   # Verifica status do pagamento
├── assets/                 # Imagens e recursos
├── index.html             # Página principal
├── script.js              # Lógica do frontend
├── styles.css             # Estilos
├── vercel.json            # Configuração da Vercel
├── .env.example           # Exemplo de variáveis de ambiente
└── .gitignore             # Arquivos ignorados pelo Git
```

## Deploy na Vercel

### 1. Instalar Vercel CLI (opcional)

```bash
npm install -g vercel
```

### 2. Configurar Variáveis de Ambiente

Acesse o dashboard da Vercel e configure as seguintes variáveis de ambiente:

- **API_TOKEN**: Seu token da API Pipfy (obrigatório)
- **TELEGRAM_GROUP_URL**: Link do grupo do Telegram (obrigatório)
- **API_BASE_URL**: URL base da API (opcional, padrão: `https://api.pipfy.com.br/api/v1`)

#### Pelo Dashboard da Vercel:
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

| Name | Value | Environments |
|------|-------|--------------|
| `API_TOKEN` | `81a3ca3c-abe8-400d-b585-31fca2e32aae` | Production, Preview, Development |
| `TELEGRAM_GROUP_URL` | `https://t.me/seu_grupo_telegram` | Production, Preview, Development |

#### Pelo CLI:
```bash
vercel env add API_TOKEN
# Cole o valor quando solicitado: 81a3ca3c-abe8-400d-b585-31fca2e32aae

vercel env add TELEGRAM_GROUP_URL
# Cole o valor quando solicitado: https://t.me/seu_grupo_telegram
```

### 3. Deploy

#### Opção 1: Pelo Dashboard (Recomendado)
1. Acesse https://vercel.com/new
2. Conecte seu repositório do GitHub
3. Configure as variáveis de ambiente
4. Clique em **Deploy**

#### Opção 2: Pelo CLI
```bash
# Deploy em produção
vercel --prod

# Deploy de preview
vercel
```

### 4. Testar

Após configurar as variáveis de ambiente, seu site estará pronto! O link do Telegram será carregado automaticamente da variável de ambiente.

## Como Funciona

### Fluxo de Pagamento

1. **Usuário acessa com click_id**: `https://seu-site.vercel.app?click_id=uuid`
2. **Click ID é salvo** no localStorage do navegador
3. **Usuário seleciona quantidade** e clica em pagar
4. **Frontend chama** `/api/create-pix` (Vercel Serverless Function)
5. **Serverless Function** faz requisição para Pipfy API (com token seguro)
6. **QR Code é exibido** e inicia polling de status
7. **Polling verifica** `/api/check-payment` a cada 10 segundos (máx 5 min)
8. **Pagamento confirmado**: Redireciona para tela apropriada
   - 1 número → Tela de agradecimento
   - 2+ números → Tela de entrega com link do Telegram

### Segurança

- ✅ Token da API **nunca exposto** no frontend
- ✅ Todas as chamadas sensíveis passam por **Serverless Functions**
- ✅ CORS configurado corretamente
- ✅ Variáveis de ambiente na Vercel
- ✅ `.gitignore` previne commit de credenciais

## Desenvolvimento Local

Para testar localmente:

1. Instale Vercel CLI:
```bash
npm install -g vercel
```

2. Crie arquivo `.env` (copie de `.env.example`):
```bash
cp .env.example .env
```

3. Edite `.env` e adicione suas credenciais

4. Execute localmente:
```bash
vercel dev
```

5. Acesse: `http://localhost:3000?click_id=test-uuid-123`

## APIs Serverless

### GET /api/config

Retorna configurações públicas da aplicação.

**Response:**
```json
{
  "telegram_group_url": "https://t.me/seu_grupo_telegram"
}
```

### POST /api/create-pix

Cria um novo pagamento PIX.

**Request Body:**
```json
{
  "click_id": "uuid-do-lead",
  "value_cents": 1000
}
```

**Response:**
```json
{
  "qr_code": "00020126...",
  "qr_code_base64": "data:image/png;base64,...",
  "payment_id": "cmfvl8mrf008xqu21nnh1tx8j"
}
```

### GET /api/check-payment

Verifica status do pagamento.

**Query Parameters:**
- `payment_id`: ID do pagamento retornado pelo create-pix

**Response:**
```json
{
  "status": "paid" | "pending" | "cancelled",
  "payment_id": "cmfvl8mrf008xqu21nnh1tx8j"
}
```

## Testando Manualmente

### Simular Pagamento Aprovado

Abra o console do navegador e execute:

```javascript
// Simular pagamento feito há 1 dia (faltam 2 dias para sorteio)
const paymentData = {
    paid: true,
    paymentDate: new Date(Date.now() - 86400000).toISOString(),
    drawDate: new Date(Date.now() + 172800000).toISOString()
};
localStorage.setItem('payment_data', JSON.stringify(paymentData));
location.reload();
```

### Limpar Dados

```javascript
localStorage.clear();
location.reload();
```

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.