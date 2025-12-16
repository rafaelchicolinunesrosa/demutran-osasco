// ========== VARIÁVEIS GLOBAIS ==========
const turnos = [
  { nome: "12x36 - 6h às 18h" },
  { nome: "12x36 - 8h às 20h" },
  { nome: "12x36 - 10h às 22h" },
  { nome: "12x36 - 18h às 06h" },
  { nome: "12x36 - 19h às 07h" },
  { nome: "5x2 - 8h às 17h" },
  { nome: "5x2 - 6h às 13h" }
];

// ========== INICIALIZAÇÃO ==========
function initEscalaSystem() {
  console.log('Inicializando sistema de escalas...');
  
  // Carregar configuração
  loadConfig();
  
  // Verificar se está configurado
  if (CONFIG.configured && CONFIG.binId) {
    document.getElementById('configSection').style.display = 'none';
  }
  
  // Criar turnos
  const container = document.getElementById('turnosContainer');
  turnos.forEach((turno, idx) => {
    container.appendChild(createTurnoCard(turno, idx));
  });
  
  // Inicializar seletor de turnos
  initTurnosSelector();
  
  // Inicializar auto-grow
  initAutoGrow();
  
  // Auto-preencher dia da semana
  document.getElementById('data').addEventListener('change', function() {
    const dateInput = this.value;
    if (dateInput) {
      const date = new Date(dateInput + 'T00:00:00');
      const dayOfWeek = date.getDay();
      const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      document.getElementById('diaSemana').value = daysOfWeek[dayOfWeek];
    }
  });
  
  console.log('Sistema inicializado com sucesso!');
}

// ========== CRIAÇÃO DE TURNOS ==========
function createTurnoCard(turno, idx) {
  const card = document.createElement('div');
  card.className = 'turno-card';
  card.id = `turno-${idx}`;
  card.dataset.turnoIdx = idx;
  card.innerHTML = `
    <div class="turno-title">${turno.nome}</div>
    <table id="table-${idx}">
      <thead>
        <tr>
          <th class="col-viatura">Viatura</th>
          <th class="col-agentes">Agentes</th>
          <th class="col-36">36</th>
          <th class="col-os">O.S. / Observações</th>
          <th class="col-acao"></th>
        </tr>
      </thead>
      <tbody>
        ${createRow(idx)}
      </tbody>
    </table>
    <button type="button" class="add-row-btn" onclick="addRow(${idx})">Adicionar Linha</button>
  `;
  return card;
}

function createRow(idx) {
  return `
    <tr>
      <td class="col-viatura"><input type="text" name="viatura-${idx}[]"></td>
      <td class="col-agentes">
        <textarea name="agentes-${idx}[]" rows="1" placeholder="Nomes" oninput="formatAgentes(this)"></textarea>
      </td>
      <td class="col-36"><input type="text" name="horario-${idx}[]" placeholder="Ex: 6h-18h"></td>
      <td class="col-os">
        <textarea name="os-${idx}[]" class="auto-grow" rows="1" placeholder="O.S."></textarea>
      </td>
      <td class="col-acao"><button type="button" class="remove-row-btn" onclick="removeRow(this)">X</button></td>
    </tr>
  `;
}

function addRow(idx) {
  const tbody = document.querySelector(`#table-${idx} tbody`);
  tbody.insertAdjacentHTML('beforeend', createRow(idx));
  initAutoGrow();
}

function removeRow(btn) {
  const row = btn.closest('tr');
  const tbody = row.parentNode;
  
  // Não permitir remover a última linha
  if (tbody.querySelectorAll('tr').length > 1) {
    row.remove();
  } else {
    alert('Não é possível remover a última linha!');
  }
}

