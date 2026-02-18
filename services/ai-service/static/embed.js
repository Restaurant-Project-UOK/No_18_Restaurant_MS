(function () {
  // Create full-screen transparent iframe for the chatbot widget
  const iframe = document.createElement("iframe");
  iframe.src = "https://reschatbot.livelymeadow-4f6bca4e.centralindia.azurecontainerapps.io/widget";
  iframe.style.position = "fixed";
  iframe.style.bottom = "0";
  iframe.style.right = "0";
  iframe.style.width = "420px";
  iframe.style.height = "700px";
  iframe.style.border = "none";
  iframe.style.zIndex = "9999";
  iframe.style.background = "transparent";
  iframe.style.colorScheme = "normal";
  iframe.setAttribute("title", "Restaurant Pro Chatbot");
  iframe.setAttribute("allowtransparency", "true");
  document.body.appendChild(iframe);

  // Listen for messages from widget to resize iframe
  window.addEventListener("message", function (e) {
    if (e.data === "chatbot-open") {
      // Expand iframe to show the full chat panel
      iframe.style.width = "420px";
      iframe.style.height = "700px";
    } else if (e.data === "chatbot-close") {
      // Shrink iframe to just the button area
      iframe.style.width = "100px";
      iframe.style.height = "100px";
    }
  });

  // Start small (just the toggle button)
  iframe.style.width = "100px";
  iframe.style.height = "100px";
})();
