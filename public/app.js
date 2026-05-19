// FTTH Maps - app.js v3
// Pick Mode: klik FAB → pilih lokasi di peta → modal terbuka otomatis

// ==================== DATA STORE ====================
var DB_KEY = 'ftth_maps_data';

window.networkData    = { customers:[], nodes:[], cables:[] };
window.odpStatusSummary = {};
window.odpMarkers     = [];
window.mapSettings    = {
  enableCableRealtime: false,
  cableIntervalMs: 5000,
  odpOnlineDelaySec: 60,
  odpOfflineDelaySec: 60,
  odpMaintenanceDelaySec: 3600
};

var appData = { nodes:[], cables:[], nextId:1 };

function saveData() { localStorage.setItem(DB_KEY, JSON.stringify(appData)); }

function loadData() {
  var raw = localStorage.getItem(DB_KEY);
  if (raw) { try { appData = JSON.parse(raw); } catch(e) { seedDemoData(); } }
  else { seedDemoData(); }
  syncNetworkData();
}

function syncNetworkData() {
  window.networkData.nodes   = appData.nodes;
  window.networkData.cables  = appData.cables;
  window.networkData.customers = appData.nodes
    .filter(function(n){ return n.type === 'pelanggan'; })
    .map(function(n){
      return {
        id: n.id, name: n.name,
        online_status: normalizeStatus(n.status),
        status:        normalizeStatus(n.status),
        recharge_status: (n.status==='isolir'||n.status==='off_isolir') ? 'off' : '',
        odp_id: n.extra ? (n.extra.odp_id||'') : ''
      };
    });
  window.networkData.odps = appData.nodes
    .filter(function(n){ return n.type==='odp'; })
    .map(function(n){
      return { id:n.id, name:n.name, status:n.status, total_slots:1,
               single_slot_status:n.status, slots:[] };
    });
  window.networkData.odps_all = window.networkData.odps;
}

function normalizeStatus(s) {
  s = String(s||'offline').toLowerCase().trim();
  if (s==='online'||s==='on'||s==='active'||s==='aktif') return 'online';
  if (s==='isolir')     return 'isolir';
  if (s==='off_isolir') return 'off_isolir';
  if (s==='maintenance')return 'maintenance';
  return 'offline';
}
function statusBadgeClass(s) {
  s = normalizeStatus(s);
  if (s==='online')      return 'status-online';
  if (s==='isolir'||s==='off_isolir') return 'status-isolir';
  if (s==='maintenance') return 'status-maintenance';
  return 'status-offline';
}
function statusLabel(s) {
  s = normalizeStatus(s);
  if (s==='online')      return 'Online';
  if (s==='isolir'||s==='off_isolir') return 'Isolir';
  if (s==='maintenance') return 'Maintenance';
  return 'Offline';
}

