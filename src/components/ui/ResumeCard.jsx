import React from 'react';
import styled from 'styled-components';
import { TbDownload } from 'react-icons/tb';
import engine from '../../utils/audioEngine';

const ResumeCard = () => {
  return (
    <StyledWrapper>
      <a 
        href="https://drive.google.com/file/d/1qtC5b7YPsODuOaratxb8ePHLfpfPsdv4/view?usp=sharing" 
        target="_blank" 
        rel="noopener noreferrer"
        className="resume-card"
        onMouseEnter={() => engine.playHover()}
        onClick={() => engine.playClick()}
      >
        <div className="card-inner">
          <div className="card-text">
            <span className="card-title">KR</span>
            <span className="card-sub">Resume</span>
            <span className="card-note">Opens latest version</span>
          </div>
          <div className="card-btn mt-6">
            <span>Download</span>
            <TbDownload size={20} />
          </div>
        </div>
        {/* Decorative person silhouette */}
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="card-svg card-svg-1">
          <path strokeWidth={4} strokeMiterlimit={10} d="M 50.4 51 C 40.5 49.1 40 46 40 44 v -1.2 a 18.9 18.9 0 0 0 5.7 -8.8 h 0.1 c 3 0 3.8 -6.3 3.8 -7.3 s 0.1 -4.7 -3 -4.7 C 53 4 30 0 22.3 6 c -5.4 0 -5.9 8 -3.9 16 c -3.1 0 -3 3.8 -3 4.7 s 0.7 7.3 3.8 7.3 c 1 3.6 2.3 6.9 4.7 9 v 1.2 c 0 2 0.5 5 -9.5 6.8 S 2 62 2 62 h 60 a 14.6 14.6 0 0 0 -11.6 -11 z" />
        </svg>
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="card-svg card-svg-2">
          <path strokeWidth={2} strokeMiterlimit={10} d="M 50.4 51 C 40.5 49.1 40 46 40 44 v -1.2 a 18.9 18.9 0 0 0 5.7 -8.8 h 0.1 c 3 0 3.8 -6.3 3.8 -7.3 s 0.1 -4.7 -3 -4.7 C 53 4 30 0 22.3 6 c -5.4 0 -5.9 8 -3.9 16 c -3.1 0 -3 3.8 -3 4.7 s 0.7 7.3 3.8 7.3 c 1 3.6 2.3 6.9 4.7 9 v 1.2 c 0 2 0.5 5 -9.5 6.8 S 2 62 2 62 h 60 a 14.6 14.6 0 0 0 -11.6 -11 z" />
        </svg>
      </a>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .resume-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    border-radius: 30px;
    height: 250px;
    width: 250px;
    background: var(--color-primary);
    padding: 0;
    transition: all 0.5s ease;
    transform: perspective(400px) rotateY(-5deg) rotateX(3deg);
    text-decoration: none;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .resume-card:hover {
    transform: perspective(400px) rotateY(0deg) rotateX(0deg);
    box-shadow: 0 8px 30px color-mix(in srgb, var(--color-primary) 40%, transparent);
  }

  .card-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    z-index: 2;
    position: relative;
    gap: 8px;
  }

  .card-text {
    display: flex;
    flex-direction: column;
    line-height: 1;
    align-items: center;
  }

  .card-title {
    font-weight: 800;
    font-size: 52px;
    color: var(--bg-primary);
    font-family: 'Cinzel Decorative', serif;
  }

  .card-sub {
    font-size: 14px;
    color: var(--bg-primary);
    opacity: 0.8;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .card-note {
    font-size: 8px;
    color: var(--bg-primary);
    opacity: 0.5;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .card-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    border-radius: 12px;
    background: var(--bg-primary);
    color: var(--color-primary);
    font-size: 14px;
    font-weight: 700;
    transition: all 0.3s ease;
    gap: 8px;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .resume-card:hover .card-btn {
    background: var(--bg-secondary);
    color: var(--text-primary);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .card-svg {
    position: absolute;
    bottom: -10px;
    right: -20px;
    width: 120px;
    height: 120px;
    z-index: 1;
    transition: all 0.5s ease;
  }

  .card-svg-1 {
    fill: var(--bg-primary);
    stroke: var(--color-primary);
    opacity: 0.15;
  }

  .card-svg-2 {
    fill: var(--bg-primary);
    stroke: var(--color-primary);
    opacity: 0.08;
    transition-duration: 0.2s;
  }

  .resume-card:hover .card-svg {
    transform: scale(1.2);
  }
`;

export default ResumeCard;
