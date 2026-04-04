package httpapi

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

type localSwarmTask struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Status   string `json:"status"`
	Priority int    `json:"priority"`
}

type localSwarmMission struct {
	ID             string           `json:"id"`
	Goal           string           `json:"goal"`
	Status         string           `json:"status"`
	Priority       int              `json:"priority"`
	Model          string           `json:"model,omitempty"`
	MaxConcurrency int              `json:"maxConcurrency,omitempty"`
	Tools          []string         `json:"tools,omitempty"`
	CreatedAt      int64            `json:"createdAt"`
	UpdatedAt      int64            `json:"updatedAt"`
	Tasks          []localSwarmTask `json:"tasks"`
}

type persistedSwarmState struct {
	NextID   int64               `json:"nextId"`
	Missions []localSwarmMission `json:"missions"`
}

type localSwarmStateManager struct {
	mu          sync.RWMutex
	persistPath string
	nextID      int64
	missions    []localSwarmMission
}

func newLocalSwarmStateManager(persistPath string) *localSwarmStateManager {
	m := &localSwarmStateManager{
		persistPath: persistPath,
		nextID:      1,
		missions:    []localSwarmMission{},
	}
	m.load()
	return m
}

func (m *localSwarmStateManager) startMission(payload map[string]any) map[string]any {
	m.mu.Lock()
	defer m.mu.Unlock()
	goal := strings.TrimSpace(stringValue(payload["masterPrompt"]))
	if goal == "" {
		goal = "Untitled local swarm mission"
	}
	priority := intNumber(payload["priority"])
	if priority <= 0 {
		priority = 3
	}
	maxConcurrency := intNumber(payload["maxConcurrency"])
	if maxConcurrency <= 0 {
		maxConcurrency = 3
	}
	model := strings.TrimSpace(stringValue(payload["model"]))
	tools := stringArray(payload["tools"])
	now := time.Now().UTC().UnixMilli()
	missionID := fmt.Sprintf("mission-%d", m.nextID)
	m.nextID++
	mission := localSwarmMission{
		ID:             missionID,
		Goal:           goal,
		Status:         "active",
		Priority:       priority,
		Model:          model,
		MaxConcurrency: maxConcurrency,
		Tools:          append([]string(nil), tools...),
		CreatedAt:      now,
		UpdatedAt:      now,
		Tasks: []localSwarmTask{
			{ID: missionID + "-task-1", Title: "Analyze objective", Status: "completed", Priority: priority},
			{ID: missionID + "-task-2", Title: "Implement candidate plan", Status: "active", Priority: priority},
			{ID: missionID + "-task-3", Title: "Verify and summarize", Status: "pending", Priority: priority},
		},
	}
	m.missions = append([]localSwarmMission{mission}, m.missions...)
	m.saveLocked()
	return map[string]any{
		"missionId": missionID,
		"taskCount": len(mission.Tasks),
	}
}

func (m *localSwarmStateManager) resumeMission(missionID string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	for i := range m.missions {
		if m.missions[i].ID != missionID {
			continue
		}
		m.missions[i].Status = "active"
		m.missions[i].UpdatedAt = time.Now().UTC().UnixMilli()
		m.saveLocked()
		return true
	}
	return false
}

func (m *localSwarmStateManager) missionHistory() []map[string]any {
	m.mu.RLock()
	defer m.mu.RUnlock()
	result := make([]map[string]any, 0, len(m.missions))
	for _, mission := range m.sortedMissionsLocked() {
		result = append(result, mission.toMap())
	}
	return result
}

func (m *localSwarmStateManager) missionRiskSummary() map[string]any {
	m.mu.RLock()
	defer m.mu.RUnlock()
	missions := m.sortedMissionsLocked()
	total := len(missions)
	if total == 0 {
		return map[string]any{"missionCount": 0, "averageRisk": 0, "activeMissions": 0, "topRiskMission": nil}
	}
	totalRisk := 0.0
	active := 0
	var top map[string]any
	maxRisk := -1.0
	for _, mission := range missions {
		risk := mission.riskScore()
		totalRisk += risk
		if mission.Status == "active" {
			active++
		}
		if risk > maxRisk {
			maxRisk = risk
			top = map[string]any{"missionId": mission.ID, "goal": mission.Goal, "missionRiskScore": risk}
		}
	}
	return map[string]any{
		"missionCount":   total,
		"averageRisk":    totalRisk / float64(total),
		"activeMissions": active,
		"topRiskMission": top,
	}
}

