<?php
require 'conexao.php';
$acao = entrada('acao');

if ($acao == 'criar') {
    $u = exigir(array('Cliente'));
    $titulo = entrada('titulo');
    $modelo = entrada('modelo');
    $sistema = entrada('sistema');
    $descricao = entrada('descricao');
    $endereco = entrada('endereco');
    $destino = entrada('tecnico_destino');

    $c = consultar('SELECT id FROM categorias WHERE nome = ?', array(entrada('categoria')));
    if (count($c) == 0) {
        erro('Selecione uma categoria.');
    }
    if ($titulo == '' || $modelo == '' || $descricao == '' || $endereco == '') {
        erro('Preencha título, marca/modelo, descrição e endereço de atendimento.');
    }
    $categoria_id = $c[0]['id'];

    if ($destino != '') {
        $t = consultar("SELECT u.id FROM usuarios u JOIN perfis p ON p.id = u.perfil_id JOIN tecnico_categorias tc ON tc.tecnico_id = u.id WHERE u.id = ? AND p.nome = 'Tecnico' AND tc.categoria_id = ?", array($destino, $categoria_id));
        if (count($t) == 0) {
            erro('Este técnico não atende a categoria escolhida.');
        }
    } else {
        $destino = null;
    }

    $fotos = array();
    $arquivos = arquivos_enviados('fotos');
    if (count($arquivos) > 3) {
        erro('Envie no máximo 3 fotos do aparelho.');
    }
    foreach ($arquivos as $arquivo) {
        $fotos[] = ler_imagem($arquivo);
    }

    $id = executar('INSERT INTO chamados (cliente_id, tecnico_destino_id, categoria_id, titulo, modelo, sistema, descricao, endereco) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', array($u['id'], $destino, $categoria_id, $titulo, $modelo, $sistema, $descricao, $endereco));

    foreach ($fotos as $f) {
        executar('INSERT INTO chamado_fotos (chamado_id, foto, tipo) VALUES (?, ?, ?)', array($id, $f['dados'], $f['tipo']));
    }

    notificar($u['id'], null, 'Novo chamado registrado', 'Seu chamado #' . $id . ' foi registrado e está aguardando um técnico');

    if ($destino != null) {
        $tecnicos = array(array('id' => $destino));
    } else {
        $tecnicos = consultar("SELECT u.id FROM usuarios u JOIN perfis p ON p.id = u.perfil_id JOIN tecnico_categorias tc ON tc.tecnico_id = u.id WHERE p.nome = 'Tecnico' AND tc.categoria_id = ?", array($categoria_id));
    }
    foreach ($tecnicos as $t) {
        notificar($t['id'], $u['id'], 'Novo chamado aberto', $u['nome'] . ' abriu um novo chamado #' . $id . ' - ' . $titulo);
    }
    responder(array('ok' => true, 'id' => $id));
}

if ($acao == 'cancelar') {
    $u = exigir(array('Cliente'));
    $r = consultar('SELECT id, status, tecnico_destino_id FROM chamados WHERE id = ? AND cliente_id = ?', array(entrada('chamado_id'), $u['id']));
    if (count($r) == 0) {
        erro('Chamado não encontrado.');
    }
    $c = $r[0];
    if ($c['status'] == 'Cancelado') {
        erro('Este chamado já está cancelado.');
    }
    if ($c['status'] == 'Em análise') {
        erro('Um técnico já respondeu a este chamado com um orçamento. Veja o orçamento e decida se quer seguir com o serviço ou recusá-lo.');
    }
    if ($c['status'] != 'Pendente') {
        erro('Este chamado já foi aceito e não pode mais ser cancelado por aqui.');
    }
    executar("UPDATE chamados SET status = 'Cancelado' WHERE id = ? AND status = 'Pendente'", array($c['id']));
    $depois = consultar('SELECT status FROM chamados WHERE id = ?', array($c['id']));
    if ($depois[0]['status'] != 'Cancelado') {
        erro('Um técnico respondeu a este chamado agora há pouco. Veja o orçamento e decida se quer seguir com o serviço.');
    }
    if ($c['tecnico_destino_id'] != null) {
        notificar($c['tecnico_destino_id'], $u['id'], 'Chamado cancelado', $u['nome'] . ' cancelou o chamado #' . $c['id']);
    }
    responder(array('ok' => true));
}

