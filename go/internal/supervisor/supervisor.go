package supervisor

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"sort"
	"strings"
	"sync"
	"time"
)

type SessionState string

const (
	StateCreated    SessionState = "created"
	StateStarting   SessionState = "starting"
	StateRunning    SessionState = "running"
	StateStopping   SessionState = "stopping"
	StateStopped    SessionState = "stopped"
	StateFailed     SessionState = "error"
	StateRestarting SessionState = "restarting"
)

const (
	defaultRestartDelay  = 2 * time.Second
	defaultMaxLogEntries = 200
)

type SessionLogEntry struct {
	Timestamp int64  `json:"timestamp"`
	Stream    string `json:"stream"`
	Message   string `json:"message"`
}

type SessionHealth struct {
	Status              string  `json:"status"`
	LastCheck           int64   `json:"lastCheck"`
	ConsecutiveFailures int     `json:"consecutiveFailures"`
	RestartCount        int     `json:"restartCount"`
	LastRestartAt       *int64  `json:"lastRestartAt,omitempty"`
	NextRestartAt       *int64  `json:"nextRestartAt,omitempty"`
	LastExitCode        *int    `json:"lastExitCode,omitempty"`
	LastExitSignal      *string `json:"lastExitSignal,omitempty"`
	ErrorMessage        *string `json:"errorMessage,omitempty"`
}

type SessionAttachInfo struct {
	ID                    string   `json:"id"`
	PID                   int      `json:"pid,omitempty"`
	Command               string   `json:"command"`
	Args                  []string `json:"args"`
	CWD                   string   `json:"cwd"`
	Status                string   `json:"status"`
	Attachable            bool     `json:"attachable"`
	AttachReadiness       string   `json:"attachReadiness"`
	AttachReadinessReason string   `json:"attachReadinessReason"`
}

type CreateSessionOptions struct {
	ID                  string
	Name                string
	CliType             string
	Command             string
	Args                []string
	Env                 map[string]string
	RequestedWorkingDir string
	WorkingDirectory    string
	ExecutionProfile    string
	AutoRestart         bool
	IsolateWorktree     bool
	Metadata            map[string]any
	MaxRestarts         int
}

type SupervisedSession struct {
	ID                        string            `json:"id"`
	Name                      string            `json:"name"`
	CliType                   string            `json:"cliType"`
	Command                   string            `json:"command"`
	Args                      []string          `json:"args"`
	Env                       map[string]string `json:"env"`
	ExecutionProfile          string            `json:"executionProfile"`
	RequestedWorkingDirectory string            `json:"requestedWorkingDirectory"`
	WorkingDirectory          string            `json:"workingDirectory"`
	WorktreePath              string            `json:"worktreePath,omitempty"`
	AutoRestart               bool              `json:"autoRestart"`
	IsolateWorktree           bool              `json:"isolateWorktree"`
	State                     SessionState      `json:"status"`
	PID                       int               `json:"pid,omitempty"`
	RestartCount              int               `json:"restartCount"`
	MaxRestarts               int               `json:"maxRestartAttempts"`
	CreatedAt                 int64             `json:"createdAt"`
	StartedAt                 int64             `json:"startedAt,omitempty"`
	StoppedAt                 int64             `json:"stoppedAt,omitempty"`
	ScheduledRestartAt        int64             `json:"scheduledRestartAt,omitempty"`
	LastActivityAt            int64             `json:"lastActivityAt"`
	LastError                 string            `json:"lastError,omitempty"`
	LastExitCode              int               `json:"lastExitCode,omitempty"`
	LastExitSignal            string            `json:"lastExitSignal,omitempty"`
	Metadata                  map[string]any    `json:"metadata"`
	Logs                      []SessionLogEntry `json:"logs"`

	health           SessionHealth   `json:"-"`
	cmd              *exec.Cmd       `json:"-"`
	manualStop       bool            `json:"-"`
	restartAfterStop bool            `json:"-"`
	restartTimer     *time.Timer     `json:"-"`
	restartContext   context.Context `json:"-"`
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
	return m.CreateSessionWithOptions(CreateSessionOptions{
		ID:                  id,
		Name:                id,
		CliType:             command,
		Command:             command,
		Args:                args,
		Env:                 env,
		RequestedWorkingDir: cwd,
		WorkingDirectory:    cwd,
		ExecutionProfile:    "auto",
		AutoRestart:         true,
		IsolateWorktree:     false,
		Metadata:            map[string]any{},
		MaxRestarts:         maxRestarts,
	})
}

