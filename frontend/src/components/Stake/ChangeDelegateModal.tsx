import { useCelo } from '@celo/react-celo'
import { ChainId } from '@ubeswap/sdk'
import { ButtonError } from 'components/Button'
import { SearchInput } from 'components/SearchModal/styleds'
import { useDoTransaction } from 'components/swap/routing'
import { usePoofTokenContract } from 'hooks/useContract'
import React, { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'
import { useRomulusInfo } from 'utils/useRomulusInfo'
import { isAddress } from 'web3-utils'

import { ubeGovernanceAddresses } from '../../constants'
import { CloseIcon } from '../../theme'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import Row, { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  flex: 1 1;
  position: relative;
  padding: 1rem;
`

interface ChangeDelegateModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export default function ChangeDelegateModal({ isOpen, onDismiss }: ChangeDelegateModalProps) {
  const { network } = useCelo()
  const inputRef = useRef<HTMLInputElement>()
  const [delegateAddress, setDelegateAddress] = useState<string>('')
  const [error, setError] = useState<string | undefined>('ChangeDelegate')

  const romulusAddress = ubeGovernanceAddresses[network.chainId as ChainId]
  const { tokenAddress } = useRomulusInfo(romulusAddress)
  const c = usePoofTokenContract(tokenAddress)
  const doTransaction = useDoTransaction()

  const handleInput = (event: any) => {
    const input = event.target.value
    setDelegateAddress(input)
  }

  useEffect(() => {
    if (delegateAddress.length === 0) {
      setError('Change Delegate')
    } else if (isAddress(delegateAddress)) {
      setError(undefined)
    } else {
      if (delegateAddress.length > 0) {
        setError('Enter Valid Delegate Address')
      } else {
        setError(undefined)
      }
    }
  }, [delegateAddress])

  const onConfirm = useCallback(async () => {
    if (c) {
      await doTransaction(c, 'delegate', {
        args: [delegateAddress],
        summary: `Change Delegate Address`,
      })
      setDelegateAddress('')
    }
    onDismiss()
  }, [c, onDismiss, doTransaction, delegateAddress])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <ContentWrapper gap={'12px'}>
        <AutoColumn gap="12px">
          <RowBetween>
            <Text fontWeight={500} fontSize={16}>
              {'Change Delegate'}
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <Row>
            <SearchInput
              type="text"
              id="delegate-input"
              placeholder={'Enter Delegate Address'}
              autoComplete="off"
              value={delegateAddress}
              ref={inputRef as RefObject<HTMLInputElement>}
              onChange={handleInput}
            />
          </Row>
        </AutoColumn>
        <ButtonError disabled={!!error} onClick={onConfirm}>
          {error ? error : 'Change Delegate'}
        </ButtonError>
      </ContentWrapper>
    </Modal>
  )
}
