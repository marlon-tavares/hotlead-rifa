// API Serverless para criar PIX
// Esta função protege o token da API

module.exports = async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responde OPTIONS para CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { click_id, value_cents } = req.body;

  // Validação
  if (!click_id || !value_cents) {
    return res.status(400).json({
      error: 'Missing required fields: click_id, value_cents'
    });
  }

  try {
    // Token vem das variáveis de ambiente da Vercel
    const apiToken = process.env.API_TOKEN;
    const apiBaseURL = process.env.API_BASE_URL || 'https://api.pipfy.com.br/api/v1';

    const response = await fetch(`${apiBaseURL}/pix`, {
      method: 'POST',
      headers: {
        'Authorization': apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        click_id,
        value_cents,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to create PIX',
        details: errorData
      });
    }

    const data = await response.json();

    // Retorna os dados do PIX
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
