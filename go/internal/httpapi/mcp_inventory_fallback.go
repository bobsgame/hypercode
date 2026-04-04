package httpapi

import (
	"path/filepath"
	"strings"

	"github.com/hypercodehq/hypercode-go/internal/mcp"
)

func (s *Server) localMCPInventoryCachePath() string {
	return filepath.Join(s.cfg.ConfigDir, "mcp_inventory_cache.json")
}

func (s *Server) localMCPInventory() (*mcp.Inventory, error) {
	return mcp.LoadInventoryWithCache(s.cfg.WorkspaceRoot, s.cfg.MainConfigDir, s.localMCPInventoryCachePath())
}

func normalizedInventoryToolName(tool mcp.ToolEntry) string {
	if strings.TrimSpace(tool.OriginalName) != "" {
		return tool.OriginalName
	}
	if strings.TrimSpace(tool.Name) != "" {
		return tool.Name
	}
	if strings.TrimSpace(tool.AdvertisedName) != "" {
		return tool.AdvertisedName
	}
	return "unknown"
}

func normalizedInventoryTools(inventory *mcp.Inventory) []mcp.ToolEntry {
	if inventory == nil || len(inventory.Tools) == 0 {
		return []mcp.ToolEntry{}
	}
	tools := make([]mcp.ToolEntry, 0, len(inventory.Tools))
	for _, tool := range inventory.Tools {
		copyTool := tool
		copyTool.Name = normalizedInventoryToolName(tool)
		if strings.TrimSpace(copyTool.AdvertisedName) == "" {
			copyTool.AdvertisedName = tool.Name
		}
		tools = append(tools, copyTool)
	}
	return tools
}

func fallbackMCPInventoryTools(inventory *mcp.Inventory) []map[string]any {
	tools := normalizedInventoryTools(inventory)
	result := make([]map[string]any, 0, len(tools))
	for _, tool := range tools {
		result = append(result, map[string]any{
			"name":         tool.Name,
			"description":  tool.Description,
			"server":       tool.Server,
			"alwaysShow":   tool.AlwaysOn,
			"source":       inventory.Source,
			"availability": "cache-backed",
		})
	}
	return result
}

func fallbackSearchMCPInventoryTools(query string, inventory *mcp.Inventory, limit int) []map[string]any {
	ranked := mcp.RankTools(query, normalizedInventoryTools(inventory), limit)
	results := make([]map[string]any, 0, len(ranked))
	for _, item := range ranked {
		results = append(results, map[string]any{
			"name":        normalizedInventoryToolName(item.ToolEntry),
			"server":      item.Server,
			"alwaysShow":  item.AlwaysOn,
			"matchReason": item.MatchReason,
			"score":       item.Score,
			"source":      inventory.Source,
		})
	}
	return results
}

func fallbackControlToolsFromInventory(inventory *mcp.Inventory) []map[string]any {
	if inventory == nil {
		return []map[string]any{}
	}
	serverUUIDs := make(map[string]string, len(inventory.Servers))
	for _, server := range inventory.Servers {
		if strings.TrimSpace(server.Name) != "" {
			serverUUIDs[server.Name] = server.UUID
		}
	}
	tools := normalizedInventoryTools(inventory)
	result := make([]map[string]any, 0, len(tools))
	for _, tool := range tools {
		schemaParamCount := 0
		if inputSchemaMap, ok := tool.InputSchema.(map[string]any); ok {
			if properties, ok := inputSchemaMap["properties"].(map[string]any); ok {
				schemaParamCount = len(properties)
			}
		}
		result = append(result, map[string]any{
			"uuid":             tool.Name,
			"name":             tool.Name,
			"description":      nullableString(tool.Description),
			"server":           tool.Server,
			"inputSchema":      tool.InputSchema,
			"isDeferred":       false,
			"schemaParamCount": schemaParamCount,
			"mcpServerUuid":    serverUUIDs[tool.Server],
			"always_on":        tool.AlwaysOn,
			"source":           inventory.Source,
		})
	}
	return result
}

func fallbackControlToolFromInventory(inventory *mcp.Inventory, uuid string) any {
	for _, tool := range fallbackControlToolsFromInventory(inventory) {
		if stringValue(tool["uuid"]) == uuid || stringValue(tool["name"]) == uuid {
			return tool
		}
	}
	return nil
}
