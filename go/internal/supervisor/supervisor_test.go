package supervisor

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func waitForSessionState(t *testing.T, m *Manager, id string, timeout time.Duration, acceptable ...SessionState) SupervisedSession {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		for _, session := range m.ListSessions() {
			if session.ID != id {
				continue
			}
			for _, state := range acceptable {
				if session.State == state {
					return session
				}
			}
		}
		time.Sleep(25 * time.Millisecond)
	}

	sessions := m.ListSessions()
	t.Fatalf("session %s did not reach one of %v within %s; sessions=%#v", id, acceptable, timeout, sessions)
	return SupervisedSession{}
}

func TestCreateSessionRejectsDuplicates(t *testing.T) {
	manager := NewManager()
	if _, err := manager.CreateSession("dup", "go", []string{"version"}, nil, t.TempDir(), 0); err != nil {
		t.Fatalf("first CreateSession failed: %v", err)
	}
	if _, err := manager.CreateSession("dup", "go", []string{"version"}, nil, t.TempDir(), 0); err == nil {
		t.Fatal("expected duplicate session creation to fail")
	}
}

func TestStartSessionRunsShortLivedProcessToStopped(t *testing.T) {
	goBinary, err := exec.LookPath("go")
	if err != nil {
		t.Skip("go binary not available")
	}

	manager := NewManager()
	workspace := t.TempDir()
	if _, err := manager.CreateSession("go-version", goBinary, []string{"version"}, nil, workspace, 0); err != nil {
		t.Fatalf("CreateSession failed: %v", err)
	}
	if err := manager.StartSession(context.Background(), "go-version"); err != nil {
		t.Fatalf("StartSession failed: %v", err)
	}

	session := waitForSessionState(t, manager, "go-version", 5*time.Second, StateStopped)
	if session.RestartCount != 0 {
		t.Fatalf("expected no restarts, got %#v", session)
	}
	if session.PID != 0 {
		t.Fatalf("expected PID reset after stop, got %#v", session)
	}
}

func TestStartSessionMissingReturnsError(t *testing.T) {
	manager := NewManager()
	if err := manager.StartSession(context.Background(), "missing"); err == nil {
		t.Fatal("expected StartSession on missing id to fail")
	}
}

func TestFailingProcessRestartsAndEventuallyFails(t *testing.T) {
	goBinary, err := exec.LookPath("go")
	if err != nil {
		t.Skip("go binary not available")
	}

	manager := NewManager()
	workspace := t.TempDir()
	if _, err := manager.CreateSession("go-fail", goBinary, []string{"tool", "definitely-not-a-real-go-tool"}, nil, workspace, 1); err != nil {
		t.Fatalf("CreateSession failed: %v", err)
	}
	if err := manager.StartSession(context.Background(), "go-fail"); err != nil {
		t.Fatalf("StartSession failed: %v", err)
	}

	session := waitForSessionState(t, manager, "go-fail", 7*time.Second, StateFailed)
	if session.RestartCount != 1 {
		t.Fatalf("expected one restart before permanent failure, got %#v", session)
	}
}

func TestCreateSessionCapturesMetadata(t *testing.T) {
	manager := NewManager()
	workspace := t.TempDir()
	env := map[string]string{"HYPERCODE_TEST": "1"}
	session, err := manager.CreateSession("meta", "go", []string{"version"}, env, workspace, 3)
	if err != nil {
		t.Fatalf("CreateSession failed: %v", err)
	}
	if session.WorkingDirectory != workspace || session.MaxRestarts != 3 || session.Env["HYPERCODE_TEST"] != "1" {
		t.Fatalf("unexpected session metadata: %#v", session)
	}
	if session.State != StateCreated {
		t.Fatalf("expected initial created state, got %#v", session)
	}
	if session.ExecutionPolicy == nil {
		t.Fatalf("expected execution policy on created session, got %#v", session)
	}
	if strings.TrimSpace(session.Env["HYPERCODE_EXECUTION_PROFILE_REQUESTED"]) == "" || strings.TrimSpace(session.Env["HYPERCODE_EXECUTION_PROFILE_EFFECTIVE"]) == "" {
		t.Fatalf("expected execution policy env vars, got %#v", session.Env)
	}
}

