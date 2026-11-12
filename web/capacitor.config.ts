import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.andylafleur.powrfit',
  appName: 'PowrFit',
  webDir: 'out',
  plugins: {
    LocalNotifications: {
      // "Rest over" (P7-03) is for a locked phone or another app. While
      // PowrFit is open, its own timer and a haptic show the end of a rest.
      presentationOptions: [],
    },
  },
};

export default config;
