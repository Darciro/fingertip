<?php

/*
 * Diagnóstico para hospedagem compartilhada.
 * Envie para a raiz da app (ao lado do index.php), acesse /server-check.php
 * no navegador e APAGUE o arquivo em seguida.
 */

header('Content-Type: text/plain; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', '1');

$base = __DIR__;
$ok = fn (bool $c) => $c ? '[OK]  ' : '[FALHA]';

echo "PHP\n";
echo $ok(PHP_VERSION_ID >= 80300).' versão '.PHP_VERSION." (precisa >= 8.3)\n";
echo '        SAPI: '.PHP_SAPI.' | usuário: '.(function_exists('get_current_user') ? get_current_user() : '?')."\n\n";

echo "Extensões\n";
foreach (['pdo', 'pdo_pgsql', 'pgsql', 'mbstring', 'openssl', 'tokenizer', 'xml', 'ctype', 'fileinfo', 'bcmath', 'curl', 'intl'] as $ext) {
    echo $ok(extension_loaded($ext))." $ext\n";
}

echo "\nArquivos e permissões\n";
foreach (['.env', 'vendor/autoload.php', 'bootstrap/app.php', 'build/manifest.json'] as $f) {
    echo $ok(is_file("$base/$f"))." existe $f\n";
}
foreach (['storage', 'storage/logs', 'storage/framework/cache/data', 'storage/framework/sessions', 'storage/framework/views', 'bootstrap/cache'] as $d) {
    echo $ok(is_dir("$base/$d") && is_writable("$base/$d"))." gravável $d\n";
}

echo "\nBanco de dados\n";
$env = is_file("$base/.env") ? (parse_ini_file("$base/.env", false, INI_SCANNER_RAW) ?: []) : [];
$url = trim($env['DB_URL'] ?? $env['DATABASE_URL_UNPOOLED'] ?? $env['DATABASE_URL'] ?? '', "\"'");
if ($url === '') {
    echo "[FALHA] nenhuma DB_URL / DATABASE_URL no .env\n";
} else {
    $p = parse_url($url);
    $host = $p['host'] ?? '';
    $port = $p['port'] ?? 5432;
    echo "        host: $host:$port\n";

    $sock = @fsockopen($host, $port, $errno, $errstr, 5);
    echo $ok((bool) $sock).' conexão TCP de saída'.($sock ? '' : " ($errno $errstr)")."\n";
    $sock && fclose($sock);

    if (extension_loaded('pdo_pgsql')) {
        parse_str($p['query'] ?? '', $q);
        $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s;sslmode=%s', $host, $port, ltrim($p['path'] ?? '', '/'), $q['sslmode'] ?? 'require');
        if (str_ends_with($host, '.neon.tech')) {
            // Igual ao App\Database\NeonPostgresConnector (libpq sem SNI).
            $dsn .= ";options='endpoint=".strstr($host, '.', true)."'";
        }
        try {
            $pdo = new PDO($dsn, urldecode($p['user'] ?? ''), urldecode($p['pass'] ?? ''), [PDO::ATTR_TIMEOUT => 5]);
            echo "[OK]   login no banco\n";
            $tables = $pdo->query("select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('sessions', 'cache', 'users', 'migrations')")->fetchColumn();
            echo $ok($tables == 4)." tabelas sessions/cache/users/migrations ($tables de 4)\n";
        } catch (Throwable $e) {
            echo '[FALHA] login no banco: '.$e->getMessage()."\n";
        }
    }
}

echo "\nÚltimo erro do Laravel (storage/logs/laravel.log)\n";
$log = "$base/storage/logs/laravel.log";
if (is_file($log)) {
    $lines = file($log);
    $last = array_values(preg_grep('/^\[\d{4}-\d{2}-\d{2}/', $lines));
    echo substr(end($last) ?: '(vazio)', 0, 1500)."\n";
} else {
    echo "(sem log: o erro aconteceu antes do Laravel iniciar, ou storage/logs não é gravável)\n";
}
