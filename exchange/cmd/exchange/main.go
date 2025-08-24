package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
)

// Order represents a trading order
type Order struct {
	ID             string  `json:"id"`
	OrderID        string  `json:"order_id"` // For incoming orders from broker
	Symbol         string  `json:"symbol"`
	Side           string  `json:"side"`
	OrderType      string  `json:"order_type"`
	Qty            int     `json:"qty"`
	LimitPrice     *float64 `json:"limit_price,omitempty"`
	StopPrice      *float64 `json:"stop_price,omitempty"`
	TrailingPercent *float64 `json:"trailing_percent,omitempty"`
	TIF            string  `json:"tif"`
	CallbackURL    string  `json:"callback_url"`
	Status         string  `json:"status"`
	FilledQty      int     `json:"filled_qty"`
	LeavesQty      int     `json:"leaves_qty"`
	AvgPrice       *float64 `json:"avg_price,omitempty"`
	CreatedAt      int64   `json:"created_at"`
	LastModified   int64   `json:"last_modified"`
	ExecutionLog   []Execution `json:"execution_log,omitempty"`
}

// Execution represents a trade execution
type Execution struct {
	Timestamp     int64   `json:"timestamp"`
	Price         float64 `json:"price"`
	Qty           int     `json:"qty"`
	Venue         string  `json:"venue"`
	OrderBookSnapshot *OrderBookSnapshot `json:"order_book_snapshot,omitempty"`
}

// OrderBookEntry represents a price level in the order book
type OrderBookEntry struct {
	Price     float64 `json:"price"`
	Size      int     `json:"size"`
	Venue     string  `json:"venue"`
	Timestamp int64   `json:"timestamp"`
}

// OrderBookSnapshot represents the order book at a point in time
type OrderBookSnapshot struct {
	Symbol    string          `json:"symbol"`
	Timestamp int64           `json:"timestamp"`
	Bids      []OrderBookEntry `json:"bids"`
	Asks      []OrderBookEntry `json:"asks"`
	LastPrice *float64        `json:"last_price,omitempty"`
	Volume    int             `json:"volume"`
}

// Market represents the market for a symbol
type Market struct {
	Symbol      string
	Orders      map[string]*Order
	Bids        []*Order // Sorted by price (highest first)
	Asks        []*Order // Sorted by price (lowest first)
	LastPrice   float64
	LastTrade   time.Time
	Volume      int
	mu          sync.RWMutex
}

// Exchange represents the trading exchange
type Exchange struct {
	Markets map[string]*Market
	mu      sync.RWMutex
}

var exchange = &Exchange{
	Markets: make(map[string]*Market),
}

func main() {
	r := mux.NewRouter()

	// API endpoints
	r.HandleFunc("/orders", handlePlaceOrder).Methods("POST")
	r.HandleFunc("/order-book/{symbol}", handleGetOrderBook).Methods("GET")
	r.HandleFunc("/health", handleHealth).Methods("GET")

	// Start background processes
	go startMarketMaking()
	go startStopOrderMonitoring()

	log.Println("Exchange starting on :8081")
	log.Fatal(http.ListenAndServe(":8081", r))
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok",
		"ts":     time.Now().Unix(),
	})
}

