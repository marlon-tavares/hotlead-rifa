#!/bin/bash
echo "Testando APIs..."
echo ""
echo "1. Config API:"
curl -s http://localhost:3000/api/config || echo "FALHOU"
echo -e "\n"
echo "2. Create PIX API:"
curl -s -X POST http://localhost:3000/api/create-pix \
  -H "Content-Type: application/json" \
  -d '{"click_id": "test-123", "value_cents": 399}' || echo "FALHOU"
echo -e "\n"
