<?php
require 'conexao.php';
$u = usuario_logado();
if (!$u) {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

$foto = array();
if (isset($_GET['usuario'])) {
    $foto = consultar('SELECT foto, foto_tipo AS tipo FROM usuarios WHERE id = ? AND foto IS NOT NULL', array($_GET['usuario']));
} elseif (isset($_GET['chamado_foto'])) {
    $sql = 'SELECT f.foto, f.tipo FROM chamado_fotos f JOIN chamados c ON c.id = f.chamado_id WHERE f.id = ?';
    $params = array($_GET['chamado_foto']);
    if ($u['perfil'] == 'Cliente') {
        $sql .= ' AND c.cliente_id = ?';
        $params[] = $u['id'];
    }
    $foto = consultar($sql, $params);
}

if (count($foto) == 0) {
    header('HTTP/1.1 404 Not Found');
    exit;
}

header('Content-Type: ' . $foto[0]['tipo']);
header('Cache-Control: private, max-age=60');
header('Content-Length: ' . strlen($foto[0]['foto']));
echo $foto[0]['foto'];