function seedDemoData() {
  appData.nodes = [
    { id:1,  type:'olt',      name:'OLT-HSGQ-XE04ID', lat:-6.3459, lng:107.9554, status:'online',      notes:'4 PON Port EPON', extra:{brand:'HSGQ',model:'XE04ID',ports:4} },
    { id:2,  type:'odc',      name:'ODC-A01',          lat:-6.3430, lng:107.9590, status:'online',      notes:'', extra:{capacity:'1:8', parent_olt:1} },
    { id:3,  type:'odc',      name:'ODC-B01',          lat:-6.3480, lng:107.9530, status:'online',      notes:'', extra:{capacity:'1:8', parent_olt:1} },
    { id:4,  type:'odp',      name:'ODP-A01',          lat:-6.3420, lng:107.9610, status:'online',      notes:'RT 01', extra:{capacity:8, parent_odc:2} },
    { id:5,  type:'odp',      name:'ODP-A02',          lat:-6.3415, lng:107.9625, status:'online',      notes:'RT 02', extra:{capacity:8, parent_odc:2} },
    { id:6,  type:'odp',      name:'ODP-B01',          lat:-6.3490, lng:107.9510, status:'online',      notes:'RT 03', extra:{capacity:8, parent_odc:3} },
    { id:7,  type:'odp',      name:'ODP-B02',          lat:-6.3500, lng:107.9495, status:'maintenance', notes:'RT 04', extra:{capacity:8, parent_odc:3} },
    { id:8,  type:'splitter', name:'SPL-A01-1',        lat:-6.3422, lng:107.9608, status:'online',      notes:'', extra:{rasio:'1:4', parent_odp:4} },
    { id:9,  type:'splitter', name:'SPL-A01-2',        lat:-6.3418, lng:107.9622, status:'online',      notes:'', extra:{rasio:'1:4', parent_odp:5} },
    { id:10, type:'pelanggan',name:'PLG-001 Budi S.',  lat:-6.3416, lng:107.9612, status:'online',      notes:'', extra:{ont:'ZTE F601',   port:'PON1/0/1', odp_id:4} },
    { id:11, type:'pelanggan',name:'PLG-002 Sari W.',  lat:-6.3418, lng:107.9615, status:'online',      notes:'', extra:{ont:'ZTE F601',   port:'PON1/0/2', odp_id:4} },
    { id:12, type:'pelanggan',name:'PLG-003 Agus T.',  lat:-6.3420, lng:107.9617, status:'offline',     notes:'Belum bayar', extra:{ont:'Huawei EG8145',port:'PON1/0/3',odp_id:4} },
    { id:13, type:'pelanggan',name:'PLG-004 Dewi L.',  lat:-6.3413, lng:107.9628, status:'online',      notes:'', extra:{ont:'ZTE F601',   port:'PON1/0/4', odp_id:5} },
    { id:14, type:'pelanggan',name:'PLG-005 Hendra K.',lat:-6.3412, lng:107.9630, status:'online',      notes:'', extra:{ont:'ZTE F601',   port:'PON1/0/5', odp_id:5} },
    { id:15, type:'pelanggan',name:'PLG-006 Rina P.',  lat:-6.3492, lng:107.9512, status:'isolir',      notes:'Tunggakan 2 bulan', extra:{ont:'Huawei EG8145',port:'PON2/0/1',odp_id:6} },
    { id:16, type:'pelanggan',name:'PLG-007 Wahyu N.', lat:-6.3495, lng:107.9508, status:'online',      notes:'', extra:{ont:'ZTE F601',   port:'PON2/0/2', odp_id:6} },
  ];
  appData.cables = [
    { id:'c1',  from:1, to:2, type:'trunk',        cores:12, status:'active' },
    { id:'c2',  from:1, to:3, type:'trunk',        cores:12, status:'active' },
    { id:'c3',  from:2, to:4, type:'distribution', cores:8,  status:'active' },
    { id:'c4',  from:2, to:5, type:'distribution', cores:8,  status:'active' },
    { id:'c5',  from:3, to:6, type:'distribution', cores:8,  status:'active' },
    { id:'c6',  from:3, to:7, type:'distribution', cores:8,  status:'maintenance' },
    { id:'c7',  from:4, to:8, type:'drop',         cores:4,  status:'active' },
    { id:'c8',  from:5, to:9, type:'drop',         cores:4,  status:'active' },
    { id:'c9',  from:8, to:10,type:'drop',         cores:4,  status:'active' },
    { id:'c10', from:8, to:11,type:'drop',         cores:4,  status:'active' },
    { id:'c11', from:8, to:12,type:'drop',         cores:4,  status:'active' },
    { id:'c12', from:9, to:13,type:'drop',         cores:4,  status:'active' },
    { id:'c13', from:9, to:14,type:'drop',         cores:4,  status:'active' },
    { id:'c14', from:6, to:15,type:'drop',         cores:4,  status:'active' },
    { id:'c15', from:6, to:16,type:'drop',         cores:4,  status:'active' },
  ];
  appData.nextId = 20;
  saveData();
}

// ==================== MAP SETUP ====================
var map, markers={}, cablePolylines={};
var layers = { pelanggan:true,olt:true,odc:true,odp:true,splitter:true,kabel:true };
var currentLayer='satellite', baseLayers={};
var selectedNodeForModal=null, isDark=true, sidebarOpen=true;

var TILES = {
  satellite: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr:'Esri' },
  street:    { url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr:'OSM' },
  topo:      { url:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr:'OpenTopo' }
};

var TYPE_CONFIG = {
  olt:       { color:'#6366f1', label:'OLT', sz:36 },
  odc:       { color:'#10b981', label:'ODC', sz:30 },
  odp:       { color:'#f59e0b', label:'ODP', sz:26 },
  splitter:  { color:'#8b5cf6', label:'SPL', sz:22 },
  pelanggan: { color:'#06b6d4', label:'🏠',  sz:18 }
};
var CABLE_COLORS = { trunk:'#f59e0b', distribution:'#10b981', drop:'#06b6d4' };

function initMap() {
  map = L.map('map', { center:[-6.3459,107.9554], zoom:15, zoomControl:false, attributionControl:false });
  Object.keys(TILES).forEach(function(k){
    baseLayers[k] = L.tileLayer(TILES[k].url, { attribution:TILES[k].attr, maxZoom:21 });
  });
  baseLayers.satellite.addTo(map);
  window.map = map;
  // Klik peta hanya dihandle oleh pick mode — tidak ada handler default
}

// ==================== PICK MODE ====================
var isPickMode   = false;
var pickModeType = null;
var tempMarker   = null;
var pickCoords   = {}; // { type: {lat, lng} }

