/** localStorage key for the site's light/dark choice. */
export const SITE_THEME_KEY = "sa-theme";

/**
 * Runs in <head> before the first paint: the saved choice, else the system
 * setting, as html[data-theme]. Kept in a plain module so the server layout
 * can inline it (the toggle lives in components/site/theme.tsx).
 */
export const siteThemeScript = `(()=>{try{var t=localStorage.getItem("${SITE_THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`;
