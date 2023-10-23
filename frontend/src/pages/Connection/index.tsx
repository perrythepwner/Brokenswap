import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

const BodyWrapper = styled.div`
  position: relative;
  width: auto;
  background: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 15px;
  padding: 2rem;
  font-size: 110%;
`

const Label = styled.span`
  font-weight: bold;
  color: #8979c5;
  margin-bottom: 0.5rem;
`

const InfoLabel = ({ label, value }) => (
  <div>
    <Label>{label}: </Label>
    {value}
  </div>
)

export function ConnectionInfo() {
  const [connectionData, setConnectionData] = useState([])
  const RPC_ENDPOINT = process.env.REACT_APP_RPC_ENDPOINT

  useEffect(() => {
    fetch(`connection-info-by-team/${RPC_ENDPOINT}`)
      .then((response) => response.json())
      .then((data) => setConnectionData(data))
      .catch((error) => {
        console.error(error)
        setConnectionData([])
      })
  }, [RPC_ENDPOINT])

  return connectionData
}

export default function Connection() {
  const connectionData = ConnectionInfo()
  return (
    <BodyWrapper>
      <InfoLabel label="Team UUID" value={connectionData['Team UUID']} />
      <InfoLabel label="Player UUID" value={connectionData['Player UUID']} />
      <InfoLabel label="RPC URL" value={connectionData['RPC URL']} />
      <InfoLabel label="Player Private Key" value={connectionData['Player Private Key']} />
      <InfoLabel label="Player Address" value={connectionData['Player Address']} />
      <InfoLabel label="Setup Contract" value={connectionData['Setup Contract']} />
      <InfoLabel label="Target Contract" value={connectionData['Target Contract']} />
      <InfoLabel label="Fees Pool Contract" value={connectionData['Fees Pool Contract']} />
      <InfoLabel label="WETH Token Contract" value={connectionData['WETH Token Contract']} />
      <InfoLabel label="HTB Token Contract" value={connectionData['HTB Token Contract']} />
    </BodyWrapper>
  )
}
