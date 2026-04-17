import React from 'react';
import styled from 'styled-components';

const ContactCard = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="background"></div>
        <div className="logo cursor-none">
          <div className="text-text-primary text-xl font-bold font-mono tracking-widest">CONNECT</div>
        </div>
        
        <a href="mailto:krishnarajus2004@gmail.com" className="box box1 cursor-none">
          <span className="icon text-text-primary font-mono text-xs uppercase tracking-wide">Email</span>
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="box box2 cursor-none"> 
          <span className="icon text-text-primary font-mono text-xs uppercase tracking-wide">LinkedIn</span>
        </a>
        <a href="https://github.com/KRISH-exe-29" target="_blank" rel="noopener noreferrer" className="box box3 cursor-none">
          <span className="icon text-text-primary font-mono text-xs uppercase tracking-wide">GitHub</span>
        </a>
        <div className="box box4" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    position: relative;
    width: 250px;
    height: 250px;
    background: var(--bg-secondary);
    border-radius: 30px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    transition: all 1s ease-in-out;
    margin: 0 auto;
  }

  .background {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 100% 107%, var(--color-primary) 0%, var(--color-accent) 50%, transparent 100%);
    opacity: 0.15;
    transition: opacity 0.5s;
  }
  
  .card:hover .background {
    opacity: 0.4;
  }

  .logo {
    position: absolute;
    right: 50%;
    bottom: 50%;
    transform: translate(50%, 50%);
    transition: all 0.6s ease-in-out;
    z-index: 2;
  }

  .logo .text-text-primary {
      letter-spacing: 0.3em;
      font-size: 1.25rem;
      opacity: 0.8;
  }

  .box {
    position: absolute;
    padding: 10px;
    text-align: right;
    background: var(--bg-primary);
    border-top: 2px solid var(--border);
    border-right: 1px solid var(--border);
    border-radius: 10% 13% 42% 0%/10% 12% 75% 0%;
    box-shadow: rgba(0, 0, 0, 0.2) -7px 7px 29px 0px;
    transform-origin: bottom left;
    transition: all 1s ease-in-out;
    text-decoration: none;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
  }

  .box::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    transition: all 0.5s ease-in-out;
    z-index: -1;
  }

  .box:hover .icon {
    color: var(--color-primary);
  }

  .box1 {
    width: 70%;
    height: 70%;
    bottom: -70%;
    left: -70%;
  }

  .box1::before {
    background: radial-gradient(circle at 30% 107%, color-mix(in srgb, var(--color-primary) 50%, transparent) 0%, color-mix(in srgb, var(--color-accent) 30%, transparent) 90%);
  }

  .box1:hover::before {
    opacity: 1;
  }

  .box2 {
    width: 50%;
    height: 50%;
    bottom: -50%;
    left: -50%;
    transition-delay: 0.2s;
  }

  .box2::before {
    background: radial-gradient(circle at 30% 107%, color-mix(in srgb, var(--color-accent) 50%, transparent) 0%, color-mix(in srgb, var(--color-primary) 30%, transparent) 90%);
  }

  .box2:hover::before {
    opacity: 1;
  }

  .box3 {
    width: 30%;
    height: 30%;
    bottom: -30%;
    left: -30%;
    transition-delay: 0.4s;
  }

  .box3::before {
    background: radial-gradient(circle at 30% 107%, var(--border) 0%, transparent 90%);
  }

  .box3:hover::before {
    opacity: 1;
  }

  .box4 {
    width: 10%;
    height: 10%;
    bottom: -10%;
    left: -10%;
    transition-delay: 0.6s;
  }

  .card:hover {
    transform: scale(1.1);
  }

  .card:hover .box {
    bottom: -1px;
    left: -1px;
  }

  .card:hover .logo {
    transform: translate(0, 0);
    bottom: 20px;
    right: 20px;
  }
`;

export default ContactCard;
