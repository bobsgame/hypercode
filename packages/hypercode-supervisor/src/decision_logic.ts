import { DEFAULT_ACTION_LABELS, SupervisorSettings } from './settings.js';
import { ChatSurfaceInfo, UiInspection } from './ui_automation.js';

export const TERMINAL_TEXT_HINTS = ['@terminal:', 'pwsh', 'powershell', 'terminal', 'shell'];
export const ANTIGRAVITY_LABEL_HINTS = ['Run', 'Expand', 'Always Allow', 'Retry', 'Accept all', 'Accept', 'Allow', 'Approve', 'Proceed', 'Keep'];

export function normalizeComparableLabel(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function collectInspectionHints(inspection: UiInspection): string[] {
    return [
        ...inspection.labels,
        ...inspection.buttons.map((button) => button.name),
        ...inspection.inputs.flatMap((input) => [input.name, input.automationId ?? '', input.className ?? ''])
    ].filter((value): value is string => Boolean(value && value.trim()));
}

export function inspectionLooksLikeAntigravity(inspection: UiInspection): boolean {
    const normalizedHints = new Set(collectInspectionHints(inspection).map((value) => normalizeComparableLabel(value)));

    for (const label of ANTIGRAVITY_LABEL_HINTS) {
        if (normalizedHints.has(normalizeComparableLabel(label))) {
            return true;
        }
    }

    return [...normalizedHints].some((value) =>
        TERMINAL_TEXT_HINTS.some((needle) => value.includes(normalizeComparableLabel(needle)))
    );
}

export function resolveActionLabels(explicitLabels: string[] | undefined, surface: ChatSurfaceInfo, settings: SupervisorSettings): string[] {
    if (explicitLabels && explicitLabels.length > 0) {
        return explicitLabels;
    }

    if (surface.detectedSurface === 'antigravity') {
        return [...DEFAULT_ACTION_LABELS];
    }

    return surface.surfaceProfile.actionLabels ?? settings.actionLabels ?? [...DEFAULT_ACTION_LABELS];
}
