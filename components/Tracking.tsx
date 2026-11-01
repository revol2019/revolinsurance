import Script from 'next/script';

/**
 * Ad platform tags, on only when their ids are set in Vercel:
 *   NEXT_PUBLIC_GA_ID          Google Analytics 4 (G-XXXX). Google Ads imports its Lead conversion from here.
 *   NEXT_PUBLIC_META_PIXEL_ID  Meta pixel. Every producer's ads use this one pixel.
 * The rate check already calls track('generate_lead'); the standard events
 * below are what Google Ads and Meta count as a conversion.
 */
export default function Tracking() {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const meta = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!ga && !meta) return null;
  return (
    <>
      {ga ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}</Script>
        </>
      ) : null}
      {meta ? (
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta}');fbq('track','PageView');`}</Script>
      ) : null}
      <Script id="lead-bridge" strategy="afterInteractive">{`(function(){var w=window;var orig=w.dataLayer&&w.dataLayer.push;if(!w.dataLayer)w.dataLayer=[];w.dataLayer.push=function(){var a=arguments[0];try{if(a&&a.event==='generate_lead'){if(typeof w.fbq==='function')w.fbq('track','Lead',{content_name:a.page||''});}}catch(e){}return Array.prototype.push.apply(w.dataLayer,arguments);};})();`}</Script>
    </>
  );
}
