import { useState, useEffect } from 'react';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface UseCameraReturn {
  hasCameraPermission: boolean | null;
  hasMicrophonePermission: boolean | null;
  hasAllPermissions: boolean;
  requestPermissions: () => Promise<boolean>;
}

export function useCamera(): UseCameraReturn {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  async function checkPermissions() {
    const [cameraStatus, audioStatus] = await Promise.all([
      Camera.getCameraPermissionsAsync(),
      Camera.getMicrophonePermissionsAsync(),
    ]);
    setHasCameraPermission(cameraStatus.granted);
    setHasMicrophonePermission(audioStatus.granted);
  }

  async function requestPermissions(): Promise<boolean> {
    const [cameraStatus, audioStatus] = await Promise.all([
      Camera.requestCameraPermissionsAsync(),
      Camera.requestMicrophonePermissionsAsync(),
    ]);
    const granted = cameraStatus.granted && audioStatus.granted;
    setHasCameraPermission(cameraStatus.granted);
    setHasMicrophonePermission(audioStatus.granted);
    if (granted) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return granted;
  }

  return {
    hasCameraPermission,
    hasMicrophonePermission,
    hasAllPermissions: hasCameraPermission === true && hasMicrophonePermission === true,
    requestPermissions,
  };
}
