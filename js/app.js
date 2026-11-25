var pagina = location.pathname.split('/').pop();

var paginasPublicas = ['login.html', 'esqueci-senha.html', 'redefinir-senha.html'];
var paginasCliente = ['cliente-inicio.html', 'abrir-chamado.html', 'cliente-config.html', 'cliente-notificacoes.html', 'cliente-orcamento.html', 'cliente-pagamento.html', 'cliente-ajuda.html'];
var paginasTecnico = ['dashboard.html', 'chamados-tecnico.html', 'orcamentos.html', 'tecnicos.html', 'configuracoes.html', 'notificacoes.html', 'ajuda.html'];

var iconesCategoria = {
  'Celular': '<svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"></rect><line x1="11" y1="18" x2="13" y2="18"></line></svg>',
  'Computador': '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="12" rx="1"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="15" x2="12" y2="21"></line></svg>',
  'Notebook': '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="1"></rect><line x1="2" y1="19" x2="22" y2="19"></line></svg>',
  'Outros': '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>'
};

var classesStatus = {
  'Pendente': 'pendente',
  'Em análise': 'pendente',
  'Aceito': 'aceito',
  'Em atendimento': 'andamento',
  'Concluído': 'aceito',
  'Pago': 'aceito',
  'Cancelado': 'recusado'
};

var classesSeletor = {
  'Aguardando': 'pendente',
  'Aceito': 'aceito',
  'Em atendimento': 'andamento',
  'Concluído': 'aceito',
  'Pago': 'pago',
  'Recusado': 'recusado',
  'Cancelado': 'cancelado'
};

var iconeSol = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>';
var iconeLua = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>';

function temaAtual() {
  return document.documentElement.getAttribute('data-tema') === 'claro' ? 'claro' : 'escuro';
}

function trocarLogo() {
  var claro = temaAtual() === 'claro';
  document.querySelectorAll('.logo-completa').forEach(function (imagem) {
    if (!imagem.dataset.original) {
      imagem.dataset.original = imagem.getAttribute('src');
    }
    imagem.src = claro ? 'logo-claro.png' : imagem.dataset.original;
  });
}

function atualizarBotaoTema() {
  var claro = temaAtual() === 'claro';
  document.querySelectorAll('.botao-tema').forEach(function (botao) {
    botao.innerHTML = claro ? iconeLua : iconeSol;
    botao.title = claro ? 'Mudar para o tema escuro' : 'Mudar para o tema claro';
    botao.setAttribute('aria-label', botao.title);
  });
}

function aplicarTema(tema) {
  if (tema === 'claro') {
    document.documentElement.setAttribute('data-tema', 'claro');
  } else {
    document.documentElement.removeAttribute('data-tema');
  }
  try {
    localStorage.setItem('vqt-tema', tema);
  } catch (e) {
    tema = temaAtual();
  }
  trocarLogo();
  atualizarBotaoTema();
}

function ligarTema() {
  var botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-tema';
  botao.addEventListener('click', function () {
    aplicarTema(temaAtual() === 'claro' ? 'escuro' : 'claro');
  });
  var cabecalho = document.querySelector('.cabecalho');
  if (cabecalho) {
    var sair = cabecalho.querySelector('a[href="login.html"]');
    var grupo = document.createElement('div');
    grupo.className = 'cabecalho-direita';
    cabecalho.appendChild(grupo);
    grupo.appendChild(botao);
    if (sair) {
      grupo.appendChild(sair);
    }
  } else {
    botao.classList.add('flutuante');
    document.body.appendChild(botao);
  }
  trocarLogo();
  atualizarBotaoTema();
}

function api(arquivo, dados) {
  var corpo = dados instanceof FormData || dados instanceof URLSearchParams ? dados : new URLSearchParams(dados || {});
  return fetch('php/' + arquivo + '.php', { method: 'POST', body: corpo })
    .then(function (r) { return r.json(); })
    .then(function (r) {
      if (r.sessao === false) {
        location.href = 'login.html';
        return new Promise(function () {});
      }
      return r;
    })
    .catch(function () {
      return { ok: false, erro: 'Não foi possível falar com o servidor. Verifique se o Apache e o MySQL estão ligados.' };
    });
}

function janela(titulo, mensagem, classe, botoes) {
  var fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.innerHTML = '<div class="modal-caixa ' + classe + '"><h3>' + esc(titulo) + '</h3><p>' + esc(mensagem) + '</p><div class="modal-acoes"></div></div>';
  var acoes = fundo.querySelector('.modal-acoes');
  botoes.forEach(function (b) {
    var botao = document.createElement('a');
    botao.href = '#';
    botao.className = 'botao' + (b.contorno ? ' contorno' : '');
    botao.textContent = b.texto;
    botao.addEventListener('click', function (e) {
      e.preventDefault();
      fundo.remove();
      if (b.acao) {
        b.acao();
      }
    });
    acoes.appendChild(botao);
  });
  document.body.appendChild(fundo);
  acoes.querySelector('.botao').focus();
}

function aviso(mensagem, depois) {
  janela('Atenção...', mensagem, 'erro', [{ texto: 'OK', acao: depois }]);
}

function sucesso(mensagem, depois) {
  janela('Tudo certo!', mensagem, 'sucesso', [{ texto: 'OK', acao: depois }]);
}

function confirmar(titulo, mensagem, aoConfirmar) {
  janela(titulo, mensagem, '', [{ texto: 'Sim', acao: aoConfirmar }, { texto: 'Não', contorno: true }]);
}

function chamar(arquivo, dados, aoSucesso, aoFalhar) {
  api(arquivo, dados).then(function (r) {
    if (!r.ok) {
      if (aoFalhar) {
        aoFalhar(r);
      }
      aviso(r.erro);
      return;
    }
    if (aoSucesso) {
      aoSucesso(r);
    }
  });
}

