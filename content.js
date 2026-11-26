const MENU_TRIGGER_SELECTOR =
  "ytd-menu-renderer, [aria-haspopup], button[aria-label], [role='button'][aria-label]";
const VIDEO_CARD_SELECTOR = [
  "ytd-video-renderer",
  "ytd-rich-item-renderer",
  "ytd-compact-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-playlist-video-renderer",
  "yt-lockup-view-model",
  "ytd-reel-item-renderer",
  "ytm-shorts-lockup-view-model",
  "ytm-shorts-lockup-view-model-v2"
].join(", ");
const LEGACY_MENU_SELECTOR = "ytd-menu-popup-renderer[role='menu']";
const MODERN_MENU_SELECTOR = "yt-list-view-model[role='menu']";
const MENU_SELECTOR = `${LEGACY_MENU_SELECTOR}, ${MODERN_MENU_SELECTOR}`;
const ITEM_ATTRIBUTE = "data-ad-free-video-item";
let activeVideoId = null;

function getVideoIdFromElement(element) {
  const card = element.closest(VIDEO_CARD_SELECTOR);

  if (card) {
    const dataVideoId = card.getAttribute("video-id") || card.getAttribute("data-video-id");
    if (dataVideoId) {
      return dataVideoId;
    }

    const videoLink = card.querySelector('a[href*="/shorts/"], a[href*="/watch"]');
    const videoId = getVideoIdFromUrl(videoLink?.href);
    if (videoId) {
      return videoId;
    }
  }

  let ancestor = element;
  for (let depth = 0; ancestor && depth < 10; depth += 1, ancestor = ancestor.parentElement) {
    const dataVideoId = ancestor.getAttribute("video-id") || ancestor.getAttribute("data-video-id");
    if (dataVideoId) {
      return dataVideoId;
    }

    if (ancestor.matches("a[href*='/shorts/'], a[href*='/watch']")) {
      const videoId = getVideoIdFromUrl(ancestor.href);
      if (videoId) {
        return videoId;
      }
    }
  }

  return null;
}

function getVideoIdFromEvent(event) {
  const path = event.composedPath();
  for (const target of path) {
    if (target instanceof Element) {
      const videoId = getVideoIdFromElement(target);
      if (videoId) {
        return videoId;
      }
    }
  }

  return null;
}

function getVideoIdFromUrl(urlString) {
  if (!urlString) {
    return null;
  }

  try {
    const url = new URL(urlString, window.location.origin);
    if (url.pathname === "/watch") {
      return url.searchParams.get("v") || null;
    }

    const shortsMatch = url.pathname.match(/^\/shorts\/([^/]+)/);
    return shortsMatch ? decodeURIComponent(shortsMatch[1]) : null;
  } catch (error) {
    console.error("Could not read the YouTube video link:", error);
    return null;
  }
}

function rememberMenuVideo(event) {
  const path = event.composedPath();
  const trigger = path.find(
    (target) =>
      target instanceof Element &&
      (target.matches("ytd-menu-renderer") ||
        target.matches(MENU_TRIGGER_SELECTOR) &&
          /more|action|menu|options/i.test(
            `${target.getAttribute("aria-label") || ""} ${target.getAttribute("title") || ""}`
          ))
  );

  if (!trigger) {
    return;
  }

  activeVideoId = getVideoIdFromEvent(event) || getVideoIdFromElement(trigger);
  updateOpenMenus();
}