func handlePlaceOrder(w http.ResponseWriter, r *http.Request) {
	var order Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("📥 Received order: %s %s %d %s (OrderID: %s, ID: %s)", 
		order.Symbol, order.Side, order.Qty, order.OrderType, order.OrderID, order.ID)

	// Validate order
	if order.Symbol == "" || order.Side == "" || order.Qty <= 0 {
		http.Error(w, "Invalid order parameters", http.StatusBadRequest)
		return
	}

	// Handle order_id from broker
	if order.OrderID != "" {
		order.ID = order.OrderID
		log.Printf("🔄 Set order ID to: %s", order.ID)
	} else if order.ID == "" {
		order.ID = fmt.Sprintf("ex_%d", time.Now().UnixNano())
		log.Printf("🆔 Generated new order ID: %s", order.ID)
	}

	// Set order metadata
	order.Status = "NEW"
	order.FilledQty = 0
	order.LeavesQty = order.Qty
	order.CreatedAt = time.Now().Unix()
	order.LastModified = time.Now().Unix()
	order.ExecutionLog = make([]Execution, 0)

	// Get or create market
	market := exchange.getOrCreateMarket(order.Symbol)

	// Process order based on type
	switch order.OrderType {
	case "MARKET":
		processMarketOrder(market, &order)
		// Send callback after market order processing (includes synthetic execution)
		go sendExecutionCallback(order)
	case "LIMIT":
		processLimitOrder(market, &order)
		// Send callback after limit order processing
		go sendExecutionCallback(order)
	case "STOP":
		processStopOrder(market, &order)
		// Send callback after stop order processing
		go sendExecutionCallback(order)
	case "STOP_LIMIT":
		processStopLimitOrder(market, &order)
		// Send callback after stop limit order processing
		go sendExecutionCallback(order)
	case "TRAILING_STOP":
		processTrailingStopOrder(market, &order)
		// Send callback after trailing stop order processing
		go sendExecutionCallback(order)
	case "TRAILING_STOP_LIMIT":
		processTrailingStopLimitOrder(market, &order)
		// Send callback after trailing stop limit order processing
		go sendExecutionCallback(order)
	default:
		http.Error(w, "Unsupported order type", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusAccepted)
}

func handleGetOrderBook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	symbol := vars["symbol"]

	market := exchange.getMarket(symbol)
	if market == nil {
		http.Error(w, "Market not found", http.StatusNotFound)
		return
	}

	snapshot := market.getOrderBookSnapshot()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(snapshot)
}

func (e *Exchange) getOrCreateMarket(symbol string) *Market {
	e.mu.Lock()
	defer e.mu.Unlock()

	if market, exists := e.Markets[symbol]; exists {
		return market
	}

	market := &Market{
		Symbol:    symbol,
		Orders:    make(map[string]*Order),
		Bids:      make([]*Order, 0),
		Asks:      make([]*Order, 0),
		LastPrice: 100.0 + float64(rand.Intn(200)), // Random starting price
		LastTrade: time.Now(),
		Volume:    0,
	}

	e.Markets[symbol] = market
	
	// Add initial market making orders
	addInitialMarketMaking(market)
	
	return market
}

func (e *Exchange) getMarket(symbol string) *Market {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.Markets[symbol]
}

func (m *Market) getOrderBookSnapshot() OrderBookSnapshot {
	m.mu.RLock()
	defer m.mu.RUnlock()

	bids := make([]OrderBookEntry, 0, len(m.Bids))
	asks := make([]OrderBookEntry, 0, len(m.Asks))

	// Aggregate bids by price
	bidLevels := make(map[float64]int)
	for _, order := range m.Bids {
		if order.LeavesQty > 0 {
			bidLevels[*order.LimitPrice] += order.LeavesQty
		}
	}

	// Convert to entries
	for price, size := range bidLevels {
		bids = append(bids, OrderBookEntry{
			Price:     price,
			Size:      size,
			Venue:     "SIMX",
			Timestamp: time.Now().Unix(),
		})
	}

	// Aggregate asks by price
	askLevels := make(map[float64]int)
	for _, order := range m.Asks {
		if order.LeavesQty > 0 {
			askLevels[*order.LimitPrice] += order.LeavesQty
		}
	}

	// Convert to entries
	for price, size := range askLevels {
		asks = append(asks, OrderBookEntry{
			Price:     price,
			Size:      size,
			Venue:     "SIMX",
			Timestamp: time.Now().Unix(),
		})
	}

	return OrderBookSnapshot{
		Symbol:    m.Symbol,
		Timestamp: time.Now().Unix(),
		Bids:      bids,
		Asks:      asks,
		LastPrice: &m.LastPrice,
		Volume:    m.Volume,
	}
}

