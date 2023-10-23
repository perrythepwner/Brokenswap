// @ts-nocheck
import { useCelo } from '@celo/react-celo'
import { ErrorBoundary } from '@sentry/react'
import React, { Suspense } from 'react'
import { Route, Switch } from 'react-router-dom'
import styled from 'styled-components'
import { isBanned } from 'utils/isBannedUser'

import Header from '../components/Header'
import Popups from '../components/Popups'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import Docs from './Docs'
import Earn from './Earn'
import Manage from './Earn/Manage'
import ManageSingle from './Earn/ManageSingle'
import Pool from './Pool'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects'
import Send from './Send'
import { Stake } from './Stake'
import AddProposal from './Stake/AddProposal'
import Swap from './Swap'
import { OpenClaimAddressModalAndRedirectToSwap, RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import Connection from './Connection'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
  min-height: 100vh;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 40px;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
  `};

  z-index: 1;
`

const Marginer = styled.div`
  margin-top: 5rem;
`

export default function App() {
  return (
    <Suspense fallback={null}>
      <AppWrapper>
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
        <BodyWrapper>
          <Popups />
          <ErrorBoundary fallback={<p>An unexpected error occured on this part of the page. Please reload.</p>}>
            <Switch>
              <Route exact strict path="/swap" component={Swap} />
              <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
              <Route exact strict path="/find" component={PoolFinder} />
              <Route exact strict path="/pool" component={Pool} />
              <Route exact strict path="/remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} />
              <Route exact strict path="/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
              <Route exact strict path="/docs" component={Docs} />
              <Route exact strict path="/connection" component={Connection} />
              <Route component={RedirectPathToSwapOnly} />
            </Switch>
          </ErrorBoundary>
          <Marginer />
        </BodyWrapper>
      </AppWrapper>
    </Suspense>
  )
}
