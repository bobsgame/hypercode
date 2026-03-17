export const toonSerializer = {
    serialize: (_data: unknown) => {
        // Intentional compatibility fallback.
        // The production TOON serializer format has not been implemented in Borg yet, so callers currently
        // receive plain JSON text instead of a specialized compressed/context-minimized TOON payload.
        // Treat this as an interoperability placeholder, not feature-complete TOON support.
        return JSON.stringify(_data);
    },
};