func (m *localSwarmStateManager) missionRiskRows(statusFilter string, minRisk float64, limit int) []map[string]any {
	m.mu.RLock()
	defer m.mu.RUnlock()
	rows := make([]map[string]any, 0)
	filter := strings.TrimSpace(strings.ToLower(statusFilter))
	for _, mission := range m.sortedMissionsLocked() {
		if filter != "" && strings.ToLower(mission.Status) != filter {
			continue
		}
		risk := mission.riskScore()
		if risk < minRisk {
			continue
		}
		rows = append(rows, map[string]any{
			"missionId":        mission.ID,
			"goal":             mission.Goal,
			"status":           mission.Status,
			"taskCount":        len(mission.Tasks),
			"missionRiskScore": risk,
			"updatedAt":        mission.UpdatedAt,
		})
		if limit > 0 && len(rows) >= limit {
			break
		}
	}
	return rows
}

func (m *localSwarmStateManager) missionRiskFacets(statusFilter string, minRisk float64) map[string]any {
	rows := m.missionRiskRows(statusFilter, minRisk, 0)
	bands := map[string]int{"low": 0, "medium": 0, "high": 0}
	for _, row := range rows {
		risk, _ := row["missionRiskScore"].(float64)
		switch {
		case risk >= 50:
			bands["high"]++
		case risk >= 25:
			bands["medium"]++
		default:
			bands["low"]++
		}
	}
	return map[string]any{"bands": bands, "count": len(rows)}
}

func (m *localSwarmStateManager) meshCapabilities() map[string]any {
	return map[string]any{
		"hypercoded-go": []string{"startSwarm", "resumeMission", "getMissionHistory", "getMissionRiskSummary", "getMissionRiskRows", "getMissionRiskFacets", "getMeshCapabilities"},
	}
}

func (m *localSwarmStateManager) sortedMissionsLocked() []localSwarmMission {
	missions := append([]localSwarmMission(nil), m.missions...)
	sort.Slice(missions, func(i, j int) bool { return missions[i].CreatedAt > missions[j].CreatedAt })
	return missions
}

func (m *localSwarmStateManager) load() {
	if strings.TrimSpace(m.persistPath) == "" {
		return
	}
	data, err := os.ReadFile(m.persistPath)
	if err != nil {
		return
	}
	var state persistedSwarmState
	if err := json.Unmarshal(data, &state); err != nil {
		return
	}
	if state.NextID > 0 {
		m.nextID = state.NextID
	}
	m.missions = state.Missions
}

func (m *localSwarmStateManager) saveLocked() {
	if strings.TrimSpace(m.persistPath) == "" {
		return
	}
	state := persistedSwarmState{NextID: m.nextID, Missions: append([]localSwarmMission(nil), m.missions...)}
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return
	}
	_ = os.MkdirAll(filepath.Dir(m.persistPath), 0o755)
	_ = os.WriteFile(m.persistPath, data, 0o644)
}

func (m localSwarmMission) toMap() map[string]any {
	tasks := make([]map[string]any, 0, len(m.Tasks))
	for _, task := range m.Tasks {
		tasks = append(tasks, map[string]any{"id": task.ID, "title": task.Title, "status": task.Status, "priority": task.Priority})
	}
	return map[string]any{
		"id":             m.ID,
		"goal":           m.Goal,
		"status":         m.Status,
		"priority":       m.Priority,
		"model":          nullableString(m.Model),
		"maxConcurrency": m.MaxConcurrency,
		"tools":          append([]string(nil), m.Tools...),
		"createdAt":      m.CreatedAt,
		"updatedAt":      m.UpdatedAt,
		"tasks":          tasks,
	}
}

func (m localSwarmMission) riskScore() float64 {
	if len(m.Tasks) == 0 {
		return 0
	}
	pending := 0
	active := 0
	for _, task := range m.Tasks {
		switch task.Status {
		case "pending":
			pending++
		case "active":
			active++
		}
	}
	return float64(pending*20 + active*10)
}
