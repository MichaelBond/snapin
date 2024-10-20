# curl -X GET "http://localhost:4000/api/stripe/balance" \
# -H "User: 3f3f3-f3f3-f33f3f3f3f3" 

curl -X 'POST' \
  'http://localhost:4000/api/auth/login' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "username": "brycerbond@gmail.com",
  "password": "password"
}'