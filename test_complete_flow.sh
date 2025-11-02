#!/bin/bash

echo "=== Testing Complete AdvTom System ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health check
echo "1. Testing health endpoint..."
HEALTH=$(curl -s https://api.advtom.com/health --insecure)
if [[ $HEALTH == *"ok"* ]]; then
  echo -e "${GREEN}✓ Health check passed${NC}"
  echo "   Response: $HEALTH"
else
  echo -e "${RED}✗ Health check failed${NC}"
  echo "   Response: $HEALTH"
fi
echo ""

# Test 2: CORS preflight
echo "2. Testing CORS configuration..."
CORS=$(curl -s -I -X OPTIONS https://api.advtom.com/api/auth/login \
  -H "Origin: https://app.advtom.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  --insecure 2>&1)
if [[ $CORS == *"Access-Control-Allow-Origin"* ]]; then
  echo -e "${GREEN}✓ CORS configured correctly${NC}"
else
  echo -e "${YELLOW}⚠ CORS might have issues${NC}"
fi
echo ""

# Test 3: Login with existing user
echo "3. Testing login with existing user..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://api.advtom.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://app.advtom.com" \
  -d '{"email":"joao@escritorio.com.br","password":"senha123"}' \
  --insecure 2>&1)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [[ $HTTP_CODE == "200" ]]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "   User: $(echo $BODY | grep -o '"email":"[^"]*"')"
  echo "   Role: $(echo $BODY | grep -o '"role":"[^"]*"')"
  TOKEN=$(echo $BODY | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
  echo -e "${RED}✗ Login failed with HTTP $HTTP_CODE${NC}"
  echo "   Response: $BODY"
fi
echo ""

# Test 4: Login with wrong credentials
echo "4. Testing login with wrong credentials..."
WRONG_LOGIN=$(curl -s -w "\n%{http_code}" -X POST https://api.advtom.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@email.com","password":"wrongpass"}' \
  --insecure 2>&1)

HTTP_CODE=$(echo "$WRONG_LOGIN" | tail -n1)
if [[ $HTTP_CODE == "401" ]]; then
  echo -e "${GREEN}✓ Wrong credentials correctly rejected${NC}"
else
  echo -e "${RED}✗ Wrong credentials not properly handled (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 5: Authenticated request
if [[ ! -z "$TOKEN" ]]; then
  echo "5. Testing authenticated request (get clients)..."
  CLIENTS=$(curl -s -w "\n%{http_code}" https://api.advtom.com/api/clients \
    -H "Authorization: Bearer $TOKEN" \
    --insecure 2>&1)

  HTTP_CODE=$(echo "$CLIENTS" | tail -n1)
  BODY=$(echo "$CLIENTS" | head -n-1)

  if [[ $HTTP_CODE == "200" ]]; then
    echo -e "${GREEN}✓ Authenticated request successful${NC}"
    CLIENT_COUNT=$(echo $BODY | grep -o '"id"' | wc -l)
    echo "   Found $CLIENT_COUNT clients"
  else
    echo -e "${RED}✗ Authenticated request failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
  fi
else
  echo -e "${YELLOW}⚠ Skipping authenticated request test (no token)${NC}"
fi
echo ""

# Test 6: Database check
echo "6. Testing database..."
DB_CHECK=$(docker exec $(docker ps -q -f name=advtom_postgres) psql -U postgres advtom -t -c "SELECT COUNT(*) FROM users;" 2>&1)
if [[ $DB_CHECK =~ ^[0-9]+$ ]]; then
  echo -e "${GREEN}✓ Database accessible${NC}"
  echo "   Total users: $(echo $DB_CHECK | xargs)"
else
  echo -e "${RED}✗ Database connection failed${NC}"
fi
echo ""

# Test 7: Frontend check
echo "7. Testing frontend..."
FRONTEND=$(curl -s https://app.advtom.com --insecure 2>&1)
if [[ $FRONTEND == *"AdvTom"* ]]; then
  echo -e "${GREEN}✓ Frontend accessible${NC}"
else
  echo -e "${RED}✗ Frontend not accessible${NC}"
fi
echo ""

echo "=== Test Summary ==="
echo "All tests completed. Check results above."
echo ""
echo "Available test users:"
echo "  - joao@escritorio.com.br / senha123 (ADMIN)"
echo "  - teste@advtom.com / teste123 (ADMIN)"
echo ""