function esc(texto) {
  if (texto === null || texto === undefined) {
    return '';
  }
  return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function valor(id) {
  return document.getElementById(id).value.trim();
}

function parametro(nome) {
  return new URLSearchParams(location.search).get(nome);
}

function iniciais(nome) {
  var partes = String(nome).trim().split(/\s+/);
  var a = partes[0].charAt(0);
  var b = partes.length > 1 ? partes[partes.length - 1].charAt(0) : partes[0].charAt(1);
  return (a + b).toUpperCase();
}

function cor(id) {
  return 'cor-' + (Number(id) % 4 + 1);
}

function dinheiro(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dataCurta(texto) {
  var d = texto.substring(0, 10).split('-');
  return d[2] + '/' + d[1];
}

function resumo(texto, tamanho) {
  texto = String(texto);
  return texto.length > tamanho ? texto.substring(0, tamanho) + '...' : texto;
}

function tempoAtras(segundos) {
  var s = Number(segundos);
  if (s < 60) {
    return 'agora';
  }
  if (s < 3600) {
    return Math.floor(s / 60) + ' min atrás';
  }
  if (s < 86400) {
    return Math.floor(s / 3600) + ' h atrás';
  }
  return Math.floor(s / 86400) + ' dia(s) atrás';
}

function formatarTelefone(texto) {
  var n = String(texto || '').replace(/\D/g, '').substring(0, 11);
  if (n.length === 0) {
    return '';
  }
  if (n.length <= 2) {
    return '(' + n;
  }
  if (n.length <= 6) {
    return '(' + n.substring(0, 2) + ') ' + n.substring(2);
  }
  if (n.length <= 10) {
    return '(' + n.substring(0, 2) + ') ' + n.substring(2, 6) + '-' + n.substring(6);
  }
  return '(' + n.substring(0, 2) + ') ' + n.substring(2, 7) + '-' + n.substring(7);
}

function mascaraTelefone(campo) {
  campo.addEventListener('input', function () {
    campo.value = formatarTelefone(campo.value);
  });
}

function urlFoto(id) {
  return 'php/foto.php?usuario=' + id;
}

function avatar(id, nome, classe) {
  return '<span class="avatar-iniciais ' + cor(id) + (classe ? ' ' + classe : '') + '">' + esc(iniciais(nome)) + '<img src="' + urlFoto(id) + '" alt="" onerror="this.remove()"></span>';
}

function pessoa(id, nome, texto) {
  return '<div class="linha-pessoa">' + avatar(id, nome) + '<span class="nome">' + esc(texto) + '</span></div>';
}

function definirAvatar(elemento, id, nome) {
  elemento.innerHTML = esc(iniciais(nome)) + '<img src="' + urlFoto(id) + '&t=' + Date.now() + '" alt="" onerror="this.remove()">';
}

function miniaturas(fotos) {
  if (!fotos) {
    return '';
  }
  return '<div class="miniaturas">' + String(fotos).split(',').map(function (id) {
    var url = 'php/foto.php?chamado_foto=' + id;
    return '<a href="' + url + '" target="_blank"><img src="' + url + '" alt="Foto do aparelho"></a>';
  }).join('') + '</div>';
}

function reduzirImagem(arquivo, maximo) {
  return new Promise(function (resolve, reject) {
    if (!arquivo.type || arquivo.type.indexOf('image/') !== 0) {
      reject();
      return;
    }
    var leitor = new FileReader();
    leitor.onload = function () {
      var imagem = new Image();
      imagem.onload = function () {
        var escala = Math.min(1, maximo / Math.max(imagem.width, imagem.height));
        var tela = document.createElement('canvas');
        tela.width = Math.round(imagem.width * escala);
        tela.height = Math.round(imagem.height * escala);
        var contexto = tela.getContext('2d');
        contexto.fillStyle = '#ffffff';
        contexto.fillRect(0, 0, tela.width, tela.height);
        contexto.drawImage(imagem, 0, 0, tela.width, tela.height);
        tela.toBlob(function (blob) { resolve(blob); }, 'image/jpeg', 0.85);
      };
      imagem.onerror = reject;
      imagem.src = leitor.result;
    };
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

function ligarAreas(raiz) {
  var gerais = raiz.querySelector('.area-gerais');
  var itens = raiz.querySelectorAll('.area-item');
  gerais.addEventListener('change', function () {
    itens.forEach(function (i) { i.checked = gerais.checked; });
  });
  itens.forEach(function (item) {
    item.addEventListener('change', function () {
      gerais.checked = Array.prototype.every.call(itens, function (i) { return i.checked; });
    });
  });
}

function marcarAreas(raiz, areas) {
  var itens = raiz.querySelectorAll('.area-item');
  itens.forEach(function (i) { i.checked = areas.indexOf(i.value) >= 0; });
  raiz.querySelector('.area-gerais').checked = Array.prototype.every.call(itens, function (i) { return i.checked; });
}

function areasMarcadas(raiz) {
  return Array.prototype.filter.call(raiz.querySelectorAll('.area-item'), function (i) { return i.checked; }).map(function (i) { return i.value; });
}

function teclaEnter(e) {
  if (e.key !== 'Enter') {
    return;
  }
  var alvo = e.target;
  var campoPg = alvo.classList && alvo.classList.contains('entrada-pg');
  if (!campoPg && (alvo.tagName !== 'INPUT' || ['checkbox', 'radio', 'file', 'button'].indexOf(alvo.type) >= 0)) {
    return;
  }
  var formulario = alvo.closest('form');
  if (!formulario) {
    return;
  }
  e.preventDefault();
  if (formulario.id === 'form-entrar') {
    entrar('Auto');
    return;
  }
  var botao = formulario.querySelector('a.botao:not(.contorno)');
  if (botao) {
    botao.click();
  }
}

var iconeSair = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path></svg>';

function sairDaConta() {
  confirmar('Sair da conta', 'Deseja sair da conta?', function () {
    api('auth', { acao: 'logout' }).then(function () {
      location.href = 'login.html';
    });
  });
}

function atualizarResumoLateral() {
  var bloco = document.querySelector('.lateral-resumo');
  if (!bloco) {
    return;
  }
  api('chamados', { acao: 'resumo_lateral' }).then(function (r) {
    if (!r.ok) {
      return;
    }
    bloco.innerHTML = '<div class="lateral-titulo">' + esc(r.titulo) + '</div>' + r.itens.map(function (item) {
      var numero = Number(item.valor);
      return '<a href="' + item.link + '"><span>' + esc(item.rotulo) + '</span><span class="lateral-numero' + (numero === 0 ? ' zero' : '') + '">' + numero + '</span></a>';
    }).join('');
  });
}

function montarLateral(usuario) {
  var lateral = document.querySelector('.barra-lateral');
  if (!lateral) {
    return;
  }
  var papeis = { 'Cliente': 'Cliente', 'Tecnico': 'Técnico', 'Admin': 'Administrador' };
  var configuracao = usuario.perfil === 'Cliente' ? 'cliente-config.html' : 'configuracoes.html';
  var resumo = document.createElement('div');
  resumo.className = 'lateral-resumo';
  var rodape = document.createElement('div');
  rodape.className = 'lateral-rodape';
  rodape.innerHTML = '<a class="lateral-perfil" href="' + configuracao + '" title="Abrir configurações">' + avatar(usuario.id, usuario.nome) +
    '<span class="lateral-dados"><span class="lateral-nome">' + esc(usuario.nome) + '</span><span class="lateral-papel">' + papeis[usuario.perfil] + '</span></span></a>' +
    '<button type="button" class="lateral-sair" title="Sair da conta" aria-label="Sair da conta">' + iconeSair + '</button>';
  lateral.appendChild(resumo);
  lateral.appendChild(rodape);
  rodape.querySelector('.lateral-sair').addEventListener('click', sairDaConta);
  atualizarResumoLateral();
}

function ligarSair(usuario) {
  var sair = document.querySelector('.cabecalho a[href="login.html"]');
  if (!sair) {
    return;
  }
  var bolinha = sair.querySelector('.avatar');
  if (bolinha) {
    bolinha.innerHTML = '<img src="' + urlFoto(usuario.id) + '" alt="" onerror="this.remove()">';
  }
  sair.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var aberto = document.querySelector('.menu-sair');
    if (aberto) {
      aberto.remove();
      return;
    }
    var menu = document.createElement('div');
    menu.className = 'menu-sair';
    menu.innerHTML = '<a href="#">Sair da conta</a>';
    document.body.appendChild(menu);
    menu.firstChild.addEventListener('click', function (ev) {
      ev.preventDefault();
      menu.remove();
      sairDaConta();
    });
  });
  document.addEventListener('click', function () {
    var menu = document.querySelector('.menu-sair');
    if (menu) {
      menu.remove();
    }
  });
}

function iniciarLogin() {
  var formCadastro = document.getElementById('form-cadastrar');
  var botoesEntrar = document.querySelectorAll('#form-entrar .grupo-botoes a');
  var botoesCadastro = formCadastro.querySelectorAll('.grupo-botoes a');

  ligarAreas(document.getElementById('areas-cad'));
  mascaraTelefone(document.getElementById('telefone-cad'));

  botoesEntrar[0].addEventListener('click', function (e) { e.preventDefault(); entrar('Cliente'); });
  botoesEntrar[1].addEventListener('click', function (e) { e.preventDefault(); entrar('Tecnico'); });
  botoesCadastro[0].addEventListener('click', function (e) { e.preventDefault(); cadastrar('Cliente'); });
  botoesCadastro[1].addEventListener('click', function (e) { e.preventDefault(); cadastrar('Tecnico'); });
}

function entrar(tipo) {
  var campoSenha = document.getElementById('senha-entrar');
  chamar('auth', {
    acao: 'login',
    login: valor('email-entrar'),
    senha: campoSenha.value,
    tipo: tipo
  }, function (r) {
    location.href = r.destino;
  }, function () {
    campoSenha.value = '';
    campoSenha.focus();
  });
}

function cadastrar(tipo) {
  var dados = new FormData();
  dados.append('acao', 'cadastrar');
  dados.append('nome', valor('nome-cad'));
  dados.append('email', valor('email-cad'));
  dados.append('telefone', valor('telefone-cad'));
  dados.append('senha', document.getElementById('senha-cad').value);
  dados.append('tipo', tipo);
  areasMarcadas(document.getElementById('areas-cad')).forEach(function (a) { dados.append('areas[]', a); });

  var enviar = function () {
    chamar('auth', dados, function (r) {
      location.href = r.destino;
    }, function () {
      document.getElementById('senha-cad').value = '';
    });
  };

  var arquivo = document.getElementById('foto-cad').files[0];
  if (!arquivo) {
    enviar();
    return;
  }
  reduzirImagem(arquivo, 400).then(function (blob) {
    dados.append('foto', blob, 'foto.jpg');
    enviar();
  }).catch(function () {
    aviso('O arquivo escolhido não é uma imagem válida.');
  });
}

function esqueciSenha() {
  document.querySelector('#form-esqueci a.botao').addEventListener('click', function (e) {
    e.preventDefault();
    chamar('auth', { acao: 'verificar_identidade', nome: valor('nome-esqueci'), email: valor('email-esqueci') }, function () {
      location.href = 'redefinir-senha.html';
    });
  });
}

function redefinirSenha() {
  api('auth', { acao: 'etapa_redefinir' }).then(function (r) {
    if (!r.ok) {
      aviso(r.erro, function () { location.href = 'esqueci-senha.html'; });
      return;
    }
    document.getElementById('saudacao').textContent = 'Olá, ' + r.nome.split(' ')[0] + '! Defina a nova senha da sua conta.';
  });

  var nova = document.getElementById('senha-nova-redefinir');
  var confirmacao = document.getElementById('senha-confirmar-redefinir');
  document.querySelector('#form-redefinir a.botao').addEventListener('click', function (e) {
    e.preventDefault();
    var limpar = function () {
      nova.value = '';
      confirmacao.value = '';
      nova.focus();
    };
    if (nova.value !== confirmacao.value) {
      limpar();
      aviso('A confirmação não confere com a nova senha.');
      return;
    }
    chamar('auth', { acao: 'redefinir_senha', senha_nova: nova.value, senha_confirmar: confirmacao.value }, function () {
      sucesso('Senha redefinida com sucesso! Entre com a nova senha.', function () { location.href = 'login.html'; });
    }, limpar);
  });
}

function cartaoCliente(c) {
  if (c.status === 'Em análise' && Number(c.orcamentos) === 0) {
    c.status = 'Pendente';
  }
  var rotulo = c.status;
  var classe = classesStatus[c.status];
  var progresso = 15;
  var abertura = 'Aberto em ' + dataCurta(c.criado_em);
  var cabecalho = '<p class="cliente">' + abertura + ' · ' + esc(resumo(c.descricao, 70)) + '</p>';
  var linha = '';
  var acao = '';
  var avaliacao = '';
  var media = c.media ? ' · ★ ' + c.media : '';
  var podePagar = !Number(c.pago) && c.status === 'Concluído';

  if (c.status === 'Pendente') {
    cabecalho = '<p class="cliente">' + abertura + ' · Aguardando um técnico</p>';
    acao = '<a class="recusar" href="#" data-cancelar="' + c.id + '">Cancelar chamado</a>';
  } else if (c.status === 'Em análise') {
    rotulo = 'Orçamento recebido';
    classe = 'aceito';
    progresso = 40;
    var varios = Number(c.orcamentos) > 1;
    linha = pessoa(c.orc_tecnico_id, c.orc_tecnico, varios ? c.orcamentos + ' técnicos enviaram orçamentos' : c.orc_tecnico + ' enviou um orçamento');
    acao = '<a class="enviar" href="cliente-orcamento.html?chamado=' + c.id + '">' + (varios ? 'Ver orçamentos' : 'Ver orçamento') + '</a>';
  } else if (c.status === 'Aceito') {
    progresso = 55;
    linha = pessoa(c.tecnico_id, c.tecnico_nome, c.tecnico_nome + ' aceitou seu chamado' + media);
  } else if (c.status === 'Em atendimento') {
    progresso = 70;
    linha = pessoa(c.tecnico_id, c.tecnico_nome, c.tecnico_nome + ' está atendendo seu chamado' + media);
  } else if (c.status === 'Concluído' || c.status === 'Pago') {
    progresso = 100;
    linha = pessoa(c.tecnico_id, c.tecnico_nome, c.tecnico_nome + ' · ' + (Number(c.pago) ? 'Pagamento confirmado' : 'Serviço concluído, pagamento disponível') + media);
    if (c.nota) {
      avaliacao = '<div class="avaliacao"><p>Sua avaliação: ' + c.nota + ' de 5 ★</p></div>';
    } else {
      avaliacao = '<div class="avaliacao"><p>Avalie o atendimento</p><div class="estrelas">' +
        [5, 4, 3, 2, 1].map(function (n) {
          return '<input type="radio" id="estrela' + n + '-' + c.id + '" name="avaliacao-' + c.id + '" value="' + n + '" data-chamado="' + c.id + '"><label for="estrela' + n + '-' + c.id + '">★</label>';
        }).join('') + '</div></div>';
    }
  } else if (c.status === 'Cancelado') {
    progresso = 0;
    cabecalho = '<p class="cliente">' + abertura + ' · Chamado cancelado</p>';
  }

  if (podePagar) {
    acao += '<a class="enviar" href="cliente-pagamento.html?chamado=' + c.id + '">Pagar</a>';
  }

  return '<div class="cartao cartao-chamado"><span class="icone-categoria">' + iconesCategoria[c.categoria] + '</span><div class="info">' +
    '<h3>#' + c.id + '  ' + esc(c.titulo) + '</h3>' + cabecalho + miniaturas(c.fotos) + linha +
    '<span class="etiqueta-status ' + classe + '">' + rotulo + '</span>' +
    '<div class="barra-progresso"><span style="width: ' + progresso + '%"></span></div>' + avaliacao + '</div>' +
    (acao ? '<div class="acoes-chamado">' + acao + '</div>' : '') + '</div>';
}

function clienteInicio() {
  chamar('chamados', { acao: 'listar_cliente' }, function (r) {
    var principal = document.querySelector('.conteudo-principal');
    atualizarResumoLateral();
    principal.querySelectorAll('.cartao-chamado, .aviso-vazio').forEach(function (c) { c.remove(); });
    var html = r.chamados.map(cartaoCliente).join('');
    if (r.chamados.length === 0) {
      html = '<div class="cartao aviso-vazio"><p>Você ainda não abriu nenhum chamado.</p></div>';
    }
    principal.insertAdjacentHTML('beforeend', html);
    principal.querySelectorAll('[data-cancelar]').forEach(function (botao) {
      botao.addEventListener('click', function (e) {
        e.preventDefault();
        confirmar('Cancelar chamado', 'Deseja cancelar o chamado #' + botao.dataset.cancelar + '? Depois de cancelado, ele não poderá ser reativado.', function () {
          chamar('chamados', { acao: 'cancelar', chamado_id: botao.dataset.cancelar }, function () {
            sucesso('Chamado cancelado com sucesso.', clienteInicio);
          });
        });
      });
    });
    principal.querySelectorAll('.estrelas input').forEach(function (entrada) {
      entrada.addEventListener('change', function () {
        chamar('avaliacoes', { acao: 'avaliar', chamado_id: entrada.dataset.chamado, nota: entrada.value }, clienteInicio);
      });
    });
  });
}

function carregarTecnicos(categoria) {
  var select = document.getElementById('tecnico-destino');
  select.innerHTML = '<option value="">Qualquer técnico da área</option>';
  if (['Celular', 'Computador', 'Notebook', 'Outros'].indexOf(categoria) < 0) {
    return;
  }
  chamar('usuarios', { acao: 'tecnicos_area', categoria: categoria }, function (r) {
    r.tecnicos.forEach(function (t) {
      select.insertAdjacentHTML('beforeend', '<option value="' + t.id + '">' + esc(t.nome) + (t.media ? ' · ★ ' + t.media : '') + '</option>');
    });
  });
}

function abrirChamado() {
  var categoria = document.getElementById('categoria');
  var entradaFotos = document.getElementById('fotos-aparelho');
  var previa = document.getElementById('previa-fotos');
  var fotos = [];

  function desenharPrevia() {
    previa.innerHTML = '';
    fotos.forEach(function (arquivo, i) {
      var imagem = document.createElement('img');
      imagem.src = URL.createObjectURL(arquivo);
      imagem.title = 'Clique para remover';
      imagem.addEventListener('click', function () {
        fotos.splice(i, 1);
        desenharPrevia();
      });
      previa.appendChild(imagem);
    });
  }

  entradaFotos.addEventListener('change', function () {
    var escolhidas = Array.prototype.slice.call(entradaFotos.files);
    entradaFotos.value = '';
    var invalida = escolhidas.some(function (f) { return f.type.indexOf('image/') !== 0; });
    if (invalida) {
      aviso('Escolha apenas arquivos de imagem.');
      return;
    }
    if (fotos.length + escolhidas.length > 3) {
      aviso('Você pode anexar no máximo 3 fotos.');
    }
    fotos = fotos.concat(escolhidas).slice(0, 3);
    desenharPrevia();
  });

  categoria.addEventListener('change', function () { carregarTecnicos(categoria.value); });
  document.querySelectorAll('#grade-categorias .item-categoria').forEach(function (item) {
    item.addEventListener('click', function () { carregarTecnicos(item.dataset.valor); });
  });

  document.querySelector('form .botao').addEventListener('click', function (e) {
    e.preventDefault();
    var dados = new FormData();
    dados.append('acao', 'criar');
    dados.append('titulo', valor('titulo'));
    dados.append('categoria', categoria.value);
    dados.append('modelo', valor('modelo'));
    dados.append('sistema', valor('sistema'));
    dados.append('descricao', valor('descricao'));
    dados.append('endereco', valor('endereco'));
    dados.append('tecnico_destino', document.getElementById('tecnico-destino').value);

    Promise.all(fotos.map(function (f) { return reduzirImagem(f, 1000); })).then(function (blobs) {
      blobs.forEach(function (b) { dados.append('fotos[]', b, 'foto.jpg'); });
      chamar('chamados', dados, function () {
        sucesso('Chamado criado! Agora é só aguardar os orçamentos dos técnicos.', function () { location.href = 'cliente-inicio.html'; });
      });
    }).catch(function () {
      aviso('Não foi possível processar uma das imagens. Tente outra foto.');
    });
  });
}

function cartaoOrcamento(chamado, o) {
  var detalhes = 'Orçamento enviado por ' + esc(o.tecnico) + ' · ' + (o.media ? '★ ' + o.media : 'sem avaliações') + ' · ' + o.servicos + ' serviço(s) concluído(s)';
  return '<div class="cartao" style="margin-bottom: 16px;">' +
    '<h3>Chamado #' + chamado.id + ' — ' + esc(chamado.titulo) + '</h3>' +
    '<p class="descricao-cartao">' + detalhes + '</p>' +
    '<div class="grade-cartao">' +
    '<div class="campo"><label>Valor do serviço</label><div class="valor-campo">' + dinheiro(o.valor) + '</div></div>' +
    '<div class="campo"><label>Prazo estimado</label><div class="valor-campo">' + esc(o.prazo) + '</div></div></div>' +
    '<div class="campo"><label>Observações do técnico</label><div class="valor-campo">' + (esc(o.observacoes) || '—') + '</div></div>' +
    '<div class="acoes-formulario">' +
    '<a class="botao" href="#" data-aceitar="' + o.id + '">Aceitar orçamento</a>' +
    '<a class="botao contorno" href="#" data-recusar="' + o.id + '">Recusar orçamento</a></div></div>';
}

function clienteOrcamento() {
  var id = parametro('chamado');
  if (!id) {
    location.href = 'cliente-inicio.html';
    return;
  }
  chamar('orcamentos', { acao: 'listar_chamado', chamado_id: id }, function (r) {
    var principal = document.querySelector('.conteudo-principal');
    principal.querySelectorAll('.cartao').forEach(function (c) { c.remove(); });
    if (r.orcamentos.length === 0) {
      principal.insertAdjacentHTML('beforeend', '<div class="cartao"><p>Nenhum orçamento disponível para este chamado.</p></div>');
      return;
    }
    principal.insertAdjacentHTML('beforeend', r.orcamentos.map(function (o) { return cartaoOrcamento(r.chamado, o); }).join(''));

    principal.querySelectorAll('[data-aceitar]').forEach(function (botao) {
      botao.addEventListener('click', function (e) {
        e.preventDefault();
        chamar('orcamentos', { acao: 'aceitar', orcamento_id: botao.dataset.aceitar }, function () {
          sucesso('Orçamento aceito! O pagamento fica disponível quando o técnico marcar o serviço como Concluído.', function () { location.href = 'cliente-inicio.html'; });
        });
      });
    });

    principal.querySelectorAll('[data-recusar]').forEach(function (botao) {
      botao.addEventListener('click', function (e) {
        e.preventDefault();
        confirmar('Recusar orçamento', 'Deseja recusar este orçamento?', function () {
          chamar('orcamentos', { acao: 'recusar', orcamento_id: botao.dataset.recusar }, function (res) {
            if (Number(res.restantes) > 0) {
              clienteOrcamento();
            } else {
              location.href = 'cliente-inicio.html';
            }
          });
        });
      });
    });
  });
}

function textoPg(id) {
  return document.getElementById(id).textContent.trim();
}

function ligarEntradaPg(campo, formatar) {
  campo.contentEditable = 'plaintext-only';
  if (campo.contentEditable !== 'plaintext-only') {
    campo.contentEditable = 'true';
  }
  campo.addEventListener('input', function () {
    var texto = formatar(campo.textContent);
    if (campo.textContent !== texto || campo.children.length > 0) {
      campo.textContent = texto;
      var faixa = document.createRange();
      faixa.selectNodeContents(campo);
      faixa.collapse(false);
      var selecao = window.getSelection();
      selecao.removeAllRanges();
      selecao.addRange(faixa);
    }
  });
}

function clientePagamento() {
  var id = parametro('chamado');
  if (!id) {
    location.href = 'cliente-inicio.html';
    return;
  }
  api('pagamentos', { acao: 'resumo', chamado_id: id }).then(function (r) {
    if (!r.ok) {
      aviso(r.erro, function () { location.href = 'cliente-inicio.html'; });
      return;
    }
    var p = r.pagamento;
    document.querySelector('.cartao h3').textContent = 'Pagamento do chamado #' + p.id;
    var spans = document.querySelectorAll('.resumo-pagamento span');
    spans[0].innerHTML = esc(p.titulo) + '<br>Técnico: ' + esc(p.tecnico) + ' · Método: Cartão';
    spans[1].textContent = dinheiro(p.valor);
    if (Number(p.pago)) {
      aviso('Este chamado já foi pago.', function () { location.href = 'cliente-inicio.html'; });
    }
  });

  ligarEntradaPg(document.getElementById('pg-campo-1'), function (t) {
    return t.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
  });
  ligarEntradaPg(document.getElementById('pg-campo-2'), function (t) {
    return t.replace(/[\r\n]+/g, ' ');
  });
  ligarEntradaPg(document.getElementById('pg-campo-3'), function (t) {
    var n = t.replace(/\D/g, '').substring(0, 4);
    return n.length > 2 ? n.substring(0, 2) + '/' + n.substring(2) : n;
  });
  ligarEntradaPg(document.getElementById('pg-campo-4'), function (t) {
    return t.replace(/\D/g, '').substring(0, 4);
  });

  document.querySelector('form .botao').addEventListener('click', function (e) {
    e.preventDefault();
    chamar('pagamentos', {
      acao: 'pagar',
      chamado_id: id,
      numero_cartao: textoPg('pg-campo-1'),
      nome_cartao: textoPg('pg-campo-2'),
      validade: textoPg('pg-campo-3'),
      cvv: textoPg('pg-campo-4')
    }, function () {
      sucesso('Pagamento confirmado! O status do chamado agora é Pago.', function () { location.href = 'cliente-inicio.html'; });
    });
  });
}

function configuracoes(usuario) {
  var formularios = document.querySelectorAll('form');
  var dados = formularios[0].querySelectorAll('input');
  var senhas = formularios[1].querySelectorAll('input');
  var bolinha = document.querySelector('.avatar-editavel .avatar-iniciais');
  var blocoAreas = document.getElementById('bloco-areas');

  mascaraTelefone(dados[2]);
  if (blocoAreas) {
    ligarAreas(blocoAreas);
  }

  chamar('usuarios', { acao: 'meus_dados' }, function (r) {
    dados[0].value = r.usuario.nome;
    dados[1].value = r.usuario.email;
    dados[2].value = formatarTelefone(r.usuario.telefone);
    definirAvatar(bolinha, usuario.id, r.usuario.nome);
    if (blocoAreas) {
      marcarAreas(blocoAreas, r.usuario.areas);
    }
  });

  var entradaFoto = document.createElement('input');
  entradaFoto.type = 'file';
  entradaFoto.accept = 'image/*';
  entradaFoto.style.display = 'none';
  document.body.appendChild(entradaFoto);

  document.querySelector('.avatar-editavel a.botao').addEventListener('click', function (e) {
    e.preventDefault();
    entradaFoto.click();
  });

  entradaFoto.addEventListener('change', function () {
    var arquivo = entradaFoto.files[0];
    entradaFoto.value = '';
    if (!arquivo) {
      return;
    }
    reduzirImagem(arquivo, 400).then(function (blob) {
      var enviar = new FormData();
      enviar.append('acao', 'salvar_foto');
      enviar.append('foto', blob, 'foto.jpg');
      chamar('usuarios', enviar, function () {
        definirAvatar(bolinha, usuario.id, dados[0].value);
        var lateralAvatar = document.querySelector('.lateral-perfil .avatar-iniciais');
        if (lateralAvatar) {
          definirAvatar(lateralAvatar, usuario.id, dados[0].value);
        }
        var cabecalho = document.querySelector('.cabecalho .avatar');
        if (cabecalho) {
          cabecalho.innerHTML = '<img src="' + urlFoto(usuario.id) + '&t=' + Date.now() + '" alt="">';
        }
        sucesso('Foto de perfil atualizada!');
      });
    }).catch(function () {
      aviso('O arquivo escolhido não é uma imagem válida.');
    });
  });

  var botaoDados = formularios[0].querySelector('a.botao');
  botaoDados.addEventListener('click', function (e) {
    e.preventDefault();
    chamar('usuarios', { acao: 'salvar_dados', nome: dados[0].value, email: dados[1].value, telefone: dados[2].value }, function () {
      sucesso('Dados salvos com sucesso!', function () { location.href = botaoDados.getAttribute('href'); });
    });
  });

  var botaoSenha = formularios[1].querySelector('a.botao');
  var limparSenhas = function () {
    senhas.forEach(function (s) { s.value = ''; });
    senhas[0].focus();
  };
  botaoSenha.addEventListener('click', function (e) {
    e.preventDefault();
    if (senhas[1].value !== senhas[2].value) {
      limparSenhas();
      aviso('A confirmação não confere com a nova senha.');
      return;
    }
    chamar('usuarios', { acao: 'trocar_senha', senha_atual: senhas[0].value, senha_nova: senhas[1].value }, function () {
      sucesso('Senha atualizada com sucesso!', function () { location.href = botaoSenha.getAttribute('href'); });
    }, limparSenhas);
  });

  if (blocoAreas) {
    blocoAreas.querySelector('a.botao').addEventListener('click', function (e) {
      e.preventDefault();
      var enviar = new URLSearchParams();
      enviar.append('acao', 'salvar_areas');
      areasMarcadas(blocoAreas).forEach(function (a) { enviar.append('areas[]', a); });
      chamar('usuarios', enviar, function () {
        sucesso('Especialidades atualizadas com sucesso!');
      });
    });
  }
}

function notificacoesPagina() {
  chamar('notificacoes', { acao: 'listar' }, function (r) {
    var cartao = document.querySelector('.conteudo-principal .cartao');
    if (r.notificacoes.length === 0) {
      cartao.innerHTML = '<p>Nenhuma notificação por enquanto.</p>';
      return;
    }
    cartao.innerHTML = r.notificacoes.map(function (n) {
      var marca = n.origem ? avatar(n.origem_id, n.origem, 'pequeno') : '<span class="ponto"></span>';
      return '<div class="item-notificacao">' + marca + '<div class="conteudo"><strong>' + esc(n.titulo) + '</strong><p>' + esc(n.mensagem) + '</p></div><span class="tempo">' + tempoAtras(n.segundos) + '</span></div>';
    }).join('');
  });
}

function dashboardPagina() {
  chamar('dashboard', { acao: 'dados' }, function (r) {
    var numeros = document.querySelectorAll('.cartao-estatistica strong');
    numeros[0].textContent = r.pendentes;
    numeros[1].textContent = r.andamento;
    numeros[2].textContent = r.concluidos;
    numeros[3].textContent = dinheiro(r.faturamento);

    var maior = Math.max.apply(null, r.semanas.concat([1]));
    document.querySelector('.grafico-barras').innerHTML = r.semanas.map(function (n, i) {
      var destaque = i === r.semanas.length - 1 ? ' class="destaque"' : '';
      return '<div' + destaque + ' style="height: ' + Math.max(n / maior * 100, 3) + '%" title="' + n + ' chamado(s)"></div>';
    }).join('');

    document.querySelector('.lista-atividade').innerHTML = r.atividades.length ?
      r.atividades.map(function (a) { return '<li><span class="ponto"></span>' + esc(a) + '</li>'; }).join('') :
      '<li>Nenhuma atividade ainda</li>';

    document.querySelector('.tabela tbody').innerHTML = r.ultimos.map(function (c) {
      var tecnico = c.tecnico ? pessoa(c.tecnico_id, c.tecnico, c.tecnico) : '—';
      return '<tr><td>#' + c.id + '</td><td>' + pessoa(c.cliente_id, c.cliente, c.cliente) + '</td><td>' + esc(c.titulo) + '</td><td>' + tecnico +
        '</td><td><span class="etiqueta-status ' + classesStatus[c.status] + '">' + c.status + '</span></td></tr>';
    }).join('');
  });
}

var listaChamados = [];

function cartaoTecnico(c, admin) {
  var enviado = Number(c.enviado) > 0;
  var detalhes = c.categoria + ' · ' + c.modelo + (c.sistema ? ' · ' + c.sistema : '') + ' — ' + resumo(c.descricao, 110);
  var acoes = admin ? '' :
    '<div class="acoes-chamado"><a class="enviar" href="#" data-enviar="' + c.id + '">Enviar orçamento</a>' +
    '<a class="recusar" href="#" data-recusar="' + c.id + '">Recusar</a></div>';
  return '<div class="cartao cartao-chamado"><span class="icone-categoria">' + iconesCategoria[c.categoria] + '</span><div class="info">' +
    '<h3>#' + c.id + '  ' + esc(c.titulo) + '</h3><p class="cliente">' + esc(detalhes) + '</p>' + miniaturas(c.fotos) +
    pessoa(c.cliente_id, c.cliente, c.cliente + ' · ' + c.endereco) +
    '<span class="etiqueta-status ' + (enviado ? 'enviado' : 'pendente') + '">' + (enviado ? 'Orçamento enviado' : 'Pendente') + '</span>' +
    '<div class="barra-progresso"><span style="width: ' + (enviado ? 40 : 15) + '%"></span></div></div>' + acoes + '</div>';
}

function abrirModalOrcamento(id, depois) {
  var fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.innerHTML = '<div class="cartao-auth"><h3>Orçamento do chamado #' + id + '</h3><form>' +
    '<div class="campo"><label for="orc-valor">Valor do serviço (R$)</label><input type="text" id="orc-valor" placeholder="Ex.: 220,00"></div>' +
    '<div class="campo"><label for="orc-prazo">Prazo estimado</label><input type="text" id="orc-prazo" placeholder="Ex.: 2 dias úteis"></div>' +
    '<div class="campo"><label for="orc-obs">Observações</label><textarea id="orc-obs" placeholder="Peças, detalhes do serviço..."></textarea></div>' +
    '<div class="acoes-formulario"><a class="botao" href="#" id="orc-enviar">Enviar orçamento</a><a class="botao contorno" href="#" id="orc-cancelar">Cancelar</a></div></form></div>';
  document.body.appendChild(fundo);
  document.getElementById('orc-valor').focus();

  document.getElementById('orc-cancelar').addEventListener('click', function (e) {
    e.preventDefault();
    fundo.remove();
  });
  document.getElementById('orc-enviar').addEventListener('click', function (e) {
    e.preventDefault();
    chamar('orcamentos', {
      acao: 'enviar',
      chamado_id: id,
      valor: valor('orc-valor'),
      prazo: valor('orc-prazo'),
      observacoes: valor('orc-obs')
    }, function () {
      fundo.remove();
      sucesso('Orçamento enviado ao cliente!', depois);
    });
  });
}

function chamadosTecnico(usuario) {
  var admin = usuario.perfil === 'Admin';
  var filtros = document.querySelector('.barra-filtros');
  var busca = filtros.querySelector('input');
  var selects = filtros.querySelectorAll('select');
  selects[0].innerHTML = '<option value="">Categoria</option><option>Celular</option><option>Computador</option><option>Notebook</option><option>Outros</option>';
  selects[1].innerHTML = '<option value="">Status</option><option>Pendente</option><option>Orçamento enviado</option>';
  selects[2].innerHTML = '<option value="novos">Mais recentes</option><option value="antigos">Mais antigos</option>';

  function desenhar() {
    var texto = busca.value.toLowerCase();
    var lista = listaChamados.filter(function (c) {
      var enviado = Number(c.enviado) > 0;
      var alvo = (c.titulo + ' ' + c.cliente + ' ' + c.modelo + ' ' + c.endereco).toLowerCase();
      return alvo.indexOf(texto) >= 0 &&
        (selects[0].value === '' || c.categoria === selects[0].value) &&
        (selects[1].value === '' || (selects[1].value === 'Orçamento enviado') === enviado);
    });
    if (selects[2].value === 'antigos') {
      lista.reverse();
    }
    var principal = document.querySelector('.conteudo-principal');
    principal.querySelectorAll('.cartao-chamado, .aviso-vazio').forEach(function (c) { c.remove(); });
    var html = lista.map(function (c) { return cartaoTecnico(c, admin); }).join('');
    if (lista.length === 0) {
      html = '<div class="cartao aviso-vazio"><p>Nenhum chamado disponível no momento.</p></div>';
    }
    principal.insertAdjacentHTML('beforeend', html);

    principal.querySelectorAll('[data-enviar]').forEach(function (botao) {
      botao.addEventListener('click', function (e) {
        e.preventDefault();
        abrirModalOrcamento(botao.dataset.enviar, carregar);
      });
    });
    principal.querySelectorAll('[data-recusar]').forEach(function (botao) {
      botao.addEventListener('click', function (e) {
        e.preventDefault();
        confirmar('Recusar chamado', 'Deseja recusar este chamado?', function () {
          chamar('chamados', { acao: 'recusar', chamado_id: botao.dataset.recusar }, carregar);
        });
      });
    });
  }

  function carregar() {
    chamar('chamados', { acao: 'listar_tecnico' }, function (r) {
      atualizarResumoLateral();
      listaChamados = r.chamados;
      desenhar();
    });
  }

  busca.addEventListener('input', desenhar);
  selects.forEach(function (s) { s.addEventListener('change', desenhar); });
  carregar();
}

var listaOrcamentos = [];
var statusOrcamento = ['Aguardando', 'Aceito', 'Em atendimento', 'Concluído', 'Pago', 'Recusado', 'Cancelado'];

function seletorStatus(o, admin) {
  return '<select class="seletor-status ' + classesSeletor[o.status] + '" data-id="' + o.id + '"' + (admin ? ' disabled' : '') + '>' +
    statusOrcamento.map(function (s) {
      return '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>';
    }).join('') + '</select>';
}

function orcamentosTecnico(usuario) {
  var admin = usuario.perfil === 'Admin';
  var filtros = document.querySelector('.barra-filtros');
  var busca = filtros.querySelector('input');
  var selects = filtros.querySelectorAll('select');
  selects[0].innerHTML = '<option value="">Status</option>' + statusOrcamento.map(function (s) { return '<option>' + s + '</option>'; }).join('');
  selects[1].innerHTML = '<option value="novos">Mais recentes</option><option value="antigos">Mais antigos</option>';
  var corpo = document.querySelector('.tabela tbody');

  function desenhar() {
    var texto = busca.value.toLowerCase();
    var lista = listaOrcamentos.filter(function (o) {
      return (o.titulo + ' ' + o.cliente + ' ' + o.chamado_id).toLowerCase().indexOf(texto) >= 0 &&
        (selects[0].value === '' || o.status === selects[0].value);
    });
    if (selects[1].value === 'antigos') {
      lista.reverse();
    }
    corpo.innerHTML = lista.map(function (o) {
      return '<tr><td>#' + o.chamado_id + '</td><td>' + pessoa(o.cliente_id, o.cliente, o.cliente) + '</td><td>' + esc(o.titulo) + '</td><td>' +
        dinheiro(o.valor) + '</td><td>' + dataCurta(o.criado_em) + '</td><td>' + seletorStatus(o, admin) + '</td></tr>';
    }).join('');
    if (lista.length === 0) {
      corpo.innerHTML = '<tr><td colspan="6">Nenhum orçamento encontrado.</td></tr>';
    }
    corpo.querySelectorAll('select').forEach(function (s) {
      s.addEventListener('change', function () {
        api('orcamentos', { acao: 'mudar_status', orcamento_id: s.dataset.id, status: s.value }).then(function (r) {
          if (!r.ok) {
            aviso(r.erro);
          }
          carregar();
        });
      });
    });
  }

  function carregar() {
    chamar('orcamentos', { acao: 'listar_tecnico' }, function (r) {
      atualizarResumoLateral();
      listaOrcamentos = r.orcamentos;
      desenhar();
    });
  }

  busca.addEventListener('input', desenhar);
  selects.forEach(function (s) { s.addEventListener('change', desenhar); });
  carregar();
}

var listaTecnicos = [];

function tecnicosPagina() {
  var filtros = document.querySelector('.barra-filtros');
  var busca = filtros.querySelector('input');
  var selects = filtros.querySelectorAll('select');
  var corpo = document.querySelector('.tabela tbody');
  selects[0].innerHTML = '<option value="">Especialidade</option><option value="Celular">Celulares e tablets</option><option value="Computador">Computadores e PCs</option><option value="Notebook">Notebooks</option><option value="Outros">Outros eletrônicos</option>';
  selects[1].innerHTML = '<option value="">Status</option><option>Online</option><option>Offline</option>';

  function desenhar() {
    var texto = busca.value.toLowerCase();
    var lista = listaTecnicos.filter(function (t) {
      var estado = Number(t.online) ? 'Online' : 'Offline';
      var areas = t.areas ? t.areas.split(',') : [];
      return t.nome.toLowerCase().indexOf(texto) >= 0 &&
        (selects[0].value === '' || areas.indexOf(selects[0].value) >= 0) &&
        (selects[1].value === '' || estado === selects[1].value);
    });
    corpo.innerHTML = lista.map(function (t) {
      var online = Number(t.online) === 1;
      return '<tr><td>' + pessoa(t.id, t.nome, t.nome) + '</td><td>' + esc(t.especialidade || '—') + '</td><td>' + t.ativos + '</td><td>' +
        (t.media ? Number(t.media).toFixed(1) : '—') + '</td><td><span class="etiqueta-status ' + (online ? 'aceito' : 'offline') + '">' + (online ? 'Online' : 'Offline') + '</span></td></tr>';
    }).join('');
    if (lista.length === 0) {
      corpo.innerHTML = '<tr><td colspan="5">Nenhum técnico encontrado.</td></tr>';
    }
  }

  chamar('usuarios', { acao: 'tecnicos' }, function (r) {
    listaTecnicos = r.tecnicos;
    desenhar();
  });

  busca.addEventListener('input', desenhar);
  selects.forEach(function (s) { s.addEventListener('change', desenhar); });
}

function semAcento(texto) {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function ajudaPagina() {
  var busca = document.getElementById('busca-ajuda');
  var vazio = document.getElementById('ajuda-vazia');
  busca.addEventListener('input', function () {
    var termo = semAcento(busca.value.trim());
    var encontrou = false;
    document.querySelectorAll('.faq-secao').forEach(function (secao) {
      var visiveis = 0;
      secao.querySelectorAll('.faq-item').forEach(function (item) {
        var mostrar = semAcento(item.textContent).indexOf(termo) >= 0;
        item.style.display = mostrar ? '' : 'none';
        item.open = mostrar && termo !== '';
        if (mostrar) {
          visiveis++;
        }
      });
      secao.style.display = visiveis > 0 ? '' : 'none';
      if (visiveis > 0) {
        encontrou = true;
      }
    });
    vazio.style.display = encontrou ? 'none' : '';
  });
}

var paginas = {
  'esqueci-senha.html': esqueciSenha,
  'redefinir-senha.html': redefinirSenha,
  'cliente-inicio.html': clienteInicio,
  'abrir-chamado.html': abrirChamado,
  'cliente-orcamento.html': clienteOrcamento,
  'cliente-pagamento.html': clientePagamento,
  'cliente-config.html': configuracoes,
  'cliente-notificacoes.html': notificacoesPagina,
  'dashboard.html': dashboardPagina,
  'chamados-tecnico.html': chamadosTecnico,
  'orcamentos.html': orcamentosTecnico,
  'tecnicos.html': tecnicosPagina,
  'configuracoes.html': configuracoes,
  'notificacoes.html': notificacoesPagina,
  'ajuda.html': ajudaPagina,
  'cliente-ajuda.html': ajudaPagina
};

function iniciar() {
  document.addEventListener('keydown', teclaEnter);
  ligarTema();

  if (paginasPublicas.indexOf(pagina) >= 0) {
    if (pagina === 'login.html') {
      iniciarLogin();
    } else {
      paginas[pagina]();
    }
    return;
  }

  api('auth', { acao: 'sessao' }).then(function (r) {
    if (!r.logado) {
      location.href = 'login.html';
      return;
    }
    var cliente = r.usuario.perfil === 'Cliente';
    if (paginasCliente.indexOf(pagina) >= 0 && !cliente) {
      location.href = 'dashboard.html';
      return;
    }
    if (paginasTecnico.indexOf(pagina) >= 0 && cliente) {
      location.href = 'cliente-inicio.html';
      return;
    }
    ligarSair(r.usuario);
    montarLateral(r.usuario);
    if (paginas[pagina]) {
      paginas[pagina](r.usuario);
    }
  });
}

iniciar();
