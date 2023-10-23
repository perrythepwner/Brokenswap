// @ts-nocheck
import { ChainId, useCelo } from '@celo/react-celo'

export const useIsSupportedNetwork = () => {
  

  return [ChainId.Mainnet, ChainId.Alfajores].includes(network.chainId)
}
