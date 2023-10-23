import 'rc-drawer/assets/index.css'

import { ChainId, useCelo } from '@celo/react-celo'
import { CELO, ChainId as UbeswapChainId, TokenAmount } from '@ubeswap/sdk'
import { CardNoise } from 'components/earn/styled'
import Modal from 'components/Modal'
import Hamburger from 'hamburger-react'
import usePrevious from 'hooks/usePrevious'
import { darken } from 'polished'
import Drawer from 'rc-drawer'
import React, { useState } from 'react'
import { Moon, Sun } from 'react-feather'
import { NavLink } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'
import { TYPE } from 'theme'
import { ExternalLink } from 'theme/components'
import { CountUp } from 'use-count-up'
import { relevantDigits } from 'utils/relevantDigits'

import Icon from '../../assets/svg/icon-ube.svg'
import Logo from '../../assets/svg/logo.svg'
import LogoDark from '../../assets/svg/logo-dark.svg'
import brokenswapIcon from '../../assets/images/brokenswap-icon.png';
import brokenswapLogo from '../../assets/images/brokenswap-logo.png';
import { useDarkModeManager } from '../../state/user/hooks'
import { YellowCard } from '../Card'
import Row, { RowFixed } from '../Row'
import { CloseIcon } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  flex: 1 1;
  position: relative;
  padding: 1rem;
`

const HeaderFrame = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem;
  z-index: 2;

  @media (max-width: 1115px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
    width: calc(100%);
    position: relative;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
        padding: 0.5rem 1rem;
  `}
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;

  @media (max-width: 1115px) {
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    width: 100%;
    max-width: 1115px;
    padding: 1rem;
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    z-index: 99;
    height: 72px;
    border-radius: 12px 12px 0 0;
    background-color: ${({ theme }) => theme.bg1};
  }
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;

  /* addresses safari's lack of support for "gap" */
  & > *:not(:first-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
   flex-direction: row-reverse;
    align-items: center;
  `};
`

const HeaderElementWrap = styled.div`
  display: flex;
  align-items: center;
`

const HeaderRow = styled(RowFixed)`
  @media (max-width: 1115px) {
    width: 100%;
  }
`

const HeaderLinks = styled(Row)`
  justify-content: center;
  @media (max-width: 1115px) {
    padding: 1rem 0 1rem 1rem;
    justify-content: flex-end;
  }
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 12px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;

  :focus {
    border: 1px solid blue;
  }
`

const HideSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const NetworkCard = styled(YellowCard)`
  border-radius: 12px;
  padding: 8px 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const Title = styled(NavLink)`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`

const UbeIcon = styled.div`
  transition: transform 0.3s ease;
  :hover {
    transform: rotate(-5deg);
  }
`

const activeClassName = 'ACTIVE'

export const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  @media (max-width: 320px) {
    margin: 0 8px;
  }
`

export const StyledNavLinkExtraSmall = styled(StyledNavLink).attrs({
  activeClassName,
})`
  @media (max-width: 550px) {
    display: none;
  }
`

const StyledExternalLink = styled(ExternalLink).attrs({
  activeClassName,
})<{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      display: none;
`}
`

export const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};
  margin-left: 8px;
  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }

  svg {
    margin-top: 2px;
  }
  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

export const StyledDesktopLogo = styled.img`
  display: inline;
  @media (max-width: 1225px) {
    display: none;
  }
  @media (max-width: 1115px) {
    display: inline;
  }
  @media (max-width: 655px) {
    display: none;
  }
  @media (max-width: 550px) {
    display: inline;
  }
  @media (max-width: 415px) {
    display: none;
  }
`

export const StyledMobileLogo = styled.img`
  display: none;
  @media (max-width: 1225px) {
    display: inline;
  }
  @media (max-width: 1115px) {
    display: none;
  }
  @media (max-width: 655px) {
    display: inline;
  }
  @media (max-width: 550px) {
    display: none;
  }
  @media (max-width: 415px) {
    display: inline;
  }
`

