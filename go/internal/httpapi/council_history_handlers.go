package httpapi

import (
	"net/http"
	"strconv"
	"strings"
)

func (s *Server) handleCouncilHistoryStatus(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodGet, "council.history.status", nil)
}

func (s *Server) handleCouncilHistoryConfig(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.handleTRPCBridgeCall(w, r, http.MethodGet, "council.history.getConfig", nil)
	case http.MethodPost:
		s.handleTRPCBridgeBodyCall(w, r, "council.history.updateConfig")
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error": "method not allowed"})
	}
}

func (s *Server) handleCouncilHistoryToggle(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeBodyCall(w, r, "council.history.toggle")
}

func (s *Server) handleCouncilHistoryStats(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodGet, "council.history.stats", nil)
}

func (s *Server) handleCouncilHistoryList(w http.ResponseWriter, r *http.Request) {
	payload := map[string]any{}
	if sessionID := strings.TrimSpace(r.URL.Query().Get("sessionId")); sessionID != "" {
		payload["sessionId"] = sessionID
	}
	if taskType := strings.TrimSpace(r.URL.Query().Get("taskType")); taskType != "" {
		payload["taskType"] = taskType
	}
	if supervisorName := strings.TrimSpace(r.URL.Query().Get("supervisorName")); supervisorName != "" {
		payload["supervisorName"] = supervisorName
	}
	if approved := strings.TrimSpace(r.URL.Query().Get("approved")); approved != "" {
		if parsed, err := strconv.ParseBool(approved); err == nil {
			payload["approved"] = parsed
		}
	}
	if fromTimestamp := strings.TrimSpace(r.URL.Query().Get("fromTimestamp")); fromTimestamp != "" {
		if parsed, err := strconv.Atoi(fromTimestamp); err == nil {
			payload["fromTimestamp"] = parsed
		}
	}
	if toTimestamp := strings.TrimSpace(r.URL.Query().Get("toTimestamp")); toTimestamp != "" {
		if parsed, err := strconv.Atoi(toTimestamp); err == nil {
			payload["toTimestamp"] = parsed
		}
	}
	if minConsensus := strings.TrimSpace(r.URL.Query().Get("minConsensus")); minConsensus != "" {
		if parsed, err := strconv.ParseFloat(minConsensus, 64); err == nil {
			payload["minConsensus"] = parsed
		}
	}
	if maxConsensus := strings.TrimSpace(r.URL.Query().Get("maxConsensus")); maxConsensus != "" {
		if parsed, err := strconv.ParseFloat(maxConsensus, 64); err == nil {
			payload["maxConsensus"] = parsed
		}
	}
	if limit := strings.TrimSpace(r.URL.Query().Get("limit")); limit != "" {
		if parsed, err := strconv.Atoi(limit); err == nil {
			payload["limit"] = parsed
		}
	}
	if offset := strings.TrimSpace(r.URL.Query().Get("offset")); offset != "" {
		if parsed, err := strconv.Atoi(offset); err == nil {
			payload["offset"] = parsed
		}
	}
	if sortBy := strings.TrimSpace(r.URL.Query().Get("sortBy")); sortBy != "" {
		payload["sortBy"] = sortBy
	}
	if sortOrder := strings.TrimSpace(r.URL.Query().Get("sortOrder")); sortOrder != "" {
		payload["sortOrder"] = sortOrder
	}
	if len(payload) == 0 {
		s.handleTRPCBridgeCall(w, r, http.MethodGet, "council.history.list", nil)
		return
	}
	s.handleTRPCBridgeCall(w, r, http.MethodGet, "council.history.list", payload)
}

func (s *Server) handleCouncilHistoryGet(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.URL.Query().Get("id"))
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "error": "missing id query parameter"})
		return
	}
	s.handleTRPCBridgeCall(w, r, http.MethodGet, "council.history.get", map[string]any{"id": id})
}

func (s *Server) handleCouncilHistoryDelete(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeBodyCall(w, r, "council.history.delete")
}

func (s *Server) handleCouncilHistorySupervisor(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimSpace(r.URL.Query().Get("name"))
	if name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "error": "missing name query parameter"})
		return
	}
	s.handleTRPCBridgeCall(w, r, http.MethodGet, "council.history.supervisorHistory", map[string]any{"name": name})
}

func (s *Server) handleCouncilHistoryClear(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodPost, "council.history.clear", nil)
}

func (s *Server) handleCouncilHistoryInitialize(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodPost, "council.history.initialize", nil)
}
