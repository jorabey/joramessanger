import React from 'react';

const loaderStyles = `
  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes topDot {
    0%, 100% {
      transform: translate(-50%, -50%) translateY(-14px) scale(0.7);
      opacity: 0.45;
    }
    50% {
      transform: translate(-50%, -50%) translateY(-32px) scale(1.2);
      opacity: 1;
    }
  }

  @keyframes rightDot {
    0%, 100% {
      transform: translate(-50%, -50%) translateX(14px) scale(0.7);
      opacity: 0.45;
    }
    50% {
      transform: translate(-50%, -50%) translateX(32px) scale(1.2);
      opacity: 1;
    }
  }

  @keyframes bottomDot {
    0%, 100% {
      transform: translate(-50%, -50%) translateY(14px) scale(0.7);
      opacity: 0.45;
    }
    50% {
      transform: translate(-50%, -50%) translateY(32px) scale(1.2);
      opacity: 1;
    }
  }

  @keyframes leftDot {
    0%, 100% {
      transform: translate(-50%, -50%) translateX(-14px) scale(0.7);
      opacity: 0.45;
    }
    50% {
      transform: translate(-50%, -50%) translateX(-32px) scale(1.2);
      opacity: 1;
    }
  }

  .oneui-loader {
    position: relative;
    width: 90px;
    height: 90px;
    animation: rotate 2s linear infinite;
  }

  .oneui-dot {
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    margin: -7px;
    filter: blur(0.2px);
  }

  /* Oq rejim uchun ranglar */
  @media (prefers-color-scheme: light) {
    .oneui-dot { background: #000; box-shadow: 0 0 10px rgba(0, 0, 0, 0.4); }
  }

  /* Qora rejim uchun ranglar */
  @media (prefers-color-scheme: dark) {
    .oneui-dot { background: #fff; box-shadow: 0 0 10px rgba(255, 255, 255, 0.4); }
  }

  .oneui-dot:nth-child(1) { animation: topDot   1s ease-in-out infinite; }
  .oneui-dot:nth-child(2) { animation: rightDot  1s ease-in-out infinite; }
  .oneui-dot:nth-child(3) { animation: bottomDot 1s ease-in-out infinite; }
  .oneui-dot:nth-child(4) { animation: leftDot   1s ease-in-out infinite; }
`;

const Loader = ({ fullScreen = false }) => {
  const loaderEl = (
    <>
      <style>{loaderStyles}</style>
      <div className="oneui-loader">
        <div className="oneui-dot" />
        <div className="oneui-dot" />
        <div className="oneui-dot" />
        <div className="oneui-dot" />
      </div>
    </>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-[99999] bg-white dark:bg-black flex items-center justify-center pointer-events-none transition-colors duration-300"
      >
        {loaderEl}
      </div>
    );
  }

  return loaderEl;
};

export default Loader;
