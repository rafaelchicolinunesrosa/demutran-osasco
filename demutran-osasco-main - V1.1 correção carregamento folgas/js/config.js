// ==================== CONFIGURAÇÃO CENTRALIZADA ====================
// ⚠️ ATENÇÃO ADMINISTRADOR: Configure suas Master Keys aqui uma única vez

// Configuração para ESCALAS (seu sistema atual)
const CENTRAL_CONFIG = {
  apiKey: '$2a$10$vgfrAI6lgj5R0fSHzxhFDemJRBzc4fONGjcygtAvBtaRd3Y3251FO',
  binId: '6923def143b1c97be9c13215',
  configured: true
};

// Configuração para FOLGAS (atualize com seu Bin ID real)
const CENTRAL_CONFIG_FOLGAS = {
  apiKey: '$2a$10$vgfrAI6lgj5R0fSHzxhFDemJRBzc4fONGjcygtAvBtaRd3Y3251FO',
  binId: '692f678743b1c97be9d3aca4', // ✅ JÁ ESTÁ CONFIGURADO
  configured: true
};


// ==================== SISTEMA DE CONFIGURAÇÃO ====================

const CONFIG_KEY = 'demutran_jsonbin_config_v4';
const CONFIG_KEY_FOLGAS = 'demutran_jsonbin_config_folgas_v1';

let CONFIG = { ...CENTRAL_CONFIG };
let CONFIG_FOLGAS = { ...CENTRAL_CONFIG_FOLGAS };

// Carregar configuração de ESCALAS
function loadConfig() {
  if (CENTRAL_CONFIG.configured && CENTRAL_CONFIG.apiKey && CENTRAL_CONFIG.binId) {
    CONFIG = { ...CENTRAL_CONFIG };
    console.log('✅ Usando configuração centralizada de ESCALAS');
    return CONFIG;
  }

  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    CONFIG = JSON.parse(saved);
    console.log('✅ Configuração de ESCALAS carregada do localStorage');
  }
  return CONFIG;
}

// Carregar configuração de FOLGAS
function loadConfigFolgas() {
  // Primeiro, verificar se já foi configurado centralmente
  if (CENTRAL_CONFIG_FOLGAS.configured && CENTRAL_CONFIG_FOLGAS.binId) {
    CONFIG_FOLGAS = { ...CENTRAL_CONFIG_FOLGAS };
    console.log('✅ Usando configuração centralizada de FOLGAS');
    return CONFIG_FOLGAS;
  }

  // Tentar carregar do localStorage
  const saved = localStorage.getItem(CONFIG_KEY_FOLGAS);
  if (saved) {
    CONFIG_FOLGAS = JSON.parse(saved);
    console.log('✅ Configuração de FOLGAS carregada do localStorage');
    return CONFIG_FOLGAS;
  }

  // Se não existe, usar a API Key de escalas
  CONFIG_FOLGAS = {
    apiKey: CENTRAL_CONFIG.apiKey,
    binId: '',
    configured: false
  };
  console.log('⚠️ Configuração de FOLGAS não encontrada - será criada');
  return CONFIG_FOLGAS;
}

// Salvar configuração de ESCALAS
function saveConfig(apiKey, binId) {
  CONFIG = {
    apiKey: apiKey,
    binId: binId,
    configured: true
  };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(CONFIG));
  console.log('✅ Configuração de ESCALAS salva com sucesso!');
}

// Salvar configuração de FOLGAS
function saveConfigFolgas(binId) {
  CONFIG_FOLGAS = {
    apiKey: CENTRAL_CONFIG.apiKey, // Usa a mesma API Key
    binId: binId,
    configured: true
  };
  localStorage.setItem(CONFIG_KEY_FOLGAS, JSON.stringify(CONFIG_FOLGAS));
  console.log('✅ Configuração de FOLGAS salva com sucesso!');
  console.log('📋 Bin ID de Folgas:', binId);
  console.log('⚠️ IMPORTANTE: Adicione este Bin ID no arquivo config.js:');
  console.log(`CENTRAL_CONFIG_FOLGAS = { binId: '${binId}', configured: true }`);
}

// ==================== FUNÇÕES DE HEADERS ====================

// Headers para ESCALAS (compatível com código existente)
function getJSONBinHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Master-Key': CONFIG.apiKey,
    'X-Bin-Meta': 'false'
  };
}

// Headers para FOLGAS
function getJSONBinHeadersFolgas() {
  return {
    'Content-Type': 'application/json',
    'X-Master-Key': CONFIG_FOLGAS.apiKey,
    'X-Bin-Meta': 'false'
  };
}

// ==================== COMPATIBILIDADE COM JSONBIN_CONFIG ====================

// Para manter compatibilidade com código que usa JSONBIN_CONFIG
const JSONBIN_CONFIG = {
  get apiKey() { return CONFIG.apiKey; },
  get binId() { return CONFIG.binId; },
  baseUrl: 'https://api.jsonbin.io/v3'
};

const JSONBIN_CONFIG_FOLGAS = {
  get apiKey() { return CONFIG_FOLGAS.apiKey; },
  get binId() { return CONFIG_FOLGAS.binId; },
  baseUrl: 'https://api.jsonbin.io/v3'
};

// ==================== FUNÇÕES DE UI ====================

function showLoading(text = 'Processando...') {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
      loadingText.textContent = text;
    }
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

