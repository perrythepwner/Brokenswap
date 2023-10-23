
// @ts-nocheck
import { useCelo } from '@celo/react-celo'

import { useAsyncState } from './useAsyncState'

export const useLatestBlockNumber = () => {
  
  return useAsyncState(0, kit.connection.web3.eth.getBlockNumber)
}
