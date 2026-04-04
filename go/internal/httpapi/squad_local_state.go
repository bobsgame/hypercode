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

type localSquadBrain struct {
	Goal        string   `json:"goal"`
	LastMessage string   `json:"lastMessage,omitempty"`
	History     []string `json:"history"`
	CurrentStep int      `json:"currentStep"`
	Active      bool     `json:"active"`
	LastUpdated int64    `json:"lastUpdated"`
}

type localSquadMember struct {
	ID           string          `json:"id"`
	Branch       string          `json:"branch"`
	Goal         string          `json:"goal"`
	WorktreePath string          `json:"worktreePath"`
	Status       string          `json:"status"`
	Active       bool            `json:"active"`
	CreatedAt    int64           `json:"createdAt"`
	Brain        localSquadBrain `json:"brain"`
}

type localSquadIndexerState struct {
	Running   bool   `json:"running"`
	Indexing  bool   `json:"indexing"`
	UpdatedAt string `json:"updatedAt,omitempty"`
}

type persistedSquadState struct {
	Members map[string]localSquadMember `json:"members"`
	Indexer localSquadIndexerState      `json:"indexer"`
}

type localSquadManager struct {
	mu          sync.RWMutex
	persistPath string
	workspace   string
	members     map[string]localSquadMember
	indexer     localSquadIndexerState
}

func newLocalSquadManager(workspaceRoot string, persistPath string) *localSquadManager {
	m := &localSquadManager{
		persistPath: persistPath,
		workspace:   workspaceRoot,
		members:     map[string]localSquadMember{},
		indexer:     localSquadIndexerState{Running: false, Indexing: false},
	}
	m.load()
	return m
}

func (m *localSquadManager) listMembers() []map[string]any {
	m.mu.RLock()
	defer m.mu.RUnlock()
	members := make([]localSquadMember, 0, len(m.members))
	for _, member := range m.members {
		members = append(members, member)
	}
	sort.Slice(members, func(i, j int) bool { return members[i].Branch < members[j].Branch })
	result := make([]map[string]any, 0, len(members))
	for _, member := range members {
		result = append(result, map[string]any{
			"id":       member.ID,
			"branch":   member.Branch,
			"status":   member.Status,
			"active":   member.Active,
			"goal":     member.Goal,
			"worktree": member.WorktreePath,
			"brain": map[string]any{
				"goal":        member.Brain.Goal,
				"lastMessage": nullableString(member.Brain.LastMessage),
				"history":     append([]string(nil), member.Brain.History...),
				"currentStep": member.Brain.CurrentStep,
				"active":      member.Brain.Active,
				"lastUpdated": member.Brain.LastUpdated,
			},
		})
	}
	return result
}

func (m *localSquadManager) spawnMember(branch string, goal string) map[string]any {
	m.mu.Lock()
	defer m.mu.Unlock()
	normalized := strings.TrimSpace(branch)
	now := time.Now().UTC().UnixMilli()
	id := "squad-" + normalized
	worktreePath := filepath.Join(m.workspace, ".hypercode", "squads", sanitizeLocalSquadPath(normalized))
	_ = os.MkdirAll(worktreePath, 0o755)
	member := localSquadMember{
		ID:           id,
		Branch:       normalized,
		Goal:         strings.TrimSpace(goal),
		WorktreePath: worktreePath,
		Status:       "spawned",
		Active:       true,
		CreatedAt:    now,
		Brain: localSquadBrain{
			Goal:        strings.TrimSpace(goal),
			History:     []string{"Spawned by native Go fallback squad manager."},
			CurrentStep: 1,
			Active:      true,
			LastUpdated: now,
		},
	}
	m.members[id] = member
	m.saveLocked()
	return map[string]any{"branch": normalized, "status": "spawned", "id": id, "worktreePath": worktreePath}
}

func (m *localSquadManager) killMember(branch string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	id := "squad-" + strings.TrimSpace(branch)
	member, ok := m.members[id]
	if !ok {
		return false
	}
	member.Status = "killed"
	member.Active = false
	member.Brain.Active = false
	member.Brain.History = append(member.Brain.History, "Killed by native Go fallback squad manager.")
	member.Brain.LastUpdated = time.Now().UTC().UnixMilli()
	delete(m.members, id)
	m.saveLocked()
	return true
}

func (m *localSquadManager) chat(branch string, message string) string {
	m.mu.Lock()
	defer m.mu.Unlock()
	id := "squad-" + strings.TrimSpace(branch)
	member, ok := m.members[id]
	if !ok {
		return fmt.Sprintf("Member squad-%s not found.", strings.TrimSpace(branch))
	}
	member.Brain.LastMessage = strings.TrimSpace(message)
	member.Brain.History = append(member.Brain.History, "User: "+strings.TrimSpace(message))
	member.Brain.History = append(member.Brain.History, "Squad: Native Go fallback acknowledged the message but does not yet run a full director-backed worker conversation loop.")
	member.Brain.CurrentStep++
	member.Brain.LastUpdated = time.Now().UTC().UnixMilli()
	member.Status = "busy"
	m.members[id] = member
	m.saveLocked()
	return "Native Go fallback squad member acknowledged the message and updated its local brain state."
}

func (m *localSquadManager) toggleIndexer(enabled bool) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.indexer.Running = enabled
	m.indexer.Indexing = enabled
	m.indexer.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	m.saveLocked()
	return enabled
}

func (m *localSquadManager) indexerStatus() map[string]any {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return map[string]any{
		"running":   m.indexer.Running,
		"indexing":  m.indexer.Indexing,
		"updatedAt": nullableString(m.indexer.UpdatedAt),
	}
}

func sanitizeLocalSquadPath(value string) string {
	clean := strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z':
			return r
		case r >= 'A' && r <= 'Z':
			return r
		case r >= '0' && r <= '9':
			return r
		case r == '-', r == '_', r == '/':
			return r
		default:
			return '_'
		}
	}, value)
	clean = strings.ReplaceAll(clean, "/", string(os.PathSeparator))
	return strings.Trim(clean, "_")
}

func (m *localSquadManager) load() {
	if strings.TrimSpace(m.persistPath) == "" {
		return
	}
	data, err := os.ReadFile(m.persistPath)
	if err != nil {
		return
	}
	var state persistedSquadState
	if err := json.Unmarshal(data, &state); err != nil {
		return
	}
	if state.Members != nil {
		m.members = state.Members
	}
	m.indexer = state.Indexer
}

func (m *localSquadManager) saveLocked() {
	if strings.TrimSpace(m.persistPath) == "" {
		return
	}
	state := persistedSquadState{Members: m.members, Indexer: m.indexer}
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return
	}
	_ = os.MkdirAll(filepath.Dir(m.persistPath), 0o755)
	_ = os.WriteFile(m.persistPath, data, 0o644)
}