if ($acao == 'resumo_lateral') {
    $u = exigir(array('Cliente', 'Tecnico', 'Admin'));
    if ($u['perfil'] == 'Cliente') {
        $r = consultar("SELECT COALESCE(SUM(status = 'Pendente'), 0) AS a, COALESCE(SUM(status = 'Em análise'), 0) AS b, COALESCE(SUM(status IN ('Aceito', 'Em atendimento')), 0) AS d, COALESCE(SUM(status = 'Concluído'), 0) AS e FROM chamados WHERE cliente_id = ?", array($u['id']));
        $r = $r[0];
        responder(array('ok' => true, 'titulo' => 'Seus chamados', 'itens' => array(
            array('rotulo' => 'Aguardando técnico', 'valor' => (int) $r['a'], 'link' => 'cliente-inicio.html'),
            array('rotulo' => 'Orçamento para ver', 'valor' => (int) $r['b'], 'link' => 'cliente-inicio.html'),
            array('rotulo' => 'Em andamento', 'valor' => (int) $r['d'], 'link' => 'cliente-inicio.html'),
            array('rotulo' => 'Para pagar', 'valor' => (int) $r['e'], 'link' => 'cliente-inicio.html')
        )));
    }
    if ($u['perfil'] == 'Tecnico') {
        list($f, $p) = filtro_visivel($u);
        $a = consultar("SELECT COUNT(*) AS n FROM chamados c WHERE c.status IN ('Pendente', 'Em análise') AND " . $f . " AND NOT EXISTS (SELECT 1 FROM orcamentos o WHERE o.chamado_id = c.id AND o.tecnico_id = ? AND o.status = 'Aguardando')", array_merge($p, array($u['id'])));
        $b = consultar("SELECT COUNT(*) AS n FROM orcamentos WHERE tecnico_id = ? AND status = 'Aguardando'", array($u['id']));
        $d = consultar("SELECT COUNT(*) AS n FROM chamados WHERE tecnico_id = ? AND status IN ('Aceito', 'Em atendimento')", array($u['id']));
        responder(array('ok' => true, 'titulo' => 'Seu resumo', 'itens' => array(
            array('rotulo' => 'Disponíveis para você', 'valor' => (int) $a[0]['n'], 'link' => 'chamados-tecnico.html'),
            array('rotulo' => 'Aguardando cliente', 'valor' => (int) $b[0]['n'], 'link' => 'orcamentos.html'),
            array('rotulo' => 'Em andamento', 'valor' => (int) $d[0]['n'], 'link' => 'orcamentos.html')
        )));
    }
    $a = consultar("SELECT COUNT(*) AS n FROM chamados WHERE status IN ('Pendente', 'Em análise')");
    $d = consultar("SELECT COUNT(*) AS n FROM chamados WHERE status IN ('Aceito', 'Em atendimento')");
    responder(array('ok' => true, 'titulo' => 'Resumo geral', 'itens' => array(
        array('rotulo' => 'Chamados abertos', 'valor' => (int) $a[0]['n'], 'link' => 'chamados-tecnico.html'),
        array('rotulo' => 'Em andamento', 'valor' => (int) $d[0]['n'], 'link' => 'orcamentos.html')
    )));
}

