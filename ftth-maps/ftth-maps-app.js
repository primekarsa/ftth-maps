// FTTH Maps - Main Application
// OLT: HSGQ-XE04ID (4 PON Ports)

// ==================== DATA STORE ====================
const DB_KEY = 'ftth_maps_data';

let appData = {
  nodes: [],
  cables: [],
  nextId: 1
};

function saveData() {
  localStorage.setItem(DB_KEY, JSON.stringify(appData));
}

function loadData() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    appData = JSON.parse(raw);
  } else {
    // Seed with demo data
    seedDemoData();
  }
}

function seedDemoData() {
  const baseNodes = [
    { id: 1, type: 'olt', name: 'OLT-HSGQ-XE04ID', lat: -6.3459, lng: 107.9554, status: 'active', notes: '4 PON Port, Kapasitas 256 ONT', extra: { brand: 'HSGQ', model: 'XE04ID', pon_ports: 4 } },
    { id: 2, type: 'odc', name: 'ODC-A01', lat: -6.3430, lng: 107.9590, status: 'active', notes: 'Splitter 1:8', extra: { capacity: '1:8' } },
    { id: 3, type: 'odc', name: 'ODC-B01', lat: -6.3480, lng: 107.9530, status: 'active', notes: 'Splitter 1:8', extra: { capacity: '1:8' } },
    { id: 4, type: 'odp', name: 'ODP-A01', lat: -6.3420, lng: 107.9610, status: 'active', notes: 'ODP tiang RT 01', extra: { capacity: 8 } },
    { id: 5, type: 'odp', name: 'ODP-A02', lat: -6.3415, lng: 107.9625, status: 'active', notes: 'ODP tiang RT 02', extra: { capacity: 8 } },
    { id: 6, type: 'odp', name: 'ODP-B01', lat: -6.3490, lng: 107.9510, status: 'active', notes: 'ODP tiang RT 03', extra: { capacity: 8 } },
    { id: 7, type: 'odp', name: 'ODP-B02', lat: -6.3500, lng: 107.9495, status: 'maintenance', notes: 'ODP tiang RT 04', extra: { capacity: 8 } },
    { id: 8, type: 'splitter', name: 'SPL-A01-1', lat: -6.3422, lng: 107.9608, status: 'active', notes: 'Splitter 1:4', extra: { ratio: '1:4' } },
    { id: 9, type: 'splitter', name: 'SPL-A01-2', lat: -6.3418, lng: 107.9622, status: 'active', notes: 'Splitter 1:4', extra: { ratio: '1:4' } },
    { id: 10, type: 'pelanggan', name: 'PLG-001 - Budi S.', lat: -6.3416, lng: 107.9612, status: 'active', notes: 'ONT: 192.168.1.2', extra: { ont: 'ZTE F601', port: 'PON-1/0/1' } },
    { id: 11, type: 'pelanggan', name: 'PLG-002 - Sari W.', lat: -6.3418, lng: 107.9615, status: 'active', notes: 'ONT: 192.168.1.3', extra: { ont: 'ZTE F601', port: 'PON-1/0/2' } },
    { id: 12, type: 'pelanggan', name: 'PLG-003 - Agus T.', lat: -6.3420, lng: 107.9617, status: 'inactive', notes: 'Belum bayar tagihan', extra: { ont: 'Huawei EG8145', port: 'PON-1/0/3' } },
    { id: 13, type: 'pelanggan', name: 'PLG-004 - Dewi L.', lat: -6.3413, lng: 107.9628, status: 'active', notes: 'ONT: 192.168.1.5', extra: { ont: 'ZTE F601', port: 'PON-1/0/4' } },
    { id: 14, type: 'pelanggan', name: 'PLG-005 - Hendra K.', lat: -6.3412, lng: 107.9630, status: 'active', notes: 'Paket 10 Mbps', extra: { ont: 'ZTE F601', port: 'PON-1/0/5' } },
    { id: 15, type: 'pelanggan', name: 'PLG-006 - Rina P.', lat: -6.3492, lng: 107.9512, status: 'active', notes: 'Paket 20 Mbps', extra: { ont: 'Huawei EG8145', port: 'PON-2/0/1' } },
    { id: 16, type: 'pelanggan', name: 'PLG-007 - Wahyu N.', lat: -6.3495, lng: 107.9508, status: 'active', notes: 'Paket 10 Mbps', extra: { ont: 'ZTE F601', port: 'PON-2/0/2' } },
  ];

  const baseCables = [
    { id: 'c1', from: 1, to: 2, type: 'trunk', cores: 12, status: 'active' },
    { id: 'c2', from: 1, to: 3, type: 'trunk', cores: 12, status: 'active' },
    { id: 'c3', from: 2, to: 4, type: 'distribution', cores: 8, status: 'active' },
    { id: 'c4', from: 2, to: 5, type: 'distribution', cores: 8, status: 'active' },
    { id: 'c5', from: 3, to: 6, type: 'distribution', cores: 8, status: 'active' },
    { id: 'c6', from: 3, to: 7, type: 'distribution', cores: 8, status: 'maintenance' },
    { id: 'c7', from: 4, to: 8, type: 'drop', cores: 4, status: 'active' },
    { id: 'c8', from: 5, to: 9, type: 'drop', cores: 4, status: 'active' },
    { id: 'c9', from: 8, to: 10, type: 'drop', cores: 4, status: 'active' },
    { id: 'c10', from: 8, to: 11, type: 'drop', cores: 4, status: 'active' },
    { id: 'c11', from: 8, to: 12, type: 'drop', cores: 4, status: 'active' },
    { id: 'c12', from: 9, to: 13, type: 'drop', cores: 4, status: 'active' },
    { id: 'c13', from: 9, to: 14, type: 'drop', cores: 4, status: 'active' },
    { id: 'c14', from: 6, to: 15, type: 'drop', cores: 4, status: 'active' },
    { id: 'c15', from: 6, to: 16, type: 'drop', cores: 4, status: 'active' },
  ];

  appData.nodes = baseNodes;
  appData.cables = baseCables;
  appData.nextId = 20;
  saveData();
}

