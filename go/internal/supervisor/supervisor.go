package supervisor

import (
	"context"
	"fmt"
	"os/exec"
	"sync"
	"time"
)

type SessionState string

const (
	StateStarting  SessionState = "starting"
	StateRunning   SessionState = "running"
	StateStopped   SessionState = "stopped"
	StateFailed    SessionState = "failed"
	StateRestarting SessionState = "restarting"
)

type SupervisedSession struct {
	ID             string
	Command        string
	Args           []string
	Env            map[string]string
	WorkingDirectory string
	State          SessionState
	PID            int
	RestartCount   int
	MaxRestarts    int
	LastActivityAt time.Time
	
	cmd *exec.Cmd
}

type Manager struct {
	sessions map[string]*SupervisedSession
	mu       sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		sessions: make(map[string]*SupervisedSession),
	}
}

func (m *Manager) CreateSession(id, command string, args []string, env map[string]string, cwd string, maxRestarts int) (*SupervisedSession, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.sessions[id]; exists {
		return nil, fmt.Errorf("session %s already exists", id)
	}

	session := &SupervisedSession{
		ID:             id,
		Command:        command,
		Args:           args,
		Env:            env,
		WorkingDirectory: cwd,
		State:          StateStopped,
		MaxRestarts:    maxRestarts,
		LastActivityAt: time.Now(),
	}

	m.sessions[id] = session
	return session, nil
}

func (m *Manager) StartSession(ctx context.Context, id string) error {
	m.mu.Lock()
	session, exists := m.sessions[id]
	if !exists {
		m.mu.Unlock()
		return fmt.Errorf("session %s not found", id)
	}
	
	if session.State == StateRunning || session.State == StateStarting {
		m.mu.Unlock()
		return nil
	}

	session.State = StateStarting
	m.mu.Unlock()

	return m.runSession(ctx, session)
}

func (m *Manager) runSession(ctx context.Context, session *SupervisedSession) error {
	session.cmd = exec.Command(session.Command, session.Args...)
	session.cmd.Dir = session.WorkingDirectory

	for k, v := range session.Env {
		session.cmd.Env = append(session.cmd.Env, fmt.Sprintf("%s=%s", k, v))
	}

	if err := session.cmd.Start(); err != nil {
		m.mu.Lock()
		session.State = StateFailed
		m.mu.Unlock()
		return err
	}

	m.mu.Lock()
	session.PID = session.cmd.Process.Pid
	session.State = StateRunning
	session.LastActivityAt = time.Now()
	m.mu.Unlock()

	go func() {
		err := session.cmd.Wait()
		m.mu.Lock()
		session.PID = 0
		if err != nil {
			session.State = StateFailed
			if session.RestartCount < session.MaxRestarts {
				session.RestartCount++
				session.State = StateRestarting
				m.mu.Unlock()
				
				// Backoff
				time.Sleep(2 * time.Second)
				m.runSession(ctx, session)
				return
			}
		} else {
			session.State = StateStopped
		}
		m.mu.Unlock()
	}()

	return nil
}

func (m *Manager) StopSession(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	session, exists := m.sessions[id]
	if !exists {
		return fmt.Errorf("session %s not found", id)
	}

	if session.State != StateRunning {
		return nil
	}

	if session.cmd != nil && session.cmd.Process != nil {
		session.State = StateStopped // Prevent auto-restart
		return session.cmd.Process.Kill()
	}

	return nil
}

func (m *Manager) ListSessions() []SupervisedSession {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var list []SupervisedSession
	for _, s := range m.sessions {
		list = append(list, *s)
	}
	return list
}