var PICK_LABELS = {
  olt:       'OLT — klik lokasi penempatan di peta',
  odc:       'ODC — klik lokasi penempatan di peta',
  odp:       'ODP — klik lokasi penempatan di peta',
  splitter:  'Splitter — klik lokasi penempatan di peta',
  pelanggan: 'Pelanggan — klik lokasi rumah di peta',
  'remap-olt':      'Pindah OLT — klik lokasi baru',
  'remap-odc':      'Pindah ODC — klik lokasi baru',
  'remap-odp':      'Pindah ODP — klik lokasi baru',
  'remap-splitter': 'Pindah Splitter — klik lokasi baru',
  'remap-pelanggan':'Pindah Pelanggan — klik lokasi baru'
};

function aktivasiPickMode(type) {
  // Tutup FAB
  tutupFab();

  // Tutup semua modal
  ['olt','odc','odp','splitter','pelanggan','add-cable','node-detail'].forEach(function(m){
    var el = document.getElementById('modal-'+m);
    if (el) el.style.display = 'none';
  });

  isPickMode   = true;
  pickModeType = type;

  // Tampilkan indikator
  var ind = document.getElementById('pickModeIndicator');
  var txt = document.getElementById('pickModeText');
  if (txt) txt.textContent = PICK_LABELS[type] || 'Klik pada peta untuk memilih lokasi';
  if (ind) ind.classList.add('active');

  // Crosshair
  document.getElementById('map').classList.add('pick-mode');

  // Delay 300ms agar klik tombol FAB tidak tembus ke map
  setTimeout(function(){
    map.on('click', onMapClickPick);
  }, 300);
}

function batalkanModePick() {
  isPickMode   = false;
  pickModeType = null;

  document.getElementById('pickModeIndicator').classList.remove('active');
  document.getElementById('map').classList.remove('pick-mode');

  if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
  map.off('click', onMapClickPick);
}

function onMapClickPick(e) {
  var lat = e.latlng.lat;
  var lng = e.latlng.lng;
  var type = pickModeType;

  // Hapus temp marker lama
  if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }

  // Buat temp marker
  var cfg = TYPE_CONFIG[type.replace('remap-','')] || TYPE_CONFIG.odp;
  var d = document.createElement('div');
  d.className = 'temp-marker-wrap';
  d.style.cssText = 'background:'+cfg.color+';width:32px;height:32px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;box-shadow:0 2px 10px rgba(0,0,0,0.4);';
  d.textContent = cfg.label;

  tempMarker = L.marker([lat, lng], {
    icon: L.divIcon({ html:d.outerHTML, iconSize:[32,32], iconAnchor:[16,16], className:'' })
  }).addTo(map);

  // Nonaktifkan pick mode
  isPickMode = false;
  document.getElementById('pickModeIndicator').classList.remove('active');
  document.getElementById('map').classList.remove('pick-mode');
  map.off('click', onMapClickPick);

  // Simpan koordinat dan buka modal
  if (type.startsWith('remap-')) {
    // Remap: update koordinat node yang sedang di-edit
    var baseType = type.replace('remap-', '');
    if (selectedNodeForModal) {
      var node = appData.nodes.find(function(n){ return n.id===selectedNodeForModal; });
      if (node) {
        node.lat = lat;
        node.lng = lng;
        saveData();
        syncNetworkData();
        renderAll();
      }
    }
    // Buka kembali detail modal
    setTimeout(function(){ showNodeDetail(selectedNodeForModal); }, 100);
  } else {
    // Tambah baru: simpan koordinat dan buka modal form
    pickCoords[type] = { lat:lat, lng:lng };
    bukaModalNode(type, lat, lng);
  }
}

// ==================== MODAL NODE BARU ====================
function bukaModalNode(type, lat, lng) {
  var coordStr = lat.toFixed(6) + ', ' + lng.toFixed(6);

  // Update tampilan koordinat di modal
  var dispEl = document.getElementById('coord-display-' + type);
  var txtEl  = document.getElementById('coord-text-' + type);
  if (dispEl) dispEl.classList.add('has-coord');
  if (txtEl)  txtEl.textContent = '📍 ' + coordStr;

  // Isi dropdown parent sebelum modal dibuka
  populateParentDropdowns(type);

  // Buka modal
  var modalEl = document.getElementById('modal-' + type);
  if (modalEl) modalEl.style.display = 'flex';
}

