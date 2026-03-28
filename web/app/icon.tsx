import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Favicon nítido (gerado) — alinhado com a cor principal do site. */
export default function Icon() {
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
          borderRadius: 7,
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: '-0.06em',
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