function createMenuItem(template, videoId, modern) {
  const item = template.cloneNode(true);
  item.setAttribute(ITEM_ATTRIBUTE, "");
  item.setAttribute("data-ad-free-video-id", videoId);
  item.setAttribute("aria-selected", "false");
  item.classList.remove("iron-selected");

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  icon.setAttribute("width", "24");
  icon.setAttribute("height", "24");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("role", "img");
  icon.setAttribute("aria-label", "No ads");
  icon.style.cssText =
    "pointer-events:none;display:block;width:24px;height:24px;min-width:24px;min-height:24px;max-width:24px;max-height:24px;flex:none;overflow:visible";
  if (modern) {
    const iconWrapper = item.querySelector(".ytIconWrapperHost");
    if (iconWrapper) {
      iconWrapper.replaceChildren(icon);
    }
  } else {
    const youtubeIcon = item.querySelector("yt-icon");
    if (youtubeIcon) {
      youtubeIcon.replaceWith(icon);
      icon.style.marginRight = "8px";
    } else {
      item.querySelector(".text-wrapper")?.before(icon);
      icon.style.marginRight = "8px";
    }
  }
  icon.replaceChildren();

  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = "No ads";
  icon.append(title);

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10.75");
  circle.setAttribute("stroke", "currentColor");
  circle.setAttribute("stroke-width", "1.5");
  icon.append(circle);

  const letters = document.createElementNS("http://www.w3.org/2000/svg", "g");
  letters.setAttribute("stroke", "currentColor");
  letters.setAttribute("stroke-width", "1.45");
  letters.setAttribute("stroke-linecap", "round");
  letters.setAttribute("stroke-linejoin", "round");
  const aPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  aPath.setAttribute("d", "M4.9 16.2 8.1 7.8l3.2 8.4M6.1 13.1h4");
  const dPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  dPath.setAttribute("d", "M13.4 7.8h1.7c2.7 0 4.1 1.5 4.1 4.2s-1.4 4.2-4.1 4.2h-1.7z");
  letters.append(aPath, dPath);
  icon.append(letters);

  const slash = document.createElementNS("http://www.w3.org/2000/svg", "path");
  slash.setAttribute("d", "M4.5 19.5 19.5 4.5");
  slash.setAttribute("stroke", "#E32636");
  slash.setAttribute("stroke-width", "1.65");
  slash.setAttribute("stroke-linecap", "round");
  icon.append(slash);

  let label = modern
    ? item.querySelector(".ytListItemViewModelTitle")
    : item.querySelector("yt-formatted-string.title");

  if (!label) {
    return null;
  }

  if (!modern) {
    const textLabel = document.createElement("span");
    textLabel.className = label.className;
    textLabel.setAttribute("role", "text");
    label.replaceWith(textLabel);
    label = textLabel;
  }
  label.textContent = "Open Ad-Free Video";
  item.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(
        `https://www.yout-ube.com/embed/${encodeURIComponent(
          item.getAttribute("data-ad-free-video-id")
        )}`
      );
    },
    true
  );

  return item;
}

function addItemToMenu(menu, videoId, modern) {
  const existingItem = menu.querySelector(`[${ITEM_ATTRIBUTE}]`);
  if (existingItem) {
    existingItem.setAttribute("data-ad-free-video-id", videoId);
    existingItem.hidden = false;
    existingItem.removeAttribute("hidden");
    return;
  }

  const list = modern ? menu : menu.querySelector("tp-yt-paper-listbox");
  if (!list) {
    return;
  }

  const items = [...list.querySelectorAll(
    modern ? ":scope > yt-list-item-view-model" : ":scope > ytd-menu-service-item-renderer"
  )].filter((item) => !item.hidden && !item.hasAttribute("hidden"));
  const lastItem = items[items.length - 1];

  if (!lastItem) {
    return;
  }

  const item = createMenuItem(lastItem, videoId, modern);
  if (item) {
    list.append(item);
  }
}

function updateOpenMenus() {
  if (!activeVideoId) {
    return;
  }

  document.querySelectorAll(LEGACY_MENU_SELECTOR).forEach((menu) => {
    addItemToMenu(menu, activeVideoId, false);
  });
  document.querySelectorAll(MODERN_MENU_SELECTOR).forEach((menu) => {
    addItemToMenu(menu, activeVideoId, true);
  });
}

function updateMutatedMenus(records) {
  if (!activeVideoId) {
    return;
  }

  const menus = new Set();
  records.forEach((record) => {
    if (record.target instanceof Element) {
      const containingMenu = record.target.closest(MENU_SELECTOR);
      if (containingMenu) {
        menus.add(containingMenu);
      }
    }

    record.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) {
        return;
      }

      if (node.matches(MENU_SELECTOR)) {
        menus.add(node);
      }
      node.querySelectorAll(MENU_SELECTOR).forEach((menu) => menus.add(menu));
      const containingMenu = node.parentElement?.closest(MENU_SELECTOR);
      if (containingMenu) {
        menus.add(containingMenu);
      }
    });
  });

  menus.forEach((menu) => {
    const modern = menu.matches(MODERN_MENU_SELECTOR);
    addItemToMenu(menu, activeVideoId, modern);
  });
}

function attachPopupContainerObserver() {
  const popupContainer = document.querySelector("ytd-popup-container");
  if (!popupContainer) {
    return false;
  }

  popupContainerObserver.disconnect();
  popupContainerObserver.observe(popupContainer, {
    childList: true,
    subtree: true
  });
  updateOpenMenus();
  return true;
}

document.addEventListener("pointerdown", rememberMenuVideo, true);
document.addEventListener("click", rememberMenuVideo, true);
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    rememberMenuVideo(event);
  }
}, true);

const popupContainerObserver = new MutationObserver(updateMutatedMenus);
const popupContainerDiscoveryObserver = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (!(node instanceof Element)) {
        continue;
      }

      const popupContainer = node.matches("ytd-popup-container")
        ? node
        : node.querySelector("ytd-popup-container");
      if (popupContainer) {
        attachPopupContainerObserver();
      }
    }
  }
});

if (!attachPopupContainerObserver()) {
  popupContainerDiscoveryObserver.observe(document, {
    childList: true,
    subtree: true
  });
}

if (document.documentElement) {
  updateOpenMenus();
} else {
  document.addEventListener("DOMContentLoaded", updateOpenMenus, { once: true });
}
