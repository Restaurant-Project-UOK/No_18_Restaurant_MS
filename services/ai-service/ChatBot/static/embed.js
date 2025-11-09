(function () {
  const iframe = document.createElement("iframe");
  iframe.src = "http://localhost:8000/widget"; 
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "320px";
  iframe.style.height = "420px";
  iframe.style.border = "none";
  iframe.style.zIndex = "9999";
  iframe.style.borderRadius = "10px";
  iframe.setAttribute("title", "LangChain Chatbot");
  document.body.appendChild(iframe);
})();