func (m *Manager) CreateSessionWithOptions(input CreateSessionOptions) (*SupervisedSession, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	id := strings.TrimSpace(input.ID)
	if id == "" {
		id = fmt.Sprintf("session-%d", time.Now().UTC().UnixNano())
	}
	if _, exists := m.sessions[id]; exists {
		return nil, fmt.Errorf("session %s already exists", id)
	}

	command := strings.TrimSpace(input.Command)
	if command == "" {
		return nil, fmt.Errorf("session %s has no command", id)
	}
	cliType := strings.TrimSpace(input.CliType)
	if cliType == "" {
		cliType = command
	}
	workingDirectory := strings.TrimSpace(input.WorkingDirectory)
	if workingDirectory == "" {
		workingDirectory = strings.TrimSpace(input.RequestedWorkingDir)
	}
	if workingDirectory == "" {
		workingDirectory = "."
	}
	requestedWorkingDirectory := strings.TrimSpace(input.RequestedWorkingDir)
	if requestedWorkingDirectory == "" {
		requestedWorkingDirectory = workingDirectory
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		name = fmt.Sprintf("%s-%s", cliType, shortenID(id))
	}
	maxRestarts := input.MaxRestarts
	if maxRestarts < 0 {
		maxRestarts = 0
	}
	executionProfile := strings.TrimSpace(input.ExecutionProfile)
	if executionProfile == "" {
		executionProfile = "auto"
	}
	metadata := cloneMetadata(input.Metadata)
	now := nowMillis()
	autoRestart := input.AutoRestart
	if !input.AutoRestart && input.MaxRestarts == 0 {
		autoRestart = false
	} else if input.AutoRestart || input.MaxRestarts > 0 {
		autoRestart = true
	}

	session := &SupervisedSession{
		ID:                        id,
		Name:                      name,
		CliType:                   cliType,
		Command:                   command,
		Args:                      append([]string(nil), input.Args...),
		Env:                       cloneEnv(input.Env),
		ExecutionProfile:          executionProfile,
		RequestedWorkingDirectory: requestedWorkingDirectory,
		WorkingDirectory:          workingDirectory,
		AutoRestart:               autoRestart,
		IsolateWorktree:           input.IsolateWorktree,
		State:                     StateCreated,
		RestartCount:              0,
		MaxRestarts:               maxRestarts,
		CreatedAt:                 now,
		LastActivityAt:            now,
		Metadata:                  metadata,
		Logs:                      []SessionLogEntry{},
		health: SessionHealth{
			Status:              "degraded",
			LastCheck:           now,
			ConsecutiveFailures: 0,
			RestartCount:        0,
		},
	}

	m.sessions[id] = session
	m.appendLogLocked(session, "system", fmt.Sprintf("Session created for %s in %s", session.CliType, session.WorkingDirectory))
	return m.cloneSession(session), nil
}

func (m *Manager) GetSession(id string) (*SupervisedSession, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	session, ok := m.sessions[id]
	if !ok {
		return nil, false
	}
	return m.cloneSession(session), true
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
	if session.restartTimer != nil {
		session.restartTimer.Stop()
		session.restartTimer = nil
	}
	if ctx == nil {
		ctx = context.Background()
	}
	if session.restartContext == nil {
		session.restartContext = ctx
	}

	session.manualStop = false
	session.restartAfterStop = false
	session.State = StateStarting
	session.ScheduledRestartAt = 0
	session.LastError = ""
	session.health.Status = "degraded"
	session.health.LastCheck = nowMillis()
	session.health.NextRestartAt = nil
	session.LastActivityAt = nowMillis()
	m.appendLogLocked(session, "system", fmt.Sprintf("Starting %s %s", session.Command, strings.Join(session.Args, " ")))
	m.mu.Unlock()

	return m.runSession(ctx, session)
}