func processMarketOrder(market *Market, order *Order) {
	market.mu.Lock()
	defer market.mu.Unlock()

	log.Printf("📈 Processing market order: %s %s %d shares", order.Side, order.Symbol, order.Qty)
	log.Printf("📊 Market has %d bids and %d asks", len(market.Bids), len(market.Asks))

	// Market orders execute immediately against the opposite side
	if order.Side == "BUY" {
		executeAgainstAsks(market, order)
	} else {
		executeAgainstBids(market, order)
	}

	// If no executions happened, create a synthetic execution at market price
	if len(order.ExecutionLog) == 0 && order.Status == "FILLED" {
		log.Printf("⚠️ Creating synthetic execution for market order: %s", order.ID)
		
		// Use market price for synthetic execution
		execution := Execution{
			Timestamp: time.Now().Unix(),
			Price:     market.LastPrice,
			Qty:       order.Qty,
			Venue:     "SIMX",
			OrderBookSnapshot: &OrderBookSnapshot{
				Symbol:    market.Symbol,
				Timestamp: time.Now().Unix(),
				LastPrice: &market.LastPrice,
			},
		}
		order.ExecutionLog = append(order.ExecutionLog, execution)
		order.AvgPrice = &market.LastPrice
		order.FilledQty = order.Qty
		order.LeavesQty = 0
	}

	// Update order status
	order.Status = "FILLED"
	order.LastModified = time.Now().Unix()
	market.Orders[order.ID] = order
}

func processLimitOrder(market *Market, order *Order) {
	market.mu.Lock()
	defer market.mu.Unlock()

	// Try to execute immediately
	if order.Side == "BUY" {
		executeAgainstAsks(market, order)
	} else {
		executeAgainstBids(market, order)
	}

	// If order is not fully filled, add to book
	if order.LeavesQty > 0 {
		if order.Side == "BUY" {
			insertBid(market, order)
		} else {
			insertAsk(market, order)
		}
		if order.FilledQty > 0 {
			order.Status = "PARTIAL"
		} else {
			order.Status = "NEW"
		}
	} else {
		order.Status = "FILLED"
	}

	order.LastModified = time.Now().Unix()
	market.Orders[order.ID] = order
}

func processStopOrder(market *Market, order *Order) {
	market.mu.Lock()
	defer market.mu.Unlock()

	// Check if stop is triggered
	if order.Side == "BUY" && market.LastPrice >= *order.StopPrice {
		// Stop triggered - execute as market order
		executeAgainstAsks(market, order)
		order.Status = "FILLED"
	} else if order.Side == "SELL" && market.LastPrice <= *order.StopPrice {
		// Stop triggered - execute as market order
		executeAgainstBids(market, order)
		order.Status = "FILLED"
	} else {
		// Stop not triggered - store for later
		order.Status = "PENDING"
	}

	order.LastModified = time.Now().Unix()
	market.Orders[order.ID] = order
}

func processStopLimitOrder(market *Market, order *Order) {
	market.mu.Lock()
	defer market.mu.Unlock()

	// Check if stop is triggered
	if order.Side == "BUY" && market.LastPrice >= *order.StopPrice {
		// Stop triggered - execute as limit order
		executeAgainstAsks(market, order)
		if order.LeavesQty > 0 {
			insertBid(market, order)
			if order.FilledQty > 0 {
				order.Status = "PARTIAL"
			} else {
				order.Status = "NEW"
			}
		} else {
			order.Status = "FILLED"
		}
	} else if order.Side == "SELL" && market.LastPrice <= *order.StopPrice {
		// Stop triggered - execute as limit order
		executeAgainstBids(market, order)
		if order.LeavesQty > 0 {
			insertAsk(market, order)
			if order.FilledQty > 0 {
				order.Status = "PARTIAL"
			} else {
				order.Status = "NEW"
			}
		} else {
			order.Status = "FILLED"
		}
	} else {
		// Stop not triggered - store for later
		order.Status = "PENDING"
	}

	order.LastModified = time.Now().Unix()
	market.Orders[order.ID] = order
}

