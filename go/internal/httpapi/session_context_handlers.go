package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/borghq/borg-go/internal/interop"
)

type SessionBootstrapPayload struct {
	Goal                   string `json:"goal,omitempty"`
	Objective              string `json:"objective,omitempty"`
	SummaryCount           int    `json:"summaryCount"`
	ObservationCount       int    `json:"observationCount"`
	ToolAdvertisementCount int    `json:"toolAdvertisementCount"`
	Prompt                 string `json:"prompt"`
}

type SessionContext struct {
	ActiveGoal    string                  `json:"activeGoal,omitempty"`
	LastObjective string                  `json:"lastObjective,omitempty"`
	Startup       StartupStatus           `json:"startup"`
	Bootstrap     SessionBootstrapPayload `json:"bootstrap"`
	ToolAds       any                     `json:"toolAds"`
	Bridge        map[string]any          `json:"bridge"`
}

func (s *Server) handleSessionContext(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error": "method not allowed"})
		return
	}

	activeGoal := strings.TrimSpace(r.URL.Query().Get("activeGoal"))
	lastObjective := strings.TrimSpace(r.URL.Query().Get("lastObjective"))

	startup, err := s.buildStartupStatus(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"success": false, "error": err.Error()})
		return
	}

	bootstrapPayload := map[string]any{}
	if activeGoal != "" {
		bootstrapPayload["activeGoal"] = activeGoal
	}
	if lastObjective != "" {
		bootstrapPayload["lastObjective"] = lastObjective
	}

	var bootstrap SessionBootstrapPayload
	bootstrapBase, err := s.callUpstreamJSON(r.Context(), "memory.getSessionBootstrap", bootstrapPayload, &bootstrap)
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"success": false, "error": err.Error()})
		return
	}

	query := strings.TrimSpace(strings.Join([]string{lastObjective, activeGoal}, " "))
	toolAdsPayload := map[string]any{
		"name": "list_all_tools",
		"args": map[string]any{
			"query": query,
			"limit": 8,
		},
	}
	var toolAds any
	toolAdsBase, err := s.callUpstreamJSON(r.Context(), "mcp.callTool", toolAdsPayload, &toolAds)
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"success": false, "error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data": SessionContext{
			ActiveGoal:    activeGoal,
			LastObjective: lastObjective,
			Startup:       startup,
			Bootstrap:     bootstrap,
			ToolAds:       toolAds,
			Bridge: map[string]any{
				"bootstrap": map[string]any{
					"upstreamBase": bootstrapBase,
					"procedure":    "memory.getSessionBootstrap",
				},
				"toolAds": map[string]any{
					"upstreamBase": toolAdsBase,
					"procedure":    "mcp.callTool",
					"toolName":     "list_all_tools",
				},
			},
		},
	})
}

func (s *Server) callUpstreamJSON(ctx context.Context, procedure string, payload any, target any) (string, error) {
	result, err := interop.CallTRPCProcedure(ctx, s.cfg.MainLockPath(), procedure, payload)
	if err != nil {
		return "", err
	}
	if err := json.Unmarshal(result.Data, target); err != nil {
		return "", err
	}
	return result.BaseURL, nil
}
