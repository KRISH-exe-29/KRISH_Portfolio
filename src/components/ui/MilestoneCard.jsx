import React from 'react';
import styled from 'styled-components';

const MilestoneCard = ({ title, details, icon, media }) => {
  return (
    <StyledWrapper>
      <div className="card">
        {media ? (
           <img src={media} alt={title} className="w-full h-full object-cover grayscale transition-all duration-500 hover:grayscale-0" />
        ) : (
           <div className="flex justify-center items-center w-full h-full bg-black/10">
              {icon}
           </div>
        )}
        <div className="card__content">
          <p className="card__title font-cinzel text-lg">{title}</p>
          <p className="card__description font-inter text-sm">{details}</p>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    position: relative;
    width: 340px;
    height: 220px;
    background-color: #111;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    perspective: 1000px;
    box-shadow: 0 0 0 1px rgba(255,184,0,0.2);
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .card:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 16px rgba(255,184,0, 0.15);
  }

  .card__content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    background-color: #0d1117;
    border: 1px solid rgba(255,184,0,0.5);
    transform: rotateX(-90deg);
    transform-origin: bottom;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .card:hover .card__content {
    transform: rotateX(0deg);
  }

  .card__title {
    margin: 0;
    color: #FFB800;
    font-weight: 700;
  }

  .card__description {
    margin: 10px 0 0;
    color: #aaa;
    line-height: 1.4;
  }`;

export default MilestoneCard;
