export const runtime = 'nodejs';

const DEFAULT_UPSTREAM_TRPC_URLS = [
  'http://127.0.0.1:3001/trpc',
  'http://127.0.0.1:12009/trpc',
  'http://127.0.0.1:12009/api/trpc',
];

const LEGACY_COMPAT_RESPONSES: Record<string, unknown> = {
  'mcpServers.list': [],
  'tools.list': [],
  'mcp.getStatus': {
    initialized: false,
    serverCount: 0,
    toolCount: 0,
    connectedCount: 0,
  },
};

const LEGACY_MCP_PROCEDURES = new Set([
  'mcpServers.list',
  'tools.list',
  'mcp.getStatus',
]);

function resolveUpstreamBases(): string[] {
  const configured = process.env.BORG_TRPC_UPSTREAM?.trim();
  const allBases = [
    ...(configured ? [configured] : []),
    ...DEFAULT_UPSTREAM_TRPC_URLS,
  ];

  const uniqueBases = Array.from(new Set(allBases.map((base) => base.trim()).filter(Boolean)));

  return uniqueBases;
}

function buildUpstreamUrl(req: Request, upstreamBase: string): URL {
  const incomingUrl = new URL(req.url);
  const normalizedBase = upstreamBase.replace(/\/$/, '');
  const pathMatch = incomingUrl.pathname.match(/\/api\/trpc\/?(.*)$/);
  const procedurePath = pathMatch?.[1] ? `/${pathMatch[1]}` : '';
  const upstreamUrl = new URL(`${normalizedBase}${procedurePath}`);
  upstreamUrl.search = incomingUrl.search;
  return upstreamUrl;
}

function getProcedureNames(req: Request): string[] {
  const incomingUrl = new URL(req.url);
  const pathMatch = incomingUrl.pathname.match(/\/api\/trpc\/?(.*)$/);
  const procedureSegment = pathMatch?.[1] ?? '';

  if (!procedureSegment) {
    return [];
  }

  return procedureSegment
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

function isLegacyMcpRequest(req: Request): boolean {
  const procedures = getProcedureNames(req);
  return procedures.length > 0 && procedures.every((name) => LEGACY_MCP_PROCEDURES.has(name));
}

function extractTrpcData(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const maybeResult = (payload as { result?: { data?: unknown } }).result;
  const data = maybeResult?.data;
  if (!data || typeof data !== 'object') {
    return data;
  }

  const maybeJson = (data as { json?: unknown }).json;
  return maybeJson ?? data;
}

function normalizeServerList(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    const maybeEnvelope = data as { success?: boolean; data?: unknown[] };
    if (Array.isArray(maybeEnvelope.data) && maybeEnvelope.success !== false) {
      return maybeEnvelope.data;
    }
  }

  return [];
}

function buildStatusFromServers(servers: unknown[]): {
  initialized: boolean;
  serverCount: number;
  toolCount: number;
  connectedCount: number;
} {
  const connectedCount = servers.filter((server) => {
    if (!server || typeof server !== 'object') {
      return false;
    }

    const row = server as { error_status?: unknown; status?: unknown };
    if (typeof row.status === 'string' && row.status.toLowerCase() === 'connected') {
      return true;
    }

    return row.error_status === 'NONE';
  }).length;

  return {
    initialized: true,
    serverCount: servers.length,
    toolCount: 0,
    connectedCount,
  };
}

async function fetchProcedureData(
  upstreamBases: string[],
  headers: Headers,
  procedureNames: string[],
): Promise<unknown | undefined> {
  for (const upstreamBase of upstreamBases) {
    for (const procedureName of procedureNames) {
      const normalizedBase = upstreamBase.replace(/\/$/, '');
      const procedureUrl = new URL(`${normalizedBase}/${procedureName}`);
      procedureUrl.searchParams.set('input', '{}');

      try {
        const response = await fetch(procedureUrl, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          continue;
        }

        const json = await response.json();
        return extractTrpcData(json);
      } catch {
        // Try next candidate URL.
      }
    }
  }

  return undefined;
}

