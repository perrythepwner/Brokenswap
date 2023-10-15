import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import { RowFixed } from '../../components/Row'

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

export default function ConnectionInfo() {
  const [connectionInfo, setConnectionInfo] = useState(null)

  useEffect(() => {
    // Fetch connection info when the component mounts
    fetch('/connection_info')
      .then((response) => response.json())
      .then((data) => {
        const formattedData = JSON.stringify(data, null, 4)
        setConnectionInfo(formattedData)
      })
  }, [])

  const syntaxHighlight = (json) => {
    // Implement your syntax highlighting logic here
    // You can adapt your existing function to work with React's JSX
  }

  const copyToClipboard = () => {
    if (connectionInfo) {
      navigator.clipboard.writeText(connectionInfo)
      // Implement your alert logic here
    }
  }

  const restart = () => {
    // Implement your restart logic here
  }

  return (
    <>
      <div>
        <pre id="jsonCode">{connectionInfo}</pre>
      </div>
      <ButtonRow>
        <ResponsiveButtonSecondary as={copyToClipboard} padding="6px 8px" to="/create/ETH">
          {'Copy to Clipboard'}
        </ResponsiveButtonSecondary>
        <ResponsiveButtonPrimary id="join-pool-button" as={restart} padding="6px 8px" borderRadius="12px" to="/add/ETH">
          <Text fontWeight={500} fontSize={16}>
            {'Restart'}
          </Text>
        </ResponsiveButtonPrimary>
      </ButtonRow>
    </>
  )
}
