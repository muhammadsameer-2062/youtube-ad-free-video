// Auto-skip ads in the YouTube player (works on youtube.com watch pages,
// youtube-nocookie.com/embed pages, and YouTube iframes on other sites).
//
// Key facts this relies on:
//  - Ads and content play through the SAME <video class="html5-main-video">
//    element. (.ytp-ad-module only contains the overlay UI, not the video.)
//  - While an ad plays, the player root (.html5-video-player) gets the
//    class "ad-showing".
//  - Skippable ads show a skip button after ~5s; unskippable ads can only be
//    fast-forwarded by seeking the ad video to its end.

(() => {
  "use strict";

  let lastAttempt = 0;

  function trySkip() {
    const player = document.querySelector(".html5-video-player");
    if (!player || !player.classList.contains("ad-showing")) return;

    // Throttle: don't hammer the seek/click more than once per second.
    const now = Date.now();
    if (now - lastAttempt < 1000) return;

    // 1) Preferred: click the native skip button if it is rendered and visible.
    const skipBtn =
      document.querySelector(".ytp-skip-ad-button") ||
      document.querySelector(".ytp-ad-skip-button-modern") ||
      document.querySelector(".ytp-ad-skip-button");
    if (skipBtn && skipBtn.offsetParent !== null) {
      skipBtn.click();
      lastAttempt = now;
      return;
    }

    // 2) Fallback: jump the ad to its final half-second -> fires "ended".
    //    NOTE: query the main video element, NOT .ytp-ad-module video.
    const video =
      player.querySelector("video.html5-main-video") ||
      player.querySelector("video");
    if (
      video &&
      video.duration &&
      isFinite(video.duration) &&
      video.currentTime < video.duration - 0.5
    ) {
      video.muted = true; // silence the tail of the ad while skipping
      video.currentTime = Math.max(video.duration - 0.5, 0);
      lastAttempt = now;
    }
  }

  function start() {
    // React to class/DOM changes in the player (ad start, skip button appearing).
    new MutationObserver(trySkip).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    // Belt and braces in case the observer misses a state change.
    setInterval(trySkip, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
