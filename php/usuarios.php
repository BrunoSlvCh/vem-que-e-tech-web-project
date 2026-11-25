<?php
require 'conexao.php';
$acao = entrada('acao');

if ($acao == 'meus_dados') {
    $u = exigir(array('Cliente', 'Tecnico', 'Admin'));
    $areas = array();
    $r = consultar('SELECT c.nome FROM tecnico_categorias t JOIN categorias c ON c.id = t.categoria_id WHERE t.tecnico_id = ?', array($u['id']));
    foreach ($r as $x) {
        $areas[] = $x['nome'];
    }
    responder(array('ok' => true, 'usuario' => array('id' => $u['id'], 'nome' => $u['nome'], 'email' => $u['email'], 'telefone' => $u['telefone'], 'areas' => $areas)));
}

if ($acao == 'salvar_dados') {
    $u = exigir(array('Cliente', 'Tecnico', 'Admin'));
    $nome = entrada('nome');
    $email = strtolower(entrada('email'));
    if ($nome == '') {
        erro('Informe o nome.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        erro('Informe um e-mail válido.');
    }
    $telefone = telefone_valido(entrada('telefone'));
    if (!$telefone) {
        erro('Informe um telefone válido com DDD. Ex.: (11) 91234-5678.');
    }
    if (count(consultar('SELECT id FROM usuarios WHERE email = ? AND id <> ?', array($email, $u['id']))) > 0) {
        erro('Este e-mail já está em uso por outra conta.');
    }
    if (count(consultar('SELECT id FROM usuarios WHERE telefone = ? AND id <> ?', array($telefone, $u['id']))) > 0) {
        erro('Este telefone já está em uso por outra conta.');
    }
    executar('UPDATE usuarios SET nome = ?, email = ?, telefone = ? WHERE id = ?', array($nome, $email, $telefone, $u['id']));
    responder(array('ok' => true));
}

if ($acao == 'salvar_foto') {
    $u = exigir(array('Cliente', 'Tecnico', 'Admin'));
    $arquivos = arquivos_enviados('foto');
    if (count($arquivos) == 0) {
        erro('Escolha uma imagem para a foto de perfil.');
    }
    $img = ler_imagem($arquivos[0]);
    executar('UPDATE usuarios SET foto = ?, foto_tipo = ? WHERE id = ?', array($img['dados'], $img['tipo'], $u['id']));
    responder(array('ok' => true));
}

if ($acao == 'salvar_areas') {
    $u = exigir(array('Tecnico'));
    $areas = ids_das_areas();
    if (count($areas) == 0) {
        erro('Escolha pelo menos uma especialidade.');
    }
    executar('DELETE FROM tecnico_categorias WHERE tecnico_id = ?', array($u['id']));
    foreach ($areas as $a) {
        executar('INSERT INTO tecnico_categorias (tecnico_id, categoria_id) VALUES (?, ?)', array($u['id'], $a));
    }
    responder(array('ok' => true));
}

if ($acao == 'trocar_senha') {
    $u = exigir(array('Cliente', 'Tecnico', 'Admin'));
    $atual = isset($_POST['senha_atual']) ? $_POST['senha_atual'] : '';
    $nova = isset($_POST['senha_nova']) ? $_POST['senha_nova'] : '';
    $r = consultar('SELECT senha FROM usuarios WHERE id = ?', array($u['id']));
    if (!password_verify($atual, $r[0]['senha'])) {
        erro('A senha atual está incorreta.');
    }
    if (strlen($nova) < 6) {
        erro('A nova senha deve ter pelo menos 6 caracteres.');
    }
    executar('UPDATE usuarios SET senha = ? WHERE id = ?', array(password_hash($nova, PASSWORD_DEFAULT), $u['id']));
    responder(array('ok' => true));
}

if ($acao == 'tecnicos') {
    exigir(array('Tecnico', 'Admin'));
    $lista = consultar("SELECT u.id, u.nome,
        (SELECT IF(COUNT(*) = (SELECT COUNT(*) FROM categorias), 'Especialidades gerais', GROUP_CONCAT(c2.descricao ORDER BY c2.id SEPARATOR ', ')) FROM tecnico_categorias tc JOIN categorias c2 ON c2.id = tc.categoria_id WHERE tc.tecnico_id = u.id) AS especialidade,
        (SELECT GROUP_CONCAT(c3.nome ORDER BY c3.id) FROM tecnico_categorias tc2 JOIN categorias c3 ON c3.id = tc2.categoria_id WHERE tc2.tecnico_id = u.id) AS areas,
        (SELECT COUNT(*) FROM chamados ch WHERE ch.tecnico_id = u.id AND ch.status IN ('Aceito', 'Em atendimento')) AS ativos,
        (SELECT ROUND(AVG(a.nota), 1) FROM avaliacoes a WHERE a.tecnico_id = u.id) AS media,
        IF(u.ultimo_acesso > DATE_SUB(NOW(), INTERVAL 10 MINUTE), 1, 0) AS online
        FROM usuarios u JOIN perfis p ON p.id = u.perfil_id
        WHERE p.nome = 'Tecnico' ORDER BY u.nome");
    responder(array('ok' => true, 'tecnicos' => $lista));
}

if ($acao == 'tecnicos_area') {
    exigir(array('Cliente'));
    $lista = consultar("SELECT u.id, u.nome, ROUND(AVG(a.nota), 1) AS media
        FROM usuarios u JOIN perfis p ON p.id = u.perfil_id
        JOIN tecnico_categorias tc ON tc.tecnico_id = u.id JOIN categorias c ON c.id = tc.categoria_id
        LEFT JOIN avaliacoes a ON a.tecnico_id = u.id
        WHERE p.nome = 'Tecnico' AND c.nome = ?
        GROUP BY u.id, u.nome ORDER BY u.nome", array(entrada('categoria')));
    responder(array('ok' => true, 'tecnicos' => $lista));
}

erro('Ação inválida.');
