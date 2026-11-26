const redirectButton = document.getElementById("redirect");
const statusMessage = document.getElementById("status");
const statusText = document.getElementById("status-message");

function showMessage(message) {
  redirectButton.hidden = true;
  statusText.textContent = message;
  statusMessage.hidden = false;
}

function getVideoId(urlString) {
  const url = new URL(urlString);
  const isYoutubeHost =
    url.hostname === "youtube.com" ||
    url.hostname.endsWith(".youtube.com");

  if (!isYoutubeHost || url.pathname !== "/watch") {
    return null;
  }

  return url.searchParams.get("v") || null;
}

async function showPopupState() {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!activeTab?.url) {
      showMessage("Could not read the current tab.");
      return;
    }

    if (!getVideoId(activeTab.url)) {
      showMessage("Open a YouTube video to use this extension.");
      return;
    }

    statusText.textContent = "";
    statusMessage.hidden = true;
    redirectButton.hidden = false;
  } catch (error) {
    console.error("Could not check the current tab:", error);
    showMessage("Could not check the current tab.");
  }
}

redirectButton.addEventListener("click", async (event) => {
  statusText.textContent = "";
  statusMessage.hidden = true;

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!activeTab?.url || activeTab.id === undefined) {
      showMessage("Could not read the current tab.");
      return;
    }

    const videoId = getVideoId(activeTab.url);

    if (!videoId) {
      showMessage("Open a YouTube video to use this extension.");
      return;
    }

    const destination =
      `https://muhammadsameer-2062.github.io/youtube-ad-free-video/redirect.html` +
      `?v=${encodeURIComponent(videoId)}`;
    if (event.ctrlKey) {
      await chrome.tabs.create({ url: destination, active: false });
    } else {
      await chrome.tabs.update(activeTab.id, { url: destination });
    }
    window.close();
  } catch (error) {
    console.error("Could not redirect the current YouTube video:", error);
    showMessage(
      event.ctrlKey
        ? "Could not open the video in a new tab."
        : "Could not redirect this tab."
    );
  }
});

showPopupState();
