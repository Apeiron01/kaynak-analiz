(() => {
  if (window.fbq) {
    return;
  }

  const fbq = function () {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, arguments);
      return;
    }

    fbq.queue.push(arguments);
  };

  if (!window._fbq) {
    window._fbq = fbq;
  }

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";

  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  fbq("init", "2945635578979261");
  fbq("track", "PageView");
})();