func processTrailingStopOrder(market *Market, order *Order) {
	market.mu.Lock()
	defer market.mu.Unlock()

	// Calculate trailing stop price
	trailingAmount := market.LastPrice * (*order.TrailingPercent / 100)
	var stopPrice float64
	if order.Side == "BUY" {
		stopPrice = market.LastPrice - trailingAmount
	} else {
		stopPrice = market.LastPrice + trailingAmount
	}

	// Check if trailing stop is triggered
	if order.Side == "BUY" && market.LastPrice <= stopPrice {
		executeAgainstAsks(market, order)
		order.Status = "FILLED"
	} else if order.Side == "SELL" && market.LastPrice >= stopPrice {
		executeAgainstBids(market, order)
		order.Status = "FILLED"
	} else {
		// Update stop price and store for later
		order.StopPrice = &stopPrice
		order.Status = "PENDING"
	}

	order.LastModified = time.Now().Unix()
	market.Orders[order.ID] = order
}

func processTrailingStopLimitOrder(market *Market, order *Order) {
	market.mu.Lock()
	defer market.mu.Unlock()

	// Calculate trailing stop price
	trailingAmount := market.LastPrice * (*order.TrailingPercent / 100)
	var stopPrice float64
	if order.Side == "BUY" {
		stopPrice = market.LastPrice - trailingAmount
	} else {
		stopPrice = market.LastPrice + trailingAmount
	}

	// Check if trailing stop is triggered
	if order.Side == "BUY" && market.LastPrice <= stopPrice {
		executeAgainstAsks(market, order)
		if order.LeavesQty > 0 {
			insertBid(market, order)
			if order.FilledQty > 0 {
				order.Status = "PARTIAL"
			} else {
				order.Status = "NEW"
			}
		} else {
			order.Status = "FILLED"
		}
	} else if order.Side == "SELL" && market.LastPrice >= stopPrice {
		executeAgainstBids(market, order)
		if order.LeavesQty > 0 {
			insertAsk(market, order)
			if order.FilledQty > 0 {
				order.Status = "PARTIAL"
			} else {
				order.Status = "NEW"
			}
		} else {
			order.Status = "FILLED"
		}
	} else {
		// Update stop price and store for later
		order.StopPrice = &stopPrice
		order.Status = "PENDING"
	}

	order.LastModified = time.Now().Unix()
	market.Orders[order.ID] = order
}

func executeAgainstAsks(market *Market, order *Order) {
	log.Printf("🔍 Executing BUY order against %d asks", len(market.Asks))
	
	for i := 0; i < len(market.Asks) && order.LeavesQty > 0; i++ {
		ask := market.Asks[i]
		if ask.LeavesQty == 0 {
			continue
		}

		log.Printf("💰 Checking ask: price=%f, qty=%d", *ask.LimitPrice, ask.LeavesQty)

		// Check if we can trade
		if order.LimitPrice != nil && *order.LimitPrice < *ask.LimitPrice {
			log.Printf("❌ Order limit price %f < ask price %f, stopping", *order.LimitPrice, *ask.LimitPrice)
			break
		}

		// Execute trade
		tradeQty := min(order.LeavesQty, ask.LeavesQty)
		tradePrice := *ask.LimitPrice

		log.Printf("✅ Executing trade: %d shares @ $%f", tradeQty, tradePrice)

		// Update orders
		order.FilledQty += tradeQty
		order.LeavesQty -= tradeQty
		ask.FilledQty += tradeQty
		ask.LeavesQty -= tradeQty

		// Update average price
		if order.AvgPrice == nil {
			order.AvgPrice = &tradePrice
		} else {
			totalValue := float64(order.FilledQty-tradeQty)**order.AvgPrice + float64(tradeQty)*tradePrice
			newAvg := totalValue / float64(order.FilledQty)
			order.AvgPrice = &newAvg
		}

		// Add execution log
		execution := Execution{
			Timestamp: time.Now().Unix(),
			Price:     tradePrice,
			Qty:       tradeQty,
			Venue:     "SIMX",
			OrderBookSnapshot: &OrderBookSnapshot{
				Symbol:    market.Symbol,
				Timestamp: time.Now().Unix(),
				LastPrice: &tradePrice,
			},
		}
		order.ExecutionLog = append(order.ExecutionLog, execution)

		// Update market
		market.LastPrice = tradePrice
		market.LastTrade = time.Now()
		market.Volume += tradeQty

		// Update ask order status
		if ask.LeavesQty == 0 {
			ask.Status = "FILLED"
		} else {
			ask.Status = "PARTIAL"
		}
		ask.LastModified = time.Now().Unix()
	}

	// Remove filled asks from book
	market.Asks = filterActiveOrders(market.Asks)
}

