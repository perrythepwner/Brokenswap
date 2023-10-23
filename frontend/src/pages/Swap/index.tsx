// @ts-nocheck
import { useCelo } from '@celo/react-celo'
import { JsonRpcProvider } from '@ethersproject/providers'
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk'
import { CELO, ChainId as UbeswapChainId, JSBI, Token, TokenAmount, Trade } from '@ubeswap/sdk'
import OpticsV1Warning from 'components/Header/OpticsV1Warning'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { useIsTransactionUnsupported } from 'hooks/Trades'
import useENS from 'hooks/useENS'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import ReactGA, { send } from 'react-ga'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'

import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import Card, { GreyCard } from '../../components/Card'
import Column, { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import Loader from '../../components/Loader'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import ProgressSteps from '../../components/ProgressSteps'
import { AutoRow, RowBetween } from '../../components/Row'
import AdvancedSwapDetailsDropdown from '../../components/swap/AdvancedSwapDetailsDropdown'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import SwapHeader from '../../components/swap/SwapHeader'
import TradePrice from '../../components/swap/TradePrice'
import TokenWarningModal from '../../components/TokenWarningModal'
import { INITIAL_ALLOWED_SLIPPAGE } from '../../constants'
import { useAllTokens, useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback'
import { useContract } from '../../hooks/useContract'
import { SendSwap } from '../../hooks/useContract'
import { useToggleSettingsMenu, useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
} from '../../state/swap/hooks'
import { useExpertModeManager, useUserSingleHopOnly, useUserSlippageTolerance } from '../../state/user/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { computeTradePriceBreakdown, warningSeverity } from '../../utils/prices'
import AppBody from '../AppBody'
import { useSingleCallResult } from '../../state/multicall/hooks'

import { Contract } from '@ethersproject/contracts'
import { ethers } from 'ethers'
import { getWeb3Provider } from '../../hooks/useContract'
import { ConnectionInfo } from '../Connection'
import BROKENSWAP_ABI from '../../constants/Brokenswap.json'
import { CloseIcon } from '../../theme'
import Modal from '../../components/Modal'
import styled from 'styled-components'

// to-do: move to /abis/
const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  flex: 1 1;
  position: relative;
  padding: 1rem;
`

export default function Swap() {
  const theme = useContext(ThemeContext)

  // for expert mode
  // const toggleSettings = useToggleSettingsMenu()
  // const [isExpertMode] = useExpertModeManager()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const {
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    showRamp,
  } = useDerivedSwapInfo()
  const parsedAmounts = {
    [Field.INPUT]: parsedAmount,
    [Field.OUTPUT]: parsedAmount,
  }
  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )
  // check whether the user has approved the router on the input token
  //const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  //useEffect(() => {
  //  if (approval === ApprovalState.PENDING) {
  //    setApprovalSubmitted(true)
  //  }
  //}, [approval, approvalSubmitted])

  //const maxAmountInput: TokenAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const maxAmountInput: TokenAmount | undefined = maxAmountSpend(500)

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: true, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: undefined, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  const handleHalfInput = useCallback(() => {
    if (maxAmountInput) {
      onUserInput(Field.INPUT, Math.max(Number(maxAmountInput.toExact()) * 0.5, 0).toString())
    }
  }, [maxAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  )

  const [isInstanceRunning, setIsInstanceRunning] = useState(false)
  const connectionInfo = ConnectionInfo()

  useEffect(() => {
    if (Array.isArray(connectionInfo) && connectionInfo.length === 0) {
      setIsInstanceRunning(false)
    } else {
      setIsInstanceRunning(true)
    }
  }, [connectionInfo])

  const [showPopup, setShowPopup] = useState(false)

  const handleSendSwap = () => {
    if (isInstanceRunning) {
      SendSwap()
    } else {
      setShowPopup(true)
    }
  }

  async function SendSwap() {
    if (isInstanceRunning) {
      const BROKENSWAP_ADDRESS = connectionInfo['Target Contract']
      const provider = getWeb3Provider()
      const signer = new ethers.Wallet('0x5be4ad1a1d6c8298ec36dae3920bc0180ee928427b40ffaf3f26507abc303cbd', provider)
      const Brokenswap = new Contract(BROKENSWAP_ADDRESS, BROKENSWAP_ABI.abi, signer)
      const result = await Brokenswap.FEERATE()
      console.log('result', result)
      return result
    }
  }

  return (
    <>
      <SwapPoolTabs active={'swap'} />
      <AppBody>
        <SwapHeader title={'Swap'} />
        <Wrapper id="swap-page">
          <ConfirmSwapModal
            isOpen={showConfirm}
            trade={undefined}
            originalTrade={tradeToConfirm}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            allowedSlippage={undefined}
            onConfirm={SendSwap}
            swapErrorMessage={swapErrorMessage}
            onDismiss={handleConfirmDismiss}
          />

          <AutoColumn gap={'md'}>
            <CurrencyInputPanel
              label={'From'}
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={false}
              showHalfButton={false}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              onHalf={handleHalfInput}
              onCurrencySelect={handleInputSelect}
              otherCurrency={Field.OUTPUT}
              id="swap-currency-input"
            />
            <AutoColumn justify="space-between">
              <AutoRow justify={'center'} style={{ padding: '0 1rem' }}>
                <ArrowWrapper clickable>
                  <ArrowDown
                    size="16"
                    onClick={() => {
                      setApprovalSubmitted(false) // reset 2 step UI for approvals
                      handleTypeInput(formattedAmounts[Field.OUTPUT])
                      onSwitchTokens()
                    }}
                    color={currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.primary1 : theme.text2}
                  />
                </ArrowWrapper>
              </AutoRow>
            </AutoColumn>
            <CurrencyInputPanel
              value={formattedAmounts[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              label={independentField === Field.INPUT && 'To'}
              showMaxButton={false}
              currency={currencies[Field.OUTPUT]}
              onCurrencySelect={handleOutputSelect}
              otherCurrency={currencies[Field.INPUT]}
              id="swap-currency-output"
              disabled
            />

            {recipient !== null ? (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" color={theme.text2} />
                  </ArrowWrapper>
                  <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                    - Remove send
                  </LinkStyledButton>
                </AutoRow>
                <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
              </>
            ) : null}
            <Card padding={'0px'} borderRadius={'20px'}>
              <AutoColumn gap="8px" style={{ padding: '0 16px' }}>
                {Boolean(false) && (
                  <RowBetween align="center">
                    <Text fontWeight={500} fontSize={14} color={theme.text2}>
                      Price
                    </Text>
                    <TradePrice
                      price={trade?.executionPrice}
                      showInverted={showInverted}
                      setShowInverted={setShowInverted}
                    />
                  </RowBetween>
                )}
              </AutoColumn>
            </Card>
            <ButtonPrimary borderRadius="12px" onClick={handleSendSwap}>{`${'Swap'}`}</ButtonPrimary>
            <Modal isOpen={showPopup} onDismiss={() => setShowPopup(false)}>
              <ContentWrapper>
                <AutoColumn gap="12px">
                  <RowBetween>
                    <Text fontWeight={500} fontSize={18}>
                      {'No instance found!'}
                    </Text>
                    <CloseIcon onClick={() => setShowPopup(false)} />
                  </RowBetween>
                </AutoColumn>
              </ContentWrapper>
            </Modal>
          </AutoColumn>
        </Wrapper>
      </AppBody>
    </>
  )
}
