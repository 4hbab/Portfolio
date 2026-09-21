const SVG_DATA_URL = /^data:image\/svg\+xml(?:;[^,]*)?,/i;

export function normalizeTotpQrCode(qrCode: string): string {
    const trimmed = qrCode.trim();
    if (!SVG_DATA_URL.test(trimmed)) return trimmed;

    const separator = trimmed.indexOf(",");
    const payload = trimmed.slice(separator + 1).trim();
    let svg = payload;

    if (!payload.startsWith("<")) {
        try {
            svg = decodeURIComponent(payload);
        } catch {
            // Re-encoding the original payload is still safer than rendering raw control characters.
        }
    }

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}