// ==================== MAP SETUP ====================
let map;
let markers = {};
let cables = {};
let layers = { pelanggan: true, olt: true, odc: true, odp: true, splitter: true, kabel: true };
let currentLayer = 'satellite';
let baseLayers = {};
let selectedNodeForModal = null;
let pickingCoord = false;

const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri'
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap'
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenTopoMap'
  }
};

function initMap() {
  const center = [-6.3459, 107.9554];

  map = L.map('map', {
    center, zoom: 15,
    zoomControl: false,
    attributionControl: false
  });

  Object.entries(TILE_LAYERS).forEach(([key, val]) => {
    baseLayers[key] = L.tileLayer(val.url, { attribution: val.attr, maxZoom: 20 });
  });

  baseLayers.satellite.addTo(map);

  // Click to pick coordinate
  map.on('click', (e) => {
    if (document.getElementById('modal-add-node').style.display !== 'none') {
      document.getElementById('node-lat').value = e.latlng.lat.toFixed(6);
      document.getElementById('node-lng').value = e.latlng.lng.toFixed(6);
    }
  });
}

// ==================== MARKER COLORS ====================
const TYPE_CONFIG = {
  olt:       { color: '#10b981', label: 'OLT',      size: 36 },
  odc:       { color: '#f59e0b', label: 'ODC',      size: 30 },
  odp:       { color: '#8b5cf6', label: 'ODP',      size: 26 },
  splitter:  { color: '#06b6d4', label: 'SPL',      size: 22 },
  pelanggan: { color: '#3b82f6', label: '🏠',       size: 18 }
};

