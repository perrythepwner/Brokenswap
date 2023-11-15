import { Token, TokenAmount } from '@ubeswap/sdk'
import { useMemo } from 'react'

import { useTokenContract } from '../hooks/useContract'
import { useSingleCallResult } from '../state/multicall/hooks'

export function useTokenAllowance(token: Token, owner?: string, spender?: string): TokenAmount | undefined {
  const contract = useTokenContract(token.address, false)

  const inputs = useMemo(() => [owner ?? '', spender ?? ''].filter(Boolean) as [string, string], [owner, spender])
  const allowance = useSingleCallResult(contract, 'allowance', inputs).result

  return useMemo(
    () => (token && allowance ? new TokenAmount(token, allowance.toString()) : undefined),
    [token, allowance]
  )
}