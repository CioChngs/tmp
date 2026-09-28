module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
  },
  apps: {
    'android.emu.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
      build: 'cd android && gradlew.bat :app:assembleRelease :app:assembleReleaseAndroidTest',
    },
  },
  devices: {
    'android.emu': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6',
      },
    },
  },
  configurations: {
    'android.emu.release': {
      device: 'android.emu',
      app: 'android.emu.release',
    },
  },
};
