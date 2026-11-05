/**
 * Intro gate (SA-Brand README §1.4): runs before the first paint of the public
 * site. First visit in a tab session plays the intro; reloads and reduced
 * motion skip it with no flash. Set as html[data-intro] = "play" | "skip".
 * Automated browsers (tests, crawlers) skip it too; "?intro" in the URL forces
 * a replay. Not used by the admin, so the intro never plays there.
 */
export const introGateScript = `(function(){var d=document.documentElement;try{var force=/[?&]intro\\b/.test(location.search);if(matchMedia('(prefers-reduced-motion: reduce)').matches||(!force&&(navigator.webdriver||sessionStorage.getItem('sa:intro')))){d.dataset.intro='skip';return}sessionStorage.setItem('sa:intro','1');d.dataset.intro='play'}catch(e){d.dataset.intro='skip'}})()`;