function tutupModalNode(type) {
  var modalEl = document.getElementById('modal-' + type);
  if (modalEl) modalEl.style.display = 'none';

  // Reset form
  var inputs = modalEl ? modalEl.querySelectorAll('input[type="text"],input[type="number"],textarea') : [];
  inputs.forEach(function(el){ el.value = ''; });
  var selects = modalEl ? modalEl.querySelectorAll('select') : [];
  selects.forEach(function(el){ el.selectedIndex = 0; });

  // Reset coord display
  var dispEl = document.getElementById('coord-display-' + type);
  var txtEl  = document.getElementById('coord-text-' + type);
  if (dispEl) dispEl.classList.remove('has-coord');
  if (txtEl)  txtEl.textContent = 'Koordinat belum dipilih';

  // Hapus temp marker
  if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }

  delete pickCoords[type];
}

function populateParentDropdowns(type) {
  // OLT tidak punya parent
  if (type === 'odc') {
    var sel = document.getElementById('odc-parent-olt');
    if (!sel) return;
    var olts = appData.nodes.filter(function(n){ return n.type==='olt'; });
    sel.innerHTML = '<option value="">-- Tidak Ada --</option>'
      + olts.map(function(n){ return '<option value="'+n.id+'">'+n.name+'</option>'; }).join('');
  }
  if (type === 'odp') {
    var sel2 = document.getElementById('odp-parent-odc');
    if (!sel2) return;
    var odcs = appData.nodes.filter(function(n){ return n.type==='odc'; });
    sel2.innerHTML = '<option value="">-- Tidak Ada --</option>'
      + odcs.map(function(n){ return '<option value="'+n.id+'">'+n.name+'</option>'; }).join('');
  }
  if (type === 'splitter') {
    var sel3 = document.getElementById('splitter-parent-odp');
    if (!sel3) return;
    var odps = appData.nodes.filter(function(n){ return n.type==='odp'; });
    sel3.innerHTML = '<option value="">-- Tidak Ada --</option>'
      + odps.map(function(n){ return '<option value="'+n.id+'">'+n.name+'</option>'; }).join('');
  }
  if (type === 'pelanggan') {
    var sel4 = document.getElementById('pelanggan-parent-odp');
    if (!sel4) return;
    var odps2 = appData.nodes.filter(function(n){ return n.type==='odp'; });
    sel4.innerHTML = '<option value="">-- Tidak Ada --</option>'
      + odps2.map(function(n){ return '<option value="'+n.id+'">'+n.name+'</option>'; }).join('');
  }
}

function simpanNode(type) {
  var coords = pickCoords[type];
  if (!coords) { alert('Koordinat belum dipilih! Silakan ulangi dari FAB.'); return; }

  var nameEl = document.getElementById(type + '-name');
  var name   = nameEl ? nameEl.value.trim() : '';
  if (!name) { alert('Nama wajib diisi!'); if(nameEl) nameEl.focus(); return; }

  var statusEl = document.getElementById(type + '-status');
  var status = statusEl ? normalizeStatus(statusEl.value) : 'online';

  var notesEl = document.getElementById(type + '-notes');
  var notes = notesEl ? notesEl.value : '';

  // Kumpulkan extra data per tipe
  var extra = {};
  if (type === 'olt') {
    extra.brand = (document.getElementById('olt-brand')||{}).value || '';
    extra.model = (document.getElementById('olt-model')||{}).value || '';
    extra.ports = parseInt((document.getElementById('olt-ports')||{}).value) || 4;
  }
  if (type === 'odc') {
    extra.capacity   = (document.getElementById('odc-capacity')||{}).value || '1:8';
    var pOlt = document.getElementById('odc-parent-olt');
    extra.parent_olt = pOlt && pOlt.value ? parseInt(pOlt.value) : null;
  }
  if (type === 'odp') {
    extra.capacity   = parseInt((document.getElementById('odp-capacity')||{}).value) || 8;
    var pOdc = document.getElementById('odp-parent-odc');
    extra.parent_odc = pOdc && pOdc.value ? parseInt(pOdc.value) : null;
  }
  if (type === 'splitter') {
    extra.rasio      = (document.getElementById('splitter-rasio')||{}).value || '1:8';
    var pOdp = document.getElementById('splitter-parent-odp');
    extra.parent_odp = pOdp && pOdp.value ? parseInt(pOdp.value) : null;
  }
  if (type === 'pelanggan') {
    extra.ont   = (document.getElementById('pelanggan-ont')||{}).value  || '';
    extra.port  = (document.getElementById('pelanggan-port')||{}).value || '';
    var pOdp2 = document.getElementById('pelanggan-parent-odp');
    extra.odp_id = pOdp2 && pOdp2.value ? parseInt(pOdp2.value) : null;
  }

  // Buat node baru
  var node = {
    id:     appData.nextId++,
    type:   type,
    name:   name,
    lat:    coords.lat,
    lng:    coords.lng,
    status: status,
    notes:  notes,
    extra:  extra
  };
  appData.nodes.push(node);

  // Auto-buat kabel ke parent jika ada
  var parentId = extra.parent_olt || extra.parent_odc || extra.parent_odp || extra.odp_id || null;
  if (parentId) {
    var cType = type==='odc' ? 'trunk' : type==='odp' ? 'distribution' : 'drop';
    var cCores= type==='odc' ? 12 : type==='odp' ? 8 : 4;
    appData.cables.push({
      id: 'c'+Date.now(),
      from: parentId,
      to: node.id,
      type: cType,
      cores: cCores,
      status: 'active'
    });
  }

  saveData();
  syncNetworkData();
  tutupModalNode(type);
  renderAll();

  // Zoom ke node baru
  setTimeout(function(){ map.setView([coords.lat, coords.lng], 18, { animate:true }); }, 150);
}