func executeAgainstBids(market *Market, order *Order) {
	for i := 0; i < len(market.Bids) && order.LeavesQty > 0; i++ {
		bid := market.Bids[i]
		if bid.LeavesQty == 0 {
			continue
		}

		// Check if we can trade
		if order.LimitPrice != nil && *order.LimitPrice > *bid.LimitPrice {
			break
		}

		// Execute trade
		tradeQty := min(order.LeavesQty, bid.LeavesQty)
		tradePrice := *bid.LimitPrice

		// Update orders
		order.FilledQty += tradeQty
		order.LeavesQty -= tradeQty
		bid.FilledQty += tradeQty
		bid.LeavesQty -= tradeQty

		// Update average price
		if order.AvgPrice == nil {
			order.AvgPrice = &tradePrice
		} else {
			totalValue := float64(order.FilledQty-tradeQty)**order.AvgPrice + float64(tradeQty)*tradePrice
			newAvg := totalValue / float64(order.FilledQty)
			order.AvgPrice = &newAvg
		}

		// Add execution log
		execution := Execution{
			Timestamp: time.Now().Unix(),
			Price:     tradePrice,
			Qty:       tradeQty,
			Venue:     "SIMX",
			OrderBookSnapshot: &OrderBookSnapshot{
				Symbol:    market.Symbol,
				Timestamp: time.Now().Unix(),
				LastPrice: &tradePrice,
			},
		}
		order.ExecutionLog = append(order.ExecutionLog, execution)

		// Update market
		market.LastPrice = tradePrice
		market.LastTrade = time.Now()
		market.Volume += tradeQty

		// Update bid order status
		if bid.LeavesQty == 0 {
			bid.Status = "FILLED"
		} else {
			bid.Status = "PARTIAL"
		}
		bid.LastModified = time.Now().Unix()
	}

	// Remove filled bids from book
	market.Bids = filterActiveOrders(market.Bids)
}

func insertBid(market *Market, order *Order) {
	// Insert in price-time priority (highest price first, then earliest time)
	for i, bid := range market.Bids {
		if *order.LimitPrice > *bid.LimitPrice {
			market.Bids = append(market.Bids[:i], append([]*Order{order}, market.Bids[i:]...)...)
			return
		}
	}
	market.Bids = append(market.Bids, order)
}

func insertAsk(market *Market, order *Order) {
	// Insert in price-time priority (lowest price first, then earliest time)
	for i, ask := range market.Asks {
		if *order.LimitPrice < *ask.LimitPrice {
			market.Asks = append(market.Asks[:i], append([]*Order{order}, market.Asks[i:]...)...)
			return
		}
	}
	market.Asks = append(market.Asks, order)
}

