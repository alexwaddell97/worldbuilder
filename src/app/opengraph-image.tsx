import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import { APP_TAGLINE } from '@/config/app'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  const landscape = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/landscape.png')).toString('base64')}`
  const logo = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/Subcreation.png')).toString('base64')}`
  const fontData = readFileSync(join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-Medium.woff2'))

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
        {/* Full-bleed landscape */}
        <img
          src={landscape}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Subtle dark scrim */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(8, 6, 18, 0.28)',
            display: 'flex',
          }}
        />

        {/* Glass card */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              background: 'rgba(255, 255, 255, 0.82)',
              border: '1px solid rgba(255, 255, 255, 0.65)',
              borderRadius: '24px',
              padding: '56px 88px',
              boxShadow: '0 8px 48px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.12)',
            }}
          >
            <img src={logo} style={{ height: '72px', width: 'auto' }} />
            <p
              style={{
                margin: 0,
                fontSize: '20px',
                fontFamily: 'Geist',
                color: 'rgba(30, 25, 55, 0.65)',
                letterSpacing: '0.01em',
              }}
            >
              {APP_TAGLINE}
            </p>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Geist',
          data: fontData.buffer as ArrayBuffer,
          weight: 500,
          style: 'normal',
        },
      ],
    }
  )
}
