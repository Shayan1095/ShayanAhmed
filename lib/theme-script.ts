/**
 * The public site is dark-only. The theme is also set statically on <html>
 * (app/layout.tsx); this script keeps it dark even if an old saved choice
 * ("sa-theme": "light") is still in a visitor's browser.
 */
export const siteThemeScript = `(()=>{try{localStorage.removeItem("sa-theme")}catch(e){}document.documentElement.dataset.theme="dark"})()`;
