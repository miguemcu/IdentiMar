import * as Network from 'expo-network';

/** Sin red real (modo avión, sin señal). Si no se puede saber, se asume que hay. */
export async function hayRed(): Promise<boolean> {
  try {
    const estado = await Network.getNetworkStateAsync();
    return estado.isInternetReachable ?? estado.isConnected ?? true;
  } catch {
    return true;
  }
}
