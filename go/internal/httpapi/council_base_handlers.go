package httpapi

import "net/http"

func (s *Server) handleCouncilBaseStatus(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodGet, "council.status", nil)
}

func (s *Server) handleCouncilBaseUpdateConfig(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeBodyCall(w, r, "council.updateConfig")
}

func (s *Server) handleCouncilBaseAddSupervisors(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeBodyCall(w, r, "council.addSupervisors")
}

func (s *Server) handleCouncilBaseClearSupervisors(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodPost, "council.clearSupervisors", nil)
}

func (s *Server) handleCouncilBaseDebate(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeBodyCall(w, r, "council.debate")
}

func (s *Server) handleCouncilBaseToggle(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodPost, "council.toggle", nil)
}

func (s *Server) handleCouncilBaseAddMock(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodPost, "council.addMock", nil)
}
