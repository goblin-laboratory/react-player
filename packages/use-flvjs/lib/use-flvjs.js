import React from 'react';
// import flvjs from 'flv.js';

const getElement = (getEl, timeout = 3000) => {
  return new Promise(resolve => {
    const el = getEl();
    if (el) {
      resolve(el);
      return;
    }
    setTimeout(() => {
      resolve(getEl());
    }, timeout);
  });
};

const getScript = src => {
  return new Promise((resolve, reject) => {
    const script = global.document.createElement('script');
    global.document.body.appendChild(script);
    script.onload = resolve;
    script.onerror = reject;
    script.async = true;
    script.src = src;
  });
};

// eslint-disable-next-line no-console
const debug = console.error;

export default ({ src, config, onKernelError }, getVideoElement) => {
  const [flvPlayer, setFlvPlayer] = React.useState(null);
  const [kernelMsg, setKernelMsg] = React.useState(null);

  const ref = React.useRef('');

  const onFlvError = React.useCallback(
    (type, detail) => {
      const info = { type, detail };
      setKernelMsg(info);
      onKernelError(info);
    },
    [onKernelError],
  );

  React.useEffect(() => {
    const play = async () => {
      if (!src) {
        return;
      }
      const el = await getElement(getVideoElement);
      if (ref.current !== src) {
        return;
      }
      if (!el) {
        ref.current = '';
        // TODO: 提示用户
        debug('useFlvjs: 获取 video 元素失败');
        return;
      }
      if (!global.flvjs) {
        await getScript('https://unpkg.com/flv.js/dist/flv.min.js');
        if (!global.flvjs) {
          debug('useFlvjs: 加载 flv.js 失败');
          return;
        }
      }
      setFlvPlayer(global.flvjs.createPlayer({ isLive: true, type: 'flv', url: src }, { ...config }));
    };

    ref.current = src;
    setFlvPlayer(null);
    play();
  }, [getVideoElement, src, config]);

  React.useEffect(() => {
    const el = getVideoElement();
    if (!flvPlayer || !el) {
      return () => {};
    }
    flvPlayer.on(global.flvjs.Events.ERROR, onFlvError);
    flvPlayer.attachMediaElement(el);
    flvPlayer.load();
    // TODO: autoPlay
    flvPlayer.play();
    return () => {
      if (!flvPlayer) {
        return;
      }
      try {
        flvPlayer.off(global.flvjs.Events.ERROR, onFlvError);
      } catch (errMsg) {
        // debugger;
      }
      try {
        flvPlayer.pause();
      } catch (errMsg) {
        // debugger;
      }
      try {
        flvPlayer.unload();
      } catch (errMsg) {
        // debugger;
      }
      try {
        flvPlayer.detachMediaElement();
      } catch (errMsg) {
        // debugger;
      }
      try {
        flvPlayer.destroy();
      } catch (errMsg) {
        // debugger;
      }
    };
  }, [getVideoElement, flvPlayer, onFlvError]);

  React.useEffect(() => {
    return () => setKernelMsg(null);
  }, [src]);

  return kernelMsg;
};
