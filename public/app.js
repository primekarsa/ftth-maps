// FTTH Maps - app.js
// Kompatibel dengan realtime.js dan map.js

// ==================== DATA STORE ====================
var DB_KEY = 'ftth_maps_data';

// window.networkData dipakai oleh realtime.js
window.networkData = { customers: [], nodes: [], cables: [] };
window.odpStatusSummary = {};
window.odpMarkers = [];
window.mapSettings = {
  enableCableRealtime: false, // nonaktif default (standalone, tidak ada API Mikrotik)
  cableIntervalMs: 5000,
  odpOnlineDelaySec: 60,
  odpOfflineDelaySec: 60,
  odpMaintenanceDelaySec: 3600
};

var appData = { nodes: [], cables: [], nextId: 1 };

function saveData() {
  localStorage.setItem(DB_KEY, JSON.stringify(appData));
}

function loadData() {
  var raw = localStorage.getItem(DB_KEY);
  if (raw) {
    appData = JSON.parse(raw);
  } else {
    seedDemoData();
  }
  syncNetworkData();
}

// Sync appData ke window.networkData agar realtime.js bisa akses
function syncNetworkData() {
  window.networkData.nodes = appData.nodes;
  window.networkData.cables = appData.cables;
  // customers = pelanggan nodes, format yang dimengerti realtime.js
  window.networkData.customers = appData.nodes
    .filter(function(n) { return n.type === 'pelanggan'; })
    .map(function(n) {
      return {
        id: n.id,
        name: n.name,
        online_status: normalizeStatus(n.status),
        status: normalizeStatus(n.status),
        recharge_status: (n.status === 'isolir' || n.status === 'off_isolir') ? 'off' : '',
        odp_id: n.extra ? (n.extra.odp_id || '') : ''
      };
    });
  window.networkData.odps = appData.nodes
    .filter(function(n) { return n.type === 'odp'; })
    .map(function(n) { return { id: n.id, name: n.name, status: n.status, total_slots: 1, single_slot_status: n.status, slots: [] }; });
  window.networkData.odps_all = window.networkData.odps;
}

// Normalize status string
function normalizeStatus(s) {
  s = String(s || 'offline').toLowerCase().trim();
  if (s === 'online' || s === 'on' || s === 'active' || s === 'aktif') return 'online';
  if (s === 'isolir') return 'isolir';
  if (s === 'off_isolir') return 'off_isolir';
  if (s === 'maintenance') return 'maintenance';
  return 'offline';
}

// Status untuk tampilan badge (dipakai di HTML)
function statusBadgeClass(s) {
  s = normalizeStatus(s);
  if (s === 'online')      return 'status-online';
  if (s === 'isolir')      return 'status-isolir';
  if (s === 'off_isolir')  return 'status-isolir';
  if (s === 'maintenance') return 'status-maintenance';
  return 'status-offline';
}

function statusLabel(s) {
  s = normalizeStatus(s);
  if (s === 'online')      return 'Online';
  if (s === 'isolir')      return 'Isolir';
  if (s === 'off_isolir')  return 'Isolir';
  if (s === 'maintenance') return 'Maintenance';
  return 'Offline';
}

