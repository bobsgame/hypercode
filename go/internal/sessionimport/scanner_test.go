package sessionimport

import (
	"os"
	"path/filepath"
	"testing"
)

func TestScannerScanFindsImportableFilesAndDedupesOverlap(t *testing.T) {
	root := t.TempDir()

	claudePath := filepath.Join(root, ".claude", "session-1.jsonl")
	if err := os.MkdirAll(filepath.Dir(claudePath), 0o755); err != nil {
		t.Fatalf("failed to create claude directory: %v", err)
	}
	if err := os.WriteFile(claudePath, []byte("{\"model\":\"claude-sonnet\"}\n"), 0o644); err != nil {
		t.Fatalf("failed to write claude session file: %v", err)
	}

	openAIPath := filepath.Join(root, ".openai", "chatgpt-export.json")
	if err := os.MkdirAll(filepath.Dir(openAIPath), 0o755); err != nil {
		t.Fatalf("failed to create openai directory: %v", err)
	}
	if err := os.WriteFile(openAIPath, []byte("{\"conversation_id\":\"conv-1\"}\n"), 0o644); err != nil {
		t.Fatalf("failed to write openai export file: %v", err)
	}

	ignoredNodeModulesPath := filepath.Join(root, ".openai", "node_modules", "session-ignore.jsonl")
	if err := os.MkdirAll(filepath.Dir(ignoredNodeModulesPath), 0o755); err != nil {
		t.Fatalf("failed to create ignored node_modules directory: %v", err)
	}
	if err := os.WriteFile(ignoredNodeModulesPath, []byte("{\"model\":\"ignored\"}\n"), 0o644); err != nil {
		t.Fatalf("failed to write ignored node_modules file: %v", err)
	}

	ignoredBinaryPath := filepath.Join(root, ".openai", "notes.bin")
	if err := os.WriteFile(ignoredBinaryPath, []byte("not an importable transcript"), 0o644); err != nil {
		t.Fatalf("failed to write ignored binary file: %v", err)
	}

	scanner := NewScanner(root, root, 10)
	candidates, err := scanner.Scan()
	if err != nil {
		t.Fatalf("expected scanner to succeed, got %v", err)
	}

	if len(candidates) != 2 {
		t.Fatalf("expected 2 unique import candidates, got %+v", candidates)
	}

	candidatesByPath := make(map[string]Candidate, len(candidates))
	for _, candidate := range candidates {
		candidatesByPath[candidate.SourcePath] = candidate
	}

	claudeCandidate, ok := candidatesByPath[claudePath]
	if !ok {
		t.Fatalf("expected claude candidate at %s in %+v", claudePath, candidates)
	}
	if claudeCandidate.SourceTool != "claude-code" || claudeCandidate.SessionFormat != "jsonl" {
		t.Fatalf("expected claude-code jsonl candidate, got %+v", claudeCandidate)
	}
	if claudeCandidate.LastModifiedAt == "" || claudeCandidate.EstimatedSize <= 0 {
		t.Fatalf("expected claude candidate metadata, got %+v", claudeCandidate)
	}

	openAICandidate, ok := candidatesByPath[openAIPath]
	if !ok {
		t.Fatalf("expected openai candidate at %s in %+v", openAIPath, candidates)
	}
	if openAICandidate.SourceTool != "openai" || openAICandidate.SessionFormat != "json" {
		t.Fatalf("expected openai json candidate, got %+v", openAICandidate)
	}
	if openAICandidate.LastModifiedAt == "" || openAICandidate.EstimatedSize <= 0 {
		t.Fatalf("expected openai candidate metadata, got %+v", openAICandidate)
	}
}

func TestScannerRootsReportsExistingAndMissingRoots(t *testing.T) {
	workspaceRoot := t.TempDir()
	homeDir := t.TempDir()

	claudeRoot := filepath.Join(workspaceRoot, ".claude")
	if err := os.MkdirAll(claudeRoot, 0o755); err != nil {
		t.Fatalf("failed to create claude root: %v", err)
	}

	homeChatGPTRoot := filepath.Join(homeDir, "ChatGPT")
	if err := os.MkdirAll(homeChatGPTRoot, 0o755); err != nil {
		t.Fatalf("failed to create ChatGPT root: %v", err)
	}

	scanner := NewScanner(workspaceRoot, homeDir, 10)
	roots := scanner.Roots()

	if len(roots) != 12 {
		t.Fatalf("expected 12 import roots, got %+v", roots)
	}

	rootsByKey := make(map[string]RootStatus, len(roots))
	for _, root := range roots {
		rootsByKey[root.SourceTool+"\n"+root.RootPath] = root
	}

	claudeStatus, ok := rootsByKey["claude-code\n"+claudeRoot]
	if !ok || !claudeStatus.Exists {
		t.Fatalf("expected existing claude root, got %+v", claudeStatus)
	}

	homeChatGPTStatus, ok := rootsByKey["openai\n"+homeChatGPTRoot]
	if !ok || !homeChatGPTStatus.Exists {
		t.Fatalf("expected existing openai ChatGPT root, got %+v", homeChatGPTStatus)
	}

	copilotRoot := filepath.Join(workspaceRoot, ".copilot", "session-state")
	copilotStatus, ok := rootsByKey["copilot-cli\n"+copilotRoot]
	if !ok {
		t.Fatalf("expected copilot root in %+v", roots)
	}
	if copilotStatus.Exists {
		t.Fatalf("expected missing copilot root in this fixture, got %+v", copilotStatus)
	}
}
