// Dynamic Type (UI playbook Phase 6). Web pages ignore the iPhone's text
// size setting unless they ask for it: WebKit sizes `font: -apple-system-body`
// to the user's body text (17pt at the default size, 53pt at the largest
// accessibility size). This script compares that to 17 and sets
// --type-scale on <html>, which every type token multiplies (globals.css).
//
// It runs inline in <head>, before the first paint, so text never jumps.
// It measures again when the app comes back to the front, since that's
// when someone has just changed the size in Settings. Only on iPhone and
// iPad: on a Mac, -apple-system-body is 13px and means something else, so
// anything under iOS's smallest size (14) is ignored.
export const MAX_TYPE_SCALE = 3.1;

export const DYNAMIC_TYPE_SCRIPT = `(function () {
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!ios) return;
  var root = document.documentElement;
  function measure() {
    var probe = document.createElement("span");
    probe.style.font = "-apple-system-body";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    root.appendChild(probe);
    var px = parseFloat(getComputedStyle(probe).fontSize);
    root.removeChild(probe);
    if (!(px >= 14)) return;
    var scale = Math.min(${MAX_TYPE_SCALE}, px / 17);
    root.style.setProperty("--type-scale", String(Math.round(scale * 100) / 100));
  }
  measure();
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) measure();
  });
})();`;
