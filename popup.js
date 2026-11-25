const redirectButton = document.getElementById("redirect");
const statusMessage = document.getElementById("status");

function showMessage(message) {
  redirectButton.hidden = true;
  statusMessage.textContent = message;
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

    statusMessage.textContent = "";
    redirectButton.hidden = false;
  } catch (error) {
    console.error("Could not check the current tab:", error);
    showMessage("Could not check the current tab.");
  }
}

redirectButton.addEventListener("click", async () => {
  statusMessage.textContent = "";

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!activeTab?.url || activeTab.id === undefined) {
      statusMessage.textContent = "Could not read the current tab.";
      return;
    }

    const videoId = getVideoId(activeTab.url);

    if (!videoId) {
      showMessage("Open a YouTube video to use this extension.");
      return;
    }

    const destination = `https://www.yout-ube.com/embed/${encodeURIComponent(videoId)}`;
    await chrome.tabs.update(activeTab.id, { url: destination });
  } catch (error) {
    console.error("Could not redirect the current YouTube video:", error);
    statusMessage.textContent = "Could not redirect this tab.";
  }
});

showPopupState();
