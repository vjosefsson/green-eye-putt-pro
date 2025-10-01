# Golf Green Analyzer - Mobile Setup Guide

This app is designed to work as a mobile application using your phone's camera to analyze golf greens and provide AI-powered putting line recommendations.

## Current Setup

The app is currently configured to work in your browser with camera access. You can test it right now by:
1. Opening the app on your phone's browser
2. Granting camera permissions
3. Capturing a golf green image
4. Getting AI analysis of the putting line

## Running as a Native Mobile App

To run this as a native iOS or Android app, follow these steps:

### Prerequisites
- Node.js and npm installed
- For iOS: Mac with Xcode installed
- For Android: Android Studio installed

### Setup Steps

1. **Export and Clone the Project**
   - Click "Export to Github" in Lovable
   - Clone your repository locally:
   ```bash
   git clone <your-repo-url>
   cd <your-project-name>
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Web App**
   ```bash
   npm run build
   ```

4. **Initialize Capacitor** (already configured)
   The Capacitor configuration is already set up in `capacitor.config.ts`

5. **Add iOS or Android Platform**
   ```bash
   # For iOS
   npx cap add ios
   
   # For Android
   npx cap add android
   ```

6. **Update Native Platform**
   ```bash
   # For iOS
   npx cap update ios
   
   # For Android
   npx cap update android
   ```

7. **Sync Changes**
   ```bash
   npx cap sync
   ```

8. **Run on Device or Emulator**
   ```bash
   # For iOS
   npx cap run ios
   
   # For Android
   npx cap run android
   ```

### Development Workflow

When you make changes to your app:

1. Pull the latest changes from your GitHub repository
2. Run `npm run build`
3. Run `npx cap sync` to sync changes to native platforms
4. The native apps will automatically update

### Camera Permissions

The app will automatically request camera permissions when you first try to use it. Make sure to grant these permissions for the app to work properly.

### Features

- **Real-time Camera Access**: Uses your phone's back camera for capturing green images
- **AI-Powered Analysis**: Analyzes the slope and break of the green using advanced AI vision
- **Professional Recommendations**: Provides specific aim points, break analysis, and putting tips
- **Confidence Scoring**: Shows how confident the AI is in its analysis

### Troubleshooting

If you encounter issues:

1. **Camera not working**: Check that camera permissions are granted in your phone's settings
2. **Build errors**: Make sure all dependencies are installed with `npm install`
3. **Sync issues**: Try running `npx cap sync` again after making changes

For more help, refer to the [Capacitor documentation](https://capacitorjs.com/docs).
