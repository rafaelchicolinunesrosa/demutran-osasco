// ==================== VARIÁVEIS GLOBAIS ====================
let folgas = [];
let carregando = false;
let dataAtual = new Date();
let filtros = {
    plantao: '',
    escala: '',
    tipo: ''
};

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🟢 Sistema de Folgas iniciado');
    
    // Carregar configuração de folgas
    if (typeof loadConfigFolgas === 'function') {
        loadConfigFolgas();
    }
    
    inicializarFormulario();
    carregarFolgas();
});

// ==================== FORMULÁRIO ====================
function inicializarFormulario() {
    const form = document.getElementById('folgaForm');
    const checkboxFerias = document.getElementById('emFerias');
    const feriasFields = document.getElementById('feriasFields');
    const folgasFields = document.getElementById('folgasFields');

    if (!form || !checkboxFerias || !feriasFields || !folgasFields) {
        console.error('❌ Elementos do formulário não encontrados');
        return;
    }

    // Mostrar/ocultar campos de férias
    checkboxFerias.addEventListener('change', function() {
        if (this.checked) {
            feriasFields.style.display = 'block';
            folgasFields.style.display = 'none';
            
            // Limpar campos de folgas normais
            document.getElementById('dataFolga1').value = '';
            document.getElementById('dataFolga2').value = '';
        } else {
            feriasFields.style.display = 'none';
            folgasFields.style.display = 'block';
            
            // Limpar campos de férias
            document.getElementById('dataInicioFerias').value = '';
            document.getElementById('dataFimFerias').value = '';
        }
    });

    // Submit do formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        cadastrarFolga();
    });
}

