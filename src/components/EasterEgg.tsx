import React from 'react';
import MagnetLines from './styles/magnet';
import LocalizedText from './LocalizedText';


// A fun thing for users
const EasterEgg = () => {
  return (
    <section
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Watermark "HEY!" */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '18vw',
          fontWeight: 900,
          fontFamily: 'Montserrat, Arial, sans-serif',
          color: 'rgba(180,180,200,0.25)',
          background: 'linear-gradient(90deg, #c7d2fe 0%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '3vw',
          textShadow: '0 8px 24px rgba(80,80,80,0.12)',
          zIndex: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <LocalizedText text="HEY!" />
      </div>
      {/* MagnetLines grid with soft blur */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100vw',
          height: '100vh',
          opacity: 0.85,
          filter: 'blur(0.3px) saturate(1.2)',
        }}
      >
        <MagnetLines
          rows={20}
          columns={30}
          containerSize="full"
          lineColor="#5227FF"
          lineWidth="0.3vmin"
          lineHeight="5vmin"
          baseAngle={0}
          style={{ margin: "0rem 0rem" }}
        />
      </div>
    </section>
  );
};

export default EasterEgg;
