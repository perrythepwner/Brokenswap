import React from 'react'

import Modal from '../Modal'

const ChangeNetworkModal: React.FC = () => {
  return (
    <Modal isOpen={true} onDismiss={() => null} maxHeight={24} minHeight={24}>
      <div style={{ width: '100%', margin: '16px' }}>
        <div>
          <span>{'Unsupported network'}</span>
        </div>
        <hr style={{ marginBottom: '28px' }} />
        <div>
          <span>{'Please switch your network to Celo on your wallet to use this feature.'}</span>
        </div>
      </div>
    </Modal>
  )
}

export default ChangeNetworkModal
