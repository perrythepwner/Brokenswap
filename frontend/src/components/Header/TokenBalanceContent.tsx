import { ChainId as UbeswapChainId, TokenAmount, Token } from '@ubeswap/sdk'
import Loader from 'components/Loader'
import React, { useEffect } from 'react'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { relevantDigits } from 'utils/relevantDigits'
import { useCUSDPrice } from 'utils/useCUSDPrice'

import tokenLogo from '../../assets/images/token-logo.png'
import { UBE } from '../../constants'
import { useTotalSupply } from '../../data/TotalSupply'
import { useTotalUbeEarned } from '../../state/stake/hooks'
import { useAggregateUbeBalance, useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink, StyledInternalLink, TYPE, UbeTokenAnimated } from '../../theme'
import { AutoColumn } from '../Column'
import { Break, CardNoise, CardSection, DataCard } from '../earn/styled'
import { RowBetween } from '../Row'
import { useCirculatingSupply } from './useCirculatingSupply'
import { useWeb3Provider } from 'hooks/useContract'
import { useConnectionInfo } from 'hooks/useConnectionInfo'
import { Wallet, ethers } from 'ethers'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, ${({ theme }) => theme.primary1} 0%, #021d43 100%), #edeef2;
  padding: 0.5rem;
`

const StyledClose = styled(X)`
  position: absolute;
  right: 16px;
  top: 16px;

  :hover {
    cursor: pointer;
  }
`

/**
 * Content for balance stats modal
 */
export default function TokenBalanceContent({
  setShowTokenBalanceModal,
  tokens,
}: {
  setShowTokenBalanceModal: any
  tokens: any
}) {
  const [connectionInfo, isInstanceRunning] = useConnectionInfo()
  const provider = useWeb3Provider()

  function TokenAmount(token: Token) {
    console.log('TokenAmount', token)
    console.log('PV key', connectionInfo['Player Private Key'])
    const wallet = new ethers.Wallet(connectionInfo['Player Private Key'], provider)
    const TokenBalance = useTokenBalance(undefined, token)
    return TokenBalance
  }

  return (
    <ContentWrapper gap="lg">
      <ModalUpper>
        <CardNoise />
        <CardSection gap="md">
          <RowBetween>
            <TYPE.white color="white">Your Tokens Balance</TYPE.white>
            <StyledClose stroke="white" onClick={() => setShowTokenBalanceModal(false)} />
          </RowBetween>
        </CardSection>
        <Break />
        {
          <>
            <CardSection gap="sm">
              <AutoColumn gap="md" justify="center">
                <UbeTokenAnimated width="48px" src={tokenLogo} />{' '}
                <TYPE.white fontSize={48} fontWeight={600} color="white">
                  {'8'}
                </TYPE.white>
              </AutoColumn>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white color="white">{'Balance'}:</TYPE.white>
                  {
                    <TYPE.white color="white">
                      {TokenAmount(tokens[connectionInfo['HTB Token Address']])?.toFixed(2, { groupSeparator: ',' })}
                    </TYPE.white>
                  }
                </RowBetween>
              </AutoColumn>
            </CardSection>
            <Break />
          </>
        }
        <CardNoise />
      </ModalUpper>
    </ContentWrapper>
  )
}
