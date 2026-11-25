<?php
require 'conexao.php';
$acao = entrada('acao');

if ($acao == 'dados') {
    $u = exigir(array('Tecnico', 'Admin'));
    $admin = $u['perfil'] == 'Admin';

    if ($admin) {
        $filtro = '1 = 1';
        $pf = array();
        $meu = '1 = 1';
        $pm = array();
    } else {
        list($filtro, $pf) = filtro_visivel($u);
        $meu = 'c.tecnico_id = ?';
        $pm = array($u['id']);
    }

    $a = consultar("SELECT COUNT(*) AS n FROM chamados c WHERE c.status IN ('Pendente', 'Em análise') AND " . $filtro, $pf);
    $b = consultar("SELECT COUNT(*) AS n FROM chamados c WHERE c.status IN ('Aceito', 'Em atendimento') AND " . $meu, $pm);
    $d = consultar("SELECT COUNT(*) AS n FROM chamados c WHERE c.status IN ('Concluído', 'Pago') AND YEAR(c.atualizado_em) = YEAR(CURDATE()) AND MONTH(c.atualizado_em) = MONTH(CURDATE()) AND " . $meu, $pm);
    $f = consultar("SELECT COALESCE(SUM(p.valor), 0) AS total FROM pagamentos p JOIN chamados c ON c.id = p.chamado_id WHERE " . $meu, $pm);

    $semanas = array();
    for ($i = 11; $i >= 0; $i--) {
        $s = consultar("SELECT COUNT(*) AS n FROM chamados c WHERE YEARWEEK(c.criado_em, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL " . $i . " WEEK), 1) AND " . $filtro, $pf);
        $semanas[] = (int) $s[0]['n'];
    }

    if ($admin) {
        $at = consultar('SELECT mensagem FROM notificacoes ORDER BY id DESC LIMIT 4');
    } else {
        $at = consultar('SELECT mensagem FROM notificacoes WHERE usuario_id = ? ORDER BY id DESC LIMIT 4', array($u['id']));
    }
    $atividades = array();
    foreach ($at as $x) {
        $atividades[] = $x['mensagem'];
    }

    $ultimos = consultar("SELECT c.id, c.titulo, c.status, cli.id AS cliente_id, cli.nome AS cliente, t.id AS tecnico_id, t.nome AS tecnico
        FROM chamados c JOIN usuarios cli ON cli.id = c.cliente_id LEFT JOIN usuarios t ON t.id = c.tecnico_id
        WHERE " . $filtro . " ORDER BY c.id DESC LIMIT 5", $pf);

    responder(array('ok' => true, 'pendentes' => $a[0]['n'], 'andamento' => $b[0]['n'], 'concluidos' => $d[0]['n'], 'faturamento' => $f[0]['total'], 'semanas' => $semanas, 'atividades' => $atividades, 'ultimos' => $ultimos));
}

erro('Ação inválida.');
