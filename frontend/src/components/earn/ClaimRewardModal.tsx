import { useCelo } from '@celo/react-celo'
import { TokenAmount } from '@ubeswap/sdk'
import { useDoTransaction } from 'components/swap/routing'
import zip from 'lodash/zip'
import { CustomStakingInfo } from 'pages/Earn/useCustomStakingInfo'
import React, { useState } from 'react'
import styled from 'styled-components'

import { useStakingContract } from '../../hooks/useContract'
import { StakingInfo } from '../../state/stake/hooks'
import { CloseIcon, TYPE } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo | CustomStakingInfo
}

export default function ClaimRewardModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { address: account } = useCelo()

  // monitor call to help UI loading state
  const doTransaction = useDoTransaction()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)

  async function onClaimReward() {
    if (stakingContract && stakingInfo?.stakedAmount) {
      setAttempting(true)
      await doTransaction(stakingContract, 'getReward', {
        args: [],
        summary: `${'Claim accumulated UBE rewards'}`,
      })
        .catch(console.error)
        .finally(() => {
          wrappedOnDismiss()
        })
    }
  }

  let error: string | undefined
  if (!account) {
    error = `${'Connect wallet'}`
  }
  if (!stakingInfo?.stakedAmount) {
    error = error ?? `${'Enter an amount'}`
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Claim</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          <AutoColumn justify="center" gap="md">
            {stakingInfo.earnedAmounts &&
              stakingInfo.rewardRates &&
              zip<TokenAmount, TokenAmount>(stakingInfo?.earnedAmounts, stakingInfo?.rewardRates).map(
                ([earn, reward], idx) => {
                  return (
                    <TYPE.body fontWeight={600} fontSize={36} key={idx}>
                      {earn?.toSignificant(4)} {reward?.token.symbol}
                    </TYPE.body>
                  )
                }
              )}
            <TYPE.body>Unclaimed rewards</TYPE.body>
          </AutoColumn>
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            {'When you claim without withdrawing your liquidity remains in the mining pool.'}
          </TYPE.subHeader>
          <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.stakedAmount} onClick={onClaimReward}>
            {error ?? `${'Claim'}`}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>
              {'Claiming'}{' '}
              {stakingInfo?.earnedAmounts
                ?.map((earnedAmount) => `${earnedAmount.toSignificant(4)} ${earnedAmount?.token.symbol}`)
                .join(' + ')}
            </TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>{'Transaction Submitted'}</TYPE.largeHeader>
            <TYPE.body fontSize={20}>
              {'Claimed'} {stakingInfo?.rewardTokens.map((rewardToken) => rewardToken.symbol).join(' + ')}!
            </TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
