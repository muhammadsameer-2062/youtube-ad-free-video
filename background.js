chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "open-ad-free-video-in-new-tab") {
    return false;
  }

  let senderHostname;
  try {
    senderHostname = sender.tab?.url ? new URL(sender.tab.url).hostname : "";
  } catch (error) {
    console.error("Could not validate the sender tab URL:", error);
    senderHostname = "";
  }

  if (
    typeof message.videoId !== "string" ||
    !/^[A-Za-z0-9_-]{11}$/.test(message.videoId) ||
    !(senderHostname === "youtube.com" || senderHostname.endsWith(".youtube.com"))
  ) {
    sendResponse({ success: false, error: "Invalid video request." });
    return false;
  }

  const url =
    `https://muhammadsameer-2062.github.io/youtube-ad-free-video/redirect.html` +
    `?v=${encodeURIComponent(message.videoId)}`;
  chrome.tabs.create({ url, active: false }, (tab) => {
    if (chrome.runtime.lastError) {
      console.error("Could not create an ad-free video tab:", chrome.runtime.lastError.message);
      sendResponse({ success: false, error: chrome.runtime.lastError.message });
      return;
    }

    if (!tab) {
      sendResponse({ success: false, error: "The browser did not create a new tab." });
      return;
    }

    sendResponse({ success: true });
  });

  return true;
});
