/**
 * Checks if the current version meets or exceeds the required version.
 *
 * @param currentVersion - The current software version.
 * @param requiredVersion - The required minimum version.
 * @returns - True if currentVersion >= requiredVersion.
 *
 * _if more complex operations are needed think about using a library like semver_
 */
export default function isVersionEligible(currentVersion: string, requiredVersion: string) {
  const currentParts = currentVersion.split('.').map(Number);
  const requiredParts = requiredVersion.split('.').map(Number);

  for (let i = 0; i < requiredParts.length; i++) {
    if (currentParts[i] > requiredParts[i]) return true;
    if (currentParts[i] < requiredParts[i]) return false;
  }
  return true;
};