if ($acao == 'listar_cliente') {
    $u = exigir(array('Cliente'));
    $lista = consultar("SELECT c.id, c.titulo, c.descricao, c.status, c.criado_em, cat.nome AS categoria,
        t.id AS tecnico_id, t.nome AS tecnico_nome,
        (SELECT COUNT(*) FROM orcamentos o WHERE o.chamado_id = c.id AND o.status = 'Aguardando') AS orcamentos,
        (SELECT x.id FROM orcamentos o JOIN usuarios x ON x.id = o.tecnico_id WHERE o.chamado_id = c.id AND o.status = 'Aguardando' ORDER BY o.id DESC LIMIT 1) AS orc_tecnico_id,
        (SELECT x.nome FROM orcamentos o JOIN usuarios x ON x.id = o.tecnico_id WHERE o.chamado_id = c.id AND o.status = 'Aguardando' ORDER BY o.id DESC LIMIT 1) AS orc_tecnico,
        (SELECT COUNT(*) FROM pagamentos p WHERE p.chamado_id = c.id) AS pago,
        (SELECT a.nota FROM avaliacoes a WHERE a.chamado_id = c.id) AS nota,
        (SELECT ROUND(AVG(a2.nota), 1) FROM avaliacoes a2 WHERE a2.tecnico_id = c.tecnico_id) AS media,
        (SELECT GROUP_CONCAT(f.id) FROM chamado_fotos f WHERE f.chamado_id = c.id) AS fotos
        FROM chamados c JOIN categorias cat ON cat.id = c.categoria_id LEFT JOIN usuarios t ON t.id = c.tecnico_id
        WHERE c.cliente_id = ? ORDER BY c.id DESC", array($u['id']));
    responder(array('ok' => true, 'chamados' => $lista));
}

if ($acao == 'listar_tecnico') {
    $u = exigir(array('Tecnico', 'Admin'));
    $colunas = "c.id, c.titulo, c.modelo, c.sistema, c.descricao, c.endereco, c.status, c.criado_em, cat.nome AS categoria, cli.id AS cliente_id, cli.nome AS cliente, (SELECT GROUP_CONCAT(f.id) FROM chamado_fotos f WHERE f.chamado_id = c.id) AS fotos";
    $base = " FROM chamados c JOIN categorias cat ON cat.id = c.categoria_id JOIN usuarios cli ON cli.id = c.cliente_id WHERE c.status IN ('Pendente', 'Em análise')";
    if ($u['perfil'] == 'Admin') {
        $lista = consultar("SELECT " . $colunas . ", 0 AS enviado" . $base . " ORDER BY c.id DESC");
    } else {
        list($f, $p) = filtro_visivel($u);
        $lista = consultar("SELECT " . $colunas . ", (SELECT COUNT(*) FROM orcamentos o WHERE o.chamado_id = c.id AND o.tecnico_id = ? AND o.status = 'Aguardando') AS enviado" . $base . " AND " . $f . " ORDER BY c.id DESC", array_merge(array($u['id']), $p));
    }
    responder(array('ok' => true, 'chamados' => $lista));
}

if ($acao == 'recusar') {
    $u = exigir(array('Tecnico'));
    $id = entrada('chamado_id');
    list($f, $p) = filtro_visivel($u);
    $c = consultar("SELECT c.id, c.tecnico_destino_id FROM chamados c WHERE c.id = ? AND c.status IN ('Pendente', 'Em análise') AND " . $f, array_merge(array($id), $p));
    if (count($c) == 0) {
        erro('Chamado indisponível.');
    }
    executar('INSERT IGNORE INTO chamados_recusados (chamado_id, tecnico_id) VALUES (?, ?)', array($id, $u['id']));
    if ($c[0]['tecnico_destino_id'] == $u['id']) {
        executar('UPDATE chamados SET tecnico_destino_id = NULL WHERE id = ?', array($id));
    }
    executar("UPDATE orcamentos SET status = 'Recusado' WHERE chamado_id = ? AND tecnico_id = ? AND status = 'Aguardando'", array($id, $u['id']));
    reavaliar_chamado($id);
    responder(array('ok' => true));
}

erro('Ação inválida.');
