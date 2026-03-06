package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Client represents a WebSocket client
type Client struct {
	conn     *websocket.Conn
	send     chan []byte
	matchID  string
	username string
}

// Hub maintains active clients and broadcasts messages
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	matches    map[string]*MatchState // Track match states
	mu         sync.RWMutex
}

// MatchState tracks the current state of a match
type MatchState struct {
	MatchID       string         `json:"matchId"`
	Status        string         `json:"status"` // "live", "finished", "cancelled"
	LastUpdate    time.Time      `json:"lastUpdate"`
	Analysis      *MatchAnalysis `json:"analysis,omitempty"`
	FinishedAt    *time.Time     `json:"finishedAt,omitempty"`
	ExpiresAt     *time.Time     `json:"expiresAt,omitempty"` // 1 hour after finish
	Score         MatchScore     `json:"score"`
	Subscribers   int            `json:"subscribers"`
}

// MatchScore tracks live score
type MatchScore struct {
	Team1 int `json:"team1"`
	Team2 int `json:"team2"`
}

// WSMessage represents WebSocket message structure
type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// Global hub instance
var hub *Hub

// InitWebSocket initializes the WebSocket hub
func InitWebSocket() {
	hub = &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		matches:    make(map[string]*MatchState),
	}
	go hub.run()
	go hub.cleanupExpiredMatches()
	fmt.Println("🔌 WebSocket hub initialized")
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			// Update subscriber count
			if state, ok := h.matches[client.matchID]; ok {
				state.Subscribers++
			}
			h.mu.Unlock()
			fmt.Printf("[WS] Client connected for match: %s\n", client.matchID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				// Update subscriber count
				if state, ok := h.matches[client.matchID]; ok {
					state.Subscribers--
				}
			}
			h.mu.Unlock()
			fmt.Printf("[WS] Client disconnected\n")

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// cleanupExpiredMatches removes matches 1 hour after completion
func (h *Hub) cleanupExpiredMatches() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		h.mu.Lock()
		now := time.Now()
		for id, state := range h.matches {
			if state.ExpiresAt != nil && now.After(*state.ExpiresAt) {
				delete(h.matches, id)
				fmt.Printf("[WS] Deleted expired match: %s\n", id)
				
				// Notify clients
				msg := WSMessage{
					Type: "match_expired",
					Payload: map[string]string{
						"matchId": id,
						"message": "Match data has expired and been deleted",
					},
				}
				data, _ := json.Marshal(msg)
				h.broadcast <- data
			}
		}
		h.mu.Unlock()
	}
}

// BroadcastToMatch sends a message to all clients watching a specific match
func (h *Hub) BroadcastToMatch(matchID string, msg WSMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	
	h.mu.RLock()
	defer h.mu.RUnlock()
	
	for client := range h.clients {
		if client.matchID == matchID {
			select {
			case client.send <- data:
			default:
			}
		}
	}
}

// UpdateMatchState updates and broadcasts match state
func (h *Hub) UpdateMatchState(matchID string, analysis *MatchAnalysis, status string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	
	now := time.Now()
	state, exists := h.matches[matchID]
	
	if !exists {
		state = &MatchState{
			MatchID: matchID,
		}
		h.matches[matchID] = state
	}
	
	state.Analysis = analysis
	state.Status = status
	state.LastUpdate = now
	
	if status == "finished" && state.FinishedAt == nil {
		state.FinishedAt = &now
		expires := now.Add(1 * time.Hour)
		state.ExpiresAt = &expires
	}
	
	// Broadcast update
	msg := WSMessage{
		Type:    "match_update",
		Payload: state,
	}
	data, _ := json.Marshal(msg)
	
	for client := range h.clients {
		if client.matchID == matchID {
			select {
			case client.send <- data:
			default:
			}
		}
	}
}

// HandleWebSocket upgrades HTTP to WebSocket
func HandleWebSocket(c *gin.Context) {
	matchID := c.Query("matchId")
	username := c.Query("username")
	
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Printf("[WS] Upgrade error: %v\n", err)
		return
	}
	
	client := &Client{
		conn:     conn,
		send:     make(chan []byte, 256),
		matchID:  matchID,
		username: username,
	}
	
	hub.register <- client
	
	// Send current match state if exists
	hub.mu.RLock()
	if state, ok := hub.matches[matchID]; ok {
		msg := WSMessage{
			Type:    "match_state",
			Payload: state,
		}
		data, _ := json.Marshal(msg)
		client.send <- data
	}
	hub.mu.RUnlock()
	
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		hub.unregister <- c
		c.conn.Close()
	}()
	
	c.conn.SetReadLimit(512 * 1024)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		
		// Handle incoming messages
		var msg WSMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}
		
		switch msg.Type {
		case "ping":
			response := WSMessage{Type: "pong", Payload: time.Now().Unix()}
			data, _ := json.Marshal(response)
			c.send <- data
			
		case "subscribe":
			if payload, ok := msg.Payload.(map[string]interface{}); ok {
				if matchID, ok := payload["matchId"].(string); ok {
					c.matchID = matchID
					fmt.Printf("[WS] Client subscribed to match: %s\n", matchID)
				}
			}
			
		case "request_refresh":
			// Client requests a refresh
			if c.matchID != "" {
				hub.mu.RLock()
				if state, ok := hub.matches[c.matchID]; ok {
					response := WSMessage{Type: "match_state", Payload: state}
					data, _ := json.Marshal(response)
					c.send <- data
				}
				hub.mu.RUnlock()
			}
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)
			
			if err := w.Close(); err != nil {
				return
			}
			
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// GetMatchState returns current match state for download
func GetMatchState(matchID string) *MatchState {
	hub.mu.RLock()
	defer hub.mu.RUnlock()
	
	if state, ok := hub.matches[matchID]; ok {
		return state
	}
	return nil
}