func TestManagerPersistsAndRestoresCreatedSessions(t *testing.T) {
	persistencePath := filepath.Join(t.TempDir(), "session-supervisor.json")
	manager := NewManager(ManagerOptions{PersistencePath: persistencePath})
	session, err := manager.CreateSessionWithOptions(CreateSessionOptions{
		ID:                  "persisted-1",
		Name:                "Persisted Session",
		CliType:             "custom",
		Command:             "go",
		Args:                []string{"version"},
		Env:                 map[string]string{"HYPERCODE_TEST": "1"},
		RequestedWorkingDir: "C:/workspace/project",
		WorkingDirectory:    "C:/workspace/project",
		ExecutionProfile:    "auto",
		AutoRestart:         false,
		Metadata:            map[string]any{"source": "unit-test"},
		MaxRestarts:         0,
	})
	if err != nil {
		t.Fatalf("CreateSessionWithOptions failed: %v", err)
	}
	if session.State != StateCreated {
		t.Fatalf("expected created state, got %#v", session)
	}

	raw, err := os.ReadFile(persistencePath)
	if err != nil {
		t.Fatalf("expected persistence file at %s: %v", persistencePath, err)
	}
	var persisted persistedState
	if err := json.Unmarshal(raw, &persisted); err != nil {
		t.Fatalf("failed to decode persisted state: %v", err)
	}
	if len(persisted.Sessions) != 1 || persisted.Sessions[0].ID != "persisted-1" {
		t.Fatalf("unexpected persisted sessions: %#v", persisted.Sessions)
	}

	restored := NewManager(ManagerOptions{PersistencePath: persistencePath})
	restoredSession, ok := restored.GetSession("persisted-1")
	if !ok || restoredSession == nil {
		t.Fatalf("expected restored session")
	}
	if restoredSession.Name != "Persisted Session" || restoredSession.CliType != "custom" || restoredSession.Metadata["source"] != "unit-test" {
		t.Fatalf("unexpected restored session: %#v", restoredSession)
	}
	if restoredSession.State != StateCreated {
		t.Fatalf("expected restored created state, got %#v", restoredSession)
	}
	status := restored.GetRestoreStatus()
	if status.RestoredSessionCount != 1 {
		t.Fatalf("expected restore count 1, got %#v", status)
	}
}

func TestManagerRestoreNormalizesTransientRunningStateToStoppedWithoutAutoResume(t *testing.T) {
	persistencePath := filepath.Join(t.TempDir(), "session-supervisor.json")
	state := persistedState{
		Sessions: []SupervisedSession{{
			ID:                        "running-1",
			Name:                      "Running Session",
			CliType:                   "custom",
			Command:                   "go",
			Args:                      []string{"version"},
			ExecutionProfile:          "auto",
			RequestedWorkingDirectory: "C:/workspace/project",
			WorkingDirectory:          "C:/workspace/project",
			State:                     StateRunning,
			CreatedAt:                 time.Now().UTC().UnixMilli(),
			LastActivityAt:            time.Now().UTC().UnixMilli(),
			Logs:                      []SessionLogEntry{{Timestamp: time.Now().UTC().UnixMilli(), Stream: "system", Message: "restored"}},
			Metadata:                  map[string]any{},
		}},
		SavedAt: time.Now().UTC().UnixMilli(),
	}
	raw, err := json.Marshal(state)
	if err != nil {
		t.Fatalf("marshal persisted state: %v", err)
	}
	if err := os.WriteFile(persistencePath, raw, 0o644); err != nil {
		t.Fatalf("write persisted state: %v", err)
	}

	restored := NewManager(ManagerOptions{PersistencePath: persistencePath, AutoResumeOnStart: false})
	session, ok := restored.GetSession("running-1")
	if !ok || session == nil {
		t.Fatalf("expected restored session")
	}
	if session.State != StateStopped {
		t.Fatalf("expected transient running state to restore as stopped, got %#v", session)
	}
	if session.ScheduledRestartAt != 0 {
		t.Fatalf("expected cleared scheduled restart time, got %#v", session)
	}
}

func TestStartSessionWithCustomEnvCanRunProcess(t *testing.T) {
	goBinary, err := exec.LookPath("go")
	if err != nil {
		t.Skip("go binary not available")
	}

	manager := NewManager()
	workspace := t.TempDir()
	testFile := filepath.Join(workspace, "env-check.txt")
	if err := os.WriteFile(testFile, []byte("ok"), 0o644); err != nil {
		t.Fatalf("failed to seed file: %v", err)
	}
	if _, err := manager.CreateSession("env-run", goBinary, []string{"version"}, map[string]string{"HYPERCODE_TEST": "1"}, workspace, 0); err != nil {
		t.Fatalf("CreateSession failed: %v", err)
	}
	if err := manager.StartSession(context.Background(), "env-run"); err != nil {
		t.Fatalf("StartSession failed: %v", err)
	}
	waitForSessionState(t, manager, "env-run", 5*time.Second, StateStopped)
}