const CABLE_COLORS = {
  trunk: '#f59e0b',
  distribution: '#10b981',
  drop: '#94a3b8'
};

function createMarkerIcon(type, status) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.pelanggan;
  const s = cfg.size;
  const opacity = status === 'inactive' ? 0.5 : 1;
  const borderColor = status === 'maintenance' ? '#f59e0b' : 'white';

  const div = document.createElement('div');
  div.style.cssText = `
    width:${s}px;height:${s}px;
    border-radius:50%;
    background:${cfg.color};
    border:2.5px solid ${borderColor};
    display:flex;align-items:center;justify-content:center;
    font-size:${Math.max(9, s/3.5)}px;
    font-weight:700;color:white;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
    cursor:pointer;
    opacity:${opacity};
  `;
  div.textContent = cfg.label;

  return L.divIcon({
    html: div.outerHTML,
    iconSize: [s, s],
    iconAnchor: [s/2, s/2],
    className: ''
  });
}

// ==================== RENDER ====================
function renderAll() {
  // Clear existing
  Object.values(markers).forEach(m => m.remove());
  Object.values(cables).forEach(c => c.remove());
  markers = {}; cables = {};

  // Render cables first (below markers)
  if (layers.kabel) {
    appData.cables.forEach(cable => {
      const fromNode = appData.nodes.find(n => n.id === cable.from);
      const toNode = appData.nodes.find(n => n.id === cable.to);
      if (!fromNode || !toNode) return;

      const color = cable.status === 'maintenance' ? '#f59e0b' :
                    cable.status === 'inactive' ? '#ef4444' :
                    CABLE_COLORS[cable.type] || '#94a3b8';

      const weight = cable.type === 'trunk' ? 4 :
                     cable.type === 'distribution' ? 3 : 2;

      const dashArray = cable.type === 'drop' ? '5,5' : null;

      const polyline = L.polyline(
        [[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]],
        { color, weight, dashArray, opacity: 0.8 }
      ).addTo(map);

      // Cable popup
      polyline.bindPopup(`
        <div style="font-family:system-ui;font-size:13px">
          <div style="font-weight:600;margin-bottom:6px">🔌 Kabel FO</div>
          <div style="color:#94a3b8">Dari: <span style="color:#e2e8f0">${fromNode.name}</span></div>
          <div style="color:#94a3b8">Ke: <span style="color:#e2e8f0">${toNode.name}</span></div>
          <div style="color:#94a3b8">Tipe: <span style="color:#e2e8f0">${cable.type}</span></div>
          <div style="color:#94a3b8">Core: <span style="color:#e2e8f0">${cable.cores}</span></div>
          <div style="color:#94a3b8">Status: <span style="color:${cable.status==='active'?'#10b981':'#ef4444'}">${cable.status}</span></div>
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #2e3348">
            <span style="color:#94a3b8">Jarak: ~${calcDist(fromNode, toNode)} m</span>
          </div>
        </div>
      `);

      cables[cable.id] = polyline;
    });
  }

  // Render nodes
  appData.nodes.forEach(node => {
    if (!layers[node.type]) return;

    const marker = L.marker([node.lat, node.lng], {
      icon: createMarkerIcon(node.type, node.status),
      title: node.name
    }).addTo(map);

    marker.on('click', () => showNodeDetail(node.id));

    markers[node.id] = marker;
  });

  updateStats();
  updateNodeList();
}