// ==================== FAB TOGGLE ====================
var fabOpen = false;
function toggleFab() {
  fabOpen = !fabOpen;
  document.getElementById('fabMenu').classList.toggle('open', fabOpen);
  document.getElementById('fabIcon').classList.toggle('open', fabOpen);
}
function tutupFab() {
  fabOpen = false;
  document.getElementById('fabMenu').classList.remove('open');
  document.getElementById('fabIcon').classList.remove('open');
}

function bukaModalKabel() {
  tutupFab();
  populateCableSelects();
  document.getElementById('modal-add-cable').style.display = 'flex';
}

// Tutup FAB saat klik di luar
document.addEventListener('click', function(e) {
  var fab = document.getElementById('fabContainer');
  if (fab && !fab.contains(e.target) && fabOpen) tutupFab();
});

// ==================== MARKER ICON ====================
function createMarkerIcon(type, status) {
  var cfg  = TYPE_CONFIG[type] || TYPE_CONFIG.pelanggan;
  var s    = cfg.sz;
  var st   = normalizeStatus(status);
  var color= cfg.color;
  var bc   = 'rgba(255,255,255,0.9)';
  var op   = 1;

  if (st==='offline')   op = 0.5;
  if (st==='maintenance') bc = '#f59e0b';
  if (st==='isolir'||st==='off_isolir') { color='#a855f7'; bc='#a855f7'; }

  var anim = (type==='olt') ? 'animation:pulse 2s infinite;' : '';
  var d = document.createElement('div');
  d.style.cssText = [
    'width:'+s+'px','height:'+s+'px','border-radius:50%',
    'background:'+color,'border:2.5px solid '+bc,
    'display:flex','align-items:center','justify-content:center',
    'font-size:'+Math.max(8,Math.floor(s/3.5))+'px',
    'font-weight:700','color:white',
    'box-shadow:0 2px 8px rgba(0,0,0,0.4)',
    'cursor:pointer','opacity:'+op, anim
  ].join(';');
  d.textContent = cfg.label;
  return L.divIcon({ html:d.outerHTML, iconSize:[s,s], iconAnchor:[s/2,s/2], className:'' });
}

// ==================== RENDER ====================
function renderAll() {
  Object.values(markers).forEach(function(m){ m.remove(); });
  Object.values(cablePolylines).forEach(function(c){ c.remove(); });
  markers={}; cablePolylines={};
  window.odpMarkers=[];

  // Kabel dulu
  if (layers.kabel) {
    appData.cables.forEach(function(cable){
      var fN = appData.nodes.find(function(n){ return n.id===cable.from; });
      var tN = appData.nodes.find(function(n){ return n.id===cable.to; });
      if (!fN||!tN) return;
      var color = getCableColor(cable);
      var w     = cable.type==='trunk'?4:cable.type==='distribution'?3:2;
      var dash  = cable.type==='drop'?'5,5':null;
      var pl = L.polyline([[fN.lat,fN.lng],[tN.lat,tN.lng]],
        { color:color, weight:w, dashArray:dash, opacity:0.85 }).addTo(map);
      pl.bindPopup(buildCablePopup(cable,fN,tN));
      pl._cableData = cable;
      cablePolylines[cable.id] = pl;
    });
  }

  // Nodes
  appData.nodes.forEach(function(node){
    if (!layers[node.type]) return;
    var m = L.marker([node.lat,node.lng], {
      icon: createMarkerIcon(node.type,node.status), title:node.name
    }).addTo(map);
    m.on('click', function(){ showNodeDetail(node.id); });
    m._nodeId = node.id;
    markers[node.id] = m;
    if (node.type==='odp') { m._odpData=node; window.odpMarkers.push(m); }
  });

  updateStats();
  updateNodeList();
}

