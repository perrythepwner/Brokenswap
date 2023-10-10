import { useCelo, useConnectedSigner, useProvider } from '@celo/react-celo'
import { JsonRpcSigner } from '@ethersproject/providers'
import { ChainId, TokenAmount } from '@ubeswap/sdk'
import { ButtonEmpty, ButtonLight, ButtonPrimary, ButtonRadio } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { CardNoise, CardSection, DataCard } from 'components/earn/styled'
import Loader from 'components/Loader'
import { AutoRow, RowBetween } from 'components/Row'
import ChangeDelegateModal from 'components/Stake/ChangeDelegateModal'
import { Proposals } from 'components/Stake/Proposals'
import { InformationWrapper } from 'components/Stake/Proposals/ProposalCard'
import StakeCollapseCard from 'components/Stake/StakeCollapseCard'
import StakeInputField from 'components/Stake/StakeInputField'
import { ViewProposalModal } from 'components/Stake/ViewProposalModal'
import { useDoTransaction } from 'components/swap/routing'
import { RomulusDelegate__factory, Voter__factory } from 'generated'
import { VotableStakingRewards__factory } from 'generated/factories/VotableStakingRewards__factory'
import { useRomulus } from 'hooks/romulus/useRomulus'
import { useVotingTokens } from 'hooks/romulus/useVotingTokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useVotableStakingContract } from 'hooks/useContract'
import { useLatestBlockNumber } from 'hooks/useLatestBlockNumber'
import { BodyWrapper } from 'pages/AppBody'
import React, { useCallback, useState } from 'react'
import { useHistory } from 'react-router'
import { Text } from 'rebass'
import { WrappedTokenInfo } from 'state/lists/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import styled from 'styled-components'
import { ExternalLink, TYPE } from 'theme'
import { shortenAddress } from 'utils'

import { BIG_INT_SECONDS_IN_WEEK, BIG_INT_SECONDS_IN_YEAR, BIG_INT_ZERO, ubeGovernanceAddresses } from '../../constants'

enum DelegateIdx {
  ABSTAIN,
  FOR,
  AGAINST,
}

const StyledButtonRadio = styled(ButtonRadio)({
  padding: '8px',
  borderRadius: '4px',
})

const VOTABLE_STAKING_REWARDS_ADDRESS = '0xCe74d14163deb82af57f253108F7E5699e62116d'

const TopSection = styled(AutoColumn)({
  maxWidth: '480px',
  width: '100%',
})

const Wrapper = styled.div({
  margin: '0px 24px',
})

const ube = new WrappedTokenInfo(
  {
    address: '0x00be915b9dcf56a3cbe739d9b9c202ca692409ec',
    name: 'Ubeswap Governance Token',
    symbol: 'UBE',
    chainId: 42220,
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_UBE.png',
  },
  []
)

