<?php
header('Content-Type: text/html; charset=utf-8');
$paginas = array('login', 'abrir-chamado', 'chamados-tecnico', 'cliente-config', 'cliente-inicio', 'cliente-notificacoes', 'cliente-orcamento', 'cliente-pagamento', 'configuracoes', 'dashboard', 'notificacoes', 'orcamentos', 'tecnicos');
$linha = '<script src="js/app.js"></script>';
foreach ($paginas as $p) {
    $caminho = __DIR__ . '/' . $p . '.html';
    if (!file_exists($caminho)) {
        echo $p . '.html não encontrado<br>';
        continue;
    }
    $html = file_get_contents($caminho);
    if (strpos($html, $linha) !== false) {
        echo $p . '.html já estava pronto<br>';
        continue;
    }
    file_put_contents($caminho, str_replace('</body>', $linha . "\n</body>", $html));
    echo $p . '.html pronto<br>';
}