// ==================== JSONBIN.IO - CARREGAR FOLGAS ====================
async function carregarFolgas() {
    if (carregando) return;
    carregando = true;

    mostrarLoading('Carregando folgas...');

    try {
        // Verificar se CONFIG_FOLGAS existe
        if (typeof CONFIG_FOLGAS === 'undefined') {
            console.error('❌ CONFIG_FOLGAS não definido');
            folgas = [];
            esconderLoading();
            renderizarCalendario();
            renderizarListaFolgas();
            carregando = false;
            return;
        }

        // Verificar API Key
        if (!CONFIG_FOLGAS.apiKey || CONFIG_FOLGAS.apiKey === 'SUA_API_KEY_AQUI') {
            console.error('❌ API Key não configurada!');
            alert('ERRO: Configure sua API Key do JSONBin.io no arquivo config.js');
            folgas = [];
            esconderLoading();
            renderizarCalendario();
            renderizarListaFolgas();
            carregando = false;
            return;
        }

        // Verificar Bin ID
        if (!CONFIG_FOLGAS.binId || CONFIG_FOLGAS.binId === '' || CONFIG_FOLGAS.binId === 'SUA_BIN_ID_FOLGAS_AQUI') {
            console.log('⚠️ Bin ID de folgas não configurado. Criando novo bin...');
            esconderLoading();
            
            // Criar bin automaticamente
            const novoBinId = await criarNovoBinFolgas();
            if (novoBinId) {
                CONFIG_FOLGAS.binId = novoBinId;
                CONFIG_FOLGAS.configured = true;
                
                // Tentar carregar novamente
                folgas = [];
                carregando = false;
                renderizarCalendario();
                renderizarListaFolgas();
            }
            return;
        }

        console.log('📥 Carregando folgas do Bin:', CONFIG_FOLGAS.binId);
        
        const response = await fetch(
            `https://api.jsonbin.io/v3/b/${CONFIG_FOLGAS.binId}/latest`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG_FOLGAS.apiKey
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            
            // Verificar estrutura dos dados
            if (data.record && data.record.folgas) {
                folgas = data.record.folgas;
            } else if (Array.isArray(data.record)) {
                folgas = data.record;
            } else {
                folgas = [];
            }
            
            console.log(`✅ ${folgas.length} folgas carregadas com sucesso`);
        } else if (response.status === 404) {
            console.log('⚠️ Bin de folgas não encontrado. Criando novo...');
            esconderLoading();
            await criarNovoBinFolgas();
            folgas = [];
        } else {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar folgas:', error);
        alert('Erro ao carregar folgas: ' + error.message);
        folgas = [];
    } finally {
        carregando = false;
        esconderLoading();
        renderizarCalendario();
        renderizarListaFolgas();
    }
}


// ==================== JSONBIN.IO - CRIAR BIN ====================
async function criarNovoBinFolgas() {
    try {
        console.log('🔨 Criando novo Bin para FOLGAS...');
        
        const apiKey = CENTRAL_CONFIG.apiKey || CONFIG_FOLGAS.apiKey;
        
        if (!apiKey || apiKey === 'SUA_API_KEY_AQUI') {
            throw new Error('API Key não configurada no config.js');
        }

        const initialData = {
            folgas: [],
            created: new Date().toISOString(),
            version: '1.0',
            system: 'DEMUTRAN Osasco - Folgas'
        };

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

        if (response.ok) {
            const result = JSON.parse(responseText);
            const binId = result.metadata.id;
            
            console.log('✅ Bin de FOLGAS criado!');
            console.log('📋 Bin ID:', binId);
            
            const configFolgas = {
                apiKey: apiKey,
                binId: binId,
                configured: true
            };
            localStorage.setItem('demutran_jsonbin_config_folgas_v1', JSON.stringify(configFolgas));
            
            CONFIG_FOLGAS.binId = binId;
            CONFIG_FOLGAS.configured = true;
            
            alert(`🎉 Banco de FOLGAS criado!\n\n📋 Bin ID: ${binId}\n\n⚙️ Adicione no config.js:\nCENTRAL_CONFIG_FOLGAS = {\n  binId: '${binId}',\n  configured: true\n};`);
            
            folgas = [];
        } else {
            throw new Error(`Erro ${response.status}: ${responseText}`);
        }
    } catch (error) {
        console.error('❌ Erro ao criar bin:', error);
        alert('Erro ao criar bin de folgas.\n\n' + error.message);
    }
}

// ==================== JSONBIN.IO - SALVAR ====================
async function salvarFolgas() {
    if (carregando) return;
    carregando = true;

    mostrarLoading('Salvando folgas...');

    try {
        const dataToSave = {
            folgas: folgas,
            lastUpdate: new Date().toISOString(),
            version: '1.0',
            system: 'DEMUTRAN Osasco - Folgas'
        };
        
        const response = await fetch(
            `${JSONBIN_CONFIG_FOLGAS.baseUrl}/b/${CONFIG_FOLGAS.binId}`,
            {
                method: 'PUT',
                headers: getJSONBinHeadersFolgas(),
                body: JSON.stringify(dataToSave)
            }
        );

        if (!response.ok) {
            throw new Error(`Erro ao salvar: ${response.status}`);
        }

        console.log('✅ Folgas salvas com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('Erro ao salvar folgas. Tente novamente.');
    } finally {
        carregando = false;
        esconderLoading();
    }
}

// ==================== CADASTRAR FOLGA ====================
async function cadastrarFolga() {
    const nomeAgente = document.getElementById('nomeAgente').value.trim();
    const plantao = document.getElementById('plantao').value;
    const escalaAgente = document.getElementById('escalaAgente').value;
    const emFerias = document.getElementById('emFerias').checked;
    
    let folga = {
        id: Date.now(),
        nomeAgente,
        plantao,
        escalaAgente,
        emFerias,
        dataCadastro: new Date().toISOString()
    };

    // Validações básicas
    if (!nomeAgente || !plantao || !escalaAgente) {
        alert('⚠️ Preencha todos os campos obrigatórios!');
        return;
    }

    if (emFerias) {
        // Modo Férias
        const dataInicioFerias = document.getElementById('dataInicioFerias').value;
        const dataFimFerias = document.getElementById('dataFimFerias').value;

        if (!dataInicioFerias || !dataFimFerias) {
            alert('⚠️ Informe as datas de início e fim das férias!');
            return;
        }

        if (new Date(dataInicioFerias) > new Date(dataFimFerias)) {
            alert('⚠️ A data de início deve ser anterior à data de fim!');
            return;
        }

        folga.dataInicioFerias = dataInicioFerias;
        folga.dataFimFerias = dataFimFerias;
        folga.dataFolga1 = null;
        folga.dataFolga2 = null;
    } else {
        // Modo Folgas Normais
        const dataFolga1 = document.getElementById('dataFolga1').value;
        const dataFolga2 = document.getElementById('dataFolga2').value;

        if (!dataFolga1) {
            alert('⚠️ Informe pelo menos a Data da Folga 1!');
            return;
        }

        folga.dataFolga1 = dataFolga1;
        folga.dataFolga2 = dataFolga2 || null;
        folga.dataInicioFerias = null;
        folga.dataFimFerias = null;
    }

    folgas.push(folga);
    await salvarFolgas();
    limparFormulario();
    renderizarCalendario();
    renderizarListaFolgas();
    alert('✅ Folga cadastrada com sucesso!');
}

// ==================== LIMPAR FORMULÁRIO ====================
function limparFormulario() {
    document.getElementById('folgaForm').reset();
    document.getElementById('feriasFields').style.display = 'none';
    document.getElementById('folgasFields').style.display = 'block';
}

// ==================== EDITAR FOLGA ====================
function editarFolga(id) {
    const folga = folgas.find(f => f.id === id);
    if (!folga) return;

    document.getElementById('nomeAgente').value = folga.nomeAgente;
    document.getElementById('plantao').value = folga.plantao;
    document.getElementById('escalaAgente').value = folga.escalaAgente;
    document.getElementById('emFerias').checked = folga.emFerias;

    if (folga.emFerias) {
        document.getElementById('feriasFields').style.display = 'block';
        document.getElementById('folgasFields').style.display = 'none';
        document.getElementById('dataInicioFerias').value = folga.dataInicioFerias;
        document.getElementById('dataFimFerias').value = folga.dataFimFerias;
    } else {
        document.getElementById('feriasFields').style.display = 'none';
        document.getElementById('folgasFields').style.display = 'block';
        document.getElementById('dataFolga1').value = folga.dataFolga1;
        document.getElementById('dataFolga2').value = folga.dataFolga2 || '';
    }

    excluirFolga(id, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== EXCLUIR FOLGA ====================
async function excluirFolga(id, confirmar = true) {
    if (confirmar && !confirm('❌ Deseja realmente excluir esta folga?')) {
        return;
    }

    folgas = folgas.filter(f => f.id !== id);
    await salvarFolgas();
    renderizarCalendario();
    renderizarListaFolgas();
}

// ==================== FILTROS ====================
function aplicarFiltros() {
    filtros.plantao = document.getElementById('filtroPlantao').value;
    filtros.escala = document.getElementById('filtroEscala').value;
    filtros.tipo = document.getElementById('filtroTipo').value;
    
    renderizarCalendario();
    renderizarListaFolgas();
}

function filtrarFolgas(folgasList) {
    return folgasList.filter(folga => {
        if (filtros.plantao && folga.plantao !== filtros.plantao) return false;
        if (filtros.escala && folga.escalaAgente !== filtros.escala) return false;
        if (filtros.tipo) {
            if (filtros.tipo === 'ferias' && !folga.emFerias) return false;
            if (filtros.tipo === 'folga-normal' && folga.emFerias) return false;
        }
        return true;
    });
}

// ==================== RENDERIZAR CALENDÁRIO ====================
function renderizarCalendario() {
    const calendario = document.getElementById('calendario');
    const mesAnoAtual = document.getElementById('mesAnoAtual');

    if (!calendario || !mesAnoAtual) {
        console.error('❌ Elementos do calendário não encontrados');
        return;
    }

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    mesAnoAtual.textContent = `${meses[mes]} ${ano}`;

    calendario.innerHTML = '';

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    diasSemana.forEach(dia => {
        const divDia = document.createElement('div');
        divDia.className = 'dia-semana';
        divDia.textContent = dia;
        calendario.appendChild(divDia);
    });

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const ultimoDiaMesAnterior = new Date(ano, mes, 0).getDate();

    for (let i = primeiroDia - 1; i >= 0; i--) {
        calendario.appendChild(criarDiaCalendario(ultimoDiaMesAnterior - i, mes - 1, ano, true));
    }

    for (let dia = 1; dia <= ultimoDia; dia++) {
        calendario.appendChild(criarDiaCalendario(dia, mes, ano, false));
    }

    const diasRestantes = 42 - (primeiroDia + ultimoDia);
    for (let dia = 1; dia <= diasRestantes; dia++) {
        calendario.appendChild(criarDiaCalendario(dia, mes + 1, ano, true));
    }
}

function criarDiaCalendario(dia, mes, ano, outroMes) {
    const divDia = document.createElement('div');
    divDia.className = 'dia-calendario';
    
    if (outroMes) divDia.classList.add('outro-mes');

    const hoje = new Date();
    if (dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()) {
        divDia.classList.add('hoje');
    }

    const numeroDia = document.createElement('div');
    numeroDia.className = 'numero-dia';
    numeroDia.textContent = dia;
    divDia.appendChild(numeroDia);

    const dataStr = formatarData(new Date(ano, mes, dia));
    const folgasDoDia = filtrarFolgas(buscarFolgasDoDia(dataStr));

    if (folgasDoDia.length > 0) {
        const contador = document.createElement('div');
        contador.className = 'contador-folgas';
        contador.textContent = folgasDoDia.length;
        divDia.appendChild(contador);

        const divFolgas = document.createElement('div');
        divFolgas.className = 'folgas-dia';

        folgasDoDia.forEach(folga => {
            const itemFolga = document.createElement('div');
            itemFolga.className = 'folga-item';
            
            if (folga.emFerias) {
                itemFolga.classList.add('ferias');
            }

            const escalaAbrev = obterEscalaAbreviada(folga.escalaAgente);
            
            itemFolga.innerHTML = `
                <div class="folga-item-info">
                    <span>${folga.nomeAgente}</span>
                    <span class="plantao-badge plantao-${folga.plantao.toLowerCase()}">${folga.plantao}</span>
                </div>
                <span class="escala-badge">${escalaAbrev}</span>
            `;

            divFolgas.appendChild(itemFolga);
        });

        divDia.appendChild(divFolgas);
    }

    return divDia;
}

function buscarFolgasDoDia(data) {
    return folgas.filter(folga => {
        if (folga.emFerias) {
            const dataInicio = new Date(folga.dataInicioFerias);
            const dataFim = new Date(folga.dataFimFerias);
            const dataAtual = new Date(data);
            
            if (dataAtual >= dataInicio && dataAtual <= dataFim) {
                return true;
            }
        }

        return folga.dataFolga1 === data || folga.dataFolga2 === data;
    });
}

// ==================== RENDERIZAR LISTA ====================
function renderizarListaFolgas() {
    const container = document.getElementById('folgasPorDia');
    
    if (!container) {
        console.error('❌ Container de folgas não encontrado');
        return;
    }

    container.innerHTML = '';

    const folgasPorData = {};

    folgas.forEach(folga => {
        if (folga.dataFolga1) {
            if (!folgasPorData[folga.dataFolga1]) folgasPorData[folga.dataFolga1] = [];
            folgasPorData[folga.dataFolga1].push({...folga, dataFolga: folga.dataFolga1});
        }

        if (folga.dataFolga2) {
            if (!folgasPorData[folga.dataFolga2]) folgasPorData[folga.dataFolga2] = [];
            folgasPorData[folga.dataFolga2].push({...folga, dataFolga: folga.dataFolga2});
        }

        if (folga.emFerias) {
            const dataInicio = new Date(folga.dataInicioFerias);
            const dataFim = new Date(folga.dataFimFerias);
            
            for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
                const dataStr = formatarData(d);
                if (!folgasPorData[dataStr]) folgasPorData[dataStr] = [];
                const jaExiste = folgasPorData[dataStr].some(f => f.id === folga.id && f.emFeriasHoje);
                if (!jaExiste) {
                    folgasPorData[dataStr].push({...folga, dataFolga: dataStr, emFeriasHoje: true});
                }
            }
        }
    });

    const datasOrdenadas = Object.keys(folgasPorData).sort();

    if (datasOrdenadas.length === 0) {
        container.innerHTML = '<div class="sem-folgas">📅 Nenhuma folga cadastrada</div>';
        return;
    }

    datasOrdenadas.forEach(data => {
        const agentes = filtrarFolgas(folgasPorData[data]);
        
        if (agentes.length === 0) return;
        
        const card = document.createElement('div');
        card.className = 'dia-folgas-card';

        const titulo = document.createElement('h3');
        titulo.textContent = `${formatarDataExtenso(data)} - ${agentes.length} agente(s) de folga`;
        card.appendChild(titulo);

        const lista = document.createElement('div');
        lista.className = 'agentes-folga-list';

        agentes.forEach(agente => {
            const item = document.createElement('div');
            item.className = 'agente-folga-item';
            
            if (agente.emFeriasHoje) {
                item.classList.add('ferias');
            }

            const escalaCompleta = obterEscalaCompleta(agente.escalaAgente);
            const tipo = agente.emFeriasHoje ? 'Férias' : 'Folga Normal';

            item.innerHTML = `
                <div class="agente-info">
                    <div class="agente-nome">
                        ${agente.nomeAgente}
                        <span class="plantao-badge plantao-${agente.plantao.toLowerCase()}">Plantão ${agente.plantao}</span>
                    </div>
                    <div class="agente-detalhes">
                        ${escalaCompleta} | ${tipo}
                        ${agente.emFerias ? ` | Férias: ${formatarDataBR(agente.dataInicioFerias)} a ${formatarDataBR(agente.dataFimFerias)}` : ''}
                    </div>
                </div>
                <div class="agente-actions">
                    <button class="btn-small btn-edit" onclick="editarFolga(${agente.id})">✏️ Editar</button>
                    <button class="btn-small btn-delete" onclick="excluirFolga(${agente.id})">🗑️ Excluir</button>
                </div>
            `;

            lista.appendChild(item);
        });

        card.appendChild(lista);
        container.appendChild(card);
    });
}

// ==================== MODAL DE PDF ====================
function abrirModalPDF() {
    const modal = document.getElementById('modalPDF');
    const anoInput = document.getElementById('pdfAno');
    const mesSelect = document.getElementById('pdfMes');
    
    // Definir ano atual
    anoInput.value = new Date().getFullYear();
    
    // Definir mês atual
    mesSelect.value = '';
    
    modal.classList.add('show');
}

function fecharModalPDF() {
    const modal = document.getElementById('modalPDF');
    modal.classList.remove('show');
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('modalPDF');
    if (event.target === modal) {
        fecharModalPDF();
    }
}

// ==================== GERAR PDF POR PLANTÃO ====================
function gerarPDFPlantao() {
    const plantaoSelecionado = document.getElementById('pdfPlantao').value;
    const mesSelecionado = document.getElementById('pdfMes').value;
    const anoSelecionado = parseInt(document.getElementById('pdfAno').value);
    
    if (!plantaoSelecionado) {
        alert('⚠️ Por favor, selecione um plantão!');
        return;
    }
    
    // Determinar mês e ano
    let mes, ano;
    if (mesSelecionado === '') {
        mes = new Date().getMonth();
        ano = new Date().getFullYear();
    } else {
        mes = parseInt(mesSelecionado);
        ano = anoSelecionado;
    }
    
    const meses = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    // Filtrar folgas do plantão selecionado (EXCLUIR FÉRIAS)
    const folgasPlantao = folgas.filter(f => f.plantao === plantaoSelecionado && !f.emFerias);
    
    if (folgasPlantao.length === 0) {
        alert(`⚠️ Não há folgas cadastradas para o Plantão ${plantaoSelecionado}!`);
        return;
    }
    
    // Criar PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait');
    
    // Título Principal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Escala de Folga ${meses[mes]} ${ano}`, 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`PLANTAO ${plantaoSelecionado}`, 105, 23, { align: 'center' });
    
    let yPosition = 35;
    
    // Agrupar por escala
    const folgasPorEscala = {
        '12x36_06-18': [],
        '12x36_08-20': [],
        '12x36_10-22': [],
        '12x36_18-06': [],
        '12x36_19-07': []
    };
    
    folgasPlantao.forEach(folga => {
        if (folgasPorEscala[folga.escalaAgente]) {
            folgasPorEscala[folga.escalaAgente].push(folga);
        }
    });
    
    // Contador de escalas impressas
    let escalasImpressas = 0;
    
    // Para cada escala
    Object.keys(folgasPorEscala).forEach(escala => {
        const folgasEscala = folgasPorEscala[escala];
        
        // Preparar dados da tabela - APENAS AGENTES COM FOLGA NO MÊS
        const tableData = [];
        
        folgasEscala.forEach(folga => {
            let folga1 = '';
            let folga2 = '';
            let temFolgaNoMes = false;
            
            // Verificar se folga 1 está no mês selecionado
            if (folga.dataFolga1) {
                const data1 = new Date(folga.dataFolga1);
                if (data1.getMonth() === mes && data1.getFullYear() === ano) {
                    folga1 = formatarDataBR(folga.dataFolga1);
                    temFolgaNoMes = true;
                }
            }
            
            // Verificar se folga 2 está no mês selecionado
            if (folga.dataFolga2) {
                const data2 = new Date(folga.dataFolga2);
                if (data2.getMonth() === mes && data2.getFullYear() === ano) {
                    folga2 = formatarDataBR(folga.dataFolga2);
                    temFolgaNoMes = true;
                }
            }
            
            // Adicionar linha APENAS se tiver folga no mês
            if (temFolgaNoMes) {
                tableData.push([folga.nomeAgente, folga1, folga2]);
            }
        });
        
        // APENAS IMPRIMIR SE HOUVER DADOS
        if (tableData.length > 0) {
            // Título da escala
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            
            const horario = obterHorarioEscala(escala);
            doc.text(horario, 15, yPosition);
            yPosition += 7;
            
            // Tabela com dados reais (SEM LINHAS VAZIAS)
            doc.autoTable({
                startY: yPosition,
                head: [['Nome', 'Folga 1', 'Folga 2']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [102, 126, 234],
                    fontSize: 11,
                    fontStyle: 'bold',
                    halign: 'center',
                    font: 'helvetica'
                },
                bodyStyles: {
                    fontSize: 10,
                    minCellHeight: 12,
                    font: 'helvetica'
                },
                columnStyles: {
                    0: { cellWidth: 80, halign: 'left' },
                    1: { cellWidth: 50, halign: 'center' },
                    2: { cellWidth: 50, halign: 'center' }
                },
                margin: { left: 15, right: 15 },
                styles: {
                    cellPadding: 4,
                    font: 'helvetica'
                }
            });
            
            yPosition = doc.lastAutoTable.finalY + 10;
            escalasImpressas++;
            
            // Nova página se necessário
            if (yPosition > 240) {
                doc.addPage();
                yPosition = 20;
            }
        }
    });
    
    // Verificar se alguma escala foi impressa
    if (escalasImpressas === 0) {
        alert(`⚠️ Não há folgas no mês de ${meses[mes]}/${ano} para o Plantão ${plantaoSelecionado}!`);
        return;
    }
    
    // Rodapé
    const totalPaginas = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const dataHora = new Date().toLocaleString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        doc.text(`DEMUTRAN Osasco - Gerado em ${dataHora}`, 105, 285, { align: 'center' });
        doc.text(`Pagina ${i} de ${totalPaginas}`, 105, 290, { align: 'center' });
    }
    
    // Salvar PDF
    doc.save(`Folgas_Plantao_${plantaoSelecionado}_${meses[mes]}_${ano}.pdf`);
    
    // Fechar modal
    fecharModalPDF();
}

// Função auxiliar para obter horário da escala
function obterHorarioEscala(escala) {
    const horarios = {
        '12x36_06-18': '06:00 as 18:00',
        '12x36_08-20': '08:00 as 20:00',
        '12x36_10-22': '10:00 as 22:00',
        '12x36_18-06': '18:00 as 06:00',
        '12x36_19-07': '19:00 as 07:00'
    };
    return horarios[escala] || escala;
}

// ==================== NAVEGAÇÃO ====================
function mesAnterior() {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    renderizarCalendario();
}

function proximoMes() {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    renderizarCalendario();
}

function mesAtual() {
    dataAtual = new Date();
    renderizarCalendario();
}

function voltarIndex() {
    window.location.href = 'index.html';
}

// ==================== FUNÇÕES AUXILIARES ====================
function mostrarLoading(mensagem = 'Carregando...') {
    let loading = document.getElementById('loading-overlay');
    
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p id="loading-message">${mensagem}</p>
            </div>
        `;
        document.body.appendChild(loading);
    } else {
        document.getElementById('loading-message').textContent = mensagem;
        loading.style.display = 'flex';
    }
}

function esconderLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.style.display = 'none';
}

function formatarData(data) {
    const d = new Date(data);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function formatarDataBR(data) {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarDataExtenso(data) {
    const [ano, mes, dia] = data.split('-');
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${dia} de ${meses[parseInt(mes) - 1]} de ${ano}`;
}

function obterEscalaAbreviada(escala) {
    const escalas = {
        '12x36_06-18': '06-18',
        '12x36_08-20': '08-20',
        '12x36_10-22': '10-22',
        '12x36_18-06': '18-06',
        '12x36_19-07': '19-07'
    };
    return escalas[escala] || escala;
}

function obterEscalaCompleta(escala) {
    const escalas = {
        '12x36_06-18': '12x36 - 06:00 às 18:00',
        '12x36_08-20': '12x36 - 08:00 às 20:00',
        '12x36_10-22': '12x36 - 10:00 às 22:00',
        '12x36_18-06': '12x36 - 18:00 às 06:00',
        '12x36_19-07': '12x36 - 19:00 às 07:00'
    };
    return escalas[escala] || escala;
}

// ==================== FUNÇÃO DE DEBUG ====================
function verificarConfiguracao() {
    console.log('🔍 Verificando configuração de folgas:');
    console.log('CONFIG_FOLGAS:', CONFIG_FOLGAS);
    console.log('API Key configurada:', CONFIG_FOLGAS.apiKey ? '✅ Sim' : '❌ Não');
    console.log('Bin ID configurado:', CONFIG_FOLGAS.binId ? '✅ Sim' : '❌ Não');
    console.log('Sistema configurado:', CONFIG_FOLGAS.configured ? '✅ Sim' : '❌ Não');
}

// Chamar ao carregar a página
window.addEventListener('load', function() {
    verificarConfiguracao();
});