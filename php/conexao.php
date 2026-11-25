<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!defined('JSON_UNESCAPED_UNICODE')) {
    define('JSON_UNESCAPED_UNICODE', 0);
}

if (!function_exists('password_hash')) {
    define('PASSWORD_DEFAULT', 1);
    function password_hash($senha, $algoritmo) {
        $sal = substr(strtr(base64_encode(md5(uniqid(mt_rand(), true), true)), '+', '.'), 0, 22);
        return crypt($senha, '$2y$10$' . $sal);
    }
    function password_verify($senha, $hash) {
        return crypt($senha, $hash) === $hash;
    }
}

mysqli_report(MYSQLI_REPORT_OFF);
$db = new mysqli('127.0.0.1', 'root', 'usbw', 'vqt', 3307);
if ($db->connect_error) {
    echo json_encode(array('ok' => false, 'erro' => 'Não foi possível conectar ao banco de dados.'));
    exit;
}
$db->set_charset('utf8mb4');

function responder($dados) {
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

function erro($mensagem) {
    responder(array('ok' => false, 'erro' => $mensagem));
}

function preparar($sql, $params) {
    global $db;
    $st = $db->prepare($sql);
    if (!$st) {
        erro('Erro no banco: ' . $db->error);
    }
    if (count($params) > 0) {
        $refs = array(str_repeat('s', count($params)));
        foreach ($params as $i => $v) {
            $refs[] = &$params[$i];
        }
        call_user_func_array(array($st, 'bind_param'), $refs);
    }
    if (!$st->execute()) {
        erro('Erro no banco: ' . $st->error);
    }
    return $st;
}

function consultar($sql, $params = array()) {
    $st = preparar($sql, $params);
    $res = $st->get_result();
    $linhas = array();
    while ($l = $res->fetch_assoc()) {
        $linhas[] = $l;
    }
    $st->close();
    return $linhas;
}

function executar($sql, $params = array()) {
    global $db;
    $st = preparar($sql, $params);
    $id = $db->insert_id;
    $st->close();
    return $id;
}

function entrada($campo) {
    return isset($_POST[$campo]) && !is_array($_POST[$campo]) ? trim($_POST[$campo]) : '';
}

function usuario_logado() {
    if (!isset($_SESSION['usuario_id'])) {
        return null;
    }
    $r = consultar('SELECT u.id, u.nome, u.email, u.telefone, (u.foto IS NOT NULL) AS tem_foto, p.nome AS perfil FROM usuarios u JOIN perfis p ON p.id = u.perfil_id WHERE u.id = ?', array($_SESSION['usuario_id']));
    return count($r) > 0 ? $r[0] : null;
}

function exigir($perfis) {
    $u = usuario_logado();
    if (!$u) {
        responder(array('ok' => false, 'sessao' => false, 'erro' => 'Sessão expirada. Faça login novamente.'));
    }
    if (!in_array($u['perfil'], $perfis)) {
        erro('Você não tem permissão para isso.');
    }
    return $u;
}

function notificar($usuario_id, $origem_id, $titulo, $mensagem) {
    executar('INSERT INTO notificacoes (usuario_id, origem_id, titulo, mensagem) VALUES (?, ?, ?, ?)', array($usuario_id, $origem_id, $titulo, $mensagem));
}

function filtro_visivel($u) {
    $sql = "(c.tecnico_id = ? OR (c.tecnico_id IS NULL AND (c.tecnico_destino_id IS NULL OR c.tecnico_destino_id = ?) AND c.categoria_id IN (SELECT categoria_id FROM tecnico_categorias WHERE tecnico_id = ?) AND c.id NOT IN (SELECT chamado_id FROM chamados_recusados WHERE tecnico_id = ?)))";
    return array($sql, array($u['id'], $u['id'], $u['id'], $u['id']));
}

function reavaliar_chamado($chamado_id) {
    $r = consultar("SELECT COUNT(*) AS n FROM orcamentos WHERE chamado_id = ? AND status = 'Aguardando'", array($chamado_id));
    if ($r[0]['n'] == 0) {
        executar("UPDATE chamados SET status = 'Pendente' WHERE id = ? AND status = 'Em análise'", array($chamado_id));
    }
}

function telefone_valido($texto) {
    $n = preg_replace('/\D/', '', $texto);
    if (strlen($n) > 11 && substr($n, 0, 2) == '55') {
        $n = substr($n, 2);
    }
    if (strlen($n) != 10 && strlen($n) != 11) {
        return false;
    }
    if ((int) substr($n, 0, 2) < 11) {
        return false;
    }
    if (strlen($n) == 11 && substr($n, 2, 1) != '9') {
        return false;
    }
    return $n;
}

function arquivos_enviados($nome) {
    $lista = array();
    if (!isset($_FILES[$nome])) {
        return $lista;
    }
    $f = $_FILES[$nome];
    if (!is_array($f['name'])) {
        if ($f['error'] != UPLOAD_ERR_NO_FILE) {
            $lista[] = $f;
        }
        return $lista;
    }
    foreach ($f['name'] as $i => $n) {
        if ($f['error'][$i] == UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $lista[] = array('name' => $n, 'tmp_name' => $f['tmp_name'][$i], 'error' => $f['error'][$i], 'size' => $f['size'][$i]);
    }
    return $lista;
}

function ler_imagem($arquivo) {
    if ($arquivo['error'] == UPLOAD_ERR_INI_SIZE || $arquivo['error'] == UPLOAD_ERR_FORM_SIZE || $arquivo['size'] > 2 * 1024 * 1024) {
        erro('A imagem é muito grande. Use uma imagem de até 2 MB.');
    }
    if ($arquivo['error'] != UPLOAD_ERR_OK) {
        erro('Não foi possível enviar a imagem. Tente novamente.');
    }
    $info = @getimagesize($arquivo['tmp_name']);
    if (!$info || !in_array($info['mime'], array('image/jpeg', 'image/png', 'image/gif', 'image/webp'))) {
        erro('Envie uma imagem nos formatos JPG, PNG, GIF ou WEBP.');
    }
    return array('tipo' => $info['mime'], 'dados' => file_get_contents($arquivo['tmp_name']));
}

function ids_das_areas() {
    $nomes = isset($_POST['areas']) && is_array($_POST['areas']) ? $_POST['areas'] : array();
    $ids = array();
    foreach ($nomes as $nome) {
        $c = consultar('SELECT id FROM categorias WHERE nome = ?', array($nome));
        if (count($c) > 0 && !in_array($c[0]['id'], $ids)) {
            $ids[] = $c[0]['id'];
        }
    }
    return $ids;
}
