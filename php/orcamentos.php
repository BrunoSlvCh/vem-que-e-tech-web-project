<?php
require 'conexao.php';
$acao = entrada('acao');

if ($acao == 'enviar') {
    $u = exigir(array('Tecnico'));
    $id = entrada('chamado_id');
    $valor = str_replace(',', '.', entrada('valor'));
    $prazo = entrada('prazo');
    $obs = entrada('observacoes');
    $limite = 2;

    if (!is_numeric($valor) || $valor <= 0) {
        erro('Informe um valor válido.');
    }
    if ($prazo == '') {
        erro('Informe o prazo estimado.');
    }
    list($f, $p) = filtro_visivel($u);
    $c = consultar("SELECT c.id, c.cliente_id FROM chamados c WHERE c.id = ? AND c.status IN ('Pendente', 'Em análise') AND " . $f, array_merge(array($id), $p));
    if (count($c) == 0) {
        erro('Este chamado não está mais disponível.');
    }
    $q = consultar('SELECT COUNT(*) AS n FROM orcamentos WHERE chamado_id = ? AND tecnico_id = ?', array($id, $u['id']));
    if ($q[0]['n'] >= $limite) {
        erro('Você já atingiu o limite de ' . $limite . ' orçamentos para este chamado.');
    }
    executar("UPDATE orcamentos SET status = 'Substituído' WHERE chamado_id = ? AND tecnico_id = ? AND status = 'Aguardando'", array($id, $u['id']));
    executar('INSERT INTO orcamentos (chamado_id, tecnico_id, valor, prazo, observacoes) VALUES (?, ?, ?, ?, ?)', array($id, $u['id'], $valor, $prazo, $obs));
    executar("UPDATE chamados SET status = 'Em análise' WHERE id = ?", array($id));
    notificar($c[0]['cliente_id'], $u['id'], 'Orçamento recebido', $u['nome'] . ' enviou um orçamento para o chamado #' . $id);
    responder(array('ok' => true));
}

if ($acao == 'listar_tecnico') {
    $u = exigir(array('Tecnico', 'Admin'));
    $sql = "SELECT o.id, o.valor, o.criado_em, o.status AS orc_status, c.id AS chamado_id, c.titulo, c.status AS chamado_status, cli.id AS cliente_id, cli.nome AS cliente
        FROM orcamentos o JOIN chamados c ON c.id = o.chamado_id JOIN usuarios cli ON cli.id = c.cliente_id
        WHERE o.status <> 'Substituído'";
    if ($u['perfil'] == 'Admin') {
        $lista = consultar($sql . " ORDER BY o.id DESC");
    } else {
        $lista = consultar($sql . " AND o.tecnico_id = ? ORDER BY o.id DESC", array($u['id']));
    }
    foreach ($lista as $i => $o) {
        if ($o['orc_status'] == 'Aceito') {
            $lista[$i]['status'] = $o['chamado_status'];
        } elseif ($o['orc_status'] == 'Aguardando') {
            $lista[$i]['status'] = 'Aguardando';
        } else {
            $lista[$i]['status'] = 'Recusado';
        }
    }
    responder(array('ok' => true, 'orcamentos' => $lista));
}

