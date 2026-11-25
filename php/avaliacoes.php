<?php
require 'conexao.php';
$acao = entrada('acao');

if ($acao == 'avaliar') {
    $u = exigir(array('Cliente'));
    $nota = (int) entrada('nota');
    if ($nota < 1 || $nota > 5) {
        erro('A nota deve ser de 1 a 5.');
    }
    $r = consultar("SELECT id, tecnico_id FROM chamados WHERE id = ? AND cliente_id = ? AND status IN ('Concluído', 'Pago') AND tecnico_id IS NOT NULL", array(entrada('chamado_id'), $u['id']));
    if (count($r) == 0) {
        erro('Só é possível avaliar chamados concluídos.');
    }
    if (count(consultar('SELECT id FROM avaliacoes WHERE chamado_id = ?', array($r[0]['id']))) > 0) {
        erro('Este chamado já foi avaliado.');
    }
    executar('INSERT INTO avaliacoes (chamado_id, cliente_id, tecnico_id, nota) VALUES (?, ?, ?, ?)', array($r[0]['id'], $u['id'], $r[0]['tecnico_id'], $nota));
    notificar($r[0]['tecnico_id'], $u['id'], 'Nova avaliação', $u['nome'] . ' avaliou o chamado #' . $r[0]['id'] . ' com ' . $nota . ' estrela(s)');
    responder(array('ok' => true));       
}

erro('Ação inválida.');