function getCableColor(cable) {
  if (cable.status==='maintenance') return '#f59e0b';
  if (cable.status==='inactive')    return '#ef4444';
  var tN = appData.nodes.find(function(n){ return n.id===cable.to; });
  if (tN&&tN.type==='pelanggan') {
    var ns=normalizeStatus(tN.status);
    if (ns==='offline')              return '#ef4444';
    if (ns==='isolir'||ns==='off_isolir') return '#a855f7';
  }
  return CABLE_COLORS[cable.type]||'#94a3b8';
}

function buildCablePopup(cable,fN,tN) {
  return '<div style="font-size:12px;font-family:system-ui">'
    +'<b>🔌 Kabel FO</b><br>'
    +'Dari: '+fN.name+'<br>Ke: '+tN.name+'<br>'
    +'Tipe: '+cable.type+' | Core: '+cable.cores+'<br>'
    +'Status: <span style="color:'+(cable.status==='active'?'#10b981':'#ef4444')+'">'+cable.status+'</span><br>'
    +'<span style="color:#64748b">Jarak: ~'+calcDist(fN,tN)+' m</span></div>';
}

// ==================== REALTIME HOOKS ====================
window.updateKabelCustomerStatus = function(){
  Object.values(cablePolylines).forEach(function(pl){
    var c=pl._cableData; if(!c)return;
    pl.setStyle({ color:getCableColor(c) });
  });
  reapplyKabelOfflineBlink();
};
window.reapplyKabelOfflineBlink = function(){
  Object.values(cablePolylines).forEach(function(pl){
    var c=pl._cableData; if(!c)return;
    var tN=appData.nodes.find(function(n){ return n.id===c.to; });
    if(tN&&normalizeStatus(tN.status)==='offline'){
      if(pl._path) pl._path.classList.add('kabel-offline-blink');
    }
  });
};
window.updateOdpLossStatusAndKabelColors = window.updateKabelCustomerStatus;
window.updateOnlineOfflineCounter = function(){ updateStats(); };
window.updateCustomerMarkerFromStatus = function(obj){
  if(!obj)return;
  var node=appData.nodes.find(function(n){ return String(n.id)===String(obj.id); });
  if(!node)return;
  node.status = obj.online_status||obj.status||node.status;
  var m=markers[node.id];
  if(m) m.setIcon(createMarkerIcon(node.type,node.status));
};
window.updateKabelFlowAnimation = function(){};

// ==================== STATS ====================
function updateStats() {
  ['pelanggan','olt','odc','odp','splitter'].forEach(function(type){
    var ns = appData.nodes.filter(function(n){ return n.type===type; });
    var active = ns.filter(function(n){ var s=normalizeStatus(n.status); return s==='online'; }).length;
    var inactive= ns.filter(function(n){ var s=normalizeStatus(n.status); return s==='offline'; }).length;
    var maint  = ns.filter(function(n){ return normalizeStatus(n.status)==='maintenance'; }).length;
    var isolir = ns.filter(function(n){ var s=normalizeStatus(n.status); return s==='isolir'||s==='off_isolir'; }).length;

    var el=document.getElementById('count-'+type);   if(el) el.textContent=ns.length;
    var ea=document.getElementById('dot-'+type+'-active');    if(ea) ea.textContent=active;
    var ei=document.getElementById('dot-'+type+'-inactive');  if(ei) ei.textContent=inactive;
    var em=document.getElementById('dot-'+type+'-maintenance'); if(em) em.textContent=maint;
    var es=document.getElementById('dot-'+type+'-isolir');    if(es) es.textContent=isolir;
  });

  var totalDist=0;
  appData.cables.forEach(function(c){
    var f=appData.nodes.find(function(n){ return n.id===c.from; });
    var t=appData.nodes.find(function(n){ return n.id===c.to; });
    if(f&&t) totalDist+=calcDist(f,t);
  });
  var ek=document.getElementById('count-kabel');
  if(ek) ek.textContent=(totalDist/1000).toFixed(2);
}

function calcDist(a,b) {
  var R=6371000,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;
  return Math.round(2*R*Math.asin(Math.sqrt(
    Math.sin(dLat/2)*Math.sin(dLat/2)
    +Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2)
  )));
}

// ==================== NODE LIST ====================
function updateNodeList(filter) {
  filter=filter||'';
  var filtered=appData.nodes.filter(function(n){
    return n.name.toLowerCase().indexOf(filter.toLowerCase())>-1
      ||n.type.toLowerCase().indexOf(filter.toLowerCase())>-1;
  });
  var badge=document.getElementById('node-count-badge');
  if(badge) badge.textContent=filtered.length;
  var list=document.getElementById('node-list');
  if(!list)return;
  list.innerHTML=filtered.map(function(node){
    var st=normalizeStatus(node.status);
    return '<div class="node-item" onclick="focusNode('+node.id+')">'
      +'<div class="node-dot '+node.type+'"></div>'
      +'<div class="node-info"><div class="node-name">'+node.name+'</div>'
      +'<div class="node-type">'+node.type+'</div></div>'
      +'<span class="node-status-badge '+statusBadgeClass(st)+'">'+statusLabel(st)+'</span>'
      +'</div>';
  }).join('');
}

