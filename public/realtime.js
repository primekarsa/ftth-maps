/* ===================== REALTIME CABLE STATUS PATCH =====================
   Tujuan:
   - Update customer.online_status berdasarkan API get-customer-realtime (field online boolean)
   - Setelah berubah, panggil updateKabelCustomerStatus() agar warna kabel ikut berubah TANPA refresh manual
   - Round-robin polling ringan (1 customer / interval)
======================================================================= */
(function(){
  function safeCall(fnName){
    try { if (typeof window[fnName] === 'function') window[fnName](); } catch(e){}
  }
  function getNetworkData(){
    try { return (typeof window.networkData !== 'undefined') ? window.networkData : (typeof networkData !== 'undefined' ? networkData : null); }
    catch(e){ return null; }
  }
    function normalizeStatusFromRealtime(rt, customer){
        // rt.online true/false dari PHP
        var rechargeStatus = '';
        if (customer) {
            rechargeStatus = String(customer.recharge_status || customer.rechargeStatus || '').toLowerCase();
        }
        if (rt && (rt.online === true || rt.online === 'true')) {
            return (rechargeStatus === 'off') ? 'isolir' : 'online';
        }
        return (rechargeStatus === 'off') ? 'off_isolir' : 'offline';
    }

    // MODIFIED BY AI: 2026-02-14 - Normalize status string from database
    function normalizeStatus(statusStr){
        var s = String(statusStr || 'offline').toLowerCase().trim();
        // Database sudah normalize: 'online', 'offline', 'isolir', 'off_isolir'
        if (s === 'online' || s === 'on' || s === 'active' || s === 'aktif') return 'online';
        if (s === 'isolir' || s === 'off_isolir') return s;
        return 'offline';
    }

  // Pastikan URL base (Smarty-safe)
  function buildRealtimeUrl(customerId){
    var baseUrl = "";
    try {
      // banyak template pakai ?_route=...
      baseUrl = window.location.origin + window.location.pathname;
    } catch(e){}
    return baseUrl + "?_route=plugin/network_mapping/get-customer-realtime&customer_id=" + encodeURIComponent(customerId);
  }

    function buildOdpSummaryUrl(){
        var baseUrl = "";
        try {
            baseUrl = window.location.origin + window.location.pathname;
        } catch(e){}
        var onlineDelay = mapSettings && mapSettings.odpOnlineDelaySec ? mapSettings.odpOnlineDelaySec : 60;
        var offlineDelay = mapSettings && mapSettings.odpOfflineDelaySec ? mapSettings.odpOfflineDelaySec : 60;
        var maintenanceDelay = mapSettings && mapSettings.odpMaintenanceDelaySec ? mapSettings.odpMaintenanceDelaySec : 3600;
        return baseUrl + "?_route=plugin/network_mapping/get-odp-status-summary" +
            "&online_delay=" + encodeURIComponent(onlineDelay) +
            "&offline_delay=" + encodeURIComponent(offlineDelay) +
            "&maintenance_delay=" + encodeURIComponent(maintenanceDelay);
    }

    // MODIFIED BY AI: 2026-02-14 - Build URL untuk bulk customer status
    function buildBulkCustomerStatusUrl(){
        var baseUrl = "";
        try {
            baseUrl = window.location.origin + window.location.pathname;
        } catch(e){}
        return baseUrl + "?_route=plugin/network_mapping&action=get-bulk-customer-status";
    }

        function updateCustomerStatusInNetworkData(customerId, newStatus){
    var nd = getNetworkData();
    if (!nd || !nd.customers) return false;

        var changed = false;
        var targetCustomer = null;
                var prevStatus = null;
    for (var i=0;i<nd.customers.length;i++){
      var c = nd.customers[i];
      if (String(c.id) === String(customerId)) {
                // jangan override isolir/off_isolir dari DB
                if (c.online_status === 'off_isolir' || c.online_status === 'isolir') return false;

                if (c.online_status !== newStatus) {
                                        prevStatus = c.online_status;
                    c.online_status = newStatus;
                                        c.status = newStatus;
                    changed = true;
                }
                targetCustomer = c;
        break;
      }
    }
    if (changed) {
                        try { if (typeof updateOdpSummaryFromCustomerChange === 'function' && targetCustomer) updateOdpSummaryFromCustomerChange(prevStatus, newStatus, targetCustomer.odp_id); } catch(e){}
      // Update kabel + animasi
    safeCall('updateKabelCustomerStatus');
    safeCall('updateOdpLossStatusAndKabelColors');
      safeCall('reapplyKabelOfflineBlink');
            safeCall('updateOnlineOfflineCounter');
            try { if (typeof updateCustomerMarkerFromStatus === 'function' && targetCustomer) updateCustomerMarkerFromStatus(targetCustomer); } catch(e){}
      try { if (typeof updateKabelFlowAnimation === 'function') updateKabelFlowAnimation(true); } catch(e){}
    }
    return changed;
  }

        function updateOdpSummaryFromCustomerChange(prevStatus, newStatus, odpId){
                if (!odpId || !window.odpStatusSummary) return;
                var key = String(odpId);
                if (!window.odpStatusSummary[key]) {
                    window.odpStatusSummary[key] = { total: 0, online: 0, offline: 0, known: 0, unknown: 0 };
                }
                var entry = window.odpStatusSummary[key];
                var prev = String(prevStatus || '').toLowerCase();
                var next = String(newStatus || '').toLowerCase();

                var isKnownStatus = function(status) {
                    return status === 'online' || status === 'offline' || status === 'off_isolir' || status === 'isolir';
                };

                if (prev === next) return;

                if (prev === 'online') entry.online = Math.max(0, (entry.online || 0) - 1);
                else if (prev) entry.offline = Math.max(0, (entry.offline || 0) - 1);

                if (isKnownStatus(prev)) entry.known = Math.max(0, (entry.known || 0) - 1);
                else if (prev) entry.unknown = Math.max(0, (entry.unknown || 0) - 1);

                if (next === 'online') entry.online = (entry.online || 0) + 1;
                else entry.offline = (entry.offline || 0) + 1;

                if (isKnownStatus(next)) entry.known = (entry.known || 0) + 1;
                else if (next) entry.unknown = (entry.unknown || 0) + 1;
        }

    // Parallel batch polling - fetch SEMUA customer via Mikrotik
    var polling = false;
    var pollTimer = null;
    var pollIntervalMs = 3000;    // Default 3 detik
    var lastOdpSummaryFetch = 0;

    function computePollInterval() {
        var configured = (mapSettings && mapSettings.cableIntervalMs) ? mapSettings.cableIntervalMs : 3000;
        var nd = getNetworkData();
        var customerCount = (nd && nd.customers && nd.customers.length) ? nd.customers.length : 0;

        // PERFORMANCE FIX 2026-02-15: Interval adaptif untuk dataset besar
        if (customerCount > 5000) return Math.max(configured, 15000);
        if (customerCount > 2000) return Math.max(configured, 10000);
        if (customerCount > 1000) return Math.max(configured, 7000);
        return configured;
    }

    function shouldPollRealtime() {
        // FIXED: Hanya cek enableCableRealtime setting
        // document.hidden sudah di-handle oleh event listener visibilitychange
        if (mapSettings && mapSettings.enableCableRealtime === false) return false;
        return true;
    }

    function startPolling() {
        // BUG FIX 2026-02-15: WAJIB cek enable_cable_realtime sebelum polling
        if (!shouldPollRealtime()) {
            stopPolling();
            return;
        }
        if (pollTimer) return;
        pollIntervalMs = computePollInterval();
        
        // MODIFIED: Timer untuk bulk fetch semua customer status + auto update kabel
        // tick() sudah handle: fetch status + update memory + update warna kabel
        pollTimer = setInterval(tick, pollIntervalMs);
        setTimeout(tick, 500); // Initial fetch setelah 0.5 detik
        
        fetchOdpStatusSummary(true);
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    function fetchOdpStatusSummary(force) {
        var now = Date.now();
        if (!force && lastOdpSummaryFetch && (now - lastOdpSummaryFetch) < pollIntervalMs) return;
        lastOdpSummaryFetch = now;
        fetch(buildOdpSummaryUrl(), { credentials: 'same-origin' })
            .then(function(r){ return r.json(); })
            .then(function(rt){
                if (!rt || rt.status !== 'success') return;
                window.odpStatusSummary = rt.data || {};
                try { updateOdpOperationalStatusFromSummary(rt.data || {}, rt.last_online || {}, rt.last_offline || {}); } catch(e) {}
                safeCall('updateOdpLossStatusAndKabelColors');
            })
            .catch(function(){});
    }
    window.fetchOdpStatusSummary = fetchOdpStatusSummary;

    // MODIFIED BY AI: 2026-02-06 - allow restart when settings change
    function restartCablePolling() {
        stopPolling();
        startPolling();
    }
    window.restartCablePolling = restartCablePolling;

  // MODIFIED BY AI: 2026-02-14 - Parallel batch fetch dari Mikrotik (realtime!)
  function tick(){
    if (polling) return;
    var nd = getNetworkData();
    if (!nd || !nd.customers || !nd.customers.length) return;

    polling = true;
    
    var customers = nd.customers;
    var hasChanges = false;

        // PERFORMANCE FIX 2026-02-15: Untuk dataset besar, gunakan 1 request bulk (bukan ratusan request per customer)
        if (customers.length > 300) {
            var customerIdsCsv = customers.map(function(c){ return c && c.id ? c.id : null; }).filter(Boolean).join(',');
            fetch(buildBulkCustomerStatusUrl(), {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: 'customer_ids=' + encodeURIComponent(customerIdsCsv)
            })
                .then(function(r){ return r.json(); })
                .then(function(rt){
                    if (!rt || rt.status !== 'success') {
                        throw new Error('bulk_unavailable');
                    }
                    var bulkData = rt.data || rt.customers || [];
                    var items = [];
                    if (Array.isArray(bulkData)) {
                        items = bulkData;
                    } else if (bulkData && typeof bulkData === 'object') {
                        Object.keys(bulkData).forEach(function(k) {
                            var item = bulkData[k];
                            if (item && typeof item === 'object') {
                                if (typeof item.customer_id === 'undefined') item.customer_id = k;
                                items.push(item);
                            }
                        });
                    }

                    if (!items.length) {
                        throw new Error('bulk_empty');
                    }

                    var customerMap = {};
                    customers.forEach(function(c) { customerMap[String(c.id)] = c; });

                    items.forEach(function(item){
                        var customerId = item.customer_id || item.id;
                        if (!customerId) return;
                        var customer = customerMap[String(customerId)];
                        if (!customer) return;

                        var st = null;
                        if (typeof item.online_status !== 'undefined') {
                            st = normalizeStatus(item.online_status);
                        } else if (typeof item.status !== 'undefined') {
                            st = normalizeStatus(item.status);
                        } else {
                            st = normalizeStatusFromRealtime(item, customer);
                        }

                        var changed = updateCustomerStatusInNetworkData(customerId, st);
                        if (changed) hasChanges = true;
                    });
                })
                .catch(function(){
                    // Fallback aman: jika endpoint bulk gagal, pakai mode lama per-customer
                    return processBatch(0);
                })
                .finally(function(){
                    if (hasChanges) {
                        safeCall('updateKabelCustomerStatus');
                    }
                    fetchOdpStatusSummary(false);
                    polling = false;
                });
            return;
        }
    
    // Process SEMUA customer dalam batch parallel (10 per wave, tidak overload router)
    function processBatch(startIdx) {
      var batchPromises = [];
      var batchItems = [];
      
      // Ambil batch 10 customer
      for (var i = startIdx; i < Math.min(startIdx + 10, customers.length); i++) {
        var customer = customers[i];
        if (!customer || !customer.id) continue;
        
        batchItems.push({ customerId: customer.id, customer: customer });
        
        // Fetch parallel dari Mikrotik
        var promise = fetch(buildRealtimeUrl(customer.id), { credentials: 'same-origin' })
          .then(function(r){ return r.json(); })
          .then(function(rt){ return (rt && rt.status === 'success') ? rt : null; })
          .catch(function(){ return null; });
        
        batchPromises.push(promise);
      }
      
      // Tunggu batch ini selesai
      return Promise.all(batchPromises).then(function(results){
        // Process hasil batch
        for (var i = 0; i < results.length; i++) {
          var rt = results[i];
          var item = batchItems[i];
          if (!rt || !item) continue;
          
          var st = normalizeStatusFromRealtime(rt, item.customer);
          var changed = updateCustomerStatusInNetworkData(item.customerId, st);
          if (changed) hasChanges = true;
        }
        
        // Lanjut batch berikutnya jika masih ada
        var nextIdx = startIdx + 10;
        if (nextIdx < customers.length) {
          return processBatch(nextIdx);
        }
      });
    }
    
    // Mulai dari batch pertama - proses SEMUA customer!
    processBatch(0)
      .then(function(){
        // Semua batch selesai - update UI
        if (hasChanges) {
          safeCall('updateKabelCustomerStatus');
        }
        fetchOdpStatusSummary(false);
      })
      .catch(function(err){
        console.error('Batch fetch error:', err);
      })
      .finally(function(){ 
        polling = false; 
      });
  }

  function updateOdpOperationalStatusFromSummary(summary, lastOnline, lastOffline) {
      if (!summary || typeof summary !== 'object') return;
      var nowSec = Math.floor(Date.now() / 1000);
      var onlineDelay = mapSettings && mapSettings.odpOnlineDelaySec ? mapSettings.odpOnlineDelaySec : 60;
      var offlineDelay = mapSettings && mapSettings.odpOfflineDelaySec ? mapSettings.odpOfflineDelaySec : 60;
      var maintenanceDelay = mapSettings && mapSettings.odpMaintenanceDelaySec ? mapSettings.odpMaintenanceDelaySec : 3600;

      function computeStatus(key) {
          var stat = summary[key];
          if (!stat || !stat.total || stat.total <= 0) return null;
          var online = stat.online || 0;
          var known = (typeof stat.known !== 'undefined' && stat.known !== null)
              ? parseInt(stat.known, 10)
              : parseInt(stat.total, 10);
          var total = parseInt(stat.total, 10) || 0;
          if (known < total) return null;
          if (online > 0) {
              var lo = parseInt(lastOnline[key] || nowSec, 10);
              if (onlineDelay <= 0 || (nowSec - lo) >= onlineDelay) return 'Active';
              return null;
          }
          var lf = parseInt(lastOffline[key] || nowSec, 10);
          if (maintenanceDelay > 0 && (nowSec - lf) >= maintenanceDelay) return 'Maintenance';
          if (offlineDelay <= 0 || (nowSec - lf) >= offlineDelay) return 'Inactive';
          return null;
      }

      // Update ODP slots
      if (networkData && Array.isArray(networkData.odps_all)) {
          networkData.odps_all.forEach(function(odp) {
              var key = String(odp.id || odp.box_id || '');
              if (!key) return;
              var newStatus = computeStatus(key);
              if (newStatus && odp.status !== newStatus) {
                  odp.status = newStatus;
              }
          });
      }

      // Update ODP boxes
      if (networkData && Array.isArray(networkData.odps)) {
          networkData.odps.forEach(function(odp) {
              var key = String(odp.id || odp.box_id || '');
              if (!key) return;
              var newStatus = computeStatus(key);
              if (newStatus && odp.single_slot_status !== newStatus) {
                  odp.single_slot_status = newStatus;
              }
              if (Array.isArray(odp.slots)) {
                  odp.slots.forEach(function(slot) {
                      var skey = String(slot.id || slot.slot_id || slot.odp_id || '');
                      if (!skey) return;
                      var slotStatus = computeStatus(skey);
                      if (slotStatus && slot.status !== slotStatus) {
                          slot.status = slotStatus;
                      }
                  });
              }
          });
      }

      // Update marker classes for single-slot ODP
      if (Array.isArray(odpMarkers)) {
          odpMarkers.forEach(function(marker) {
              var odpData = marker._odpData;
              if (!odpData) return;
              var el = marker._icon ? marker._icon.querySelector('.odp-marker') : null;
              if (!el) return;
              el.classList.remove('odp-marker-inactive');
              el.classList.remove('odp-marker-maintenance');
              if (odpData.total_slots == 1 && odpData.single_slot_status) {
                  if (odpData.single_slot_status === 'Maintenance') {
                      el.classList.add('odp-marker-maintenance');
                  } else if (odpData.single_slot_status === 'Inactive') {
                      el.classList.add('odp-marker-inactive');
                  }
              }

              // Update popup status badges when popup is open
              try {
                  var popup = marker.getPopup ? marker.getPopup() : null;
                  var popupEl = popup && popup.getElement ? popup.getElement() : null;
                  if (popupEl && odpData.slots && Array.isArray(odpData.slots)) {
                      var badges = popupEl.querySelectorAll('.odp-slot-status');
                      if (badges && badges.length) {
                          var statusMap = {};
                          odpData.slots.forEach(function(slot) {
                              statusMap[String(slot.id)] = slot.status;
                          });
                          badges.forEach(function(badge) {
                              var slotId = badge.getAttribute('data-slot-id');
                              var status = statusMap[String(slotId)];
                              if (!status) return;
                              badge.classList.remove('status-active');
                              badge.classList.remove('status-inactive');
                              badge.classList.remove('status-maintenance');
                              if (status === 'Maintenance') {
                                  badge.classList.add('status-maintenance');
                                  badge.textContent = 'Perbaikan';
                              } else if (status === 'Inactive') {
                                  badge.classList.add('status-inactive');
                                  badge.textContent = 'Offline';
                              } else {
                                  badge.classList.add('status-active');
                                  badge.textContent = 'Online';
                              }
                          });
                      }
                  }
              } catch (e) {}
          });
      }
  }

  // Tunggu sampai map + networkData siap
  var tries = 0;
  var boot = setInterval(function(){
    tries++;
    var nd = getNetworkData();
        if (nd && nd.customers && nd.customers.length) {
            clearInterval(boot);
            startPolling();
                        fetchOdpStatusSummary(true);
        }
    if (tries > 80) clearInterval(boot);
  }, 250);

    // Pause polling when tab is hidden, resume when visible
    try {
        document.addEventListener('visibilitychange', function(){
            // FIXED: Langsung start/stop berdasarkan visibility, tanpa cek enableCableRealtime
            // Karena setting sudah di-control oleh user via checkbox dan auto-start
            if (document.hidden) {
                stopPolling();
            } else {
                startPolling();
            }
        });
    } catch (e) {}

    // Pause/resume polling on fullscreen changes
    try {
        document.addEventListener('fullscreenchange', function(){
            // FIXED: Langsung restart polling saat keluar masuk fullscreen
            startPolling();
        });
    } catch (e) {}
})();