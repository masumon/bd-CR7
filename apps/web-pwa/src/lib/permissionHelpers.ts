/**
 * permissionHelpers.ts
 * Utilities for requesting Camera and GPS/Location permissions.
 * Provides fallback behaviour when permissions are denied.
 */

export type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

/** Request camera access. Returns the status after the attempt. */
export async function requestCameraPermission(): Promise<PermissionStatus> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "unsupported";
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Stop immediately — we only needed the permission grant
    stream.getTracks().forEach((t) => t.stop());
    return "granted";
  } catch (err) {
    const name = (err as DOMException).name;
    if (name === "NotAllowedError" || name === "PermissionDeniedError") return "denied";
    if (name === "NotFoundError") return "unsupported";
    return "denied";
  }
}

/** Check current camera permission state without prompting. */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  if (typeof navigator === "undefined") return "unsupported";
  if (!("permissions" in navigator)) return "prompt";
  try {
    const result = await navigator.permissions.query({ name: "camera" as PermissionName });
    return result.state as PermissionStatus;
  } catch {
    return "prompt";
  }
}

/** Request GPS/Location access. Returns the status after the attempt. */
export async function requestLocationPermission(): Promise<PermissionStatus> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return "unsupported";
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve("granted"),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) resolve("denied");
        else resolve("unsupported");
      },
      { timeout: 8_000, maximumAge: 60_000 }
    );
  });
}

/** Check current location permission state without prompting. */
export async function checkLocationPermission(): Promise<PermissionStatus> {
  if (typeof navigator === "undefined") return "unsupported";
  if (!("permissions" in navigator)) return "prompt";
  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state as PermissionStatus;
  } catch {
    return "prompt";
  }
}

/** Get current GPS coordinates. Requires location permission to be granted. */
export function getCurrentPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { timeout: 10_000, maximumAge: 30_000, enableHighAccuracy: true }
    );
  });
}
