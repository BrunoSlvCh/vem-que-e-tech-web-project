<?php
require 'conexao.php';
$acao = entrada('acao');

function destino($perfil) {
    return $perfil == 'Cliente' ? 'cliente-inicio.html' : 'dashboard.html';
}

if ($acao == 'cadastrar') {
    $nome = preg_replace('/\s+/', ' ', entrada('nome'));
    $email = strtolower(entrada('email'));
    $senha = isset($_POST['senha']) ? $_POST['senha'] : '';
    $tipo = entrada('tipo') == 'Tecnico' ? 'Tecnico' : 'Cliente';

    if ($nome == '') {
        erro('Informe seu nome.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        erro('Informe um e-mail válido.');
    }
    $telefone = telefone_valido(entrada('telefone'));
    if (!$telefone) {
        erro('Informe um telefone válido com DDD. Ex.: (11) 91234-5678.');
    }
    if (strlen($senha) < 6) {
        erro('A senha deve ter pelo menos 6 caracteres.');
    }
    if (count(consultar('SELECT id FROM usuarios WHERE email = ?', array($email))) > 0) {
        erro('Este e-mail já está cadastrado.');
    }
    if (count(consultar('SELECT id FROM usuarios WHERE telefone = ?', array($telefone))) > 0) {
        erro('Este telefone já está cadastrado.');
    }

    $areas = array();
    if ($tipo == 'Tecnico') {
        $areas = ids_das_areas();
        if (count($areas) == 0) {
            erro('Escolha pelo menos uma área de atuação do técnico.');
        }
    }

    $foto = null;
    $foto_tipo = null;
    $arquivos = arquivos_enviados('foto');
    if (count($arquivos) > 0) {
        $img = ler_imagem($arquivos[0]);
        $foto = $img['dados'];
        $foto_tipo = $img['tipo'];
    }

    $p = consultar('SELECT id FROM perfis WHERE nome = ?', array($tipo));
    $id = executar('INSERT INTO usuarios (perfil_id, nome, email, senha, telefone, foto, foto_tipo, ultimo_acesso) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())', array($p[0]['id'], $nome, $email, password_hash($senha, PASSWORD_DEFAULT), $telefone, $foto, $foto_tipo));
    foreach ($areas as $a) {
        executar('INSERT INTO tecnico_categorias (tecnico_id, categoria_id) VALUES (?, ?)', array($id, $a));
    }
    session_regenerate_id(true);
    $_SESSION['usuario_id'] = $id;
    responder(array('ok' => true, 'destino' => destino($tipo)));
}

if ($acao == 'login') {
    $login = entrada('login');
    $senha = isset($_POST['senha']) ? $_POST['senha'] : '';
    $tipo = entrada('tipo');

    if (strpos($login, '@') !== false) {
        $coluna = 'email';
        $busca = strtolower($login);
    } else {
        $coluna = 'telefone';
        $busca = telefone_valido($login);
        if (!$busca) {
            erro('Informe um e-mail ou um telefone válido com DDD.');
        }
    }

    $r = consultar('SELECT u.id, u.senha, p.nome AS perfil FROM usuarios u JOIN perfis p ON p.id = u.perfil_id WHERE u.' . $coluna . ' = ?', array($busca));
    if (count($r) == 0 || !password_verify($senha, $r[0]['senha'])) {
        erro('E-mail, telefone ou senha incorretos.');
    }
    $perfil = $r[0]['perfil'];
    if ($tipo == 'Cliente' && $perfil != 'Cliente') {
        erro('Esta conta não é de cliente. Use o botão "Logar como Técnico".');
    }
    if ($tipo == 'Tecnico' && $perfil == 'Cliente') {
        erro('Esta conta é de cliente. Use o botão "Logar como Cliente".');
    }
    session_regenerate_id(true);
    $_SESSION['usuario_id'] = $r[0]['id'];
    executar('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?', array($r[0]['id']));
    responder(array('ok' => true, 'destino' => destino($perfil)));
}

if ($acao == 'logout') {
    if (isset($_SESSION['usuario_id'])) {
        executar('UPDATE usuarios SET ultimo_acesso = NULL WHERE id = ?', array($_SESSION['usuario_id']));
    }
    session_destroy();
    responder(array('ok' => true));
}

if ($acao == 'sessao') {
    $u = usuario_logado();
    if (!$u) {
        responder(array('ok' => true, 'logado' => false));
    }
    executar('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?', array($u['id']));
    responder(array('ok' => true, 'logado' => true, 'usuario' => array('id' => $u['id'], 'nome' => $u['nome'], 'perfil' => $u['perfil'], 'tem_foto' => $u['tem_foto'])));
}

if ($acao == 'verificar_identidade') {
    $nome = preg_replace('/\s+/', ' ', entrada('nome'));
    $email = strtolower(entrada('email'));
    if ($nome == '' || $email == '') {
        erro('Informe seu nome completo e seu e-mail.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        erro('Informe um e-mail válido.');
    }
    $r = consultar('SELECT id FROM usuarios WHERE email = ? AND nome = ?', array($email, $nome));
    if (count($r) == 0) {
        erro('Nome ou e-mail não conferem com nenhuma conta cadastrada.');
    }
    $_SESSION['redefinir_id'] = $r[0]['id'];
    $_SESSION['redefinir_em'] = time();
    responder(array('ok' => true));
}

if ($acao == 'etapa_redefinir') {
    if (!isset($_SESSION['redefinir_id']) || time() - $_SESSION['redefinir_em'] > 900) {
        unset($_SESSION['redefinir_id']);
        erro('Confirme seus dados primeiro para redefinir a senha.');
    }
    $r = consultar('SELECT nome FROM usuarios WHERE id = ?', array($_SESSION['redefinir_id']));
    responder(array('ok' => true, 'nome' => $r[0]['nome']));
}

if ($acao == 'redefinir_senha') {
    if (!isset($_SESSION['redefinir_id']) || time() - $_SESSION['redefinir_em'] > 900) {
        unset($_SESSION['redefinir_id']);
        erro('O tempo para redefinir a senha expirou. Comece novamente.');
    }
    $nova = isset($_POST['senha_nova']) ? $_POST['senha_nova'] : '';
    $confirmar = isset($_POST['senha_confirmar']) ? $_POST['senha_confirmar'] : '';
    if (strlen($nova) < 6) {
        erro('A nova senha deve ter pelo menos 6 caracteres.');
    }
    if ($nova !== $confirmar) {
        erro('A confirmação não confere com a nova senha.');
    }
    executar('UPDATE usuarios SET senha = ? WHERE id = ?', array(password_hash($nova, PASSWORD_DEFAULT), $_SESSION['redefinir_id']));
    unset($_SESSION['redefinir_id']);
    unset($_SESSION['redefinir_em']);
    responder(array('ok' => true));
}

erro('Ação inválida.');