// ========== SELETOR DE TURNOS ==========
function initTurnosSelector() {
  const sel = document.getElementById('turnosSelector');
  turnos.forEach((t, idx) => {
    const wrapper = document.createElement('label');
    wrapper.innerHTML = `
      <input type="checkbox" class="turno-toggle" data-idx="${idx}" checked>
      <span>${t.nome}</span>
    `;
    sel.appendChild(wrapper);
  });

  sel.addEventListener('change', (e) => {
    if (e.target.classList.contains('turno-toggle')) {
      const idx = e.target.getAttribute('data-idx');
      const card = document.getElementById('turno-' + idx);
      card.style.display = e.target.checked ? 'block' : 'none';
    }
  });
}

// ========== FORMATAÇÃO DE TEXTO ==========
function formatAgentes(textarea) {
  textarea.value = textarea.value.replace(/,\s*/g, '\n');
  autoGrow(textarea);
}

function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function initAutoGrow() {
  document.querySelectorAll('textarea, td input[type="text"]').forEach(el => {
    el.addEventListener('input', () => autoGrow(el));
    autoGrow(el);
  });
}

// ========== COLETA DE DADOS ==========
function collectFormData() {
  const data = {
    data: document.getElementById('data').value,
    diaSemana: document.getElementById('diaSemana').value,
    plantao: document.getElementById('tipoOperacao').value,
    supervisor: document.getElementById('supervisor').value,
    observacoes: document.getElementById('observacoes').value,
    turnos: [],
    turnosVisibility: {}
  };

  turnos.forEach((turno, idx) => {
    const tableBody = document.querySelector(`#table-${idx} tbody`);
    const rows = [];

    Array.from(tableBody.querySelectorAll('tr')).forEach(tr => {
      const viatura = tr.querySelector(`input[name="viatura-${idx}[]"]`).value;
      const agentes = tr.querySelector(`textarea[name="agentes-${idx}[]"]`).value;
      const horario = tr.querySelector(`input[name="horario-${idx}[]"]`).value;
      const os = tr.querySelector(`textarea[name="os-${idx}[]"]`).value;

      if (viatura.trim() || agentes.trim()) {
        rows.push({ viatura, agentes, horario, os });
      }
    });

    data.turnos.push({ idx, rows });
  });

  document.querySelectorAll('.turno-toggle').forEach(toggle => {
    const idx = toggle.getAttribute('data-idx');
    data.turnosVisibility[idx] = toggle.checked;
  });

  return data;
}

// ========== CARREGAMENTO DE DADOS ==========
function loadFormData(data) {
  document.getElementById('data').value = data.data;
  document.getElementById('diaSemana').value = data.diaSemana;
  document.getElementById('tipoOperacao').value = data.plantao;
  document.getElementById('supervisor').value = data.supervisor;
  document.getElementById('observacoes').value = data.observacoes;

  data.turnos.forEach(turnoData => {
    const idx = turnoData.idx;
    const tableBody = document.querySelector(`#table-${idx} tbody`);
    tableBody.innerHTML = '';

    if (turnoData.rows.length === 0) {
      tableBody.insertAdjacentHTML('beforeend', createRow(idx));
    } else {
      turnoData.rows.forEach(rowData => {
        tableBody.insertAdjacentHTML('beforeend', createRow(idx));
        const newRow = tableBody.lastElementChild;
        newRow.querySelector(`input[name="viatura-${idx}[]"]`).value = rowData.viatura;
        newRow.querySelector(`textarea[name="agentes-${idx}[]"]`).value = rowData.agentes;
        newRow.querySelector(`input[name="horario-${idx}[]"]`).value = rowData.horario;
        newRow.querySelector(`textarea[name="os-${idx}[]"]`).value = rowData.os;
      });
    }
  });

  if (data.turnosVisibility) {
    document.querySelectorAll('.turno-toggle').forEach(toggle => {
      const idx = toggle.getAttribute('data-idx');
      if (data.turnosVisibility[idx] !== undefined) {
        toggle.checked = data.turnosVisibility[idx];
        const card = document.getElementById('turno-' + idx);
        card.style.display = toggle.checked ? 'block' : 'none';
      }
    });
  }

  initAutoGrow();
}