export const Stake: React.FC = () => {
  const history = useHistory()
  const { address, connect, network } = useCelo()
  const provider = useProvider()
  const signer = useConnectedSigner() as JsonRpcSigner
  const [amount, setAmount] = useState('')
  const [showChangeDelegateModal, setShowChangeDelegateModal] = useState(false)
  const [showViewProposalModal, setShowViewProposalModal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState('')
  const tokenAmount = tryParseAmount(amount === '' ? '0' : amount, ube)
  const [approvalState, approve] = useApproveCallback(tokenAmount, VOTABLE_STAKING_REWARDS_ADDRESS)
  const [staking, setStaking] = useState(true)
  const ubeBalance = useCurrencyBalance(address ?? undefined, ube)
  const contract = useVotableStakingContract(VOTABLE_STAKING_REWARDS_ADDRESS)
  const doTransaction = useDoTransaction()

  const crank = useCallback(
    async (delegateIdx: DelegateIdx) => {
      const staking = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, provider)
      const voterAddr = await staking.delegates(delegateIdx)
      const supportName =
        delegateIdx === DelegateIdx.ABSTAIN ? 'ABSTAIN' : delegateIdx === DelegateIdx.FOR ? 'FOR' : 'AGAINST'
      const voter = Voter__factory.connect(voterAddr, provider)
      const romulus = RomulusDelegate__factory.connect(await voter.romulusDelegate(), provider)
      const proposalCount = await romulus.proposalCount()
      await doTransaction(voter, 'castVote', {
        args: [proposalCount.sub(1)],
        summary: `Cranking the ${supportName} vote`,
      })
    },
    [provider, doTransaction]
  )
  const stakeBalance = new TokenAmount(
    ube,
    useSingleCallResult(contract, 'balanceOf', [address ?? undefined]).result?.[0] ?? 0
  )

  // 0 - Abstain
  // 1 - For
  // 2 - Against
  const userDelegateIdx = useSingleCallResult(contract, 'userDelegateIdx', [address ?? undefined]).result?.[0]
  const earned = new TokenAmount(ube, useSingleCallResult(contract, 'earned', [address ?? undefined]).result?.[0] ?? 0)
  const totalSupply = new TokenAmount(ube, useSingleCallResult(contract, 'totalSupply', []).result?.[0] ?? 0)
  const rewardRate = new TokenAmount(ube, useSingleCallResult(contract, 'rewardRate', []).result?.[0] ?? 0)

  const apy = totalSupply.greaterThan('0') ? rewardRate.multiply(BIG_INT_SECONDS_IN_YEAR).divide(totalSupply) : null
  const userRewardRate = totalSupply.greaterThan('0') ? stakeBalance.multiply(rewardRate).divide(totalSupply) : null

  const romulusAddress = ubeGovernanceAddresses[network.chainId as ChainId]

  const { tokenDelegate, quorumVotes, proposalThreshold } = useRomulus((romulusAddress as string) || '')
  const [latestBlockNumber] = useLatestBlockNumber()
  const { votingPower, releaseVotingPower } = useVotingTokens(latestBlockNumber)
  const totalVotingPower = votingPower?.add(releaseVotingPower ?? new TokenAmount(ube, BIG_INT_ZERO))

  // const disablePropose = !totalVotingPower || !proposalThreshold || totalVotingPower?.lessThan(proposalThreshold?.raw)
  const disablePropose = false

  const onStakeClick = useCallback(async () => {
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, signer)
    if (!tokenAmount) {
      return
    }
    return await doTransaction(c, 'stake', {
      args: [tokenAmount.raw.toString()],
      summary: `Stake ${amount} UBE`,
    })
  }, [doTransaction, amount, signer, tokenAmount])
  const onUnstakeClick = useCallback(async () => {
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, signer)
    if (!tokenAmount) {
      return
    }
    return await doTransaction(c, 'withdraw', {
      args: [tokenAmount.raw.toString()],
      summary: `Unstake ${amount} UBE`,
    })
  }, [doTransaction, amount, signer, tokenAmount])
  const onClaimClick = useCallback(async () => {
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, signer)
    return await doTransaction(c, 'getReward', {
      args: [],
      summary: `Claim UBE rewards`,
    })
  }, [doTransaction, signer])
  const changeDelegateIdx = useCallback(
    async (delegateIdx: number) => {
      if (delegateIdx === userDelegateIdx) {
        return
      }
      const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, signer)
      return await doTransaction(c, 'changeDelegateIdx', {
        args: [delegateIdx],
        summary: `Change auto-governance selection to ${DelegateIdx[delegateIdx]}`,
      })
    },
    [doTransaction, signer, userDelegateIdx]
  )

  let button = <ButtonLight onClick={() => connect().catch(console.warn)}>{'Connect Wallet'}</ButtonLight>
  if (address) {
    if (staking) {
      if (approvalState !== ApprovalState.APPROVED) {
        button = (
          <ButtonPrimary
            onClick={() => approve().catch(console.error)}
            disabled={!tokenAmount}
            altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
          >
            {approvalState === ApprovalState.PENDING ? (
              <AutoRow gap="6px" justify="center">
                Approving <Loader stroke="white" />
              </AutoRow>
            ) : (
              `${'Approve'} UBE`
            )}
          </ButtonPrimary>
        )
      } else {
        button = (
          <ButtonPrimary onClick={onStakeClick} disabled={isNaN(Number(amount)) || Number(amount) <= 0}>
            {'Stake'}
          </ButtonPrimary>
        )
      }
    } else {
      button = (
        <ButtonPrimary onClick={onUnstakeClick} disabled={isNaN(Number(amount)) || Number(amount) <= 0}>
          {'Unstake'}
        </ButtonPrimary>
      )
    }
  }

  return (
    <>
      <TopSection gap="lg" justify="center">
        <DataCard style={{ marginBottom: '2px' }}>
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>{'UBE Staking & Governance'}</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>{'Stake UBE to participate in governance and earn UBE rewards'}</TYPE.white>
              </RowBetween>
            </AutoColumn>
          </CardSection>
          <CardNoise />
        </DataCard>
        <BodyWrapper>
          <CurrencyLogo
            currency={ube}
            size={'42px'}
            style={{ position: 'absolute', top: '30px', right: 'calc(50% + 112px)' }}
          />
          <h2 style={{ textAlign: 'center', margin: '15px 0px 15px 6px' }}>{'Your UBE Stake'}</h2>
          <div style={{ margin: '10px 0 0 6px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100px' }}>
              <StyledButtonRadio active={staking} onClick={() => setStaking(true)}>
                {'Stake'}
              </StyledButtonRadio>
            </div>
            <div style={{ width: '100px' }}>
              <StyledButtonRadio active={!staking} onClick={() => setStaking(false)}>
                {'Unstake'}
              </StyledButtonRadio>
            </div>
          </div>

          <Wrapper>
            <div style={{ margin: '24px 0' }}>
              <StakeInputField
                id="stake-currency"
                value={amount}
                onUserInput={setAmount}
                onMax={() => {
                  if (staking) {
                    ubeBalance && setAmount(ubeBalance.toSignificant(18))
                  } else {
                    stakeBalance && setAmount(stakeBalance.toSignificant(18))
                  }
                }}
                currency={ube}
                stakeBalance={stakeBalance}
                walletBalance={ubeBalance}
              />
            </div>
            {userRewardRate?.greaterThan('0') && (
              <InformationWrapper style={{ margin: '0px 8px 0px 8px' }}>
                <Text fontWeight={500} fontSize={16}>
                  {'Unclaimed Rewards'}
                </Text>
                <div style={{ display: 'flex' }}>
                  <ButtonEmpty padding="0 8px" borderRadius="8px" width="fit-content" onClick={onClaimClick}>
                    {'Claim'}
                  </ButtonEmpty>
                  <Text fontWeight={500} fontSize={16}>
                    {userRewardRate ? earned.toFixed(4, { groupSeparator: ',' }) : '--'}
                  </Text>
                </div>
              </InformationWrapper>
            )}
            <div style={{ margin: '24px 0 16px 0' }}>{button}</div>
          </Wrapper>
        </BodyWrapper>

        {!userRewardRate?.greaterThan('0') && (
          <Text fontSize={20} fontWeight={500}>
            {'Weekly Rewards' + ' '}
            {rewardRate ? rewardRate.multiply(BIG_INT_SECONDS_IN_WEEK).toFixed(0, { groupSeparator: ',' }) : '--'} UBE /
            week ({apy?.multiply('100').toFixed(2, { groupSeparator: ',' }) ?? '--'}% APR)
          </Text>
        )}

        <StakeCollapseCard title="Voter cranks">
          <InformationWrapper>
            <div>
              <Text fontWeight={500} fontSize={16} marginTop={12}>
                For Voter
              </Text>
              <ButtonPrimary
                onClick={async () => {
                  await crank(DelegateIdx.FOR)
                }}
              >
                Crank
              </ButtonPrimary>
            </div>
            <div>
              <Text fontWeight={500} fontSize={16} marginTop={12}>
                Abstain Voter
              </Text>
              <ButtonPrimary
                onClick={async () => {
                  await crank(DelegateIdx.ABSTAIN)
                }}
              >
                Crank
              </ButtonPrimary>
            </div>
            <div>
              <Text fontWeight={500} fontSize={16} marginTop={12}>
                Against Voter
              </Text>
              <ButtonPrimary
                onClick={async () => {
                  await crank(DelegateIdx.AGAINST)
                }}
              >
                Crank
              </ButtonPrimary>
            </div>
          </InformationWrapper>
        </StakeCollapseCard>

        <StakeCollapseCard title={'Governance'} gap={'12px'}>
          <Text fontSize={14}>
            {'Create and view proposals, delegate votes, and participate in protocol governance'}
          </Text>
          <InformationWrapper>
            <Text fontWeight={500} fontSize={16} marginTop={12}>
              {'User Details'}
            </Text>
            <ButtonPrimary
              padding="6px"
              borderRadius="8px"
              width="120px"
              marginTop="8px"
              fontSize={14}
              disabled={disablePropose}
              onClick={() => {
                history.push('/add-proposal')
              }}
            >
              Propose
            </ButtonPrimary>
          </InformationWrapper>
          <InformationWrapper fontWeight={400}>
            <Text>{'Token Balance'}</Text>
            <Text>{ubeBalance ? `${ubeBalance?.toFixed(2, { groupSeparator: ',' })} UBE` : '-'} </Text>
          </InformationWrapper>
          <InformationWrapper fontWeight={400}>
            <Text>{'Voting Power'}</Text>
            <Text>{totalVotingPower ? totalVotingPower?.toFixed(2, { groupSeparator: ',' }) : '-'}</Text>
          </InformationWrapper>
          <InformationWrapper fontWeight={400}>
            <Text>{'Token Delegate'}</Text>
            <div style={{ display: 'flex' }}>
              {tokenDelegate ? (
                <>
                  <ButtonEmpty
                    padding="0 8px"
                    borderRadius="8px"
                    width="fit-content"
                    onClick={() => {
                      setShowChangeDelegateModal(true)
                    }}
                    style={{ lineHeight: '15px' }}
                  >
                    {'Change'}
                  </ButtonEmpty>
                  <Text>{shortenAddress(tokenDelegate)}</Text>
                </>
              ) : (
                '-'
              )}
            </div>
          </InformationWrapper>
          <InformationWrapper fontWeight={400}>
            <Text>{'Quorum'}</Text>
            <Text>{quorumVotes ? `${quorumVotes?.toFixed(2, { groupSeparator: ',' })} UBE` : '-'}</Text>
          </InformationWrapper>
          <InformationWrapper fontWeight={400}>
            <Text>{'Proposal Threshold'}</Text>
            <Text>{proposalThreshold ? `${proposalThreshold?.toFixed(2, { groupSeparator: ',' })} UBE` : '-'}</Text>
          </InformationWrapper>

          {stakeBalance.greaterThan('0') && (
            <>
              <Text fontWeight={500} fontSize={16} marginTop={12}>
                {'Your governance selection'}
              </Text>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <StyledButtonRadio active={userDelegateIdx === 1} onClick={() => changeDelegateIdx(1)}>
                  {'For'}
                </StyledButtonRadio>
                <StyledButtonRadio active={userDelegateIdx === 0} onClick={() => changeDelegateIdx(0)}>
                  {'Abstain'}
                </StyledButtonRadio>
                <StyledButtonRadio active={userDelegateIdx === 2} onClick={() => changeDelegateIdx(2)}>
                  {'Against'}
                </StyledButtonRadio>
              </div>
            </>
          )}
          <Text fontWeight={500} fontSize={16} marginTop={12}>
            {'Governance Proposals'}
            <Proposals
              onClickProposal={(url) => {
                setSelectedProposal(url)
                setShowViewProposalModal(true)
              }}
            />
          </Text>
        </StakeCollapseCard>
        {userRewardRate?.greaterThan('0') && (
          <StakeCollapseCard title={'Staking Statistics'} gap={'16px'}>
            <InformationWrapper>
              <Text>{'Total UBE Staked'}</Text>
              <Text>{Number(totalSupply?.toSignificant(4)).toLocaleString('en-US')}</Text>
            </InformationWrapper>
            <InformationWrapper>
              <Text>{'Your UBE Stake Pool Share'}</Text>
              <Text>{stakeBalance?.toSignificant(4)}</Text>
            </InformationWrapper>
            <InformationWrapper>
              <Text>{'Your Weekly Rewards'}</Text>
              <Text>
                {userRewardRate
                  ? userRewardRate.multiply(BIG_INT_SECONDS_IN_WEEK).toFixed(4, { groupSeparator: ',' })
                  : '--'}
                {'  '}
              </Text>
            </InformationWrapper>
            <InformationWrapper>
              <Text>{'Annual Stake APR'}</Text>
              <Text>{apy?.multiply('100').toFixed(2, { groupSeparator: ',' }) ?? '--'}% </Text>
            </InformationWrapper>
            <ExternalLink
              style={{ textDecoration: 'underline', textAlign: 'left' }}
              target="_blank"
              href="https://explorer.celo.org/address/0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC/transactions"
            >
              <Text fontSize={14} fontWeight={600}>
                {'View UBE Contract'}
              </Text>
            </ExternalLink>
            <ExternalLink
              style={{ textDecoration: 'underline', textAlign: 'left' }}
              target="_blank"
              href="https://info.ubeswap.org/token/0x00be915b9dcf56a3cbe739d9b9c202ca692409ec"
            >
              <Text fontSize={14} fontWeight={600}>
                {'View UBE Chart'}
              </Text>
            </ExternalLink>
          </StakeCollapseCard>
        )}
      </TopSection>
      <ChangeDelegateModal isOpen={showChangeDelegateModal} onDismiss={() => setShowChangeDelegateModal(false)} />
      <ViewProposalModal
        isOpen={showViewProposalModal}
        proposalId={selectedProposal}
        onDismiss={() => setShowViewProposalModal(false)}
      />
    </>
  )
}
