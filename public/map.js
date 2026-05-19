
(function(){
  function getMapEl(){ return document.getElementById('map'); }
  function getMapObj(){ return (typeof window.map !== 'undefined' && window.map) ? window.map : (typeof map !== 'undefined' ? map : null); }

  window.toggleMapFullscreen = async function(e){
    if (e){ e.preventDefault(); e.stopPropagation(); }
    const mapEl = getMapEl();
    if (!mapEl) return;

    try{
      if (document.fullscreenEnabled) {
        if (!document.fullscreenElement) await mapEl.requestFullscreen();
        else await document.exitFullscreen();
      } else {
        // fallback class toggle
        mapEl.classList.toggle('map-fullscreen-active');
        document.body.classList.toggle('body-map-fullscreen');
        updateIcon(mapEl.classList.contains('map-fullscreen-active'));
        refreshLeaflet();
      }
    } catch(err){
      // if requestFullscreen blocked, fallback to class mode
      mapEl.classList.toggle('map-fullscreen-active');
      document.body.classList.toggle('body-map-fullscreen');
      updateIcon(mapEl.classList.contains('map-fullscreen-active'));
      refreshLeaflet();
    }
  };

  function updateIcon(active){
    const icon = document.getElementById('mapFullscreenIcon');
    if (!icon) return;
    icon.classList.toggle('fa-expand', !active);
    icon.classList.toggle('fa-compress', !!active);
  }

  function refreshLeaflet(){
    const m = getMapObj();
    if (!m || typeof m.invalidateSize !== 'function') return;
    setTimeout(function(){ m.invalidateSize(true); }, 250);
  }

  document.addEventListener('fullscreenchange', function(){
    const mapEl = getMapEl();
    const isMapFs = !!document.fullscreenElement && document.fullscreenElement === mapEl;
    if (isMapFs) {
      mapEl.classList.add('map-fullscreen-active');
      document.body.classList.add('body-map-fullscreen');
    } else {
      mapEl.classList.remove('map-fullscreen-active');
      document.body.classList.remove('body-map-fullscreen');
    }
    updateIcon(isMapFs);
    refreshLeaflet();
  });
})();