// ========== TEMPLATES LOCAIS ==========
function saveTemplate() {
  const plantao = document.getElementById('tipoOperacao').value;
  if (!plantao) {
    alert('⚠️ Selecione um Plantão antes de salvar o template.');
    return;
  }

  const template = collectFormData();
  delete template.observacoes;
  template.turnos.forEach(t => t.rows.forEach(r => r.os = ''));

  const templateKey = `escalaTemplate_${plantao.replace(/\s+/g, '_')}`;
  localStorage.setItem(templateKey, JSON.stringify(template));

  alert(`✅ Template salvo localmente para ${plantao}!`);
}

function loadTemplate() {
  const plantao = document.getElementById('tipoOperacao').value;
  if (!plantao) {
    alert('⚠️ Selecione um Plantão antes de carregar o template.');
    return;
  }

  const templateKey = `escalaTemplate_${plantao.replace(/\s+/g, '_')}`;
  const saved = localStorage.getItem(templateKey);

  if (!saved) {
    alert(`❌ Nenhum template encontrado para ${plantao}.`);
    return;
  }

  if (confirm(`Carregar template para ${plantao}?\n\nIsso substituirá os dados atuais.`)) {
    loadFormData(JSON.parse(saved));
    alert('✅ Template carregado com sucesso!');
  }
}

// ========== SALVAMENTO NA NUVEM ==========
async function saveToCloud() {
  if (!CONFIG.configured) {
    alert('⚠️ Configure o sistema primeiro!');
    document.getElementById('configSection').style.display = 'block';
    return;
  }

  const data = document.getElementById('data').value;
  const plantao = document.getElementById('tipoOperacao').value;
  const supervisor = document.getElementById('supervisor').value;

  if (!data || !plantao || !supervisor) {
    alert('❌ Preencha Data, Plantão e Supervisor antes de salvar!');
    return;
  }

  const escalaData = collectFormData();
  const timestamp = new Date().toLocaleString('pt-BR');

  showLoading('Salvando na nuvem...');

  try {
    const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.binId}/latest`, {
      headers: {
        'X-Master-Key': CONFIG.apiKey
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Erro ao buscar dados (${getResponse.status})`);
    }

    const currentData = await getResponse.json();
    let escalas = currentData.record.escalas || [];

    const existingIndex = escalas.findIndex(e => e.data === data && e.plantao === plantao);

    const newEscala = {
      data: data,
      plantao: plantao,
      supervisor: supervisor,
      dados: escalaData,
      timestamp: timestamp
    };

    if (existingIndex >= 0) {
      escalas[existingIndex] = newEscala;
    } else {
      escalas.push(newEscala);
    }

    const updatePayload = {
      escalas: escalas,
      lastUpdate: timestamp,
      system: 'DEMUTRAN Osasco'
    };

    const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': CONFIG.apiKey
      },
      body: JSON.stringify(updatePayload)
    });

    hideLoading();

    if (updateResponse.ok) {
      alert(`✅ Escala salva com sucesso na nuvem!\n\n📅 Data: ${formatDateBR(data)}\n👮 Plantão: ${plantao}\n👤 Supervisor: ${supervisor}\n🕐 ${timestamp}\n\nTotal de escalas: ${escalas.length}`);
    } else {
      alert(`❌ Erro ao salvar:\n\nStatus: ${updateResponse.status}`);
    }
  } catch (error) {
    hideLoading();
    alert(`❌ Erro ao salvar na nuvem:\n\n${error.message}`);
  }
}

