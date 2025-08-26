
Why You See Multiple Events for a Single Market Order:
Expected Behavior:
When you submit a MARKET order, the system typically generates:
Order Acceptance Event - "NEW" status
Immediate Execution Event - "FILLED" status
What's Happening Behind the Scenes:
1. Order Submission Process:
2. Event Sequence:
Order Accepted: Broker receives your order and assigns it a unique ID
Order Sent to Exchange: Order is transmitted to the exchange simulator
Immediate Execution: Since it's a MARKET order, it gets filled immediately at current market price
Execution Report: Exchange sends back the fill details
Why This Happens:
Market Orders vs Limit Orders:
MARKET Orders: Execute immediately at current market price
LIMIT Orders: Wait for price to reach your specified level
System Architecture:
The trading system has multiple components:
Broker Service (accepts orders)
Exchange Simulator (executes orders)
WebSocket Broadcasting (sends real-time updates)
Event Flow Example:

ser submits: BUY 100 AAPL MARKET

Live Events shows:
[10:30:15] Order placed: BUY 100 AAPL MARKET
[10:30:16] Order accepted by broker (NEW status)
[10:30:16] Order sent to exchange
[10:30:17] Order executed: 100 AAPL @ $150.25 (FILLED)

Order Blotter shows:
ID: 1234 | AAPL | BUY | MARKET | 100 | $150.25 | FILLED | DAY

Why You See Both Events:
1. Order Management:
The "NEW" status confirms your order was received and accepted
This is important for order tracking and audit trails
2. Execution Confirmation:
The "FILLED" status confirms the order was executed
Shows the actual execution price (may differ from expected price)
3. System Reliability:
Multiple confirmations ensure order integrity
Provides complete audit trail for compliance
This is Normal Behavior:
✅ Order Accepted → Order Executed → Order Confirmed
What to Expect:
MARKET Orders: Usually show NEW → FILLED quickly
LIMIT Orders: May show NEW → PENDING → FILLED (when price is reached)
Stop Orders: May show NEW → PENDING → TRIGGERED → FILLED
Key Points:
1. Order Submission Process:
 
2. Event Sequence:
Order Accepted: Broker receives your order and assigns it a unique ID
Order Sent to Exchange: Order is transmitted to the exchange simulator
Immediate Execution: Since it's a MARKET order, it gets filled immediately at current market price
Execution Report: Exchange sends back the fill details
Why This Happens:
Market Orders vs Limit Orders:
MARKET Orders: Execute immediately at current market price
LIMIT Orders: Wait for price to reach your specified level
System Architecture:
The trading system has multiple components:
Broker Service (accepts orders)
Exchange Simulator (executes orders)
WebSocket Broadcasting (sends real-time updates)
Event Flow Example:
Why You See Both Events:
1. Order Management:
The "NEW" status confirms your order was received and accepted
This is important for order tracking and audit trails
2. Execution Confirmation:
The "FILLED" status confirms the order was executed
Shows the actual execution price (may differ from expected price)
3. System Reliability:
Multiple confirmations ensure order integrity
Provides complete audit trail for compliance
This is Normal Behavior:
✅ Order Accepted → Order Executed → Order Confirmed
What to Expect:
MARKET Orders: Usually show NEW → FILLED quickly
LIMIT Orders: May show NEW → PENDING → FILLED (when price is reached)
Stop Orders: May show NEW → PENDING → TRIGGERED → FILLED
Key Points:
This is expected behavior for a properly functioning trading system
Market orders execute immediately due to their nature
Multiple confirmations provide better order tracking
The system is working correctly - you're seeing the complete order lifecycle
The fact that you're seeing both events means the system is properly tracking orders from submission through execution! 📊