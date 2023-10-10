import { BigNumber } from 'ethers'
import styled from 'styled-components'
import { ExternalLink } from '../../theme'
import { RowFlat } from '../Row'

const Container = styled.div<{
  lastDisplayItem?: boolean
}>`
  background-color: ${({ theme }) => theme.bg1};
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  padding-left: 0.5rem;
  border-bottom: 2px solid ${({ theme }) => theme.primary5};
  ${({ lastDisplayItem }) =>
    lastDisplayItem &&
    `
border-bottom-style: none;
`}
`

const SymbolContainer = styled.div`
  width: 75%;
`

const AssetSymbol = styled.div`
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.primary5};
  padding: 0.5rem;
`

const AssetRow = styled(RowFlat)`
  margin-bottom: 0.5rem;
`
const SellText = styled.div`
  font-weight: 700;
  margin-top: 0.25rem;
`

const OrderToFill = styled.div`
  font-weight: 300;
  font-size: 14px;
  margin-top: 0.25rem;
`

export const StyledControlButton = styled.button`
  height: 24px;
  background-color: ${({ theme }) => theme.red1};
  border: 1px solid ${({ theme }) => theme.red2};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-left: 7rem;
  margin-right: 2rem;
  color: white;
  :hover {
    border: 1px solid ${({ theme }) => theme.red3};
    box-shadow: 0px 0px 10px 0px ${({ theme }) => theme.red3};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.red3};
    box-shadow: 0px 0px 10px 0px ${({ theme }) => theme.red3};
    outline: none;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-left: 0.4rem;
    margin-right: 0.1rem;
  `};
`

const AddressLink = styled(ExternalLink)`
  font-size: 0.825rem;
  color: ${({ theme }) => theme.text3};
  border-radius: 12px;
  width: 45%;
  padding: 0.25rem;
  margin-top: 0.5rem;
  border: 1px solid ${({ theme }) => theme.primary5};
  font-size: 0.825rem;
  display: flex;
  :hover {
    color: ${({ theme }) => theme.text2};
  }
`

const BaselineRow = styled(AssetRow)`
  align-items: baseline;
`