// ==================== STATS ====================
function updateStats() {
  const types = ['pelanggan', 'olt', 'odc', 'odp', 'splitter'];
  types.forEach(type => {
    const nodes = appData.nodes.filter(n => n.type === type);
    const active = nodes.filter(n => n.status === 'active').length;
    const inactive = nodes.filter(n => n.status !== 'active').length;

    const el = document.getElementById(`count-${type}`);
    if (el) el.textContent = nodes.length;
    const dotA = document.getElementById(`dot-${type}-active`);
    if (dotA) dotA.textContent = `●${active}`;
    const dotI = document.getElementById(`dot-${type}-inactive`);
    if (dotI) dotI.textContent = `●${inactive}`;
  });

  // Kabel total distance in km
  let totalDist = 0;
  appData.cables.forEach(c => {
    const from = appData.nodes.find(n => n.id === c.from);
    const to = appData.nodes.find(n => n.id === c.to);
    if (from && to) totalDist += calcDist(from, to);
  });
  const kabelEl = document.getElementById('count-kabel');
  if (kabelEl) kabelEl.textContent = (totalDist / 1000).toFixed(2);
}

function calcDist(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

// ==================== NODE LIST ====================
function updateNodeList(filter = '') {
  const list = document.getElementById('node-list');
  const filtered = appData.nodes.filter(n =>
    n.name.toLowerCase().includes(filter.toLowerCase()) ||
    n.type.toLowerCase().includes(filter.toLowerCase())
  );

  document.getElementById('node-count-badge').textContent = filtered.length;

  list.innerHTML = filtered.map(node => `
    <div class="node-item" onclick="focusNode(${node.id})" data-id="${node.id}">
      <div class="node-dot ${node.type}"></div>
      <div class="node-info">
        <div class="node-name">${node.name}</div>
        <div class="node-type">${node.type}</div>
      </div>
      <span class="node-status-badge status-${node.status}">${node.status}</span>
    </div>
  `).join('');
}

function searchNodes(val) {
  updateNodeList(val);
}

function focusNode(id) {
  const node = appData.nodes.find(n => n.id === id);
  if (!node) return;
  map.setView([node.lat, node.lng], 18, { animate: true });
  if (markers[id]) markers[id].openPopup();
  showNodeDetail(id);
}

// ==================== NODE DETAIL ====================
function showNodeDetail(id) {
  const node = appData.nodes.find(n => n.id === id);
  if (!node) return;
  selectedNodeForModal = id;

  const cfg = TYPE_CONFIG[node.type];
  document.getElementById('detail-title').textContent = `${cfg.label} - ${node.name}`;

  const connectedCables = appData.cables.filter(c => c.from === id || c.to === id);

  let extraRows = '';
  if (node.extra) {
    Object.entries(node.extra).forEach(([k, v]) => {
      extraRows += `<div class="detail-row"><span class="detail-label">${k}</span><span class="detail-value">${v}</span></div>`;
    });
  }

  document.getElementById('detail-body').innerHTML = `
    <div class="detail-row"><span class="detail-label">ID</span><span class="detail-value">#${node.id}</span></div>
    <div class="detail-row"><span class="detail-label">Tipe</span><span class="detail-value" style="color:${cfg.color}">${node.type.toUpperCase()}</span></div>
    <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="node-status-badge status-${node.status}">${node.status}</span></span></div>
    <div class="detail-row"><span class="detail-label">Koordinat</span><span class="detail-value">${node.lat.toFixed(5)}, ${node.lng.toFixed(5)}</span></div>
    ${extraRows}
    <div class="detail-row"><span class="detail-label">Kabel Terhubung</span><span class="detail-value">${connectedCables.length} kabel</span></div>
    ${node.notes ? `<div class="detail-row"><span class="detail-label">Catatan</span><span class="detail-value">${node.notes}</span></div>` : ''}
  `;

  openModal('node-detail');
}

function deleteCurrentNode() {
  if (!selectedNodeForModal) return;
  if (!confirm('Hapus node ini? Semua kabel yang terhubung juga akan dihapus.')) return;

  appData.nodes = appData.nodes.filter(n => n.id !== selectedNodeForModal);
  appData.cables = appData.cables.filter(c => c.from !== selectedNodeForModal && c.to !== selectedNodeForModal);
  saveData();
  closeModal('node-detail');
  renderAll();
}

// ==================== LAYER TOGGLE ====================
function toggleLayer(type) {
  layers[type] = !layers[type];
  renderAll();
}

// ==================== MAP CONTROLS ====================
function fitAllNodes() {
  if (appData.nodes.length === 0) return;
  const bounds = L.latLngBounds(appData.nodes.map(n => [n.lat, n.lng]));
  map.fitBounds(bounds, { padding: [50, 50] });
}

function switchLayer(name, btn) {
  if (currentLayer === name) return;
  baseLayers[currentLayer].remove();
  baseLayers[name].addTo(map);
  currentLayer = name;
  document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

let heatmapVisible = false;
function toggleHeatmap() {
  heatmapVisible = !heatmapVisible;
  document.getElementById('heatmap-btn').style.opacity = heatmapVisible ? '1' : '0.5';
  // Simple density circles
  if (heatmapVisible) {
    appData.nodes.filter(n => n.type === 'pelanggan').forEach(n => {
      L.circle([n.lat, n.lng], { radius: 50, color: '#3b82f6', fillOpacity: 0.15, weight: 0 }).addTo(map);
    });
  } else {
    renderAll();
  }
}

// ==================== MODALS ====================
function openModal(name) {
  if (name === 'add-cable') {
    populateCableSelects();
  }
  if (name === 'add-node') {
    updateNodeForm();
  }
  document.getElementById(`modal-${name}`).style.display = 'flex';
}

function closeModal(name) {
  document.getElementById(`modal-${name}`).style.display = 'none';
}

function updateNodeForm() {
  const type = document.getElementById('node-type')?.value;
  const extra = document.getElementById('node-extra-fields');
  if (!extra) return;

  const fields = {
    olt: `<label>Brand/Model</label><input type="text" id="extra-model" value="HSGQ-XE04ID" /><label>Jumlah PON Port</label><input type="number" id="extra-pon" value="4" min="1" />`,
    odc: `<label>Kapasitas Splitter</label><select id="extra-cap"><option>1:4</option><option selected>1:8</option><option>1:16</option><option>1:32</option></select>`,
    odp: `<label>Kapasitas Core</label><input type="number" id="extra-cores" value="8" min="1" />`,
    splitter: `<label>Rasio Splitter</label><select id="extra-ratio"><option>1:2</option><option>1:4</option><option selected>1:8</option><option>1:16</option><option>1:32</option></select>`,
    pelanggan: `<label>Nomor ONT</label><input type="text" id="extra-ont" placeholder="ZTE F601" /><label>Port PON</label><input type="text" id="extra-port" placeholder="PON-1/0/1" />`
  };

  extra.innerHTML = fields[type] || '';
}

function addNode() {
  const type = document.getElementById('node-type').value;
  const name = document.getElementById('node-name').value.trim();
  const lat = parseFloat(document.getElementById('node-lat').value);
  const lng = parseFloat(document.getElementById('node-lng').value);
  const status = document.getElementById('node-status').value;
  const notes = document.getElementById('node-notes').value;

  if (!name || isNaN(lat) || isNaN(lng)) {
    alert('Nama dan koordinat harus diisi!');
    return;
  }

  // Collect extra fields
  let extra = {};
  ['extra-model', 'extra-pon', 'extra-cap', 'extra-cores', 'extra-ratio', 'extra-ont', 'extra-port'].forEach(id => {
    const el = document.getElementById(id);
    if (el) extra[id.replace('extra-', '')] = el.value;
  });

  const node = { id: appData.nextId++, type, name, lat, lng, status, notes, extra };
  appData.nodes.push(node);
  saveData();
  closeModal('add-node');
  renderAll();

  // Focus new marker
  setTimeout(() => {
    map.setView([lat, lng], 17, { animate: true });
  }, 100);

  // Reset form
  document.getElementById('node-name').value = '';
  document.getElementById('node-lat').value = '';
  document.getElementById('node-lng').value = '';
  document.getElementById('node-notes').value = '';
}

function populateCableSelects() {
  const from = document.getElementById('cable-from');
  const to = document.getElementById('cable-to');
  const opts = appData.nodes.map(n => `<option value="${n.id}">${n.name} (${n.type})</option>`).join('');
  from.innerHTML = opts;
  to.innerHTML = opts;
  if (appData.nodes.length > 1) to.selectedIndex = 1;
}

function addCable() {
  const from = parseInt(document.getElementById('cable-from').value);
  const to = parseInt(document.getElementById('cable-to').value);
  const type = document.getElementById('cable-type').value;
  const cores = parseInt(document.getElementById('cable-cores').value);
  const status = document.getElementById('cable-status').value;

  if (from === to) { alert('Node asal dan tujuan tidak boleh sama!'); return; }

  // Check duplicate
  const dup = appData.cables.find(c =>
    (c.from === from && c.to === to) || (c.from === to && c.to === from)
  );
  if (dup) { alert('Kabel antara kedua node sudah ada!'); return; }

  const cable = { id: `c${Date.now()}`, from, to, type, cores, status };
  appData.cables.push(cable);
  saveData();
  closeModal('add-cable');
  renderAll();
}

// ==================== POWER CALCULATOR ====================
function calcPower() {
  const tx = parseFloat(document.getElementById('tx-power').value) || 0;
  const cableLen = parseFloat(document.getElementById('cable-len').value) || 0;
  const splitterLoss = parseFloat(document.getElementById('splitter-ratio').value) || 0;
  const connectors = parseInt(document.getElementById('connector-count').value) || 0;

  const FIBER_LOSS = 0.35; // dB/km for G.652D
  const CONNECTOR_LOSS = 0.3; // dB per connector
  const SPLICE_LOSS = 0.1; // dB per km approximate

  const cableLoss = cableLen * FIBER_LOSS;
  const spliceLoss = cableLen * SPLICE_LOSS;
  const connLoss = connectors * CONNECTOR_LOSS;
  const totalLoss = cableLoss + spliceLoss + splitterLoss + connLoss;
  const rx = tx - totalLoss;

  document.getElementById('total-loss').textContent = `-${totalLoss.toFixed(2)} dB`;

  const rxEl = document.getElementById('rx-power');
  const statusEl = document.getElementById('rx-status');
  rxEl.textContent = `${rx.toFixed(2)} dBm`;

  // EPON receiver sensitivity typically -27 dBm
  if (rx >= -24) {
    rxEl.className = 'result-val result-ok';
    statusEl.textContent = '✅ Sangat Baik';
    statusEl.className = 'result-val result-ok';
  } else if (rx >= -27) {
    rxEl.className = 'result-val result-warn';
    statusEl.textContent = '⚠️ Normal (Batas)';
    statusEl.className = 'result-val result-warn';
  } else {
    rxEl.className = 'result-val result-bad';
    statusEl.textContent = '❌ Di Bawah Batas';
    statusEl.className = 'result-val result-bad';
  }
}

// ==================== SIDEBAR ====================
let sidebarOpen = true;
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const btn = document.querySelector('.sidebar-toggle');
  sidebarOpen = !sidebarOpen;
  sidebar.classList.toggle('collapsed', !sidebarOpen);
  btn.textContent = sidebarOpen ? '‹' : '›';
}

// ==================== THEME ====================
let isDark = true;
function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('light-mode', !isDark);
  document.getElementById('theme-btn').textContent = isDark ? '🌙' : '☀️';
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['add-node', 'add-cable', 'node-detail'].forEach(closeModal);
  }
});

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      const id = overlay.id.replace('modal-', '');
      closeModal(id);
    }
  });
});

// ==================== INIT ====================
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  initMap();
  renderAll();
  calcPower();

  // Initial fit
  setTimeout(fitAllNodes, 500);
});
