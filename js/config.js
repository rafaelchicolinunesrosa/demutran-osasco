const CONFIG_KEY = 'demutran_jsonbin_config_v4';

let CONFIG = {
  apiKey: '',
  binId: '',
  configured: false
};

function loadConfig() {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    CONFIG = JSON.parse(saved);
  }
  return CONFIG;
}

function saveConfig(apiKey, binId) {
  CONFIG = {
    apiKey: apiKey,
    binId: binId,
    configured: true
  };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(CONFIG));
}

function showLoading(text = 'Processando...') {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    document.getElementById('loadingText').textContent = text;
    overlay.classList.add('show');
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

function showConfigStatus(type, message) {
  const status = document.getElementById('configStatus');
  if (status) {
    status.className = `status show`;
    status.style.background = type === 'success' ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)';
    status.textContent = message;
  }
}

async function createDatabase() {
  const apiKey = document.getElementById('apiKey').value.trim();

  if (!apiKey) {
    showConfigStatus('error', '❌ Insira sua Master Key do JSONBin!');
    return;
  }

  showLoading('Criando banco de dados...');

  try {
    const initialData = {
      escalas: [],
      created: new Date().toISOString(),
      version: '1.0',
      system: 'DEMUTRAN Osasco'
    };

    const response = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey
      },
      body: JSON.stringify(initialData)
    });

    const responseText = await response.text();
    hideLoading();

    if (response.ok) {
      const result = JSON.parse(responseText);
      const binId = result.metadata.id;
      
      saveConfig(apiKey, binId);
      
      showConfigStatus('success', `✅ Banco de dados criado com sucesso!\n\nBin ID: ${binId}\n\nSistema configurado e pronto para uso!`);
      
      setTimeout(() => {
        document.getElementById('configSection').style.display = 'none';
      }, 4000);
    } else {
      let errorMsg = 'Erro desconhecido';
      try {
        const error = JSON.parse(responseText);
        errorMsg = error.message || JSON.stringify(error);
      } catch (e) {
        errorMsg = responseText;
      }
      showConfigStatus('error', `❌ Erro ao criar banco:\n\nStatus: ${response.status}\nMensagem: ${errorMsg}`);
    }
  } catch (error) {
    hideLoading();
    showConfigStatus('error', `❌ Erro de conexão:\n\n${error.message}`);
  }
}

async function testConnection() {
  if (!CONFIG.configured || !CONFIG.binId) {
    showConfigStatus('error', '❌ Crie o banco de dados primeiro!');
    return;
  }

  showLoading('Testando conexão...');

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.binId}/latest`, {
      headers: {
        'X-Master-Key': CONFIG.apiKey
      }
    });

    hideLoading();

    if (response.ok) {
      const result = await response.json();
      const count = result.record.escalas ? result.record.escalas.length : 0;
      showConfigStatus('success', `✅ Conexão OK!\n\nBin ID: ${CONFIG.binId}\nEscalas salvas: ${count}`);
    } else {
      showConfigStatus('error', `❌ Erro ao conectar:\n\nStatus: ${response.status}`);
    }
  } catch (error) {
    hideLoading();
    showConfigStatus('error', `❌ Erro de conexão:\n\n${error.message}`);
  }
}