func filterActiveOrders(orders []*Order) []*Order {
	active := make([]*Order, 0)
	for _, order := range orders {
		if order.LeavesQty > 0 {
			active = append(active, order)
		}
	}
	return active
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func addInitialMarketMaking(market *Market) {
	// Add 3-5 initial bids and asks
	numBids := 3 + rand.Intn(3) // 3-5 bids
	numAsks := 3 + rand.Intn(3) // 3-5 asks
	
	for i := 0; i < numBids; i++ {
		bidPrice := market.LastPrice * (1 - float64(i+1)*0.005) // 0.5%, 1%, 1.5% below
		bidQty := 100 + rand.Intn(900) // 100-1000 shares
		
		bidOrder := &Order{
			ID:         fmt.Sprintf("init_bid_%d_%d", time.Now().UnixNano(), i),
			Symbol:     market.Symbol,
			Side:       "BUY",
			OrderType:  "LIMIT",
			Qty:        bidQty,
			LimitPrice: &bidPrice,
			TIF:        "DAY",
			Status:     "NEW",
			FilledQty:  0,
			LeavesQty:  bidQty,
			CreatedAt:  time.Now().Unix(),
			LastModified: time.Now().Unix(),
		}
		
		insertBid(market, bidOrder)
		market.Orders[bidOrder.ID] = bidOrder
		log.Printf("🎯 Added initial bid: %s %d @ $%f", market.Symbol, bidQty, bidPrice)
	}
	
	for i := 0; i < numAsks; i++ {
		askPrice := market.LastPrice * (1 + float64(i+1)*0.005) // 0.5%, 1%, 1.5% above
		askQty := 100 + rand.Intn(900) // 100-1000 shares
		
		askOrder := &Order{
			ID:         fmt.Sprintf("init_ask_%d_%d", time.Now().UnixNano(), i),
			Symbol:     market.Symbol,
			Side:       "SELL",
			OrderType:  "LIMIT",
			Qty:        askQty,
			LimitPrice: &askPrice,
			TIF:        "DAY",
			Status:     "NEW",
			FilledQty:  0,
			LeavesQty:  askQty,
			CreatedAt:  time.Now().Unix(),
			LastModified: time.Now().Unix(),
		}
		
		insertAsk(market, askOrder)
		market.Orders[askOrder.ID] = askOrder
		log.Printf("🎯 Added initial ask: %s %d @ $%f", market.Symbol, askQty, askPrice)
	}
}

func sendExecutionCallback(order Order) {
	if order.CallbackURL == "" {
		return
	}

	log.Printf("📤 Sending execution callback for order: %s", order.ID)

	// Prepare execution report
	execReport := map[string]interface{}{
		"order_id": order.ID,
		"venue":    "SIMX",
		"status":   order.Status,
		"message":  "",
	}

	if len(order.ExecutionLog) > 0 {
		lastExec := order.ExecutionLog[len(order.ExecutionLog)-1]
		execReport["price"] = lastExec.Price
		execReport["qty"] = lastExec.Qty
		execReport["execution_time"] = lastExec.Timestamp
		execReport["order_book_snapshot"] = lastExec.OrderBookSnapshot
	} else {
		// For market orders that are filled but have no executions, use the order details
		if order.Status == "FILLED" && order.AvgPrice != nil {
			execReport["price"] = *order.AvgPrice
			execReport["qty"] = order.FilledQty
			execReport["execution_time"] = order.LastModified
			log.Printf("⚠️ Using order details for execution: price=%f, qty=%d", *order.AvgPrice, order.FilledQty)
		} else {
			log.Printf("❌ No execution details available for order: %s", order.ID)
			return
		}
	}

	// Send callback
	jsonData, _ := json.Marshal(execReport)
	http.Post(order.CallbackURL, "application/json", bytes.NewBuffer(jsonData))
}

func startMarketMaking() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		exchange.mu.RLock()
		for symbol, market := range exchange.Markets {
			// Simulate market making activity
			go simulateMarketMaking(symbol, market)
		}
		exchange.mu.RUnlock()
	}
}

