/**
 * Intro gate (SA-Brand README §1.4): runs before the first paint of the public
 * site. First visit in a tab session plays the intro; reloads and reduced
 * motion skip it with no flash. Set as html[data-intro] = "play" | "skip".
 * Automated browsers (tests, crawlers) skip it too; "?intro" in the URL forces
 * a replay. It also holds the name's rise until its font has loaded
 * (html[data-intro-font], at most 1.2s). Not used by the admin.
 */
export const introGateScript = `(function(){var d=document.documentElement;try{var force=/[?&]intro\\b/.test(location.search);if(matchMedia('(prefers-reduced-motion: reduce)').matches||(!force&&(navigator.webdriver||sessionStorage.getItem('sa:intro')))){d.dataset.intro='skip';return}sessionStorage.setItem('sa:intro','1');d.dataset.intro='play';var t=setTimeout(go,1200);function go(){clearTimeout(t);d.dataset.introFont='1'}(function w(){var n=document.querySelector('.sa-pl-name');if(!n)return requestAnimationFrame(w);try{document.fonts.load('900 100px '+getComputedStyle(n).fontFamily).then(go,go)}catch(e){go()}})()}catch(e){d.dataset.intro='skip'}})()`;
