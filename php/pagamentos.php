<?php
require 'conexao.php';
$acao = entrada('acao');
$u = exigir(array('Cliente'));

$r = consultar("SELECT c.id, c.titulo, c.status, c.tecnico_id, o.valor, t.nome AS tecnico,
    (SELECT COUNT(*) FROM pagamentos p WHERE p.chamado_id = c.id) AS pago
    FROM chamados c JOIN orcamentos o ON o.chamado_id = c.id AND o.status = 'Aceito' JOIN usuarios t ON t.id = c.tecnico_id
    WHERE c.id = ? AND c.cliente_id = ?", array(entrada('chamado_id'), $u['id']));
if (count($r) == 0) {
    erro('Nenhum pagamento disponível para este chamado.');
}
$c = $r[0];

$aviso = 'O pagamento só fica disponível depois que o técnico marcar o serviço como Concluído.';

if ($acao == 'resumo') {
    if ($c['pago'] == 0 && $c['status'] != 'Concluído') {
        erro($aviso);
    }
    responder(array('ok' => true, 'pagamento' => $c));
}

if ($acao == 'pagar') {
    if ($c['pago'] > 0) {
        erro('Este chamado já foi pago.');
    }
    if ($c['status'] != 'Concluído') {
        erro($aviso);
    }
    $numero = preg_replace('/\D/', '', entrada('numero_cartao'));
    if (strlen($numero) < 13 || strlen($numero) > 19) {
        erro('Número do cartão inválido.');
    }
    if (entrada('nome_cartao') == '') {
        erro('Informe o nome impresso no cartão.');
    }
    if (!preg_match('/^(0[1-9]|1[0-2])\/\d{2}$/', entrada('validade'))) {
        erro('Validade inválida. Use o formato MM/AA.');
    }
    if (!preg_match('/^\d{3,4}$/', entrada('cvv'))) {
        erro('CVV inválido.');
    }
    executar('INSERT INTO pagamentos (chamado_id, valor, metodo, final_cartao) VALUES (?, ?, ?, ?)', array($c['id'], $c['valor'], 'Cartão', substr($numero, -4)));
    executar("UPDATE chamados SET status = 'Pago' WHERE id = ?", array($c['id']));
    notificar($c['tecnico_id'], $u['id'], 'Pagamento confirmado', 'Pagamento do chamado #' . $c['id'] . ' foi confirmado');
    notificar($u['id'], null, 'Pagamento confirmado', 'Pagamento do chamado #' . $c['id'] . ' foi confirmado');
    responder(array('ok' => true));
}

erro('Ação inválida.');