if ($acao == 'listar_chamado') {
    $u = exigir(array('Cliente'));
    $id = entrada('chamado_id');
    $c = consultar('SELECT id, titulo FROM chamados WHERE id = ? AND cliente_id = ?', array($id, $u['id']));
    if (count($c) == 0) {
        erro('Chamado não encontrado.');
    }
    $lista = consultar("SELECT o.id, o.valor, o.prazo, o.observacoes, x.id AS tecnico_id, x.nome AS tecnico,
        (SELECT ROUND(AVG(a.nota), 1) FROM avaliacoes a WHERE a.tecnico_id = x.id) AS media,
        (SELECT COUNT(*) FROM chamados ch WHERE ch.tecnico_id = x.id AND ch.status IN ('Concluído', 'Pago')) AS servicos
        FROM orcamentos o JOIN usuarios x ON x.id = o.tecnico_id
        WHERE o.chamado_id = ? AND o.status = 'Aguardando' ORDER BY o.valor", array($id));
    responder(array('ok' => true, 'chamado' => $c[0], 'orcamentos' => $lista));
}

if ($acao == 'aceitar') {
    $u = exigir(array('Cliente'));
    $o = consultar("SELECT o.id, o.tecnico_id, o.chamado_id FROM orcamentos o JOIN chamados c ON c.id = o.chamado_id WHERE o.id = ? AND c.cliente_id = ? AND o.status = 'Aguardando' AND c.status = 'Em análise'", array(entrada('orcamento_id'), $u['id']));
    if (count($o) == 0) {
        erro('Orçamento indisponível.');
    }
    $o = $o[0];
    executar("UPDATE orcamentos SET status = 'Aceito' WHERE id = ?", array($o['id']));
    executar("UPDATE orcamentos SET status = 'Recusado' WHERE chamado_id = ? AND id <> ? AND status = 'Aguardando'", array($o['chamado_id'], $o['id']));
    executar("UPDATE chamados SET tecnico_id = ?, status = 'Aceito' WHERE id = ?", array($o['tecnico_id'], $o['chamado_id']));
    notificar($o['tecnico_id'], $u['id'], 'Orçamento aceito', $u['nome'] . ' aceitou seu orçamento no chamado #' . $o['chamado_id']);
    responder(array('ok' => true, 'chamado_id' => $o['chamado_id']));
}

if ($acao == 'recusar') {
    $u = exigir(array('Cliente'));
    $o = consultar("SELECT o.id, o.tecnico_id, o.chamado_id FROM orcamentos o JOIN chamados c ON c.id = o.chamado_id WHERE o.id = ? AND c.cliente_id = ? AND o.status = 'Aguardando'", array(entrada('orcamento_id'), $u['id']));
    if (count($o) == 0) {
        erro('Orçamento indisponível.');
    }
    $o = $o[0];
    executar("UPDATE orcamentos SET status = 'Recusado' WHERE id = ?", array($o['id']));
    reavaliar_chamado($o['chamado_id']);
    notificar($o['tecnico_id'], $u['id'], 'Orçamento recusado', $u['nome'] . ' recusou seu orçamento no chamado #' . $o['chamado_id']);
    $r = consultar("SELECT COUNT(*) AS n FROM orcamentos WHERE chamado_id = ? AND status = 'Aguardando'", array($o['chamado_id']));
    responder(array('ok' => true, 'restantes' => $r[0]['n']));
}

if ($acao == 'mudar_status') {
    $u = exigir(array('Tecnico'));
    $novo = entrada('status');
    $r = consultar('SELECT o.id, o.status, o.chamado_id, c.cliente_id, c.status AS chamado_status FROM orcamentos o JOIN chamados c ON c.id = o.chamado_id WHERE o.id = ? AND o.tecnico_id = ?', array(entrada('orcamento_id'), $u['id']));
    if (count($r) == 0) {
        erro('Orçamento não encontrado.');
    }
    $o = $r[0];

    if ($o['status'] == 'Aceito') {
        if ($o['chamado_status'] == 'Pago') {
            erro('Este chamado já foi pago e o status não pode mais ser alterado.');
        }
        $validos = array('Aceito', 'Em atendimento', 'Concluído', 'Pago', 'Cancelado');
        if (!in_array($novo, $validos)) {
            erro('Este orçamento já foi aceito. Escolha o andamento do serviço.');
        }
        $pago = consultar('SELECT id FROM pagamentos WHERE chamado_id = ?', array($o['chamado_id']));
        if ($novo == 'Pago' && count($pago) == 0) {
            erro('O cliente ainda não realizou o pagamento.');
        }
        if ($novo == 'Concluído' && count($pago) > 0) {
            $novo = 'Pago';
        }
        executar('UPDATE chamados SET status = ? WHERE id = ?', array($novo, $o['chamado_id']));
        if ($novo == 'Em atendimento') {
            notificar($o['cliente_id'], $u['id'], 'Atendimento iniciado', $u['nome'] . ' iniciou o atendimento do chamado #' . $o['chamado_id']);
        }
        if ($novo == 'Concluído') {
            notificar($o['cliente_id'], $u['id'], 'Chamado concluído', 'Seu chamado #' . $o['chamado_id'] . ' foi concluído. Já é possível realizar o pagamento.');
        }
        if ($novo == 'Cancelado') {
            notificar($o['cliente_id'], $u['id'], 'Chamado cancelado', 'Seu chamado #' . $o['chamado_id'] . ' foi cancelado pelo técnico');
        }
    } elseif ($o['status'] == 'Aguardando' && $novo == 'Recusado') {
        executar("UPDATE orcamentos SET status = 'Recusado' WHERE id = ?", array($o['id']));
        reavaliar_chamado($o['chamado_id']);
    } elseif ($o['status'] == 'Aguardando' && $novo == 'Aguardando') {
        responder(array('ok' => true));
    } else {
        erro('Este orçamento ainda não foi aceito pelo cliente ou já foi recusado.');
    }
    responder(array('ok' => true));
}

erro('Ação inválida.');