func (m *Manager) runSession(ctx context.Context, session *SupervisedSession) error {
	cmd := exec.CommandContext(ctx, session.Command, session.Args...)
	cmd.Dir = session.WorkingDirectory
	cmd.Env = append([]string{}, os.Environ()...)
	for key, value := range session.Env {
		cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", key, value))
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		m.markStartFailure(session.ID, fmt.Errorf("stdout pipe: %w", err))
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		m.markStartFailure(session.ID, fmt.Errorf("stderr pipe: %w", err))
		return err
	}

	if err := cmd.Start(); err != nil {
		m.markStartFailure(session.ID, err)
		return err
	}

	m.mu.Lock()
	live, ok := m.sessions[session.ID]
	if !ok {
		m.mu.Unlock()
		return fmt.Errorf("session %s disappeared", session.ID)
	}
	live.cmd = cmd
	live.PID = cmd.Process.Pid
	live.State = StateRunning
	live.StartedAt = nowMillis()
	live.StoppedAt = 0
	live.LastActivityAt = nowMillis()
	live.health.Status = "healthy"
	live.health.LastCheck = nowMillis()
	live.health.ConsecutiveFailures = 0
	live.health.ErrorMessage = nil
	m.appendLogLocked(live, "system", fmt.Sprintf("Spawned process %d", live.PID))
	m.mu.Unlock()

	go m.streamOutput(session.ID, "stdout", stdout)
	go m.streamOutput(session.ID, "stderr", stderr)
	go m.waitForExit(ctx, session.ID, cmd)
	return nil
}

func (m *Manager) StopSession(id string) error {
	return m.StopSessionWithOptions(id, false)
}

func (m *Manager) StopSessionWithOptions(id string, force bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	session, exists := m.sessions[id]
	if !exists {
		return fmt.Errorf("session %s not found", id)
	}

	session.manualStop = true
	session.restartAfterStop = false
	if session.restartTimer != nil {
		session.restartTimer.Stop()
		session.restartTimer = nil
	}
	session.ScheduledRestartAt = 0
	session.health.NextRestartAt = nil
	session.health.Status = "degraded"
	session.health.LastCheck = nowMillis()

	if session.cmd == nil || session.cmd.Process == nil {
		session.State = StateStopped
		session.StoppedAt = nowMillis()
		m.appendLogLocked(session, "system", "Stop requested while no process was running.")
		return nil
	}

	session.State = StateStopping
	if force {
		m.appendLogLocked(session, "system", "Stopping process forcefully.")
		return session.cmd.Process.Kill()
	}
	m.appendLogLocked(session, "system", "Stopping process.")
	return session.cmd.Process.Signal(os.Interrupt)
}

func (m *Manager) RestartSession(ctx context.Context, id string) error {
	m.mu.Lock()
	session, exists := m.sessions[id]
	if !exists {
		m.mu.Unlock()
		return fmt.Errorf("session %s not found", id)
	}
	if ctx == nil {
		ctx = context.Background()
	}
	session.restartContext = ctx
	if session.cmd == nil || session.cmd.Process == nil {
		session.State = StateRestarting
		m.appendLogLocked(session, "system", "Restart requested while idle; starting session.")
		m.mu.Unlock()
		return m.StartSession(ctx, id)
	}

	session.manualStop = true
	session.restartAfterStop = true
	session.State = StateRestarting
	m.appendLogLocked(session, "system", "Manual restart requested.")
	process := session.cmd.Process
	m.mu.Unlock()
	return process.Signal(os.Interrupt)
}

func (m *Manager) GetSessionLogs(id string, limit int) ([]SessionLogEntry, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	session, ok := m.sessions[id]
	if !ok {
		return nil, fmt.Errorf("session %s not found", id)
	}
	if limit <= 0 || limit > len(session.Logs) {
		limit = len(session.Logs)
	}
	result := make([]SessionLogEntry, 0, limit)
	for _, entry := range session.Logs[len(session.Logs)-limit:] {
		result = append(result, entry)
	}
	return result, nil
}

func (m *Manager) GetAttachInfo(id string) (*SessionAttachInfo, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	session, ok := m.sessions[id]
	if !ok {
		return nil, fmt.Errorf("session %s not found", id)
	}
	return buildAttachInfo(session), nil
}

func (m *Manager) GetSessionHealth(id string) (*SessionHealth, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	session, ok := m.sessions[id]
	if !ok {
		return nil, fmt.Errorf("session %s not found", id)
	}
	health := session.health
	return &health, nil
}

