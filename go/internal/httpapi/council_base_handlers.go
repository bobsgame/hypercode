package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/hypercodehq/hypercode-go/internal/orchestration"
)

func (s *Server) handleCouncilBaseStatus(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodGet, "council.status", nil)
}

func (s *Server) handleCouncilBaseUpdateConfig(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeBodyCall(w, r, "council.updateConfig")
}

func (s *Server) handleCouncilBaseAddSupervisors(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeBodyCall(w, r, "council.addSupervisors")
}

func (s *Server) handleCouncilBaseClearSupervisors(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodPost, "council.clearSupervisors", nil)
}

func (s *Server) handleCouncilBaseDebate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error": "method not allowed"})
		return
	}

	var payload struct {
		Objective string `json:"objective"`
		Context   string `json:"context"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "error": "invalid JSON body"})
		return
	}

	var result any
	upstreamBase, err := s.callUpstreamJSON(r.Context(), "council.debate", payload, &result)
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
			"data":    result,
			"bridge": map[string]any{
				"upstreamBase": upstreamBase,
				"procedure":    "council.debate",
			},
		})
		return
	}

	debateRes, fallbackErr := orchestration.RunDebate(r.Context(), payload.Objective, payload.Context)
	if fallbackErr != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{
			"success": false,
			"error":   fallbackErr.Error(),
			"detail":  fallbackErr.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    debateRes,
		"bridge": map[string]any{
			"fallback":  "go-local-council-debate",
			"procedure": "council.debate",
			"reason":    "upstream unavailable; executing native Go multi-agent debate loop",
		},
	})
}

func (s *Server) handleCouncilBaseToggle(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodPost, "council.toggle", nil)
}

func (s *Server) handleCouncilBaseAddMock(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodPost, "council.addMock", nil)
}