export const BurgerElement = styled(HeaderElement)`
  display: none;
  @media (max-width: 550px) {
    display: flex;
  }
`

export const StyledDrawer = styled(Drawer)`
  & .drawer-content-wrapper {
    background: ${({ theme }) => theme.bg3};
    color: ${({ theme }) => theme.text1};
  }
`

export const StyledMenu = styled.ul`
  padding-left: 0px;
  list-style: none;
`
export const StyledMenuItem = styled.li`
  padding: 10px 0px 10px 20px;
`
export const StyledSubMenuItem = styled(StyledMenuItem)`
  padding-left: 30px;
`

const StyledDrawerExternalLink = styled(StyledExternalLink).attrs({
  activeClassName,
})<{ isActive?: boolean }>`
  text-decoration: none;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      display: flex;
`}
`

export default function Header() {
  const userCELOBalance = 0
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  const [showUbeBalanceModal, setShowUbeBalanceModal] = useState<boolean>(false)

  const [showMessageModal, setShowMessageModal] = useState(false)
  const openMessageModal = () => {
    setShowMessageModal(true)
  }

  const [drawerVisible, setDrawerVisible] = useState<boolean>(false)

  const onDrawerClose = () => {
    setDrawerVisible(false)
  }

  const onToggle = (toggled: boolean) => {
    setDrawerVisible(toggled)
  }

  return (
    <HeaderFrame>
      <HeaderRow>
        <Title to="/">
          <UbeIcon>
            <StyledMobileLogo width={'32px'} height={'36px'} src={brokenswapIcon} alt="Brokenswap" />
            <StyledDesktopLogo width={'265px'} height={'50px'} src={brokenswapLogo} alt="Brokenswap" />
          </UbeIcon>
        </Title>
        <HeaderLinks>
          <StyledNavLink id={`swap-nav-link`} to={'/swap'}>
            {'Swap'}
          </StyledNavLink>
          <StyledNavLink
            id={`pool-nav-link`}
            to={'/pool'}
            isActive={(match, { pathname }) =>
              Boolean(match) ||
              pathname.startsWith('/add') ||
              pathname.startsWith('/remove') ||
              pathname.startsWith('/create') ||
              pathname.startsWith('/find')
            }
          >
            {'Pool'}
          </StyledNavLink>
          <StyledNavLink id={`docs-nav-link`} to={'/docs'}>
            {'Docs'}
          </StyledNavLink>
          <StyledNavLink id={`swap-nav-link`} to={'/connection'}>
            {'Connection Info'}
          </StyledNavLink>
        </HeaderLinks>
      </HeaderRow>
      <HeaderControls>
        <HeaderElement>Balance</HeaderElement>
        <HeaderElementWrap>
          <Modal isOpen={showMessageModal} onDismiss={() => setShowMessageModal(false)}>
            <ContentWrapper gap={'12px'}>
              <AutoColumn gap="12px">
                <RowBetween>
                  <Text fontWeight={500} fontSize={18}>
                    {'lol nice try, only dark mode allowed in this CTF sry.'}
                  </Text>
                  <CloseIcon onClick={() => setShowMessageModal(false)} />
                </RowBetween>
              </AutoColumn>
            </ContentWrapper>
          </Modal>
          <StyledMenuButton aria-label={'Toggle Dark Mode'} onClick={openMessageModal}>
            {darkMode ? <Moon size={20} /> : <Moon size={20} />}
          </StyledMenuButton>
        </HeaderElementWrap>
      </HeaderControls>
    </HeaderFrame>
  )
}

const UBEAmount = styled(AccountElement)`
  color: white;
  padding: 4px 8px;
  height: 36px;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg3};
  background: radial-gradient(174.47% 188.91% at 1.84% 0%, ${({ theme }) => theme.primary1} 0%, #2172e5 100%), #edeef2;
`

const UBEWrapper = styled.span`
  width: fit-content;
  position: relative;
  cursor: pointer;
  Connection :hover {
    opacity: 0.8;
  }
  :active {
    opacity: 0.9;
  }
`
