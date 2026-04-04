package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"
)

func (s *Server) handleSquadList(w http.ResponseWriter, r *http.Request) {
	var result any
	upstreamBase, err := s.callUpstreamJSON(r.Context(), "squad.list", nil, &result)
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
			"data":    result,
			"bridge": map[string]any{
				"upstreamBase": upstreamBase,
				"procedure":    "squad.list",
			},
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    s.squadState.listMembers(),
		"bridge": map[string]any{
			"fallback":  "go-local-squad",
			"procedure": "squad.list",
			"reason":    "upstream unavailable; using native Go squad state",
		},
	})
}

func (s *Server) handleSquadSpawn(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error": "method not allowed"})
		return
	}
	var payload map[string]any
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "error": "invalid JSON body"})
		return
	}
	var result any
	upstreamBase, err := s.callUpstreamJSON(r.Context(), "squad.spawn", payload, &result)
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
			"data":    result,
			"bridge": map[string]any{
				"upstreamBase": upstreamBase,
				"procedure":    "squad.spawn",
			},
		})
		return
	}
	branch := strings.TrimSpace(stringValue(payload["branch"]))
	goal := strings.TrimSpace(stringValue(payload["goal"]))
	if branch == "" || goal == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "error": "missing branch or goal"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    s.squadState.spawnMember(branch, goal),
		"bridge": map[string]any{
			"fallback":  "go-local-squad",
			"procedure": "squad.spawn",
			"reason":    "upstream unavailable; using native Go squad state",
		},
	})
}

func (s *Server) handleSquadKill(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error": "method not allowed"})
		return
	}
	var payload map[string]any
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "error": "invalid JSON body"})
		return
	}
	var result any
	upstreamBase, err := s.callUpstreamJSON(r.Context(), "squad.kill", payload, &result)
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
			"data":    result,
			"bridge": map[string]any{
				"upstreamBase": upstreamBase,
				"procedure":    "squad.kill",
			},
		})
		return
	}
	branch := strings.TrimSpace(stringValue(payload["branch"]))
	if branch == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "error": "missing branch"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    s.squadState.killMember(branch),
		"bridge": map[string]any{
			"fallback":  "go-local-squad",
			"procedure": "squad.kill",
			"reason":    "upstream unavailable; using native Go squad state",
		},
	})
}

func (s *Server) handleSquadChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error": "method not allowed"})
		return
	}
	var payload map[string]any
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "error": "invalid JSON body"})
		return
	}
	var result any
	upstreamBase, err := s.callUpstreamJSON(r.Context(), "squad.chat", payload, &result)
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
			"data":    result,
			"bridge": map[string]any{
				"upstreamBase": upstreamBase,
				"procedure":    "squad.chat",
			},
		})
		return
	}
	branch := strings.TrimSpace(stringValue(payload["branch"]))
	message := strings.TrimSpace(stringValue(payload["message"]))
	if branch == "" || message == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "error": "missing branch or message"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    s.squadState.chat(branch, message),
		"bridge": map[string]any{
			"fallback":  "go-local-squad",
			"procedure": "squad.chat",
			"reason":    "upstream unavailable; using native Go squad state",
		},
	})
}

func (s *Server) handleSquadToggleIndexer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error": "method not allowed"})
		return
	}
	var payload map[string]any
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"success": false, "error": "invalid JSON body"})
		return
	}
	var result any
	upstreamBase, err := s.callUpstreamJSON(r.Context(), "squad.toggleIndexer", payload, &result)
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
			"data":    result,
			"bridge": map[string]any{
				"upstreamBase": upstreamBase,
				"procedure":    "squad.toggleIndexer",
			},
		})
		return
	}
	enabled, _ := payload["enabled"].(bool)
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    s.squadState.toggleIndexer(enabled),
		"bridge": map[string]any{
			"fallback":  "go-local-squad",
			"procedure": "squad.toggleIndexer",
			"reason":    "upstream unavailable; using native Go squad state",
		},
	})
}

func (s *Server) handleSquadIndexerStatus(w http.ResponseWriter, r *http.Request) {
	var result any
	upstreamBase, err := s.callUpstreamJSON(r.Context(), "squad.getIndexerStatus", nil, &result)
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"success": true,
			"data":    result,
			"bridge": map[string]any{
				"upstreamBase": upstreamBase,
				"procedure":    "squad.getIndexerStatus",
			},
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    s.squadState.indexerStatus(),
		"bridge": map[string]any{
			"fallback":  "go-local-squad",
			"procedure": "squad.getIndexerStatus",
			"reason":    "upstream unavailable; using native Go squad indexer state",
		},
	})
}
