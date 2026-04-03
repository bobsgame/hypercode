package git

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
	"sync"
)

type SubmoduleResult struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Success bool   `json:"success"`
	Output  string `json:"output,omitempty"`
	Error   string `json:"error,omitempty"`
}

type UpdateReport struct {
	Total      int               `json:"total"`
	Successful int               `json:"successful"`
	Failed     int               `json:"failed"`
	Details    []SubmoduleResult `json:"details"`
}

// ListSubmodules parses the output of `git submodule status` to retrieve paths.
func ListSubmodules(ctx context.Context, repoRoot string) ([]string, error) {
	cmd := exec.CommandContext(ctx, "git", "submodule", "status")
	cmd.Dir = repoRoot
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to list submodules: %w", err)
	}

	var paths []string
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// status output format: [status_char][hash] [path] ([tag/branch])
		parts := strings.Fields(line[1:])
		if len(parts) >= 2 {
			paths = append(paths, parts[1])
		}
	}
	return paths, nil
}

// UpdateAll concurrently updates all submodules to their remote tracked branches.
func UpdateAll(ctx context.Context, repoRoot string) (*UpdateReport, error) {
	paths, err := ListSubmodules(ctx, repoRoot)
	if err != nil {
		return nil, err
	}

	report := &UpdateReport{
		Total:   len(paths),
		Details: make([]SubmoduleResult, 0, len(paths)),
	}

	if len(paths) == 0 {
		return report, nil
	}

	// First run init recursively
	initCmd := exec.CommandContext(ctx, "git", "submodule", "update", "--init", "--recursive")
	initCmd.Dir = repoRoot
	if err := initCmd.Run(); err != nil {
		// Non-fatal, some submodules might be broken, continue to individual updates
	}

	var wg sync.WaitGroup
	var mu sync.Mutex

	// Update each submodule concurrently
	for _, path := range paths {
		wg.Add(1)
		go func(subPath string) {
			defer wg.Done()
			
			// We run fetch + checkout + pull inside the submodule directory
			// To mimic `git submodule update --remote` but with precise error tracking
			name := filepathBase(subPath) // Simple extraction

			cmd := exec.CommandContext(ctx, "git", "submodule", "update", "--remote", subPath)
			cmd.Dir = repoRoot
			
			output, err := cmd.CombinedOutput()
			
			mu.Lock()
			defer mu.Unlock()
			
			res := SubmoduleResult{
				Name:    name,
				Path:    subPath,
				Success: err == nil,
				Output:  string(output),
			}
			
			if err != nil {
				res.Error = err.Error()
				report.Failed++
			} else {
				report.Successful++
			}
			report.Details = append(report.Details, res)
		}(path)
	}

	wg.Wait()
	return report, nil
}

func filepathBase(path string) string {
	parts := strings.Split(path, "/")
	if len(parts) == 0 {
		return path
	}
	return parts[len(parts)-1]
}