function seedDemoData() {
  appData.nodes = [
    { id:1,  type:'olt',      name:'OLT-HSGQ-XE04ID', lat:-6.3459, lng:107.9554, status:'active',      notes:'4 PON Port EPON', extra:{model:'HSGQ-XE04ID', pon_ports:4} },
    { id:2,  type:'odc',      name:'ODC-A01',          lat:-6.3430, lng:107.9590, status:'active',      notes:'Splitter 1:8',    extra:{capacity:'1:8'} },
    { id:3,  type:'odc',      name:'ODC-B01',          lat:-6.3480, lng:107.9530, status:'active',      notes:'Splitter 1:8',    extra:{capacity:'1:8'} },
    { id:4,  type:'odp',      name:'ODP-A01',          lat:-6.3420, lng:107.9610, status:'active',      notes:'RT 01',           extra:{core:8} },
    { id:5,  type:'odp',      name:'ODP-A02',          lat:-6.3415, lng:107.9625, status:'active',      notes:'RT 02',           extra:{core:8} },
    { id:6,  type:'odp',      name:'ODP-B01',          lat:-6.3490, lng:107.9510, status:'active',      notes:'RT 03',           extra:{core:8} },
    { id:7,  type:'odp',      name:'ODP-B02',          lat:-6.3500, lng:107.9495, status:'maintenance', notes:'RT 04',           extra:{core:8} },
    { id:8,  type:'splitter', name:'SPL-A01-1',        lat:-6.3422, lng:107.9608, status:'active',      notes:'',                extra:{ratio:'1:4'} },
    { id:9,  type:'splitter', name:'SPL-A01-2',        lat:-6.3418, lng:107.9622, status:'active',      notes:'',                extra:{ratio:'1:4'} },
    { id:10, type:'pelanggan',name:'PLG-001 Budi S.',  lat:-6.3416, lng:107.9612, status:'online',      notes:'',                extra:{ont:'ZTE F601',   port:'PON1/0/1', odp_id:4} },
    { id:11, type:'pelanggan',name:'PLG-002 Sari W.',  lat:-6.3418, lng:107.9615, status:'online',      notes:'',                extra:{ont:'ZTE F601',   port:'PON1/0/2', odp_id:4} },
    { id:12, type:'pelanggan',name:'PLG-003 Agus T.',  lat:-6.3420, lng:107.9617, status:'offline',     notes:'Belum bayar',     extra:{ont:'Huawei EG8145',port:'PON1/0/3',odp_id:4} },
    { id:13, type:'pelanggan',name:'PLG-004 Dewi L.',  lat:-6.3413, lng:107.9628, status:'online',      notes:'',                extra:{ont:'ZTE F601',   port:'PON1/0/4', odp_id:5} },
    { id:14, type:'pelanggan',name:'PLG-005 Hendra K.',lat:-6.3412, lng:107.9630, status:'online',      notes:'',                extra:{ont:'ZTE F601',   port:'PON1/0/5', odp_id:5} },
    { id:15, type:'pelanggan',name:'PLG-006 Rina P.',  lat:-6.3492, lng:107.9512, status:'isolir',      notes:'Tunggakan 2 bln', extra:{ont:'Huawei EG8145',port:'PON2/0/1',odp_id:6} },
    { id:16, type:'pelanggan',name:'PLG-007 Wahyu N.', lat:-6.3495, lng:107.9508, status:'online',      notes:'',                extra:{ont:'ZTE F601',   port:'PON2/0/2', odp_id:6} },
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
var map;
var markers = {};
var cablePolylines = {};
var layers = { pelanggan:true, olt:true, odc:true, odp:true, splitter:true, kabel:true };
var currentLayer = 'satellite';
var baseLayers = {};
var selectedNodeForModal = null;
var isDark = true;
var sidebarOpen = true;

var TILES = {
  satellite: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr:'Esri' },
  street:    { url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr:'OSM' },
  topo:      { url:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',   attr:'OpenTopo' }
};

var TYPE_CONFIG = {
  olt:       { color:'#6366f1', label:'OLT', sz:36 },
  odc:       { color:'#10b981', label:'ODC', sz:30 },
  odp:       { color:'#f59e0b', label:'ODP', sz:26 },
  splitter:  { color:'#8b5cf6', label:'SPL', sz:22 },
  pelanggan: { color:'#06b6d4', label:'🏠',  sz:18 }
};

var CABLE_COLORS = {
  trunk:        '#f59e0b',
  distribution: '#10b981',
  drop:         '#06b6d4'
};

function initMap() {
  map = L.map('map', { center:[-6.3459,107.9554], zoom:15, zoomControl:false, attributionControl:false });
  Object.keys(TILES).forEach(function(k) {
    baseLayers[k] = L.tileLayer(TILES[k].url, { attribution:TILES[k].attr, maxZoom:20 });
  });
  baseLayers.satellite.addTo(map);

  map.on('click', function(e) {
    if (document.getElementById('modal-add-node').style.display !== 'none') {
      document.getElementById('node-lat').value = e.latlng.lat.toFixed(6);
      document.getElementById('node-lng').value = e.latlng.lng.toFixed(6);
    }
  });

  // Expose map globally untuk map.js
  window.map = map;
}

// ==================== MARKER ICON ====================
function createMarkerIcon(type, status) {
  var cfg = TYPE_CONFIG[type] || TYPE_CONFIG.pelanggan;
  var s = cfg.sz;
  var st = normalizeStatus(status);

  var color = cfg.color;
  var bc = 'rgba(255,255,255,0.9)';
  var op = 1;

  if (st === 'offline')     { op = 0.55; }
  if (st === 'maintenance') { bc = '#f59e0b'; }
  if (st === 'isolir' || st === 'off_isolir') { color = '#a855f7'; bc = '#a855f7'; }

  var anim = (type === 'olt') ? 'animation:pulse 2s infinite;' : '';

  var d = document.createElement('div');
  d.style.cssText = [
    'width:'+s+'px','height:'+s+'px','border-radius:50%',
    'background:'+color,'border:2.5px solid '+bc,
    'display:flex','align-items:center','justify-content:center',
    'font-size:'+Math.max(8, s/3.5)+'px','font-weight:700','color:white',
    'box-shadow:0 2px 8px rgba(0,0,0,0.4)','cursor:pointer',
    'opacity:'+op, anim
  ].join(';');
  d.textContent = cfg.label;

  return L.divIcon({ html:d.outerHTML, iconSize:[s,s], iconAnchor:[s/2,s/2], className:'' });
}

// ==================== RENDER ====================
function renderAll() {
  Object.values(markers).forEach(function(m) { m.remove(); });
  Object.values(cablePolylines).forEach(function(c) { c.remove(); });
  markers = {};
  cablePolylines = {};
  window.odpMarkers = [];

  // Render kabel dulu (di bawah marker)
  if (layers.kabel) {
    appData.cables.forEach(function(cable) {
      var fromNode = appData.nodes.find(function(n) { return n.id === cable.from; });
      var toNode   = appData.nodes.find(function(n) { return n.id === cable.to; });
      if (!fromNode || !toNode) return;

      var color = getCableColor(cable);
      var w = cable.type === 'trunk' ? 4 : cable.type === 'distribution' ? 3 : 2;
      var dash = cable.type === 'drop' ? '5,5' : null;

      var pl = L.polyline(
        [[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]],
        { color:color, weight:w, dashArray:dash, opacity:0.85 }
      ).addTo(map);

      pl.bindPopup(buildCablePopup(cable, fromNode, toNode));
      pl._cableData = cable;
      cablePolylines[cable.id] = pl;
    });
  }

  // Render nodes
  appData.nodes.forEach(function(node) {
    if (!layers[node.type]) return;
    var m = L.marker([node.lat, node.lng], {
      icon: createMarkerIcon(node.type, node.status),
      title: node.name
    }).addTo(map);

    m.on('click', function() { showNodeDetail(node.id); });
    m._nodeId = node.id;
    markers[node.id] = m;

    if (node.type === 'odp') {
      m._odpData = node;
      window.odpMarkers.push(m);
    }
  });

  updateStats();
  updateNodeList();
}

function getCableColor(cable) {
  var st = cable.status;
  if (st === 'maintenance') return '#f59e0b';
  if (st === 'inactive')    return '#ef4444';

  // Cek apakah ada pelanggan offline/isolir di ujung kabel
  var toNode = appData.nodes.find(function(n) { return n.id === cable.to; });
  if (toNode && toNode.type === 'pelanggan') {
    var ns = normalizeStatus(toNode.status);
    if (ns === 'offline')    return '#ef4444';
    if (ns === 'isolir' || ns === 'off_isolir') return '#a855f7';
  }

  return CABLE_COLORS[cable.type] || '#94a3b8';
}

function buildCablePopup(cable, fromNode, toNode) {
  var d = calcDist(fromNode, toNode);
  return '<div style="font-size:12px;font-family:system-ui">'
    + '<b>🔌 Kabel FO</b><br>'
    + 'Dari: ' + fromNode.name + '<br>'
    + 'Ke: ' + toNode.name + '<br>'
    + 'Tipe: ' + cable.type + ' | Core: ' + cable.cores + '<br>'
    + 'Status: <span style="color:' + (cable.status==='active'?'#10b981':'#ef4444') + '">' + cable.status + '</span><br>'
    + '<span style="color:#64748b">Jarak: ~' + d + ' m</span></div>';
}

// ==================== REALTIME HOOKS ====================
// Fungsi-fungsi ini dipanggil oleh realtime.js

window.updateKabelCustomerStatus = function() {
  // Re-warnai semua kabel drop berdasarkan status pelanggan terkini
  Object.values(cablePolylines).forEach(function(pl) {
    var cable = pl._cableData;
    if (!cable) return;
    var color = getCableColor(cable);
    pl.setStyle({ color: color });
    pl._path && pl._path.classList && pl._path.classList.remove('kabel-offline-blink');
  });
  reapplyKabelOfflineBlink();
};

window.reapplyKabelOfflineBlink = function() {
  Object.values(cablePolylines).forEach(function(pl) {
    var cable = pl._cableData;
    if (!cable) return;
    var toNode = appData.nodes.find(function(n) { return n.id === cable.to; });
    if (toNode && normalizeStatus(toNode.status) === 'offline') {
      if (pl._path) pl._path.classList.add('kabel-offline-blink');
    }
  });
};

window.updateOdpLossStatusAndKabelColors = function() {
  window.updateKabelCustomerStatus();
};

window.updateOnlineOfflineCounter = function() {
  updateStats();
};

window.updateCustomerMarkerFromStatus = function(customerObj) {
  if (!customerObj) return;
  var node = appData.nodes.find(function(n) { return String(n.id) === String(customerObj.id); });
  if (!node) return;
  // Sync status ke node
  node.status = customerObj.online_status || customerObj.status || node.status;
  // Update marker icon tanpa re-render semua
  var m = markers[node.id];
  if (m) {
    m.setIcon(createMarkerIcon(node.type, node.status));
  }
};

window.updateKabelFlowAnimation = function() {
  // Placeholder — animasi flow bisa dikembangkan
};

// ==================== STATS ====================
function updateStats() {
  var types = ['pelanggan','olt','odc','odp','splitter'];
  types.forEach(function(type) {
    var nodes = appData.nodes.filter(function(n) { return n.type === type; });
    var active = nodes.filter(function(n) {
      var s = normalizeStatus(n.status);
      return s === 'online' || s === 'active';
    }).length;
    var inactive = nodes.filter(function(n) {
      var s = normalizeStatus(n.status);
      return s === 'offline' || s === 'inactive';
    }).length;
    var maint = nodes.filter(function(n) { return normalizeStatus(n.status) === 'maintenance'; }).length;
    var isolir = nodes.filter(function(n) {
      var s = normalizeStatus(n.status);
      return s === 'isolir' || s === 'off_isolir';
    }).length;

    var elCount = document.getElementById('count-' + type);
    if (elCount) elCount.textContent = nodes.length;

    var elA = document.getElementById('dot-' + type + '-active');
    if (elA) elA.textContent = active;
    var elI = document.getElementById('dot-' + type + '-inactive');
    if (elI) elI.textContent = inactive;
    var elM = document.getElementById('dot-' + type + '-maintenance');
    if (elM) elM.textContent = maint;
    var elIs = document.getElementById('dot-' + type + '-isolir');
    if (elIs) elIs.textContent = isolir;
  });

  // Total kabel km
  var totalDist = 0;
  appData.cables.forEach(function(c) {
    var f = appData.nodes.find(function(n) { return n.id === c.from; });
    var t = appData.nodes.find(function(n) { return n.id === c.to; });
    if (f && t) totalDist += calcDist(f, t);
  });
  var elK = document.getElementById('count-kabel');
  if (elK) elK.textContent = (totalDist / 1000).toFixed(2);
}

function calcDist(a, b) {
  var R = 6371000;
  var dLat = (b.lat - a.lat) * Math.PI / 180;
  var dLng = (b.lng - a.lng) * Math.PI / 180;
  var x = Math.sin(dLat/2)*Math.sin(dLat/2)
        + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)
        * Math.sin(dLng/2)*Math.sin(dLng/2);
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

// ==================== NODE LIST ====================
function updateNodeList(filter) {
  filter = filter || '';
  var filtered = appData.nodes.filter(function(n) {
    return n.name.toLowerCase().indexOf(filter.toLowerCase()) > -1
      || n.type.toLowerCase().indexOf(filter.toLowerCase()) > -1;
  });

  var badge = document.getElementById('node-count-badge');
  if (badge) badge.textContent = filtered.length;

  var list = document.getElementById('node-list');
  if (!list) return;
  list.innerHTML = filtered.map(function(node) {
    var st = normalizeStatus(node.status);
    var bc = statusBadgeClass(st);
    var bl = statusLabel(st);
    return '<div class="node-item" onclick="focusNode('+node.id+')" data-id="'+node.id+'">'
      + '<div class="node-dot '+node.type+'"></div>'
      + '<div class="node-info"><div class="node-name">'+node.name+'</div><div class="node-type">'+node.type+'</div></div>'
      + '<span class="node-status-badge '+bc+'">'+bl+'</span>'
      + '</div>';
  }).join('');
}

function searchNodes(val) { updateNodeList(val); }

function focusNode(id) {
  var node = appData.nodes.find(function(n) { return n.id === id; });
  if (!node) return;
  map.setView([node.lat, node.lng], 18, { animate:true });
  showNodeDetail(id);
}

// ==================== NODE DETAIL ====================
function showNodeDetail(id) {
  var node = appData.nodes.find(function(n) { return n.id === id; });
  if (!node) return;
  selectedNodeForModal = id;
  var cfg = TYPE_CONFIG[node.type] || TYPE_CONFIG.pelanggan;
  var st = normalizeStatus(node.status);

  document.getElementById('detail-title').textContent = cfg.label + ' — ' + node.name;

  var conn = appData.cables.filter(function(c) { return c.from === id || c.to === id; });

  var extraRows = '';
  if (node.extra) {
    Object.keys(node.extra).forEach(function(k) {
      if (k === 'odp_id') return;
      extraRows += '<div class="detail-row"><span class="detail-label">'+k+'</span><span class="detail-value">'+node.extra[k]+'</span></div>';
    });
  }

  document.getElementById('detail-body').innerHTML =
    '<div class="detail-row"><span class="detail-label">Tipe</span><span class="detail-value" style="color:'+cfg.color+'">'+node.type.toUpperCase()+'</span></div>'
    + '<div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="node-status-badge '+statusBadgeClass(st)+'">'+statusLabel(st)+'</span></span></div>'
    + '<div class="detail-row"><span class="detail-label">Koordinat</span><span class="detail-value">'+node.lat.toFixed(5)+', '+node.lng.toFixed(5)+'</span></div>'
    + extraRows
    + '<div class="detail-row"><span class="detail-label">Kabel Terhubung</span><span class="detail-value">'+conn.length+' kabel</span></div>'
    + (node.notes ? '<div class="detail-row"><span class="detail-label">Catatan</span><span class="detail-value">'+node.notes+'</span></div>' : '');

  openModal('node-detail');
}

function deleteCurrentNode() {
  if (!selectedNodeForModal) return;
  if (!confirm('Hapus node ini beserta semua kabel yang terhubung?')) return;
  appData.nodes = appData.nodes.filter(function(n) { return n.id !== selectedNodeForModal; });
  appData.cables = appData.cables.filter(function(c) { return c.from !== selectedNodeForModal && c.to !== selectedNodeForModal; });
  saveData();
  syncNetworkData();
  closeModal('node-detail');
  renderAll();
}

// ==================== LAYER TOGGLE ====================
function toggleLayer(type) { layers[type] = !layers[type]; renderAll(); }

// ==================== MAP CONTROLS ====================
function fitAllNodes() {
  if (!appData.nodes.length) return;
  var bounds = L.latLngBounds(appData.nodes.map(function(n) { return [n.lat, n.lng]; }));
  map.fitBounds(bounds, { padding:[50,50] });
}

function switchLayer(name, btn) {
  if (currentLayer === name) return;
  baseLayers[currentLayer].remove();
  baseLayers[name].addTo(map);
  currentLayer = name;
  document.querySelectorAll('.layer-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
}

// ==================== MODALS ====================
function openModal(name) {
  if (name === 'add-cable') populateCableSelects();
  if (name === 'add-node')  updateNodeForm();
  document.getElementById('modal-' + name).style.display = 'flex';
}

function closeModal(name) {
  document.getElementById('modal-' + name).style.display = 'none';
}

function updateNodeForm() {
  var type = document.getElementById('node-type') ? document.getElementById('node-type').value : '';
  var extra = document.getElementById('node-extra-fields');
  if (!extra) return;
  var fields = {
    olt:       '<div class="form-group"><label>Model OLT</label><input id="xm" value="HSGQ-XE04ID"/></div><div class="form-group"><label>PON Ports</label><input type="number" id="xp" value="4"/></div>',
    odc:       '<div class="form-group"><label>Kapasitas</label><select id="xc"><option>1:4</option><option selected>1:8</option><option>1:16</option><option>1:32</option></select></div>',
    odp:       '<div class="form-group"><label>Kapasitas Core</label><input type="number" id="xco" value="8"/></div>',
    splitter:  '<div class="form-group"><label>Rasio</label><select id="xr"><option>1:2</option><option>1:4</option><option selected>1:8</option><option>1:16</option><option>1:32</option></select></div>',
    pelanggan: '<div class="form-group"><label>Tipe ONT</label><input id="xon" placeholder="ZTE F601"/></div><div class="form-group"><label>Port PON</label><input id="xpo" placeholder="PON-1/0/1"/></div>'
  };
  extra.innerHTML = fields[type] || '';
}

function addNode() {
  var type   = document.getElementById('node-type').value;
  var name   = document.getElementById('node-name').value.trim();
  var lat    = parseFloat(document.getElementById('node-lat').value);
  var lng    = parseFloat(document.getElementById('node-lng').value);
  var status = document.getElementById('node-status').value;
  var notes  = document.getElementById('node-notes').value;

  if (!name || isNaN(lat) || isNaN(lng)) { alert('Nama dan koordinat harus diisi!'); return; }

  var extra = {};
  ['xm','xp','xc','xco','xr','xon','xpo'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) extra[id.replace('x','')] = el.value;
  });

  var node = { id:appData.nextId++, type:type, name:name, lat:lat, lng:lng, status:normalizeStatus(status), notes:notes, extra:extra };
  appData.nodes.push(node);
  saveData();
  syncNetworkData();
  closeModal('add-node');
  renderAll();

  setTimeout(function() { map.setView([lat, lng], 17, { animate:true }); }, 100);
  ['node-name','node-lat','node-lng','node-notes'].forEach(function(id) { document.getElementById(id).value = ''; });
}

function populateCableSelects() {
  var opts = appData.nodes.map(function(n) {
    return '<option value="'+n.id+'">'+n.name+' ('+n.type+')</option>';
  }).join('');
  document.getElementById('cable-from').innerHTML = opts;
  document.getElementById('cable-to').innerHTML = opts;
  if (appData.nodes.length > 1) document.getElementById('cable-to').selectedIndex = 1;
}

function addCable() {
  var from   = parseInt(document.getElementById('cable-from').value);
  var to     = parseInt(document.getElementById('cable-to').value);
  var type   = document.getElementById('cable-type').value;
  var cores  = parseInt(document.getElementById('cable-cores').value);
  var status = document.getElementById('cable-status').value;

  if (from === to) { alert('Node asal dan tujuan tidak boleh sama!'); return; }
  var dup = appData.cables.find(function(c) {
    return (c.from === from && c.to === to) || (c.from === to && c.to === from);
  });
  if (dup) { alert('Kabel antara kedua node sudah ada!'); return; }

  appData.cables.push({ id:'c'+Date.now(), from:from, to:to, type:type, cores:cores, status:status });
  saveData();
  syncNetworkData();
  closeModal('add-cable');
  renderAll();
}

// ==================== POWER CALC ====================
function calcPower() {
  var tx  = parseFloat(document.getElementById('tx-power').value) || 0;
  var cl  = parseFloat(document.getElementById('cable-len').value) || 0;
  var sr  = parseFloat(document.getElementById('splitter-ratio').value) || 0;
  var cn  = parseInt(document.getElementById('connector-count').value) || 0;

  var totalLoss = (cl * 0.35) + (cl * 0.1) + sr + (cn * 0.3);
  var rx = tx - totalLoss;

  document.getElementById('total-loss').textContent = '-' + totalLoss.toFixed(2) + ' dB';

  var rpEl = document.getElementById('rx-power');
  var rsEl = document.getElementById('rx-status');
  rpEl.textContent = rx.toFixed(2) + ' dBm';

  if (rx >= -24) {
    rpEl.className = 'result-val result-ok';
    rsEl.textContent = '✅ Sangat Baik';
    rsEl.className = 'result-val result-ok';
  } else if (rx >= -27) {
    rpEl.className = 'result-val result-warn';
    rsEl.textContent = '⚠️ Normal (Batas)';
    rsEl.className = 'result-val result-warn';
  } else {
    rpEl.className = 'result-val result-bad';
    rsEl.textContent = '❌ Di Bawah Batas';
    rsEl.className = 'result-val result-bad';
  }
}

// ==================== SIDEBAR & THEME ====================
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar').classList.toggle('collapsed', !sidebarOpen);
  document.querySelector('.sidebar-toggle').textContent = sidebarOpen ? '‹' : '›';
}

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('light-mode', !isDark);
  document.body.classList.toggle('dark-mode', isDark);
  document.getElementById('theme-btn').textContent = isDark ? '🌙' : '☀️';
}

// ==================== KEYBOARD ====================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    ['add-node','add-cable','node-detail'].forEach(closeModal);
  }
});

document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      var id = overlay.id.replace('modal-', '');
      closeModal(id);
    }
  });
});

// ==================== INIT ====================
window.addEventListener('DOMContentLoaded', function() {
  loadData();
  initMap();
  renderAll();
  calcPower();
  setTimeout(fitAllNodes, 600);
});
