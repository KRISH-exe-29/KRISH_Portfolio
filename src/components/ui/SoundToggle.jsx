import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import engine from '../../utils/audioEngine';
import { TbVolume, TbVolume3 } from 'react-icons/tb';

const SoundToggle = () => {
  const [isOn, setIsOn] = useState(true);

  const toggleSound = () => {
    const nextState = !isOn;
    setIsOn(nextState);
    engine.setMuted(!nextState);
    if (nextState) engine.playToggle();
  };

  return (
    <StyledWrapper onClick={toggleSound}>
      <div className="sound-control cursor-none">
        <div className="icon">
          {isOn ? (
            <TbVolume size={18} className="text-color-primary" />
          ) : (
            <TbVolume3 size={18} className="opacity-40" />
          )}
        </div>
        <span className="label font-mono text-[10px] tracking-widest uppercase">
          {isOn ? 'Sound: ON' : 'Sound: OFF'}
        </span>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .sound-control {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    transition: all 0.3s ease;
  }

  .sound-control:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--color-primary);
    transform: translateY(-1px);
  }

  .label {
    min-width: 70px;
    color: var(--text-secondary);
  }

  .sound-control:hover .label {
    color: var(--text-primary);
  }
`;

export default SoundToggle;
