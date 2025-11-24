// ========== CONFIGURAÇÃO CENTRALIZADA ==========
// ⚠️ ATENÇÃO ADMINISTRADOR: Configure sua Master Key aqui uma única vez
const CENTRAL_CONFIG = {
  apiKey: '$2a$10$vgfrAI6lgj5R0fSHzxhFDemJRBzc4fONGjcygtAvBtaRd3Y3251FO',  // ← COLE SUA MASTER KEY AQUI
  binId: '6923def143b1c97be9c13215',              // ← COLE SEU BIN ID AQUI (após criar o banco)
  configured: true  // Mude para true após configurar
};


const CONFIG_KEY = 'demutran_jsonbin_config_v4';
let CONFIG = { ...CENTRAL_CONFIG };

function loadConfig() {
  // Se já está configurado centralmente, usar essa configuração
  if (CENTRAL_CONFIG.configured && CENTRAL_CONFIG.apiKey && CENTRAL_CONFIG.binId) {
    CONFIG = { ...CENTRAL_CONFIG };
    console.log('✅ Usando configuração centralizada do administrador');
    return CONFIG;
  }

  // Caso contrário, tentar carregar do localStorage (modo antigo)
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    CONFIG = JSON.parse(saved);
    console.log('✅ Configuração carregada do localStorage');
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
  console.log('✅ Configuração salva com sucesso!');
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

  // Verificar se já existe configuração
  if (CONFIG.configured && CONFIG.binId) {
    const useExisting = confirm(
      `⚠️ ATENÇÃO!\n\n` +
      `Já existe um banco de dados configurado:\n` +
      `Bin ID: ${CONFIG.binId}\n\n` +
      `Deseja MANTER este banco (recomendado)?\n\n` +
      `• SIM = Mantém os dados existentes\n` +
      `• NÃO = Cria um novo banco (perderá os dados antigos)`
    );

    if (useExisting) {
      saveConfig(apiKey, CONFIG.binId);
      showConfigStatus('success', 
        `✅ Configuração atualizada!\n\n` +
        `Bin ID mantido: ${CONFIG.binId}\n` +
        `Seus dados estão preservados!`
      );
      
      setTimeout(() => {
        document.getElementById('configSection').style.display = 'none';
      }, 3000);
      
      return;
    }
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
      
      showConfigStatus('success', 
        `✅ Banco de dados criado com sucesso!\n\n` +
        `Bin ID: ${binId}\n\n` +
        `⚠️ IMPORTANTE PARA O ADMINISTRADOR:\n` +
        `Copie este Bin ID e cole no arquivo js/config.js\n` +
        `na linha: binId: '${binId}'\n\n` +
        `Depois mude configured: true\n\n` +
        `Assim todos os supervisores usarão o mesmo banco!`
      );
      
      setTimeout(() => {
        document.getElementById('configSection').style.display = 'none';
      }, 10000);
    } else {
      let errorMsg = 'Erro desconhecido';
      try {
        const error = JSON.parse(responseText);
        errorMsg = error.message || JSON.stringify(error);
      } catch (e) {
        errorMsg = responseText;
      }
      showConfigStatus('error', 
        `❌ Erro ao criar banco:\n\n` +
        `Status: ${response.status}\n` +
        `Mensagem: ${errorMsg}\n\n` +
        `Verifique se a API Key está correta.`
      );
    }
  } catch (error) {
    hideLoading();
    showConfigStatus('error', `❌ Erro de conexão:\n\n${error.message}`);
  }
}

async function testConnection() {
  if (!CONFIG.configured || !CONFIG.binId) {
    showConfigStatus('error', '❌ Configure o banco de dados primeiro!');
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
      showConfigStatus('success', 
        `✅ Conexão OK!\n\n` +
        `Bin ID: ${CONFIG.binId}\n` +
        `Escalas salvas: ${count}\n` +
        `Última atualização: ${result.record.lastUpdate || 'N/A'}\n\n` +
        `Sistema funcionando perfeitamente!`
      );
    } else {
      showConfigStatus('error', 
        `❌ Erro ao conectar:\n\n` +
        `Status: ${response.status}\n\n` +
        `Verifique se a API Key e Bin ID estão corretos.`
      );
    }
  } catch (error) {
    hideLoading();
    showConfigStatus('error', `❌ Erro de conexão:\n\n${error.message}`);
  }
}

// Função para resetar configuração (uso administrativo)
function resetConfig() {
  if (confirm(
    '⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!\n\n' +
    'Isso irá APAGAR a configuração local.\n' +
    'Os dados no JSONBin NÃO serão perdidos,\n' +
    'mas você precisará reconfigurar o sistema.\n\n' +
    'Deseja continuar?'
  )) {
    localStorage.removeItem(CONFIG_KEY);
    CONFIG = { apiKey: '', binId: '', configured: false };
    alert('✅ Configuração resetada!\n\nRecarregue a página para reconfigurar.');
    location.reload();
  }
}