// ==================== CRIAR BANCO DE DADOS DE ESCALAS ====================

async function createDatabase() {
  const apiKey = document.getElementById('apiKey').value.trim();

  if (!apiKey) {
    showConfigStatus('error', '❌ Insira sua Master Key do JSONBin!');
    return;
  }

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
        const configSection = document.getElementById('configSection');
        if (configSection) {
          configSection.style.display = 'none';
        }
      }, 3000);
      
      return;
    }
  }

  showLoading('Criando banco de dados de ESCALAS...');

  try {
    const initialData = {
      escalas: [],
      created: new Date().toISOString(),
      version: '1.0',
      system: 'DEMUTRAN Osasco - Escalas'
    };

    const response = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
        'X-Bin-Name': 'DEMUTRAN-Escalas'
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
        `✅ Banco de dados de ESCALAS criado com sucesso!\n\n` +
        `Bin ID: ${binId}\n\n` +
        `⚠️ IMPORTANTE PARA O ADMINISTRADOR:\n` +
        `Copie este Bin ID e cole no arquivo js/config.js\n` +
        `na linha: binId: '${binId}'\n\n` +
        `Depois mude configured: true\n\n` +
        `Assim todos os supervisores usarão o mesmo banco!`
      );
      
      setTimeout(() => {
        const configSection = document.getElementById('configSection');
        if (configSection) {
          configSection.style.display = 'none';
        }
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

// ==================== CRIAR BANCO DE DADOS DE FOLGAS ====================

async function createDatabaseFolgas() {
  console.log('🔨 Iniciando criação do banco de FOLGAS...');
  
  const apiKey = CENTRAL_CONFIG.apiKey;

  if (!apiKey || apiKey === 'SUA_API_KEY_AQUI') {
    console.error('❌ API Key não configurada!');
    throw new Error('API Key não configurada no config.js');
  }

  try {
    const initialData = {
      folgas: [],
      created: new Date().toISOString(),
      version: '1.0',
      system: 'DEMUTRAN Osasco - Folgas'
    };

    console.log('📤 Enviando requisição para criar bin...');
    const response = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
        'X-Bin-Name': 'DEMUTRAN-Folgas'
      },
      body: JSON.stringify(initialData)
    });

    const responseText = await response.text();
    console.log('📥 Resposta recebida:', response.status);

    if (response.ok) {
      const result = JSON.parse(responseText);
      const binId = result.metadata.id;
      
      console.log('✅ Bin de FOLGAS criado com sucesso!');
      console.log('📋 Bin ID:', binId);
      
      // Salvar configuração
      saveConfigFolgas(binId);
      
      // Mostrar alerta com instruções
      alert(
        `🎉 Banco de FOLGAS criado com sucesso!\n\n` +
        `📋 Bin ID: ${binId}\n\n` +
        `⚠️ IMPORTANTE PARA O ADMINISTRADOR:\n` +
        `Copie este Bin ID e cole no arquivo js/config.js:\n\n` +
        `CENTRAL_CONFIG_FOLGAS = {\n` +
        `  apiKey: '${apiKey}',\n` +
        `  binId: '${binId}',\n` +
        `  configured: true\n` +
        `};\n\n` +
        `Depois recarregue a página.`
      );
      
      return binId;
    } else {
      let errorMsg = 'Erro desconhecido';
      try {
        const error = JSON.parse(responseText);
        errorMsg = error.message || JSON.stringify(error);
      } catch (e) {
        errorMsg = responseText;
      }
      console.error('❌ Erro ao criar bin:', errorMsg);
      throw new Error(`Erro ${response.status}: ${errorMsg}`);
    }
  } catch (error) {
    console.error('❌ Erro ao criar banco de folgas:', error);
    throw error;
  }
}

// ==================== TESTE DE CONEXÃO ====================

async function testConnection() {
  if (!CONFIG.configured || !CONFIG.binId) {
    showConfigStatus('error', '❌ Configure o banco de dados primeiro!');
    return;
  }

  showLoading('Testando conexão com ESCALAS...');

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
        `✅ Conexão OK com ESCALAS!\n\n` +
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

// ==================== RESET DE CONFIGURAÇÃO ====================

function resetConfig() {
  if (confirm(
    '⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!\n\n' +
    'Isso irá APAGAR a configuração local.\n' +
    'Os dados no JSONBin NÃO serão perdidos,\n' +
    'mas você precisará reconfigurar o sistema.\n\n' +
    'Deseja continuar?'
  )) {
    localStorage.removeItem(CONFIG_KEY);
    localStorage.removeItem(CONFIG_KEY_FOLGAS);
    CONFIG = { apiKey: '', binId: '', configured: false };
    CONFIG_FOLGAS = { apiKey: '', binId: '', configured: false };
    alert('✅ Configuração resetada!\n\nRecarregue a página para reconfigurar.');
    location.reload();
  }
}

// ==================== INICIALIZAÇÃO ====================

// Carregar configurações ao iniciar
loadConfig();
loadConfigFolgas();

console.log('🟢 Sistema de configuração carregado');
console.log('📊 Status ESCALAS:', CONFIG.configured ? 'Configurado' : 'Não configurado');
console.log('📊 Status FOLGAS:', CONFIG_FOLGAS.configured ? 'Configurado' : 'Não configurado');
