package httpapi

import "net/http"

func (s *Server) handleHealerDiagnose(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeBodyCall(w, r, "healer.diagnose")
}

func (s *Server) handleHealerHeal(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeBodyCall(w, r, "healer.heal")
}

func (s *Server) handleHealerHistory(w http.ResponseWriter, r *http.Request) {
	s.handleTRPCBridgeCall(w, r, http.MethodGet, "healer.getHistory", nil)
}