func simulateMarketMaking(symbol string, market *Market) {
	market.mu.Lock()
	defer market.mu.Unlock()

	// Add some random market making orders
	if rand.Float64() < 0.3 { // 30% chance
		// Add a bid
		bidPrice := market.LastPrice * (1 - rand.Float64()*0.01) // 0-1% below last price
		bidQty := 100 + rand.Intn(900) // 100-1000 shares
		
		bidOrder := &Order{
			ID:         fmt.Sprintf("mm_bid_%d", time.Now().UnixNano()),
			Symbol:     symbol,
			Side:       "BUY",
			OrderType:  "LIMIT",
			Qty:        bidQty,
			LimitPrice: &bidPrice,
			TIF:        "DAY",
			Status:     "NEW",
			FilledQty:  0,
			LeavesQty:  bidQty,
			CreatedAt:  time.Now().Unix(),
			LastModified: time.Now().Unix(),
		}
		
		insertBid(market, bidOrder)
		market.Orders[bidOrder.ID] = bidOrder
		log.Printf("📈 Added market making bid: %s %d @ $%f", symbol, bidQty, bidPrice)
	}

	if rand.Float64() < 0.3 { // 30% chance
		// Add an ask
		askPrice := market.LastPrice * (1 + rand.Float64()*0.01) // 0-1% above last price
		askQty := 100 + rand.Intn(900) // 100-1000 shares
		
		askOrder := &Order{
			ID:         fmt.Sprintf("mm_ask_%d", time.Now().UnixNano()),
			Symbol:     symbol,
			Side:       "SELL",
			OrderType:  "LIMIT",
			Qty:        askQty,
			LimitPrice: &askPrice,
			TIF:        "DAY",
			Status:     "NEW",
			FilledQty:  0,
			LeavesQty:  askQty,
			CreatedAt:  time.Now().Unix(),
			LastModified: time.Now().Unix(),
		}
		
		insertAsk(market, askOrder)
		market.Orders[askOrder.ID] = askOrder
		log.Printf("📉 Added market making ask: %s %d @ $%f", symbol, askQty, askPrice)
	}

	// Simulate some price movement
	if rand.Float64() < 0.1 { // 10% chance
		movement := (rand.Float64() - 0.5) * 0.02 // ±1% movement
		market.LastPrice *= (1 + movement)
	}
}

func startStopOrderMonitoring() {
	ticker := time.NewTicker(1 * time.Second) // Check every second
	defer ticker.Stop()

	for range ticker.C {
		exchange.mu.RLock()
		for symbol, market := range exchange.Markets {
			// Check pending stop orders
			go checkStopOrders(symbol, market)
		}
		exchange.mu.RUnlock()
	}
}

func checkStopOrders(symbol string, market *Market) {
	market.mu.Lock()
	defer market.mu.Unlock()

	// Find pending stop orders
	for _, order := range market.Orders {
		if order.Status != "PENDING" {
			continue
		}

		var shouldTrigger bool
		var triggerReason string

		switch order.OrderType {
		case "STOP":
			shouldTrigger, triggerReason = checkStopOrderTrigger(order, market.LastPrice)
		case "STOP_LIMIT":
			shouldTrigger, triggerReason = checkStopLimitOrderTrigger(order, market.LastPrice)
		case "TRAILING_STOP":
			shouldTrigger, triggerReason = checkTrailingStopOrderTrigger(order, market.LastPrice)
		case "TRAILING_STOP_LIMIT":
			shouldTrigger, triggerReason = checkTrailingStopLimitOrderTrigger(order, market.LastPrice)
		}

		if shouldTrigger {
			log.Printf("Stop order triggered: %s %s %s at price %.2f - %s", 
				order.Symbol, order.Side, order.OrderType, market.LastPrice, triggerReason)
			
			// Process the triggered order
			processTriggeredOrder(market, order)
		}
	}
}

func checkStopOrderTrigger(order *Order, currentPrice float64) (bool, string) {
	if order.StopPrice == nil {
		return false, "no stop price set"
	}

	if order.Side == "BUY" && currentPrice >= *order.StopPrice {
		return true, fmt.Sprintf("BUY stop triggered: current price %.2f >= stop price %.2f", currentPrice, *order.StopPrice)
	} else if order.Side == "SELL" && currentPrice <= *order.StopPrice {
		return true, fmt.Sprintf("SELL stop triggered: current price %.2f <= stop price %.2f", currentPrice, *order.StopPrice)
	}

	return false, ""
}