async function tryResolveLegacyMcpResponse(
  req: Request,
  upstreamBases: string[],
  headers: Headers,
): Promise<Response | null> {
  if (!isLegacyMcpRequest(req)) {
    return null;
  }

  const procedures = getProcedureNames(req);
  const isBatch = new URL(req.url).searchParams.get('batch') === '1';

  const rawServers = await fetchProcedureData(upstreamBases, headers, [
    'frontend.frontend.mcpServers.list',
    'frontend.mcpServers.list',
  ]);
  const normalizedServers = normalizeServerList(rawServers);
  const status = buildStatusFromServers(normalizedServers);

  const dataByProcedure: Record<string, unknown> = {
    'mcpServers.list': normalizedServers,
    'tools.list': LEGACY_COMPAT_RESPONSES['tools.list'],
    'mcp.getStatus': status,
  };

  if (!procedures.every((name) => name in dataByProcedure)) {
    return null;
  }

  const entries = procedures.map((procedureName) => ({
    result: {
      data: dataByProcedure[procedureName],
    },
  }));

  return new Response(JSON.stringify(isBatch ? entries : entries[0]), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'x-borg-trpc-compat': 'legacy-mcp-dashboard-bridge',
    },
  });
}

function buildLegacyCompatResponse(req: Request): Response | null {
  const procedureNames = getProcedureNames(req);
  if (procedureNames.length === 0) {
    return null;
  }

  const isBatch = new URL(req.url).searchParams.get('batch') === '1';

  const compatEntries = procedureNames.map((procedureName) => {
    if (!(procedureName in LEGACY_COMPAT_RESPONSES)) {
      return null;
    }

    return {
      result: {
        data: LEGACY_COMPAT_RESPONSES[procedureName],
      },
    };
  });

  if (compatEntries.some((entry) => entry === null)) {
    return null;
  }

  const payload = isBatch ? compatEntries : compatEntries[0];
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'x-borg-trpc-compat': 'legacy-mcp-dashboard-fallback',
    },
  });
}

function cloneHeaders(req: Request): Headers {
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');
  return headers;
}

async function handler(req: Request): Promise<Response> {
  const upstreamBases = resolveUpstreamBases();
  const headers = cloneHeaders(req);
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.text() : undefined;

  let upstreamResponse: Response | null = null;
  let lastUpstreamUrl = '';
  let lastError: unknown;
  let saw404 = false;

  for (const upstreamBase of upstreamBases) {
    const upstreamUrl = buildUpstreamUrl(req, upstreamBase);
    lastUpstreamUrl = upstreamUrl.toString();

    try {
      const response = await fetch(upstreamUrl, {
        method: req.method,
        headers,
        body,
      });

      if (response.status === 404) {
        saw404 = true;
        continue;
      }

      if (isLegacyMcpRequest(req) && (response.status === 401 || response.status === 403)) {
        continue;
      }

      upstreamResponse = response;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!upstreamResponse) {
    const bridgeResponse = await tryResolveLegacyMcpResponse(req, upstreamBases, headers);
    if (bridgeResponse) {
      return bridgeResponse;
    }

    const compatResponse = buildLegacyCompatResponse(req);
    if (compatResponse) {
      return compatResponse;
    }

    const message = saw404
      ? 'No configured tRPC upstream exposed the requested procedure path'
      : lastError instanceof Error
        ? lastError.message
        : String(lastError ?? 'No upstream responded');
    return new Response(
      JSON.stringify({
        error: 'TRPC_UPSTREAM_UNAVAILABLE',
        message,
        upstream: lastUpstreamUrl,
      }),
      {
        status: 502,
        headers: { 'content-type': 'application/json' },
      },
    );
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: upstreamResponse.headers,
  });
}

export { handler as GET, handler as POST };
