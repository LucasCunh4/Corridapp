// SUBSTITUA SEU CÓDIGO DE REGISTRO POR ESTE
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js') // MUDANÇA AQUI
            .then(registration => { console.log('SW registrado com sucesso:', registration); })
            .catch(registrationError => { console.log('Falha no registro do SW:', registrationError); });
    });
}

// LÓGICA PRINCIPAL DO APP (Roda quando o HTML está pronto)
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DO LOADER (Roda primeiro em todas as páginas) ---
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        document.body.classList.remove('loading');
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }

    // --- FUNÇÕES GLOBAIS (HELPERS) ---

    /**
     * Formata um valor de tempo em minutos decimais para uma string "X min Y seg".
     * @param {number | string | null} decimalMinutes - O tempo em minutos decimais.
     * @returns {string} O tempo formatado.
     */
    function formatarTempoDecimalParaMinSeg(decimalMinutes) {
        const value = parseFloat(decimalMinutes);
        if (isNaN(value) || value === null) return "0 min 0 seg";
        const minutos = Math.floor(value);
        const segundos = Math.round((value - minutos) * 60);
        return `${minutos} min ${segundos} seg`;
    }
    // ADICIONE ESTA NOVA FUNÇÃO
function formatarDataParaISO(date) {
    if (!date) return '';
    const ano = date.getFullYear();
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const diaDoMes = date.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${diaDoMes}`;
}

// NOVO CÉREBRO DAS CONQUISTAS
// COLE ESTA VERSÃO CORRIGIDA E COMPLETA NO LUGAR DA SUA FUNÇÃO ANTIGA
function recalcularTodasConquistas() {
    const treinos = JSON.parse(localStorage.getItem('meus_treinos')) || [];
    let conquistasSalvas = {};
    let conquistasPorTreino = {};

    // --- OBJETOS DE APOIO PARA CÁLCULOS EM TEMPO REAL ---
    let kmTotalAcumulado = 0;
    const kmCorridosNoMes = {}; // Ex: { "2025-08": 150.5, "2025-07": 80.2 }

    // --- FUNÇÃO AUXILIAR (SEM MUDANÇAS) ---
    const adicionarConquista = (conquistaId, treino) => {
        if (!conquistasSalvas[conquistaId]) {
            conquistasSalvas[conquistaId] = { unlocks: [] };
        }
        // Evita adicionar o mesmo treino várias vezes para a mesma conquista
        if (!conquistasSalvas[conquistaId].unlocks.some(u => u.treinoId === treino.id)) {
            conquistasSalvas[conquistaId].unlocks.push({ data: treino.data, treinoId: treino.id });
        }
        
        if (!conquistasPorTreino[treino.id]) {
            conquistasPorTreino[treino.id] = [];
        }
        if (!conquistasPorTreino[treino.id].includes(conquistaId)) {
            conquistasPorTreino[treino.id].push(conquistaId);
        }
    };

    // --- PROCESSAMENTO PRINCIPAL (TREINO A TREINO) ---
    treinos.forEach((treino, index) => {
        const distancia = parseFloat(treino.distancia);
        const tempo = parseFloat(treino.tempoTotal);
        const pace = parseFloat(treino.paceDecimal);

        // 1. CONQUISTA DE PRIMEIRO TREINO
        if (index === 0) {
            adicionarConquista('primeiro_treino', treino);
        }

        // 2. CONQUISTAS POR TREINO INDIVIDUAL
        if (distancia >= 5) adicionarConquista('treino_5k', treino);
        if (distancia >= 10) adicionarConquista('treino_10k', treino);
        if (distancia >= 15) adicionarConquista('treino_15k', treino);
        if (distancia >= 21.097) adicionarConquista('treino_21k', treino);
        if (distancia >= 42.195) adicionarConquista('treino_42k', treino);
        if (tempo >= 60) adicionarConquista('longao', treino);
        if (distancia >= 3 && pace > 0 && pace < 5.0) adicionarConquista('pace_sub5', treino);

        // 3. CONQUISTA DE TOTAL ACUMULADO (100KM)
        const totalAnterior = kmTotalAcumulado;
        kmTotalAcumulado += distancia;
        if (kmTotalAcumulado >= 100 && totalAnterior < 100) {
            adicionarConquista('total_100k', treino);
        }

        // 4. CONQUISTAS MENSAIS (LÓGICA EM TEMPO REAL)
        const mesAno = treino.data.substring(0, 7); // "AAAA-MM"
        const kmAnteriorNoMes = kmCorridosNoMes[mesAno] || 0;
        kmCorridosNoMes[mesAno] = kmAnteriorNoMes + distancia;

        if (kmCorridosNoMes[mesAno] >= 100 && kmAnteriorNoMes < 100) {
            adicionarConquista('mes_100k', treino);
        }
        if (kmCorridosNoMes[mesAno] >= 200 && kmAnteriorNoMes < 200) {
            adicionarConquista('mes_200k', treino);
        }
        if (kmCorridosNoMes[mesAno] >= 300 && kmAnteriorNoMes < 300) {
            adicionarConquista('mes_300k', treino);
        }
    });

    // --- SALVA OS RESULTADOS FINAIS ---
    // A lógica de desbloqueio geral agora é derivada do mapa por treino
    Object.keys(conquistasPorTreino).forEach(treinoId => {
        conquistasPorTreino[treinoId].forEach(conquistaId => {
            const treinoInfo = treinos.find(t => t.id == treinoId);
            if (!conquistasSalvas[conquistaId]) {
                conquistasSalvas[conquistaId] = { unlocks: [] };
            }
            if (!conquistasSalvas[conquistaId].unlocks.some(u => u.treinoId == treinoId)) {
                conquistasSalvas[conquistaId].unlocks.push({ data: treinoInfo.data, treinoId: treinoInfo.id });
            }
        });
    });
    
    localStorage.setItem('meus_conquistas_v2', JSON.stringify(conquistasSalvas));
    localStorage.setItem('conquistas_por_treino', JSON.stringify(conquistasPorTreino));
    console.log("Conquistas recalculadas com a nova lógica.");
}

    /**
     * Formata um objeto Date para uma string no formato 'dd/mm/aaaa'.
     * @param {Date | string} date - O objeto Date ou string ISO a ser formatada.
     * @returns {string} A data formatada.
     */
    function formatarDataParaPtBr(date) {
        if (!date) return '--/--/----';
        return new Date(date).toLocaleDateString('pt-BR');
    }
    // COLE ESTA FUNÇÃO INTEIRA NA SUA ÁREA DE HELPERS
function recalcularTodosRecordes() {
    const treinos = JSON.parse(localStorage.getItem('meus_treinos')) || [];

    // Define um objeto de recordes zerado
    let recordes = {
        maiorDistancia: { valor: 0, data: null },
        maiorDuracao: { valor: 0, data: null },
        melhorPace: { valor: 999, texto: "--'--\" /km", data: null }
    };

    // Se não houver treinos, limpa os recordes salvos e para a execução
    if (treinos.length === 0) {
        localStorage.removeItem('meus_recordes');
        console.log("Histórico vazio. Recordes limpos.");
        return;
    }

    // Passa por cada treino para encontrar os recordes
    treinos.forEach(treino => {
        const distancia = parseFloat(treino.distancia);
        const tempo = parseFloat(treino.tempoTotal);
        const pace = parseFloat(treino.paceDecimal);

        if (distancia > recordes.maiorDistancia.valor) {
            recordes.maiorDistancia = { valor: distancia, data: treino.data };
        }
        if (tempo > recordes.maiorDuracao.valor) {
            recordes.maiorDuracao = { valor: tempo, data: treino.data };
        }
        // Apenas considera o pace para treinos de pelo menos 1km
        if (distancia >= 1 && pace > 0 && pace < recordes.melhorPace.valor) {
            recordes.melhorPace = { valor: pace, texto: treino.pace, data: treino.data };
        }
    });

    // Salva o objeto de recordes atualizado no localStorage
    localStorage.setItem('meus_recordes', JSON.stringify(recordes));
    console.log("Recordes recalculados com sucesso.");
}

    // --- LÓGICA DO MODAL GLOBAL ---
    const globalModal = document.getElementById('global-modal');
    const modalText = document.getElementById('global-modal-text');
    const confirmButtons = document.getElementById('global-modal-confirm-buttons');
    const alertButtons = document.getElementById('global-modal-alert-buttons');
    const btnConfirm = document.getElementById('global-modal-btn-confirm');
    const btnCancel = document.getElementById('global-modal-btn-cancel');
    const btnOk = document.getElementById('global-modal-btn-ok');

    let confirmCallback = null;
    
    function showConfirmationModal(text, onConfirm) {
        if (!globalModal) return;
        modalText.textContent = text;
        confirmCallback = onConfirm;
        alertButtons.style.display = 'none';
        confirmButtons.style.display = 'flex';
        globalModal.style.display = 'flex';
    }
    
    function showAlertModal(text) {
        if (!globalModal) return;
        modalText.textContent = text;
        confirmButtons.style.display = 'none';
        alertButtons.style.display = 'flex';
        globalModal.style.display = 'flex';
    }

    if(globalModal) {
        btnConfirm.addEventListener('click', () => {
            if (confirmCallback) {
                confirmCallback();
            }
            globalModal.style.display = 'none';
        });

        btnCancel.addEventListener('click', () => {
            globalModal.style.display = 'none';
        });

        btnOk.addEventListener('click', () => {
            globalModal.style.display = 'none';
        });
    }

   // NOVO CATÁLOGO DE CONQUISTAS
const catalogoConquistas = [
    // Conquistas de marco único (tipo: 'simples')
    { id: 'primeiro_treino', nome: 'Primeiros Passos', icone: '🏃‍♂️', descricao: 'Complete seu primeiro treino.', tipo: 'simples' },
    { id: 'total_100k', nome: 'Guerreiro do Asfalto', icone: '🛣️', descricao: 'Acumule um total de 100km corridos.', tipo: 'simples' },

    // Conquistas repetíveis de distância (tipo: 'repetivel')
    { id: 'treino_5k', nome: 'Clube dos 5km', icone: '👟', descricao: 'Complete um treino de 5km ou mais.', tipo: 'repetivel' },
    { id: 'treino_10k', nome: 'Dez Mil Metros', icone: '👟👟', descricao: 'Complete um treino de 10km ou mais.', tipo: 'repetivel' },
    { id: 'treino_15k', nome: 'Quase lá', icone: '🥉', descricao: 'Complete um treino de 15km ou mais.', tipo: 'repetivel' }, // NOVO
    { id: 'treino_21k', nome: 'Meia Maratona', icone: '🥈', descricao: 'Complete uma Meia Maratona (21.097km).', tipo: 'repetivel' }, // NOVO
    { id: 'treino_42k', nome: 'Maratonista!', icone: '🥇', descricao: 'Complete uma Maratona (42.195km).', tipo: 'repetivel' }, // NOVO
    { id: 'longao', nome: 'Resistência Pura', icone: '🐢', descricao: 'Complete um treino com mais de 1 hora de duração.', tipo: 'repetivel' },
    { id: 'pace_sub5', nome: 'Velocista', icone: '🔥', descricao: 'Alcance um pace médio abaixo de 5:00 min/km em um treino de pelo menos 3km.', tipo: 'repetivel' },
    
    // Conquistas mensais (tipo: 'mensal')
    { id: 'mes_100k', nome: 'Centurião Mensal', icone: '🗓️', descricao: 'Corra 100km em um único mês.', tipo: 'mensal' }, // NOVO
    { id: 'mes_200k', nome: 'Double Trouble', icone: '🗓️🗓️', descricao: 'Corra 200km em um único mês.', tipo: 'mensal' }, // NOVO
    { id: 'mes_300k', nome: 'Máquina da Corrida', icone: '🤖', descricao: 'Corra 300km em um único mês.', tipo: 'mensal' } // NOVO
];

    // --- LÓGICA GERAL (MENU E OVERLAY) ---
    const botaoMenu = document.getElementById('botao-menu');
    const menuLateral = document.querySelector('.menu-lateral');
    const overlay = document.getElementById('overlay');
    
    function fecharMenu() {
        if (menuLateral) menuLateral.classList.remove('menu-aberto');
        if (overlay) overlay.classList.remove('ativo');
    }

    if (botaoMenu && menuLateral && overlay) {
        botaoMenu.addEventListener('click', () => {
            menuLateral.classList.toggle('menu-aberto');
            overlay.classList.toggle('ativo');
        });
        overlay.addEventListener('click', fecharMenu);
    }
    
    // --- LÓGICA DA TELA INICIAL ---
    const displayKmTotal = document.querySelector('.km-total-display');
    if (displayKmTotal) {
        const treinos = JSON.parse(localStorage.getItem('meus_treinos')) || [];
        const kmTotal = treinos.reduce((total, treino) => total + parseFloat(treino.distancia || 0), 0);
        displayKmTotal.textContent = `${kmTotal.toFixed(2)} km`;
        
        if (treinos.length > 0) {
            const ultimaCorrida = treinos[treinos.length - 1];
            document.querySelector('.card-ultima-corrida p:nth-of-type(1)').textContent = `Tipo: ${ultimaCorrida.tipo}`;
            document.querySelector('.card-ultima-corrida p:nth-of-type(2)').textContent = `Distância: ${ultimaCorrida.distancia} km`;
            document.querySelector('.card-ultima-corrida p:nth-of-type(3)').textContent = `Tempo: ${formatarTempoDecimalParaMinSeg(ultimaCorrida.tempoTotal)}`;
            document.querySelector('.card-ultima-corrida p:nth-of-type(4)').textContent = `Pace Médio: ${ultimaCorrida.pace}`;
        }

        const seletorPeriodo = document.getElementById('seletor-periodo');
        if(seletorPeriodo){
            seletorPeriodo.addEventListener('click', (e) => {
                if(e.target.tagName === 'BUTTON'){
                    if(seletorPeriodo.querySelector('.ativo')) { seletorPeriodo.querySelector('.ativo').classList.remove('ativo'); }
                    e.target.classList.add('ativo');
                }
            });
        }

        const treinoDoDiaEl = document.getElementById('treino-do-dia');
        if (treinoDoDiaEl) {
            const planos = JSON.parse(localStorage.getItem('meus_planos_de_treino')) || [];
            const hoje = new Date().toDateString();
            const treinoDeHoje = planos.find(p => new Date(p.data).toDateString() === hoje);
            const titulo = treinoDoDiaEl.querySelector('h3');
            const descricao = treinoDoDiaEl.querySelector('p');
            if (treinoDeHoje) {
                titulo.textContent = 'TREINO DE HOJE';
                descricao.textContent = treinoDeHoje.descricao;
                if (treinoDeHoje.concluido) {
                    treinoDoDiaEl.classList.add('concluido');
                    titulo.textContent = 'TREINO CONCLUÍDO!';
                } else {
                    treinoDoDiaEl.classList.remove('concluido');
                }
            } else {
                titulo.textContent = 'HOJE';
                descricao.textContent = 'Dia de descanso! 🧘';
                treinoDoDiaEl.classList.remove('concluido');
            }
        }

        const desafiosContainer = document.getElementById('progresso-desafios-home');
        if (desafiosContainer) {
            const desafios = JSON.parse(localStorage.getItem('meus_desafios')) || [];
            desafiosContainer.innerHTML = '<h2>Desafios em Andamento</h2>';
            if (desafios.length > 0) {
                 desafios.forEach(desafio => {
                    const dataCriacao = new Date(desafio.dataCriacao);
                    const dataFim = new Date(desafio.dataFim);
                    const hoje = new Date();
                    if (hoje <= dataFim) {
                        const treinosValidos = treinos.filter(treino => { const dataTreino = new Date(treino.data); return dataTreino >= dataCriacao && dataTreino <= dataFim; });
                        let progressoAtual = 0;
                        if (desafio.tipo === 'distancia') { progressoAtual = treinosValidos.reduce((total, treino) => total + parseFloat(treino.distancia || 0), 0); }
                        else if (desafio.tipo === 'quantidade') { progressoAtual = treinosValidos.length; }
                        const meta = parseFloat(desafio.meta);
                        const porcentagem = Math.min((progressoAtual / meta) * 100, 100);
                        const card = document.createElement('div');
                        card.className = 'card-desafio-home';
                        card.innerHTML = `<h3>${desafio.titulo}</h3><div class="progresso-info"><span>${progressoAtual.toFixed(desafio.tipo === 'distancia' ? 2 : 0)} / ${meta}</span><span>${porcentagem.toFixed(0)}%</span></div><div class="progresso-barra-fundo"><div class="progresso-barra-preenchimento" style="width: ${porcentagem}%;"></div></div>`;
                        desafiosContainer.appendChild(card);
                    }
                });
            } else {
                desafiosContainer.innerHTML += '<p>Nenhum desafio ativo.</p>';
            }
        }
    }
    
    // --- LÓGICA DA PÁGINA DE REGISTRO ---
    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
        const distanciaInput = document.getElementById('distancia');
        const tempoTotalMinInput = document.getElementById('tempo-total-min');
        const tempoTotalSegInput = document.getElementById('tempo-total-seg');
        const tipoTreinoSelect = document.getElementById('tipo-treino');
        const paceDisplay = document.querySelector('.pace-display strong');
        const cansacoSlider = document.getElementById('cansaco');
        const valorCansacoDisplay = document.getElementById('valor-cansaco');
        const motivoParadaSelect = document.getElementById('motivo-parada');
        const campoOutroMotivo = document.getElementById('campo-outro-motivo');
        const equipamentoSelect = document.getElementById('equipamento-usado');

        if (equipamentoSelect) {
            const equipamentos = JSON.parse(localStorage.getItem('meus_equipamentos')) || [];
            equipamentos.forEach(equipamento => {
                const option = document.createElement('option');
                option.value = equipamento.id;
                option.textContent = equipamento.nome;
                equipamentoSelect.appendChild(option);
            });
        }
        
        function calcularPace() {
            const distancia = parseFloat(distanciaInput.value);
            const minutos = parseFloat(tempoTotalMinInput.value) || 0;
            let segundos = parseFloat(tempoTotalSegInput.value) || 0;
            if (segundos > 59) { segundos = 59; tempoTotalSegInput.value = 59; }
            const tempoTotalEmMinutos = minutos + (segundos / 60);
            if (distancia > 0 && tempoTotalEmMinutos > 0) {
                const paceDecimal = tempoTotalEmMinutos / distancia;
                const paceMinutos = Math.floor(paceDecimal);
                const paceSegundos = Math.round((paceDecimal - paceMinutos) * 60);
                const segundosFormatados = paceSegundos.toString().padStart(2, '0');
                paceDisplay.textContent = `${paceMinutos}'${segundosFormatados}" /km`;
            } else {
                paceDisplay.textContent = "--'--\" /km";
            }
        }
        function atualizarCoresCansaco() {
            const valor = parseInt(cansacoSlider.value);
            const porcentagem = (valor / 10) * 100;
            valorCansacoDisplay.textContent = valor;
            const corVerde = [40, 167, 69], corAmarela = [255, 193, 7], corVermelha = [255, 0, 0];
            let corFinal;
            if (valor < 5) {
                const fator = valor / 5.0;
                const r = corVerde[0] + fator * (corAmarela[0] - corVerde[0]);
                const g = corVerde[1] + fator * (corAmarela[1] - corVerde[1]);
                const b = corVerde[2] + fator * (corAmarela[2] - corVerde[2]);
                corFinal = `rgb(${r}, ${g}, ${b})`;
            } else {
                const fator = (valor - 5) / 5.0;
                const r = corAmarela[0] + fator * (corVermelha[0] - corAmarela[0]);
                const g = corAmarela[1] + fator * (corVermelha[1] - corAmarela[1]);
                const b = corAmarela[2] + fator * (corVermelha[2] - corAmarela[2]);
                corFinal = `rgb(${r}, ${g}, ${b})`;
            }
            const corDeFundoDaTrilha = `var(--cor-primaria)`;
            cansacoSlider.style.background = `linear-gradient(to right, ${corFinal} ${porcentagem}%, ${corDeFundoDaTrilha} ${porcentagem}%)`;
            cansacoSlider.style.setProperty('--thumb-color', corFinal);
        }
        function verificarMotivoParada() {
            if (motivoParadaSelect.value === 'outro') {
                campoOutroMotivo.style.display = 'block';
            } else {
                campoOutroMotivo.style.display = 'none';
            }
        }
        function verificarEAtualizarRecordes(treino) {
            const recordes = JSON.parse(localStorage.getItem('meus_recordes')) || {};
            let novosRecordes = [];
            const distancia = parseFloat(treino.distancia);
            const tempo = parseFloat(treino.tempoTotal);
            const paceMatch = treino.pace.match(/(\d+)'(\d+)/);
            const pace = paceMatch ? parseFloat(`${paceMatch[1]}.${paceMatch[2]}`) : 999;
            
            if (!recordes.maiorDistancia || distancia > recordes.maiorDistancia.valor) {
                recordes.maiorDistancia = { valor: distancia, data: treino.data };
                novosRecordes.push('Maior Distância');
            }
            if (!recordes.maiorDuracao || tempo > recordes.maiorDuracao.valor) {
                recordes.maiorDuracao = { valor: tempo, data: treino.data };
                novosRecordes.push('Maior Duração');
            }
            if (distancia >= 1 && (!recordes.melhorPace || pace < recordes.melhorPace.valor)) {
                recordes.melhorPace = { valor: pace, texto: treino.pace, data: treino.data };
                novosRecordes.push('Melhor Pace');
            }

            localStorage.setItem('meus_recordes', JSON.stringify(recordes));
            
            if (novosRecordes.length > 0) {
                setTimeout(() => {
                    showAlertModal(`🎉 Parabéns! Você bateu novo(s) recorde(s): ${novosRecordes.join(', ')}!`);
                }, 500);
            }
        }
        function verificarConquistas() {
            try {
                const treinos = JSON.parse(localStorage.getItem('meus_treinos')) || [];
                if (treinos.length === 0) return;
                let conquistas = JSON.parse(localStorage.getItem('meus_conquistas')) || [];
                let novasConquistas = [];
                
                const desbloquear = (id) => {
                    if (!conquistas.some(c => c.id === id)) {
                        const conquistaInfo = catalogoConquistas.find(c => c.id === id);
                        if (conquistaInfo) {
                            conquistas.push({ id: id, data: new Date().toISOString() });
                            novasConquistas.push(conquistaInfo);
                        }
                    }
                };

                if (treinos.length >= 1) desbloquear('primeiro_treino');
                
                const ultimoTreino = treinos[treinos.length - 1];
                const distanciaUltimo = parseFloat(ultimoTreino.distancia);
                const tempoUltimo = parseFloat(ultimoTreino.tempoTotal);
                
                if (distanciaUltimo >= 5) desbloquear('treino_5k');
                if (distanciaUltimo >= 10) desbloquear('treino_10k');
                if (tempoUltimo >= 60) desbloquear('longao');
                
                const paceMatch = ultimoTreino.pace.match(/(\d+)'(\d+)/);
                const pace = paceMatch ? parseFloat(`${paceMatch[1]}.${paceMatch[2]}`) : 999;
                if (distanciaUltimo >= 3 && pace < 5.0) desbloquear('pace_sub5');
                
                const totalKm = treinos.reduce((soma, t) => soma + parseFloat(t.distancia || 0), 0);
                if (totalKm >= 100) desbloquear('total_100k');
                
                const umaSemanaAtras = new Date();
                umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
                const treinosNaUltimaSemana = treinos.filter(t => new Date(t.data) >= umaSemanaAtras);
                if (treinosNaUltimaSemana.length >= 3) desbloquear('consistencia_3');

                localStorage.setItem('meus_conquistas', JSON.stringify(conquistas));
                
                if (novasConquistas.length > 0) {
                    let mensagem = 'Parabéns! Você desbloqueou nova(s) conquista(s):\n\n' + novasConquistas.map(c => `${c.icone} ${c.nome}`).join('\n');
                    setTimeout(() => showAlertModal(mensagem), 1000);
                }
            } catch (error) {
                console.error("Erro ao verificar conquistas:", error);
            }
        }

        const urlParams = new URLSearchParams(window.location.search);
        if(urlParams.has('tempoTotalSegundos')) {
            const tempoTotalSegundos = parseInt(urlParams.get('tempoTotalSegundos'));
            const tipoTreino = urlParams.get('tipo');
            const distancia = urlParams.get('distancia');
            if (!isNaN(tempoTotalSegundos)) {
                tempoTotalMinInput.value = Math.floor(tempoTotalSegundos / 60);
                tempoTotalSegInput.value = tempoTotalSegundos % 60;
            }
            if (distancia) distanciaInput.value = distancia;
            if (tipoTreino) tipoTreinoSelect.value = tipoTreino;
        }

        formRegistro.addEventListener('submit', (event) => {
            event.preventDefault();
            const botaoSalvar = document.getElementById('botao-salvar-treino');
            botaoSalvar.disabled = true;
            botaoSalvar.textContent = 'Salvando...';

            let motivoParadaOpcao = document.getElementById('motivo-parada');
            let motivoParada = motivoParadaOpcao.value;
            if (motivoParada === 'outro') {
                motivoParada = document.getElementById('outro-motivo-texto').value;
            } else if (motivoParada) {
                motivoParada = motivoParadaOpcao.options[motivoParadaOpcao.selectedIndex].text;
            }

            const minutos = parseFloat(tempoTotalMinInput.value) || 0;
            const segundos = parseFloat(tempoTotalSegInput.value) || 0;
            const tempoTotalEmMinutos = minutos + (segundos / 60);

            // SUBSTITUA PELO CÓDIGO ABAIXO

const distancia = parseFloat(distanciaInput.value || 0);
const paceDecimal = (distancia > 0) ? tempoTotalEmMinutos / distancia : 0; // Calcula o pace numérico

const novoTreino = {
    id: Date.now(),
    data: new Date().toISOString(),
    tipo: tipoTreinoSelect.value,
    distancia: distancia.toFixed(2),
    tempoTotal: tempoTotalEmMinutos.toFixed(2),
    pace: paceDisplay.textContent,          // O texto, para exibição
    paceDecimal: paceDecimal.toFixed(4),   // O NÚMERO, para cálculos! (NOVO)
    cansaco: cansacoSlider.value,
    motivoParada: motivoParada,
    equipamentoId: equipamentoSelect.value
};
            const treinosSalvos = JSON.parse(localStorage.getItem('meus_treinos')) || [];
            treinosSalvos.push(novoTreino);
            localStorage.setItem('meus_treinos', JSON.stringify(treinosSalvos));
            recalcularTodasConquistas();
            recalcularTodosRecordes();
            verificarEAtualizarRecordes(novoTreino);
            verificarConquistas();
            
            botaoSalvar.textContent = 'Salvo com Sucesso! ✓';
            botaoSalvar.classList.add('sucesso');
            
            setTimeout(() => {
                window.location.href = 'historico.html';
            }, 1500);
        });

        distanciaInput.addEventListener('input', calcularPace);
        tempoTotalMinInput.addEventListener('input', calcularPace);
        tempoTotalSegInput.addEventListener('input', calcularPace);
        cansacoSlider.addEventListener('input', atualizarCoresCansaco);
        motivoParadaSelect.addEventListener('change', verificarMotivoParada);
        
        verificarMotivoParada();
        atualizarCoresCansaco();
        calcularPace();
    }

    // --- LÓGICA DA PÁGINA DE HISTÓRICO ---
    const listaHistorico = document.getElementById('lista-historico');
    if (listaHistorico) {
        // Cole esta nova função carregarHistorico
// SUBSTITUA A FUNÇÃO carregarHistorico INTEIRA
const carregarHistorico = () => {
    const treinos = JSON.parse(localStorage.getItem('meus_treinos')) || [];
    const conquistasPorTreino = JSON.parse(localStorage.getItem('conquistas_por_treino')) || {};

    listaHistorico.innerHTML = '';
    if (treinos.length === 0) {
        // NOVO "ESTADO VAZIO" PARA O HISTÓRICO
        listaHistorico.innerHTML = `
            <div class="card-grafico" style="text-align: center;">
                <p>Você ainda não registrou nenhum treino.</p>
                <a href="registrar-treino.html" class="botao-acao" style="margin-top: 1rem;">Registrar meu primeiro treino</a>
            </div>
        `;
    } else {
        treinos.slice().reverse().forEach(treino => {
            const cardTreino = document.createElement('div');
            cardTreino.className = 'card-treino';
            cardTreino.dataset.id = treino.id;

            const conquistasDoTreino = conquistasPorTreino[treino.id] || [];
            let conquistasHtml = '';
            if (conquistasDoTreino.length > 0) {
                // Cria o botão com o contador
                conquistasHtml = `
                    <div class="footer-card-treino">
                        <button class="botao-conquistas-card" data-treino-id="${treino.id}">
                            🏆 Conquistas (${conquistasDoTreino.length})
                        </button>
                    </div>
                `;
            }

            cardTreino.innerHTML = `
                <button class="botao-excluir">&times;</button>
                <h3>${treino.tipo} - ${formatarDataParaPtBr(treino.data)}</h3>
                <p><strong>Distância:</strong> ${treino.distancia} km</p>
                <p><strong>Tempo Total:</strong> ${formatarTempoDecimalParaMinSeg(treino.tempoTotal)}</p>
                <p><strong>Pace Médio:</strong> ${treino.pace}</p>
                <p><strong>Cansaço:</strong> ${treino.cansaco}/10</p>
                ${conquistasHtml}
            `;
            listaHistorico.appendChild(cardTreino);
        });
    }
};
// SUBSTITUA O addEventListener DE HISTÓRICO INTEIRO
listaHistorico.addEventListener('click', (e) => {
    const conquistasPorTreino = JSON.parse(localStorage.getItem('conquistas_por_treino')) || {};

    // Lógica para o botão de Excluir
    const botaoExcluir = e.target.closest('.botao-excluir');
    if (botaoExcluir) {
        const cardParaRemover = botaoExcluir.closest('.card-treino');
        const treinoId = cardParaRemover.dataset.id;

        showConfirmationModal('Tem certeza que deseja excluir este treino?', () => {
            let treinos = JSON.parse(localStorage.getItem('meus_treinos')) || [];
            treinos = treinos.filter(t => t.id.toString() !== treinoId);
            localStorage.setItem('meus_treinos', JSON.stringify(treinos));
            recalcularTodasConquistas();
            recalcularTodosRecordes();
            cardParaRemover.remove();
        });
        return; // Encerra a função aqui
    }

    // Lógica para o novo botão de Conquistas
    const botaoConquistas = e.target.closest('.botao-conquistas-card');
    if (botaoConquistas) {
        const treinoId = botaoConquistas.dataset.treinoId;
        const idsConquistas = conquistasPorTreino[treinoId] || [];

        const modal = document.getElementById('modal-treino-conquistas');
        const listaModal = document.getElementById('lista-conquistas-modal');
        listaModal.innerHTML = ''; // Limpa a lista anterior

        idsConquistas.forEach(id => {
            const conquistaInfo = catalogoConquistas.find(c => c.id === id);
            if (conquistaInfo) {
                const item = document.createElement('div');
                item.className = 'item-conquista-modal';
                item.innerHTML = `
                    <span class="icone-conquista">${conquistaInfo.icone}</span>
                    <span class="nome-conquista">${conquistaInfo.nome}</span>
                `;
                // Abre um alerta com a descrição ao clicar (como na página de conquistas)
                item.onclick = () => showAlertModal(conquistaInfo.descricao);
                listaModal.appendChild(item);
            }
        });

        modal.style.display = 'flex';
    }
});

// Lógica para fechar o novo modal
const fecharModalBtn = document.getElementById('fechar-modal-treino-conquistas');
const modalTreinoConquistas = document.getElementById('modal-treino-conquistas');
if(fecharModalBtn && modalTreinoConquistas) {
    fecharModalBtn.onclick = () => { modalTreinoConquistas.style.display = 'none'; };
    modalTreinoConquistas.onclick = (e) => { if (e.target === modalTreinoConquistas) modalTreinoConquistas.style.display = 'none'; };
}


        carregarHistorico();
    }

// --- LÓGICA DA PÁGINA DE RANKINGS ---
const rankingDistanciaEl = document.getElementById('ranking-distancia');
if (rankingDistanciaEl) {
    const recordes = JSON.parse(localStorage.getItem('meus_recordes')) || {};
    const listaRecordesEl = document.getElementById('lista-recordes');
    const { maiorDistancia, maiorDuracao, melhorPace } = recordes;
    
    const dataMaiorDistancia = formatarDataParaPtBr(maiorDistancia?.data);
    const dataMaiorDuracao = formatarDataParaPtBr(maiorDuracao?.data);
    const dataMelhorPace = formatarDataParaPtBr(melhorPace?.data);

    if (listaRecordesEl) {
        listaRecordesEl.innerHTML = `<div class="card-recorde"><h4>Maior Distância</h4><p>${maiorDistancia ? maiorDistancia.valor.toFixed(2) + ' km' : '-- km'}</p><span>${dataMaiorDistancia}</span></div><div class="card-recorde"><h4>Maior Duração</h4><p>${maiorDuracao ? formatarTempoDecimalParaMinSeg(maiorDuracao.valor) : '-- min'}</p><span>${dataMaiorDuracao}</span></div><div class="card-recorde"><h4>Melhor Pace</h4><p>${melhorPace ? melhorPace.texto : "--'--\" /km"}</p><span>${dataMelhorPace}</span></div>`;
    }

    const treinos = JSON.parse(localStorage.getItem('meus_treinos')) || [];
    // ADICIONE ESTE BLOCO DE CÓDIGO
if (treinos.length === 0) {
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="card-grafico" style="text-align: center;">
                <p>Você precisa registrar treinos para ver seus recordes e rankings.</p>
                <a href="registrar-treino.html" class="botao-acao" style="margin-top: 1rem;">Registrar meu primeiro treino</a>
            </div>
        `;
    }
    return; // Encerra a execução da lógica de rankings se não houver treinos
}

    const preencherRanking = (elementoLista, dados, chaveValor, ordem = 'desc') => {
        if (!elementoLista) return;
        elementoLista.innerHTML = '<li>Carregando...</li>';
        const treinosOrdenados = [...dados].sort((a, b) => {
            let valorA, valorB;
            if (chaveValor === 'pace') {
                const paceParaNumero = (paceStr) => { const p = paceStr.match(/(\d+)'(\d+)/); return p ? parseFloat(`${p[1]}.${p[2]}`) : 999; };
                valorA = a.paceDecimal || paceParaNumero(a.pace);
                valorB = b.paceDecimal || paceParaNumero(b.pace);
            } else {
                valorA = parseFloat(a[chaveValor]);
                valorB = parseFloat(b[chaveValor]);
            }
            return ordem === 'desc' ? valorB - valorA : valorA - valorB;
        });

        const top5 = treinosOrdenados.slice(0, 5);
        
        // Limpa a lista antes de adicionar os itens
        elementoLista.innerHTML = ''; 

        if (top5.length === 0) {
            elementoLista.innerHTML = '<li>Sem dados suficientes.</li>';
        } else {
            top5.forEach(treino => {
                const item = document.createElement('li');
                let unidade = '';
                let valorExibido = treino[chaveValor];
                if (chaveValor === 'distancia') unidade = 'km';
                if (chaveValor === 'tempoTotal') {
                    unidade = '';
                    valorExibido = formatarTempoDecimalParaMinSeg(treino.tempoTotal);
                }
                if (chaveValor === 'pace') unidade = '/km';
                item.innerHTML = `<div><span class="valor-ranking">${valorExibido} ${unidade}</span><span class="data-ranking">em ${formatarDataParaPtBr(treino.data)}</span></div>`;
                elementoLista.appendChild(item);
            });
        }
    };

    preencherRanking(document.getElementById('ranking-distancia'), treinos, 'distancia', 'desc');
    preencherRanking(document.getElementById('ranking-tempo'), treinos, 'tempoTotal', 'desc');
    preencherRanking(document.getElementById('ranking-pace'), treinos, 'pace', 'asc');
}
// --- LÓGICA DA PÁGINA DE GRÁFICOS ---
const graficoDistanciaCanvas = document.getElementById('graficoDistancia');
if (graficoDistanciaCanvas) {
    const treinos = JSON.parse(localStorage.getItem('meus_treinos')) || [];
    
    // Um gráfico de linha precisa de pelo menos 2 pontos para ser útil.
    if (treinos.length > 1) {
        const labels = treinos.map(treino => formatarDataParaPtBr(treino.data));
        const dadosDistancia = treinos.map(treino => parseFloat(treino.distancia));
        
        // Lógica de fallback para o pace, compatível com dados antigos e novos
        const paceParaNumeroAntigo = (paceStr) => { 
            if (!paceStr) return 0; 
            const p = paceStr.match(/(\d+)'(\d+)/); 
            if (!p) return 0; 
            return parseFloat(`${p[1]}.${(parseInt(p[2]) / 60 * 100).toFixed(0)}`); 
        };
        const dadosPace = treinos.map(treino => treino.paceDecimal || paceParaNumeroAntigo(treino.pace));
        
        // Gráfico de Distância
        new Chart(graficoDistanciaCanvas, { 
            type: 'line', 
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Distância em km', 
                    data: dadosDistancia, 
                    borderColor: 'rgba(83, 114, 240, 1)', 
                    backgroundColor: 'rgba(83, 114, 240, 0.2)', 
                    borderWidth: 2, 
                    tension: 0.2 
                }] 
            }, 
            options: { 
                scales: { y: { beginAtZero: true } }, 
                plugins: { legend: { display: false } } 
            } 
        });
        
        // Gráfico de Pace
        const graficoPaceCanvas = document.getElementById('graficoPace');
        new Chart(graficoPaceCanvas, { 
            type: 'line', 
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Pace (min/km)', 
                    data: dadosPace, 
                    borderColor: 'rgba(142, 68, 173, 1)', 
                    backgroundColor: 'rgba(142, 68, 173, 0.2)', 
                    borderWidth: 2, 
                    tension: 0.2 
                }] 
            }, 
            options: { 
                scales: { y: { reverse: true } }, 
                plugins: { legend: { display: false } } 
            } 
        });
    
    } else {
        // Lógica para o "Estado Vazio" quando não há treinos suficientes
        const containerGraficos = document.querySelector('main');
        if (containerGraficos) {
            containerGraficos.innerHTML = `
                <div class="card-grafico" style="text-align: center;">
                    <p>Você precisa de pelo menos dois treinos registrados para ver sua evolução nos gráficos.</p>
                    <a href="registrar-treino.html" class="botao-acao" style="margin-top: 1rem;">Registrar meu primeiro treino</a>
                </div>
            `;
        }
    }
}

    // --- LÓGICA DA PÁGINA DE CRIAÇÃO DE DESAFIOS ---
    const formCriarDesafio = document.getElementById('form-criar-desafio');
    if (formCriarDesafio) {
        const duracaoSelect = document.getElementById('desafio-duracao');
        const dataPersonalizadaCheck = document.getElementById('data-personalizada-check');
        const dataFimInput = document.getElementById('desafio-data-fim');
        
        dataPersonalizadaCheck.addEventListener('change', () => {
            if (dataPersonalizadaCheck.checked) {
                dataFimInput.style.display = 'block';
                duracaoSelect.disabled = true;
            } else {
                dataFimInput.style.display = 'none';
                duracaoSelect.disabled = false;
            }
        });

        formCriarDesafio.addEventListener('submit', (e) => {
            e.preventDefault();
            const desafios = JSON.parse(localStorage.getItem('meus_desafios')) || [];
            const dataCriacao = new Date();
            dataCriacao.setHours(0, 0, 0, 0);
            let dataFim = new Date(dataCriacao);

            if (dataPersonalizadaCheck.checked) {
                if (dataFimInput.value) {
                    const [ano, mes, dia] = dataFimInput.value.split('-');
                    dataFim = new Date(ano, mes - 1, dia);
                }
            } else {
                const duracao = duracaoSelect.value;
                if (duracao === '1-semana') dataFim.setDate(dataFim.getDate() + 7);
                if (duracao === '1-mes') dataFim.setMonth(dataFim.getMonth() + 1);
                if (duracao === '1-ano') dataFim.setFullYear(dataFim.getFullYear() + 1);
            }

            const novoDesafio = {
                id: Date.now(),
                titulo: document.getElementById('desafio-titulo').value,
                tipo: document.getElementById('desafio-tipo').value,
                meta: document.getElementById('desafio-meta').value,
                dataCriacao: dataCriacao.toISOString(),
                dataFim: dataFim.toISOString()
            };
            desafios.push(novoDesafio);
            localStorage.setItem('meus_desafios', JSON.stringify(desafios));
            window.location.href = 'desafios.html';
        });
    }

    // --- LÓGICA DA PÁGINA DE LISTAGEM DE DESAFIOS ---
    const listaDesafiosEl = document.getElementById('lista-desafios');
    if (listaDesafiosEl) {
        const treinos = JSON.parse(localStorage.getItem('meus_treinos')) || [];
        
        const carregarDesafios = () => {
            const desafios = JSON.parse(localStorage.getItem('meus_desafios')) || [];
            listaDesafiosEl.innerHTML = '<h2>Meus Desafios</h2>';
            if (desafios.length === 0) {
                listaDesafiosEl.innerHTML += '<p>Você ainda não criou nenhum desafio.</p>';
                return;
            }
            desafios.forEach(desafio => {
                const dataCriacao = new Date(desafio.dataCriacao);
                const dataFim = new Date(desafio.dataFim);
                const treinosValidos = treinos.filter(treino => { const dataTreino = new Date(treino.data); return dataTreino >= dataCriacao && dataTreino <= dataFim; });
                
                let progressoAtual = 0;
                if (desafio.tipo === 'distancia') {
                    progressoAtual = treinosValidos.reduce((total, treino) => total + parseFloat(treino.distancia || 0), 0);
                } else if (desafio.tipo === 'quantidade') {
                    progressoAtual = treinosValidos.length;
                }

                const meta = parseFloat(desafio.meta);
                const porcentagem = Math.min((progressoAtual / meta) * 100, 100);
                const diasRestantes = Math.ceil((new Date(desafio.dataFim) - new Date()) / (1000 * 60 * 60 * 24));
                
                const cardDesafio = document.createElement('div');
                cardDesafio.className = 'card-desafio';
                cardDesafio.dataset.id = desafio.id;
                cardDesafio.innerHTML = `<button class="botao-excluir">&times;</button><h3>${desafio.titulo}</h3><div class="progresso-info"><span>${progressoAtual.toFixed(desafio.tipo === 'distancia' ? 2 : 0)} / ${meta} ${desafio.tipo === 'distancia' ? 'km' : 'treinos'}</span><span>${diasRestantes >= 0 ? diasRestantes + ' dias restantes' : 'Finalizado'}</span></div><div class="progresso-barra-fundo"><div class="progresso-barra-preenchimento" style="width: ${porcentagem}%;"></div></div>`;
                listaDesafiosEl.appendChild(cardDesafio);
            });
        };

        // SUBSTITUA O addEventListener DE DESAFIOS POR ESTE
listaDesafiosEl.addEventListener('click', (e) => {
    // CORREÇÃO AQUI: Usando closest()
    const botaoClicado = e.target.closest('.botao-excluir');
    if (botaoClicado) {
        const cardParaRemover = botaoClicado.closest('.card-desafio');
        const desafioId = cardParaRemover.dataset.id;
        
        showConfirmationModal('Tem certeza que deseja excluir este desafio?', () => {
            let desafios = JSON.parse(localStorage.getItem('meus_desafios')) || [];
            desafios = desafios.filter(d => d.id != desafioId);
            localStorage.setItem('meus_desafios', JSON.stringify(desafios));
            
            cardParaRemover.style.transition = 'opacity 0.3s, transform 0.3s';
            cardParaRemover.style.opacity = '0';
            cardParaRemover.style.transform = 'scale(0.95)';
            setTimeout(() => cardParaRemover.remove(), 300);
        });
    }
});

        carregarDesafios();
    }
    // LÓGICA DA PÁGINA DE CONQUISTAS
// COLE ESTE NOVO BLOCO DE LÓGICA PARA A PÁGINA DE CONQUISTAS
const gridConquistas = document.getElementById('grid-conquistas');
if (gridConquistas) {
    // Usamos a nova chave 'meus_conquistas_v2' para os dados detalhados
    const conquistasSalvas = JSON.parse(localStorage.getItem('meus_conquistas_v2')) || {};

    catalogoConquistas.forEach(conquista => {
        const dadosConquista = conquistasSalvas[conquista.id];
        const desbloqueada = dadosConquista && dadosConquista.unlocks.length > 0;

        const card = document.createElement('div');
        card.className = 'card-conquista';
        card.classList.toggle('desbloqueada', desbloqueada);
        card.classList.toggle('bloqueada', !desbloqueada);
        card.innerHTML = `<span class="icone-conquista">${conquista.icone}</span><span class="nome-conquista">${conquista.nome}</span>`;

        // Lógica do clique para abrir e preencher o pop-up
        card.onclick = () => {
            const modal = document.getElementById('modal-conquista');
            document.getElementById('modal-conquista-icone').textContent = conquista.icone;
            document.getElementById('modal-conquista-titulo').textContent = conquista.nome;
            document.getElementById('modal-conquista-descricao').textContent = conquista.descricao;

            const contadorWrapper = document.getElementById('modal-conquista-contador-wrapper');
            const contadorEl = document.getElementById('modal-conquista-contador');

            // Mostra ou esconde o contador baseado no tipo da conquista
            if (conquista.tipo === 'repetivel' || conquista.tipo === 'mensal') {
                contadorWrapper.style.display = 'block';
                contadorEl.textContent = desbloqueada ? dadosConquista.unlocks.length : 0;
            } else {
                contadorWrapper.style.display = 'none';
            }

            modal.style.display = 'flex';
        };
        gridConquistas.appendChild(card);
    });

    // Lógica para fechar o pop-up
    const modalConquista = document.getElementById('modal-conquista');
    if (modalConquista) {
        document.getElementById('modal-conquista-fechar').onclick = () => { modalConquista.style.display = 'none'; };
        modalConquista.onclick = (e) => { if(e.target === modalConquista) modalConquista.style.display = 'none'; };
    }
}
// COLE ESTE BLOCO CORRIGIDO NO LUGAR DA SUA LÓGICA DE EQUIPAMENTOS

// --- LÓGICA DA PÁGINA DE EQUIPAMENTOS (LISTAGEM) ---
const listaEquipamentosEl = document.getElementById('lista-equipamentos');
if (listaEquipamentosEl) {
    const treinos = JSON.parse(localStorage.getItem('meus_treinos')) || [];
    
    const carregarEquipamentos = () => {
        const equipamentos = JSON.parse(localStorage.getItem('meus_equipamentos')) || [];
        listaEquipamentosEl.innerHTML = '<h2>Meus Tênis</h2>';
        if (equipamentos.length === 0) {
            listaEquipamentosEl.innerHTML += '<p>Nenhum equipamento cadastrado.</p>';
            return;
        }
        equipamentos.forEach(equipamento => {
            const distanciaTotal = treinos.filter(treino => treino.equipamentoId == equipamento.id).reduce((total, treino) => total + parseFloat(treino.distancia || 0), 0);
            let progressoHtml = '';
            if (equipamento.limite && equipamento.limite > 0) {
                const porcentagem = Math.min((distanciaTotal / equipamento.limite) * 100, 100);
                progressoHtml = `<div class="progresso-info"><span>Vida útil</span><span>${porcentagem.toFixed(0)}%</span></div><div class="progresso-barra-fundo"><div class="progresso-barra-preenchimento" style="width: ${porcentagem}%;"></div></div>`;
            }
            const card = document.createElement('div');
            card.className = 'card-equipamento';
            card.dataset.id = equipamento.id;
            card.innerHTML = `<button class="botao-excluir">&times;</button><h3>${equipamento.nome}</h3><p class="equipamento-info">Distância Total: <strong>${distanciaTotal.toFixed(2)} km</strong></p>${progressoHtml}`;
            listaEquipamentosEl.appendChild(card);
        });
    };

    listaEquipamentosEl.addEventListener('click', (e) => {
        const botaoExcluir = e.target.closest('.botao-excluir');
        if (botaoExcluir) {
            const cardParaRemover = botaoExcluir.closest('.card-equipamento');
            const equipamentoId = cardParaRemover.dataset.id;
            
            showConfirmationModal('Tem certeza que deseja excluir este equipamento?', () => {
                let equipamentos = JSON.parse(localStorage.getItem('meus_equipamentos')) || [];
                equipamentos = equipamentos.filter(eq => eq.id != equipamentoId);
                localStorage.setItem('meus_equipamentos', JSON.stringify(equipamentos));
                cardParaRemover.remove();
            });
        }
    });

    carregarEquipamentos(); // Chama a função para carregar a lista na página
}

// --- LÓGICA DA PÁGINA DE ADICIONAR EQUIPAMENTO (FORMULÁRIO) ---
const formNovoEquipamento = document.getElementById('form-novo-equipamento');
if (formNovoEquipamento) {
    formNovoEquipamento.addEventListener('submit', (e) => {
        e.preventDefault();
        const equipamentos = JSON.parse(localStorage.getItem('meus_equipamentos')) || [];
        const novoEquipamento = {
            id: Date.now(),
            nome: document.getElementById('equipamento-nome').value,
            limite: parseFloat(document.getElementById('equipamento-limite').value) || null,
        };
        equipamentos.push(novoEquipamento);
        localStorage.setItem('meus_equipamentos', JSON.stringify(equipamentos));
        
        // Redireciona de volta para a lista após salvar
        window.location.href = 'equipamentos.html';
    });
}

    
    // --- LÓGICA DA PÁGINA DO TREINADOR ---
    const paginaTreinador = document.getElementById('configuracao');
    if (paginaTreinador) {
        const botaoIniciar = document.getElementById('iniciar-treino');
        const inputCorridaMin = document.getElementById('tempo-corrida-min');
        const inputCorridaSeg = document.getElementById('tempo-corrida-seg');
        const inputCaminhadaMin = document.getElementById('tempo-caminhada-min');
        const inputCaminhadaSeg = document.getElementById('tempo-caminhada-seg');
        const grupoCiclos = document.getElementById('grupo-ciclos');
        const inputCiclos = document.getElementById('ciclos');
        const checkboxCiclosInfinitos = document.getElementById('ciclos-infinitos');
        const secaoTreinoAtivo = document.getElementById('treino-ativo');
        const displayStatus = document.getElementById('status-ciclo');
        const displayContadorCiclos = document.getElementById('contador-ciclos');
        const displayTempo = document.getElementById('tempo-display');
        const containerBolinhas = document.querySelector('.bolinhas-progresso');
        const botaoParar = document.getElementById('botao-parar');
        const modalConfirmacaoTreinador = document.getElementById('modal-confirmacao');
        const modalTexto = document.getElementById('modal-texto');
        const botaoConfirmarModal = document.getElementById('modal-botao-confirmar');
        const botaoCancelarModal = document.getElementById('modal-botao-cancelar');
        let timerInterval, tempoTotalCorridoSegundos = 0, currentTimer, acaoConfirmar;

        checkboxCiclosInfinitos.addEventListener('change', () => {
            grupoCiclos.style.display = checkboxCiclosInfinitos.checked ? 'none' : 'block';
        });

        function resetarTreinador() {
            clearInterval(timerInterval);
            document.body.className = '';
            paginaTreinador.style.display = 'block';
            secaoTreinoAtivo.style.display = 'none';
            tempoTotalCorridoSegundos = 0;
            currentTimer = null;
        }

        function finalizarTreino(parcial = false) {
            clearInterval(timerInterval);
            modalTexto.textContent = 'Deseja salvar este treino?';
            botaoConfirmarModal.textContent = 'Sim, Salvar';
            botaoCancelarModal.textContent = 'Não, Descartar';
            modalConfirmacaoTreinador.style.display = 'flex';
            let tempoFinal = parcial && currentTimer ? tempoTotalCorridoSegundos + (currentTimer.duracao - currentTimer.restante) : tempoTotalCorridoSegundos;
            
            acaoConfirmar = () => {
                const distancia = prompt('Qual foi a distância total percorrida (em km)?');
                if (distancia && !isNaN(distancia) && distancia > 0) {
                    const url = `registrar-treino.html?tempoTotalSegundos=${tempoFinal}&tipo=Intervalado&distancia=${distancia}`;
                    window.location.href = url;
                } else {
                    showAlertModal('Distância inválida. O treino não foi salvo.');
                    resetarTreinador();
                    modalConfirmacaoTreinador.style.display = 'none';
                }
            };
        }

        botaoParar.addEventListener('click', () => {
            clearInterval(timerInterval);
            modalTexto.textContent = 'Tem certeza que deseja parar o treino?';
            botaoConfirmarModal.textContent = 'Sim, Parar';
            botaoCancelarModal.textContent = 'Continuar Treino';
            modalConfirmacaoTreinador.style.display = 'flex';
            acaoConfirmar = () => finalizarTreino(true);
        });

        botaoCancelarModal.addEventListener('click', () => {
            modalConfirmacaoTreinador.style.display = 'none';
            if (currentTimer && botaoCancelarModal.textContent === 'Continuar Treino') {
                iniciarContagem(currentTimer.restante, currentTimer.callback);
            } else if (botaoCancelarModal.textContent === 'Não, Descartar') {
                resetarTreinador();
            }
        });

        botaoConfirmarModal.addEventListener('click', () => {
            if (acaoConfirmar) acaoConfirmar();
        });

        function iniciarContagem(duracao, callback) {
            currentTimer = { duracao: duracao, restante: duracao, callback: callback };
            const formatarTempo = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
            displayTempo.textContent = formatarTempo(currentTimer.restante);
            timerInterval = setInterval(() => {
                currentTimer.restante--;
                displayTempo.textContent = formatarTempo(currentTimer.restante);
                if (currentTimer.restante <= 0) {
                    clearInterval(timerInterval);
                    tempoTotalCorridoSegundos += duracao;
                    callback();
                }
            }, 1000);
        }

        botaoIniciar.addEventListener('click', () => {
            const corridaMin = parseInt(inputCorridaMin.value) || 0;
            const corridaSeg = parseInt(inputCorridaSeg.value) || 0;
            const tempoCorridaSeg = (corridaMin * 60) + corridaSeg;
            const caminhadaMin = parseInt(inputCaminhadaMin.value) || 0;
            const caminhadaSeg = parseInt(inputCaminhadaSeg.value) || 0;
            const tempoCaminhadaSeg = (caminhadaMin * 60) + caminhadaSeg;
            const totalCiclos = checkboxCiclosInfinitos.checked ? Infinity : parseInt(inputCiclos.value);
            let cicloAtual = 1;

            paginaTreinador.style.display = 'none';
            secaoTreinoAtivo.style.display = 'flex';

            if (!checkboxCiclosInfinitos.checked && totalCiclos > 0) {
                containerBolinhas.innerHTML = '';
                for (let i = 0; i < totalCiclos; i++) {
                    const bolinha = document.createElement('div');
                    bolinha.className = 'bolinha';
                    containerBolinhas.appendChild(bolinha);
                }
            } else { containerBolinhas.innerHTML = ''; }

            function iniciarFaseCorrida() {
                document.body.className = 'fase-corrida';
                displayStatus.textContent = 'Corrida Forte';
                if (checkboxCiclosInfinitos.checked) {
                    displayContadorCiclos.textContent = `Ciclo ${cicloAtual}`;
                } else {
                    displayContadorCiclos.textContent = `${cicloAtual} / ${totalCiclos}`;
                }
                iniciarContagem(tempoCorridaSeg, iniciarFaseCaminhada);
            }

            function iniciarFaseCaminhada() {
                document.body.className = 'fase-caminhada';
                displayStatus.textContent = 'Corrida Leve/Caminhada';
                iniciarContagem(tempoCaminhadaSeg, () => {
                    if (!checkboxCiclosInfinitos.checked) {
                        containerBolinhas.children[cicloAtual - 1].classList.add('concluida');
                    }
                    cicloAtual++;
                    if (cicloAtual > totalCiclos) {
                        finalizarTreino(false);
                        return;
                    }
                    iniciarFaseCorrida();
                });
            }
            iniciarFaseCorrida();
        });
    }
// --- LÓGICA DA PÁGINA PLANO DE TREINOS ---
// COLE ESTE BLOCO INTEIRO NO LUGAR DA SUA LÓGICA do PLANO de TREINOS
const calendarioGrid = document.getElementById('grid-mensal');
if (calendarioGrid) {
    // --- SELETORES de ELEMENTOS ---
    const mesAnoDisplay = document.getElementById('mes-ano-display');
    const mesAnteriorBtn = document.getElementById('mes-anterior');
    const mesSeguinteBtn = document.getElementById('mes-seguinte');
    const modalPlano = document.getElementById('modal-plano');
    const modalPlanoTitulo = document.getElementById('modal-plano-titulo');
    const formPlano = document.getElementById('form-plano');
    const planoDataInput = document.getElementById('plano-data');
    const planoTipoSelect = document.getElementById('plano-tipo');
    const planoDescricaoInput = document.getElementById('plano-descricao');

    let dataAtual = new Date();

    // --- FUNÇÕES de AÇÃO ---
    const fecharModalPlano = () => {
        if (modalPlano) modalPlano.style.display = 'none';
    };

    const excluirPlano = (treinoId) => {
        showConfirmationModal('Tem certeza que deseja excluir este treino do seu plano?', () => {
            let planos = JSON.parse(localStorage.getItem('meus_planos_de_treino')) || [];
            planos = planos.filter(p => p.id != treinoId);
            localStorage.setItem('meus_planos_de_treino', JSON.stringify(planos));
            fecharModalPlano();
            renderizarCalendario();
        });
    };

    const marcarTreinoComoFeito = (treinoId, estado) => {
        let planos = JSON.parse(localStorage.getItem('meus_planos_de_treino')) || [];
        const treinoIndex = planos.findIndex(p => p.id === treinoId);
        if (treinoIndex > -1) {
            planos[treinoIndex].concluido = estado;
            localStorage.setItem('meus_planos_de_treino', JSON.stringify(planos));
            renderizarCalendario();
        }
    };

    const abrirModalPlano = (data, treinoId = null) => {
        formPlano.reset();
        modalPlano.dataset.editingId = treinoId || ''; 
        planoDataInput.value = data.toISOString().split('T')[0];

        const botaoExcluirPlano = document.getElementById('modal-plano-excluir');

        if (treinoId) {
            modalPlanoTitulo.textContent = `Editar Treino de ${data.toLocaleDateString('pt-BR')}`;
            botaoExcluirPlano.style.display = 'block';

            const planos = JSON.parse(localStorage.getItem('meus_planos_de_treino')) || [];
            const treinoParaEditar = planos.find(p => p.id === treinoId);
            if (treinoParaEditar) {
                planoTipoSelect.value = treinoParaEditar.tipo;
                planoDescricaoInput.value = treinoParaEditar.descricao;
            }
        } else {
            modalPlanoTitulo.textContent = `Agendar Treino para ${data.toLocaleDateString('pt-BR')}`;
            botaoExcluirPlano.style.display = 'none';
        }
        modalPlano.style.display = 'flex';
    };

    const renderizarCalendario = () => {
        calendarioGrid.innerHTML = '';
        const planos = JSON.parse(localStorage.getItem('meus_planos_de_treino')) || [];
        dataAtual.setDate(1);
        const mes = dataAtual.getMonth();
        const ano = dataAtual.getFullYear();
        mesAnoDisplay.textContent = dataAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
        const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();

        for (let i = 0; i < primeiroDiaDoMes; i++) {
            calendarioGrid.insertAdjacentHTML('beforeend', '<div class="dia-calendario outro-mes"></div>');
        }

        for (let i = 1; i <= ultimoDiaDoMes; i++) {
            const dia = new Date(ano, mes, i);
            const diaEl = document.createElement('div');
            diaEl.className = 'dia-calendario';
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            if (dia.getTime() === hoje.getTime()) diaEl.classList.add('hoje');
            diaEl.innerHTML = `<div class="dia-numero">${i}</div>`;
            const diaString = formatarDataParaISO(dia);
const treinoDoDia = planos.find(p => p.data === diaString);
            if (treinoDoDia) {
                if (treinoDoDia.concluido) diaEl.classList.add('concluido');
                else if (dia < hoje) diaEl.classList.add('nao-feito');
                
                const editBtn = document.createElement('button');
                editBtn.className = 'botao-editar-dia';
                editBtn.innerHTML = '✏️';
                editBtn.onclick = () => abrirModalPlano(dia, treinoDoDia.id);
                diaEl.appendChild(editBtn);

                const texto = document.createElement('span');
                texto.className = 'descricao-treino-plano';
                texto.textContent = treinoDoDia.descricao;
                if (treinoDoDia.concluido) texto.classList.add('concluido');
                diaEl.appendChild(texto);

                const checkBtn = document.createElement('button');
                checkBtn.className = 'acao-dia-principal';
                checkBtn.innerHTML = '✓';
                if (treinoDoDia.concluido) checkBtn.classList.add('concluido');
                checkBtn.onclick = () => marcarTreinoComoFeito(treinoDoDia.id, !treinoDoDia.concluido);
                diaEl.appendChild(checkBtn);
            } else {
                const addBtn = document.createElement('button');
                addBtn.className = 'acao-dia-principal';
                addBtn.textContent = '+';
                addBtn.onclick = () => abrirModalPlano(dia);
                diaEl.appendChild(addBtn);
            }
            calendarioGrid.appendChild(diaEl);
        }
    };

    // --- EVENT LISTENERS ---
    mesAnteriorBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        renderizarCalendario();
    });

    mesSeguinteBtn.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        renderizarCalendario();
    });
    
    // O "VIGIA" DO POP-UP
    modalPlano.addEventListener('click', (e) => {
        // Se o clique foi no botão de cancelar
        if (e.target.id === 'modal-plano-cancelar') {
            fecharModalPlano();
        }
        // Se o clique foi no botão de excluir
        if (e.target.id === 'modal-plano-excluir') {
            const idParaExcluir = parseInt(modalPlano.dataset.editingId);
            if (idParaExcluir) {
                excluirPlano(idParaExcluir);
            }
        }
    });

    formPlano.addEventListener('submit', (e) => {
        e.preventDefault();
        let planos = JSON.parse(localStorage.getItem('meus_planos_de_treino')) || [];
        const idParaEditar = parseInt(modalPlano.dataset.editingId);

        if (idParaEditar) {
            const treinoIndex = planos.findIndex(p => p.id === idParaEditar);
            if (treinoIndex > -1) {
                planos[treinoIndex].tipo = planoTipoSelect.value;
                planos[treinoIndex].descricao = planoDescricaoInput.value;
            }
        } else {
            const novoPlano = {
                id: Date.now(),
                data: planoDataInput.value,
                tipo: planoTipoSelect.value,
                descricao: planoDescricaoInput.value,
                concluido: false
            };
            planos.push(novoPlano);
        }
        localStorage.setItem('meus_planos_de_treino', JSON.stringify(planos));
        fecharModalPlano();
        renderizarCalendario();
    });

    // --- INICIALIZAÇÃO ---
    renderizarCalendario();
}


});