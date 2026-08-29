import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.rainbowjump.adventure',
  appName: '무지개점프',
  webDir: 'dist',
  backgroundColor: '#eaf7ff',
  android: {
    allowMixedContent: true,
  },
}

export default config