function searchNodes(val){ updateNodeList(val); }

function focusNode(id) {
  var node=appData.nodes.find(function(n){ return n.id===id; });
  if(!node)return;
  map.setView([node.lat,node.lng],18,{animate:true});
  showNodeDetail(id);
}

// ==================== NODE DETAIL ====================
function showNodeDetail(id) {
  var node=appData.nodes.find(function(n){ return n.id===id; });
  if(!node)return;
  selectedNodeForModal=id;
  var cfg=TYPE_CONFIG[node.type]||TYPE_CONFIG.pelanggan;
  var st=normalizeStatus(node.status);

  document.getElementById('detail-title').textContent=cfg.label+' — '+node.name;

  // Warna header sesuai tipe
  var colors={olt:'#6366f1',odc:'#10b981',odp:'#f59e0b',splitter:'#8b5cf6',pelanggan:'#06b6d4'};
  var dh=document.getElementById('detail-header');
  if(dh) dh.style.borderLeft='4px solid '+(colors[node.type]||'#3b82f6');

  var conn=appData.cables.filter(function(c){ return c.from===id||c.to===id; });

  var extraRows='';
  if(node.extra) {
    var skipKeys={parent_olt:1,parent_odc:1,parent_odp:1,odp_id:1};
    Object.keys(node.extra).forEach(function(k){
      if(skipKeys[k]||node.extra[k]===null||node.extra[k]==='') return;
      extraRows+='<div class="detail-row"><span class="detail-label">'+k+'</span>'
        +'<span class="detail-value">'+node.extra[k]+'</span></div>';
    });
  }

  // Cari nama parent
  var parentRow='';
  if(node.extra) {
    var pId=node.extra.parent_olt||node.extra.parent_odc||node.extra.parent_odp||node.extra.odp_id;
    if(pId) {
      var pNode=appData.nodes.find(function(n){ return n.id===parseInt(pId); });
      if(pNode) parentRow='<div class="detail-row"><span class="detail-label">Parent</span>'
        +'<span class="detail-value" style="color:'+cfg.color+'">'
        +'<a href="#" onclick="focusNode('+pNode.id+');closeModal(\'node-detail\');return false">'
        +pNode.name+'</a></span></div>';
    }
  }

  document.getElementById('detail-body').innerHTML=
    '<div class="detail-row"><span class="detail-label">Tipe</span>'
    +'<span class="detail-value" style="color:'+cfg.color+'">'+node.type.toUpperCase()+'</span></div>'
    +'<div class="detail-row"><span class="detail-label">Status</span>'
    +'<span class="detail-value"><span class="node-status-badge '+statusBadgeClass(st)+'">'+statusLabel(st)+'</span></span></div>'
    +'<div class="detail-row"><span class="detail-label">Koordinat</span>'
    +'<span class="detail-value" style="font-size:12px;font-family:monospace">'+node.lat.toFixed(5)+', '+node.lng.toFixed(5)+'</span></div>'
    +parentRow
    +extraRows
    +'<div class="detail-row"><span class="detail-label">Kabel</span>'
    +'<span class="detail-value">'+conn.length+' kabel terhubung</span></div>'
    +(node.notes?'<div class="detail-row"><span class="detail-label">Catatan</span>'
      +'<span class="detail-value">'+node.notes+'</span></div>':'')
    // Tombol ubah lokasi
    +'<div class="detail-row" style="border:none;padding-top:8px">'
    +'<button class="btn-remap" onclick="aktivasiPickModeRemap(\''+node.type+'\')">'
    +'🎯 Ubah Lokasi di Peta'
    +'</button></div>';

  document.getElementById('modal-node-detail').style.display='flex';
}

function aktivasiPickModeRemap(type) {
  closeModal('node-detail');
  aktivasiPickMode('remap-'+type);
}

function deleteCurrentNode() {
  if(!selectedNodeForModal)return;
  if(!confirm('Hapus node ini beserta semua kabel yang terhubung?'))return;
  appData.nodes  =appData.nodes.filter(function(n){ return n.id!==selectedNodeForModal; });
  appData.cables =appData.cables.filter(function(c){ return c.from!==selectedNodeForModal&&c.to!==selectedNodeForModal; });
  saveData(); syncNetworkData(); closeModal('node-detail'); renderAll();
}

// ==================== LAYER & MAP CONTROLS ====================
function toggleLayer(type){ layers[type]=!layers[type]; renderAll(); }

