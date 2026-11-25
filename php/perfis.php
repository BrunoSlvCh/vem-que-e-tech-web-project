<?php
require 'conexao.php';
exigir(array('Admin'));
$acao = entrada('acao');

if ($acao == 'listar') {
    $lista = consultar('SELECT p.id, p.nome, p.descricao, (SELECT COUNT(*) FROM usuarios u WHERE u.perfil_id = p.id) AS usuarios FROM perfis p ORDER BY p.id');
    responder(array('ok' => true, 'perfis' => $lista));
}

if ($acao == 'criar') {
    $nome = entrada('nome');
    if ($nome == '') {
        erro('Informe o nome do perfil.');
    }
    if (count(consultar('SELECT id FROM perfis WHERE nome = ?', array($nome))) > 0) {
        erro('Já existe um perfil com esse nome.');
    }
    $id = executar('INSERT INTO perfis (nome, descricao) VALUES (?, ?)', array($nome, entrada('descricao')));
    responder(array('ok' => true, 'id' => $id));
}

if ($acao == 'editar') {
    $id = entrada('id');
    $nome = entrada('nome');
    if ($id <= 3) {
        erro('Os perfis padrão (Cliente, Tecnico e Admin) não podem ser alterados.');
    }
    if ($nome == '') {
        erro('Informe o nome do perfil.');
    }
    if (count(consultar('SELECT id FROM perfis WHERE nome = ? AND id <> ?', array($nome, $id))) > 0) {
        erro('Já existe um perfil com esse nome.');
    }
    executar('UPDATE perfis SET nome = ?, descricao = ? WHERE id = ?', array($nome, entrada('descricao'), $id));
    responder(array('ok' => true));
}

if ($acao == 'excluir') {
    $id = entrada('id');
    if ($id <= 3) {
        erro('Os perfis padrão (Cliente, Tecnico e Admin) não podem ser excluídos.');
    }
    $r = consultar('SELECT COUNT(*) AS n FROM usuarios WHERE perfil_id = ?', array($id));
    if ($r[0]['n'] > 0) {
        erro('Existem usuários vinculados a este perfil.');
    }
    executar('DELETE FROM perfis WHERE id = ?', array($id));
    responder(array('ok' => true));
}

erro('Ação inválida.');
