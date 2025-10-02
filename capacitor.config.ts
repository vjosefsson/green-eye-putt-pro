import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ba77b6805ec24bfeaae19ef1ecc8c243',
  appName: 'App',
  webDir: 'dist',
  ios: {
    backgroundColor: '#00000000', // Transparent background
    contentInset: 'never'
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#000000'
    }
  }
};

export default config;