// ========== CARREGAMENTO DA NUVEM ==========
async function loadFromCloud() {
  if (!CONFIG.configured) {
    alert('⚠️ Configure o sistema primeiro!');
    document.getElementById('configSection').style.display = 'block';
    return;
  }

  const data = document.getElementById('data').value;
  const plantao = document.getElementById('tipoOperacao').value;

  if (!data || !plantao) {
    alert('❌ Selecione Data e Plantão para carregar!');
    return;
  }

  showLoading('Buscando escala...');

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.binId}/latest`, {
      headers: {
        'X-Master-Key': CONFIG.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const result = await response.json();
    const escalas = result.record.escalas || [];

    const found = escalas.find(e => e.data === data && e.plantao === plantao);

    hideLoading();

    if (found) {
      loadFormData(found.dados);
      alert(`✅ Escala carregada com sucesso!\n\n📅 Data: ${formatDateBR(data)}\n👮 Plantão: ${plantao}\n👤 Supervisor: ${found.supervisor}\n🕐 Salva em: ${found.timestamp}`);
    } else {
      alert(`ℹ️ Nenhuma escala encontrada para:\n\n📅 Data: ${formatDateBR(data)}\n👮 Plantão: ${plantao}\n\nTotal de escalas salvas: ${escalas.length}`);
    }
  } catch (error) {
    hideLoading();
    alert(`❌ Erro ao carregar:\n\n${error.message}`);
  }
}

// ========== LISTAR TODAS AS ESCALAS ==========
async function listAllScales() {
  if (!CONFIG.configured) {
    alert('⚠️ Configure o sistema primeiro!');
    document.getElementById('configSection').style.display = 'block';
    return;
  }

  showLoading('Carregando escalas...');

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.binId}/latest`, {
      headers: {
        'X-Master-Key': CONFIG.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const result = await response.json();
    const escalas = result.record.escalas || [];

    hideLoading();

    if (escalas.length === 0) {
      alert('ℹ️ Nenhuma escala salva ainda.\n\nPreencha uma escala e clique em "Salvar na Nuvem".');
      return;
    }

    escalas.sort((a, b) => new Date(b.data) - new Date(a.data));

    let html = '<div style="max-height: 500px; overflow-y: auto;">';
    html += '<table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">';
    html += '<thead><tr style="background: #667eea; color: white; position: sticky; top: 0;">';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">Data</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">Plantão</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">Supervisor</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">Última Atualização</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">Ações</th>';
    html += '</tr></thead><tbody>';

    escalas.forEach((escala) => {
      html += '<tr>';
      html += `<td style="padding: 8px; border: 1px solid #ddd;">${formatDateBR(escala.data)}</td>`;
      html += `<td style="padding: 8px; border: 1px solid #ddd;">${escala.plantao}</td>`;
      html += `<td style="padding: 8px; border: 1px solid #ddd;">${escala.supervisor}</td>`;
      html += `<td style="padding: 8px; border: 1px solid #ddd; font-size: 0.85rem;">${escala.timestamp}</td>`;
      html += `<td style="padding: 8px; border: 1px solid #ddd;">`;
      html += `<button onclick="loadScaleFromList('${escala.data}', '${escala.plantao}')" style="padding: 5px 12px; background: #0070c0; color: white; border: none; border-radius: 4px; cursor: pointer;">📥 Carregar</button>`;
      html += '</td></tr>';
    });

    html += '</tbody></table></div>';

    showModal(`📋 Todas as Escalas Salvas (${escalas.length})`, html);
  } catch (error) {
    hideLoading();
    alert(`❌ Erro ao listar escalas:\n\n${error.message}`);
  }
}

function loadScaleFromList(date, plantao) {
  document.getElementById('data').value = date;
  document.getElementById('tipoOperacao').value = plantao;
  closeModal();
  loadFromCloud();
}

// ========== MODAL ==========
function showModal(title, content) {
  const existingModal = document.getElementById('customModal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'customModal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';

  const modalContent = document.createElement('div');
  modalContent.style.cssText = 'background: white; padding: 25px; border-radius: 12px; max-width: 95%; max-height: 90%; overflow: auto;';

  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 12px;">
      <h2 style="margin: 0; color: #667eea;">${title}</h2>
      <button onclick="closeModal()" style="background: #c00; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">✕ Fechar</button>
    </div>
    ${content}
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

function closeModal() {
  const modal = document.getElementById('customModal');
  if (modal) modal.remove();
}

// ========== UTILITÁRIOS ==========
function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
