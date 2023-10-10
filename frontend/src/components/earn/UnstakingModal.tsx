import { useCelo } from '@celo/react-celo'
import { useDoTransaction } from 'components/swap/routing'
import { CustomStakingInfo } from 'pages/Earn/useCustomStakingInfo'
import React, { useState } from 'react'
import styled from 'styled-components'

import { useStakingContract } from '../../hooks/useContract'
import { StakingInfo } from '../../state/stake/hooks'
import { CloseIcon, TYPE } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import FormattedCurrencyAmount from '../FormattedCurrencyAmount'
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

export default function UnstakingModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { address: account } = useCelo()

  // monitor call to help UI loading state
  const doTransaction = useDoTransaction()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)

  async function onWithdraw() {
    if (stakingContract && stakingInfo?.stakedAmount) {
      setAttempting(true)
      await doTransaction(stakingContract, 'exit', {
        args: [],
        summary: `${'Withdraw deposited liquidity'}`,
      })
        .then((response) => {
          setHash(response.hash)
        })
        .catch(() => {
          setAttempting(false)
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
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>{'Withdraw'}</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOndismiss} />
          </RowBetween>
          {stakingInfo?.stakedAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={stakingInfo.stakedAmount} />}
              </TYPE.body>
              <TYPE.body>{'Deposited liquidity'}</TYPE.body>
            </AutoColumn>
          )}
          <AutoColumn justify="center" gap="md">
            {stakingInfo?.earnedAmounts?.map((earnedAmount, idx) => {
              return (
                <React.Fragment key={idx}>
                  <TYPE.body fontWeight={600} fontSize={36}>
                    {<FormattedCurrencyAmount currencyAmount={earnedAmount} />}
                  </TYPE.body>
                  <TYPE.body>
                    {'Unclaimed'} {earnedAmount.token.symbol}
                  </TYPE.body>
                </React.Fragment>
              )
            })}
          </AutoColumn>
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            {'When you withdraw, your UBE is claimed and your liquidity is removed from the mining pool.'}
          </TYPE.subHeader>
          <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.stakedAmount} onClick={onWithdraw}>
            {error ?? `${'Withdraw & Claim'}`}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>
              Withdrawing {stakingInfo?.stakedAmount?.toSignificant(4)}{' '}
              {stakingInfo.stakingToken?.symbol === 'ULP' ? 'UBE-LP' : stakingInfo.stakingToken?.symbol}
            </TYPE.body>
            <TYPE.body fontSize={20}>
              Claiming{' '}
              {stakingInfo?.earnedAmounts
                ?.map((earnedAmount) => `${earnedAmount.toSignificant(4)} ${earnedAmount.token.symbol}`)
                .join(' + ')}
            </TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>
              Withdrew {stakingInfo.stakingToken?.symbol === 'ULP' ? 'UBE-LP' : stakingInfo.stakingToken?.symbol}!
            </TYPE.body>
            <TYPE.body fontSize={20}>
              Claimed {stakingInfo?.rewardTokens.map((rewardToken) => rewardToken.symbol).join(' + ')}!
            </TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