func (m *Manager) ListSessions() []SupervisedSession {
	m.mu.RLock()
	defer m.mu.RUnlock()

	list := make([]SupervisedSession, 0, len(m.sessions))
	for _, session := range m.sessions {
		list = append(list, *m.cloneSession(session))
	}
	sort.Slice(list, func(i, j int) bool {
		if list[i].CreatedAt == list[j].CreatedAt {
			return list[i].ID < list[j].ID
		}
		return list[i].CreatedAt < list[j].CreatedAt
	})
	return list
}

func (m *Manager) markStartFailure(id string, err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	session, ok := m.sessions[id]
	if !ok {
		return
	}
	message := strings.TrimSpace(err.Error())
	session.cmd = nil
	session.PID = 0
	session.State = StateFailed
	session.LastError = message
	session.LastActivityAt = nowMillis()
	session.health.Status = "crashed"
	session.health.LastCheck = nowMillis()
	session.health.ConsecutiveFailures++
	session.health.ErrorMessage = stringPointer(message)
	m.appendLogLocked(session, "system", "Start failed: "+message)
}

func (m *Manager) streamOutput(id, stream string, reader interface{ Read([]byte) (int, error) }) {
	scanner := bufio.NewScanner(reader)
	buffer := make([]byte, 0, 64*1024)
	scanner.Buffer(buffer, 1024*1024)
	for scanner.Scan() {
		m.recordOutput(id, stream, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		m.recordOutput(id, "system", fmt.Sprintf("%s stream error: %v", stream, err))
	}
}

func (m *Manager) recordOutput(id, stream, message string) {
	trimmed := strings.TrimRight(message, "\r\n")
	if strings.TrimSpace(trimmed) == "" {
		return
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	session, ok := m.sessions[id]
	if !ok {
		return
	}
	m.appendLogLocked(session, stream, trimmed)
}

func (m *Manager) waitForExit(ctx context.Context, id string, cmd *exec.Cmd) {
	err := cmd.Wait()
	m.mu.Lock()
	session, ok := m.sessions[id]
	if !ok {
		m.mu.Unlock()
		return
	}
	session.cmd = nil
	session.PID = 0
	session.LastActivityAt = nowMillis()
	session.StoppedAt = nowMillis()
	session.health.LastCheck = nowMillis()
	session.health.RestartCount = session.RestartCount
	codePtr, signalPtr := exitDetails(err)
	if codePtr != nil {
		session.LastExitCode = *codePtr
		session.health.LastExitCode = codePtr
	}
	if signalPtr != nil {
		session.LastExitSignal = *signalPtr
		session.health.LastExitSignal = signalPtr
	}

	if session.restartAfterStop {
		session.restartAfterStop = false
		session.manualStop = false
		m.scheduleRestartLocked(session, ctx, "manual restart requested")
		m.mu.Unlock()
		return
	}

	if session.manualStop {
		session.manualStop = false
		session.State = StateStopped
		session.ScheduledRestartAt = 0
		session.health.Status = "degraded"
		session.health.NextRestartAt = nil
		session.health.ErrorMessage = nil
		m.appendLogLocked(session, "system", "Process stopped.")
		m.mu.Unlock()
		return
	}

	if err != nil {
		message := strings.TrimSpace(err.Error())
		session.LastError = message
		session.health.ConsecutiveFailures++
		session.health.ErrorMessage = stringPointer(message)
		if session.AutoRestart && session.RestartCount < session.MaxRestarts {
			session.RestartCount++
			session.health.RestartCount = session.RestartCount
			m.scheduleRestartLocked(session, ctx, message)
			m.mu.Unlock()
			return
		}
		session.State = StateFailed
		session.ScheduledRestartAt = 0
		session.health.NextRestartAt = nil
		session.health.Status = "crashed"
		m.appendLogLocked(session, "system", "Process exited with error: "+message)
		m.mu.Unlock()
		return
	}

	session.State = StateStopped
	session.ScheduledRestartAt = 0
	session.LastError = ""
	session.health.Status = "degraded"
	session.health.NextRestartAt = nil
	session.health.ErrorMessage = nil
	m.appendLogLocked(session, "system", "Process exited cleanly.")
	m.mu.Unlock()
}

func (m *Manager) scheduleRestartLocked(session *SupervisedSession, ctx context.Context, reason string) {
	restartAt := nowMillis() + defaultRestartDelay.Milliseconds()
	session.State = StateRestarting
	session.ScheduledRestartAt = restartAt
	session.health.Status = "degraded"
	session.health.LastCheck = nowMillis()
	session.health.RestartCount = session.RestartCount
	session.health.LastRestartAt = int64Pointer(nowMillis())
	session.health.NextRestartAt = int64Pointer(restartAt)
	m.appendLogLocked(session, "system", fmt.Sprintf("Restart scheduled: %s", reason))
	if session.restartTimer != nil {
		session.restartTimer.Stop()
	}
	restartCtx := ctx
	if restartCtx == nil {
		restartCtx = session.restartContext
	}
	if restartCtx == nil {
		restartCtx = context.Background()
	}
	session.restartContext = restartCtx
	session.restartTimer = time.AfterFunc(defaultRestartDelay, func() {
		_ = m.StartSession(restartCtx, session.ID)
	})
}

func (m *Manager) appendLogLocked(session *SupervisedSession, stream, message string) {
	entry := SessionLogEntry{
		Timestamp: nowMillis(),
		Stream:    stream,
		Message:   message,
	}
	session.Logs = append(session.Logs, entry)
	if len(session.Logs) > defaultMaxLogEntries {
		session.Logs = append([]SessionLogEntry(nil), session.Logs[len(session.Logs)-defaultMaxLogEntries:]...)
	}
	session.LastActivityAt = entry.Timestamp
}

func (m *Manager) cloneSession(session *SupervisedSession) *SupervisedSession {
	clone := *session
	clone.Args = append([]string(nil), session.Args...)
	clone.Env = cloneEnv(session.Env)
	clone.Metadata = cloneMetadata(session.Metadata)
	clone.Logs = append([]SessionLogEntry(nil), session.Logs...)
	clone.cmd = nil
	clone.restartTimer = nil
	return &clone
}

func buildAttachInfo(session *SupervisedSession) *SessionAttachInfo {
	attachReadiness := "unavailable"
	attachReason := "error"
	hasPID := session.PID > 0
	switch session.State {
	case StateRunning:
		if hasPID {
			attachReadiness = "ready"
			attachReason = "running-with-pid"
		} else {
			attachReadiness = "unavailable"
			attachReason = "no-pid"
		}
	case StateStarting:
		attachReadiness = "pending"
		attachReason = "starting"
	case StateRestarting:
		attachReadiness = "pending"
		attachReason = "restarting"
	case StateStopping:
		attachReadiness = "pending"
		attachReason = "stopping"
	case StateStopped:
		attachReason = "stopped"
	case StateCreated:
		attachReason = "created"
	case StateFailed:
		attachReason = "error"
	}
	return &SessionAttachInfo{
		ID:                    session.ID,
		PID:                   session.PID,
		Command:               session.Command,
		Args:                  append([]string(nil), session.Args...),
		CWD:                   session.WorkingDirectory,
		Status:                string(session.State),
		Attachable:            session.State == StateRunning && hasPID,
		AttachReadiness:       attachReadiness,
		AttachReadinessReason: attachReason,
	}
}

func cloneEnv(source map[string]string) map[string]string {
	if len(source) == 0 {
		return map[string]string{}
	}
	cloned := make(map[string]string, len(source))
	for key, value := range source {
		cloned[key] = value
	}
	return cloned
}

func cloneMetadata(source map[string]any) map[string]any {
	if len(source) == 0 {
		return map[string]any{}
	}
	cloned := make(map[string]any, len(source))
	for key, value := range source {
		cloned[key] = value
	}
	return cloned
}

func nowMillis() int64 {
	return time.Now().UTC().UnixMilli()
}

func shortenID(id string) string {
	trimmed := strings.TrimSpace(id)
	if len(trimmed) <= 8 {
		return trimmed
	}
	return trimmed[:8]
}

func stringPointer(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func int64Pointer(value int64) *int64 {
	return &value
}

func exitDetails(err error) (*int, *string) {
	if err == nil {
		zero := 0
		return &zero, nil
	}
	exitErr, ok := err.(*exec.ExitError)
	if !ok {
		message := strings.TrimSpace(err.Error())
		if message == "" {
			return nil, nil
		}
		return nil, &message
	}
	code := exitErr.ExitCode()
	var codePtr *int
	if code >= 0 {
		codeCopy := code
		codePtr = &codeCopy
	}
	message := strings.TrimSpace(exitErr.Error())
	if message == "" {
		return codePtr, nil
	}
	return codePtr, &message
}