function fitAllNodes() {
  if(!appData.nodes.length)return;
  map.fitBounds(L.latLngBounds(appData.nodes.map(function(n){ return [n.lat,n.lng]; })),{padding:[50,50]});
}

function switchLayer(name,btn) {
  if(currentLayer===name)return;
  baseLayers[currentLayer].remove();
  baseLayers[name].addTo(map);
  currentLayer=name;
  document.querySelectorAll('.layer-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
}

// ==================== MODAL KABEL ====================
function closeModal(name) {
  var el=document.getElementById('modal-'+name);
  if(el) el.style.display='none';
}

function populateCableSelects() {
  var opts=appData.nodes.map(function(n){
    return '<option value="'+n.id+'">'+n.name+' ('+n.type+')</option>';
  }).join('');
  document.getElementById('cable-from').innerHTML=opts;
  document.getElementById('cable-to').innerHTML=opts;
  if(appData.nodes.length>1) document.getElementById('cable-to').selectedIndex=1;
}

function addCable() {
  var from  =parseInt(document.getElementById('cable-from').value);
  var to    =parseInt(document.getElementById('cable-to').value);
  var type  =document.getElementById('cable-type').value;
  var cores =parseInt(document.getElementById('cable-cores').value);
  var status=document.getElementById('cable-status').value;

  if(from===to){ alert('Node asal dan tujuan tidak boleh sama!'); return; }
  var dup=appData.cables.find(function(c){
    return (c.from===from&&c.to===to)||(c.from===to&&c.to===from);
  });
  if(dup){ alert('Kabel antara kedua node sudah ada!'); return; }

  appData.cables.push({ id:'c'+Date.now(), from:from, to:to, type:type, cores:cores, status:status });
  saveData(); syncNetworkData(); closeModal('add-cable'); renderAll();
}

// ==================== POWER CALC ====================
function calcPower() {
  var tx =parseFloat(document.getElementById('tx-power').value)||0;
  var cl =parseFloat(document.getElementById('cable-len').value)||0;
  var sr =parseFloat(document.getElementById('splitter-ratio').value)||0;
  var cn =parseInt(document.getElementById('connector-count').value)||0;
  var tl =(cl*0.35)+(cl*0.1)+sr+(cn*0.3);
  var rx =tx-tl;

  document.getElementById('total-loss').textContent='-'+tl.toFixed(2)+' dB';
  var rpEl=document.getElementById('rx-power');
  var rsEl=document.getElementById('rx-status');
  rpEl.textContent=rx.toFixed(2)+' dBm';
  if(rx>=-24){ rpEl.className='result-val result-ok'; rsEl.textContent='✅ Sangat Baik'; rsEl.className='result-val result-ok'; }
  else if(rx>=-27){ rpEl.className='result-val result-warn'; rsEl.textContent='⚠️ Normal (Batas)'; rsEl.className='result-val result-warn'; }
  else{ rpEl.className='result-val result-bad'; rsEl.textContent='❌ Di Bawah Batas'; rsEl.className='result-val result-bad'; }
}

// ==================== SIDEBAR & THEME ====================
function toggleSidebar() {
  sidebarOpen=!sidebarOpen;
  document.getElementById('sidebar').classList.toggle('collapsed',!sidebarOpen);
  document.querySelector('.sidebar-toggle').textContent=sidebarOpen?'‹':'›';
}

function toggleTheme() {
  isDark=!isDark;
  document.body.classList.toggle('light-mode',!isDark);
  document.body.classList.toggle('dark-mode',isDark);
  document.getElementById('theme-btn').textContent=isDark?'🌙':'☀️';
}

// ==================== KEYBOARD ====================
document.addEventListener('keydown', function(e){
  if(e.key==='Escape'){
    if(isPickMode){ batalkanModePick(); return; }
    tutupFab();
    ['add-cable','node-detail'].forEach(closeModal);
    ['olt','odc','odp','splitter','pelanggan'].forEach(tutupModalNode);
  }
});

// Tutup modal overlay saat klik di luar
document.addEventListener('click', function(e){
  if(e.target && e.target.classList && e.target.classList.contains('modal-overlay')){
    var id=e.target.id;
    if(id==='modal-add-cable') closeModal('add-cable');
    else if(id==='modal-node-detail') closeModal('node-detail');
    else {
      var type=id.replace('modal-','');
      if(['olt','odc','odp','splitter','pelanggan'].indexOf(type)>-1) tutupModalNode(type);
    }
  }
});

// ==================== INIT ====================
window.addEventListener('DOMContentLoaded', function(){
  loadData();
  initMap();
  renderAll();
  calcPower();
  setTimeout(fitAllNodes, 600);
});
