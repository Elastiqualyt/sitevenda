import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Ícone para ecrã inicial iOS / atalhos (Apple touch). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#078c7a',
          borderRadius: 40,
          color: '#ffffff',
          fontSize: 88,
          fontWeight: 800,
          letterSpacing: '-0.05em',
          fontFamily:
            'ui-rounded, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        }}
      >
        TP
      </div>
    ),
    { ...size }
  );
}