func checkStopLimitOrderTrigger(order *Order, currentPrice float64) (bool, string) {
	if order.StopPrice == nil {
		return false, "no stop price set"
	}

	if order.Side == "BUY" && currentPrice >= *order.StopPrice {
		return true, fmt.Sprintf("BUY stop-limit triggered: current price %.2f >= stop price %.2f", currentPrice, *order.StopPrice)
	} else if order.Side == "SELL" && currentPrice <= *order.StopPrice {
		return true, fmt.Sprintf("SELL stop-limit triggered: current price %.2f <= stop price %.2f", currentPrice, *order.StopPrice)
	}

	return false, ""
}

func checkTrailingStopOrderTrigger(order *Order, currentPrice float64) (bool, string) {
	if order.TrailingPercent == nil || order.StopPrice == nil {
		return false, "missing trailing parameters"
	}

	trailingAmount := currentPrice * (*order.TrailingPercent / 100)
	var stopPrice float64

	if order.Side == "BUY" {
		stopPrice = currentPrice - trailingAmount
		if currentPrice <= stopPrice {
			return true, fmt.Sprintf("BUY trailing stop triggered: current price %.2f <= trailing stop %.2f", currentPrice, stopPrice)
		}
	} else {
		stopPrice = currentPrice + trailingAmount
		if currentPrice >= stopPrice {
			return true, fmt.Sprintf("SELL trailing stop triggered: current price %.2f >= trailing stop %.2f", currentPrice, stopPrice)
		}
	}

	// Update the trailing stop price
	order.StopPrice = &stopPrice
	return false, ""
}

func checkTrailingStopLimitOrderTrigger(order *Order, currentPrice float64) (bool, string) {
	if order.TrailingPercent == nil || order.StopPrice == nil {
		return false, "missing trailing parameters"
	}

	trailingAmount := currentPrice * (*order.TrailingPercent / 100)
	var stopPrice float64

	if order.Side == "BUY" {
		stopPrice = currentPrice - trailingAmount
		if currentPrice <= stopPrice {
			return true, fmt.Sprintf("BUY trailing stop-limit triggered: current price %.2f <= trailing stop %.2f", currentPrice, stopPrice)
		}
	} else {
		stopPrice = currentPrice + trailingAmount
		if currentPrice >= stopPrice {
			return true, fmt.Sprintf("SELL trailing stop-limit triggered: current price %.2f >= trailing stop %.2f", currentPrice, stopPrice)
		}
	}

	// Update the trailing stop price
	order.StopPrice = &stopPrice
	return false, ""
}

func processTriggeredOrder(market *Market, order *Order) {
	order.Status = "TRIGGERED"
	order.LastModified = time.Now().Unix()

	switch order.OrderType {
	case "STOP":
		// Execute as market order
		if order.Side == "BUY" {
			executeAgainstAsks(market, order)
		} else {
			executeAgainstBids(market, order)
		}
		order.Status = "FILLED"

	case "STOP_LIMIT":
		// Execute as limit order
		if order.Side == "BUY" {
			executeAgainstAsks(market, order)
		} else {
			executeAgainstBids(market, order)
		}
		
		if order.LeavesQty > 0 {
			if order.Side == "BUY" {
				insertBid(market, order)
			} else {
				insertAsk(market, order)
			}
			if order.FilledQty > 0 {
				order.Status = "PARTIAL"
			} else {
				order.Status = "NEW"
			}
		} else {
			order.Status = "FILLED"
		}

	case "TRAILING_STOP":
		// Execute as market order
		if order.Side == "BUY" {
			executeAgainstAsks(market, order)
		} else {
			executeAgainstBids(market, order)
		}
		order.Status = "FILLED"

	case "TRAILING_STOP_LIMIT":
		// Execute as limit order
		if order.Side == "BUY" {
			executeAgainstAsks(market, order)
		} else {
			executeAgainstBids(market, order)
		}
		
		if order.LeavesQty > 0 {
			if order.Side == "BUY" {
				insertBid(market, order)
			} else {
				insertAsk(market, order)
			}
			if order.FilledQty > 0 {
				order.Status = "PARTIAL"
			} else {
				order.Status = "NEW"
			}
		} else {
			order.Status = "FILLED"
		}
	}

	// Send execution callback
	go sendExecutionCallback(*order)
}
