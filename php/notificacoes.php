<?php
require 'conexao.php';
$acao = entrada('acao');

if ($acao == 'listar') {
    $u = exigir(array('Cliente', 'Tecnico', 'Admin'));
    $lista = consultar('SELECT n.id, n.titulo, n.mensagem, n.origem_id, o.nome AS origem, TIMESTAMPDIFF(SECOND, n.criado_em, NOW()) AS segundos
        FROM notificacoes n LEFT JOIN usuarios o ON o.id = n.origem_id
        WHERE n.usuario_id = ? ORDER BY n.id DESC LIMIT 30', array($u['id']));
    responder(array('ok' => true, 'notificacoes' => $lista));
}

erro('Ação inválida.');
