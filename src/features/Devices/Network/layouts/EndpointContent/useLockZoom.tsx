import { useEffect } from "react";

//TODO THOMAS: we must decide what to do with it
// do we simply deactivate zooming or increase fontsize to 16px ?
export default function useLockZoom() {
  useEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      const originalContent = metaViewport.getAttribute('content');
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');

      return () => {
        // Reset the meta viewport on unmount
        if (metaViewport && originalContent) {
          metaViewport.setAttribute('content', originalContent);
        }
      };
    }
  }, []);
}
