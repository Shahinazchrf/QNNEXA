#!/bin/bash
echo "🧪 COMPREHENSIVE QUEUE SYSTEM TEST"
echo "=================================="

echo "1. Health check:"
curl -s http://localhost:5000/health | jq '.status'

echo -e "\n2. Generating test tickets:"
echo "   - Normal ticket A..."
curl -s -X POST http://localhost:5000/api/tickets/generate \
  -d '{"service_id":1,"customer_name":"Normal A"}' \
  -H "Content-Type: application/json" | jq '.data.number,.data.priority'

echo "   - VIP ticket B..."
curl -s -X POST http://localhost:5000/api/tickets/generate \
  -d '{"service_id":2,"customer_name":"VIP B","vip_code":"VIP001"}' \
  -H "Content-Type: application/json" | jq '.data.number,.data.priority,.data.isVip'

echo "   - Invalid VIP ticket..."
curl -s -X POST http://localhost:5000/api/tickets/generate \
  -d '{"service_id":1,"customer_name":"Invalid VIP","vip_code":"FAKE"}' \
  -H "Content-Type: application/json" | jq '.data.number,.data.priority'

echo -e "\n3. Current queue (VIP should be first):"
curl -s http://localhost:5000/api/tickets/queue | jq '.data.count, .data.tickets[].number'

echo -e "\n4. Calling next ticket (should be VIP):"
curl -s -X POST http://localhost:5000/api/tickets/next \
  -d '{"counter_id":1}' \
  -H "Content-Type: application/json" | jq '.data.ticket_number,.data.priority'

echo -e "\n5. Queue after calling:"
curl -s http://localhost:5000/api/tickets/queue | jq '.data.count'

echo -e "\n✅ All tests completed!"
