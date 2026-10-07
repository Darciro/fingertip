#!/usr/bin/env bash
#
# Empacota a aplicação para hospedagem compartilhada (sem SSH/artisan/composer no servidor).
#
# Uso:
#   composer deploy:package
#
# Saída: .deploy/<app>.zip, com tudo na raiz do zip. O conteúdo de public/ é movido
# para a raiz (index.php, .htaccess, build/...) e o .htaccess bloqueia o acesso
# web ao código, ao .env, ao vendor/ e ao storage/. Extraia direto na pasta servida
# pelo domínio/subdomínio (ex.: public_html/fingertip).
#
# Se existir um arquivo .env.production na raiz, ele é enviado como .env.
# Caso contrário, é gerado um .env de produção a partir do .env.example (edite antes de enviar).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="$(basename "$ROOT")"
OUT="$ROOT/.deploy"
STAGE="$OUT/$APP_NAME"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

cd "$ROOT"

step "Limpando $OUT"
rm -rf "$OUT"
mkdir -p "$STAGE"

step "Instalando dependências JS e gerando build de produção"
npm ci
npm run build
rm -f public/hot

step "Copiando arquivos da aplicação"
rsync -a \
    --exclude='/.deploy/' \
    --exclude='/.git*' \
    --exclude='/.github/' \
    --exclude='/.claude/' \
    --exclude='/.neon' \
    --exclude='/.vscode/' \
    --exclude='/.idea/' \
    --exclude='/node_modules/' \
    --exclude='/vendor/' \
    --exclude='/tests/' \
    --exclude='/layout/' \
    --exclude='/scripts/' \
    --exclude='/.env' \
    --exclude='/.env.*' \
    --exclude='/.phpunit.cache/' \
    --exclude='/phpunit.xml' \
    --exclude='/phpstan.neon' \
    --exclude='/pint.json' \
    --exclude='/.editorconfig' \
    --exclude='/.npmrc' \
    --exclude='/package*.json' \
    --exclude='/pnpm-workspace.yaml' \
    --exclude='/tsconfig.json' \
    --exclude='/vite.config.ts' \
    --exclude='/neon.ts' \
    --exclude='/skills-lock.json' \
    --exclude='/public/hot' \
    --exclude='/public/storage' \
    --exclude='/public/fonts-manifest.dev.json' \
    --exclude='/bootstrap/cache/*.php' \
    --exclude='/storage/logs/*.log' \
    --exclude='/storage/pail/' \
    --exclude='/storage/framework/cache/data/*' \
    --exclude='/storage/framework/sessions/*' \
    --exclude='/storage/framework/views/*' \
    --exclude='/storage/framework/testing/' \
    --exclude='/database/*.sqlite' \
    --exclude='/AGENTS.md' \
    --exclude='/CLAUDE.md' \
    --exclude='/boost.json' \
    --exclude='/.mcp.json' \
    --exclude='.DS_Store' \
    ./ "$STAGE/"

step "Instalando dependências PHP de produção (--no-dev)"
(cd "$STAGE" && composer install --no-dev --optimize-autoloader --no-interaction --no-progress)

step "Preparando .env de produção"
if [[ -f "$ROOT/.env.production" ]]; then
    cp "$ROOT/.env.production" "$STAGE/.env"
    echo "Usando .env.production"
else
    APP_KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
    sed \
        -e "s|^APP_ENV=.*|APP_ENV=production|" \
        -e "s|^APP_DEBUG=.*|APP_DEBUG=false|" \
        -e "s|^APP_KEY=.*|APP_KEY=$APP_KEY|" \
        -e "s|^APP_URL=.*|APP_URL=https://seu-dominio.com.br|" \
        -e "s|^LOG_LEVEL=.*|LOG_LEVEL=error|" \
        -e "s|^QUEUE_CONNECTION=.*|QUEUE_CONNECTION=sync|" \
        "$ROOT/.env.example" > "$STAGE/.env"
    echo "AVISO: .env.production não encontrado. Gerado $STAGE/.env com APP_KEY novo."
    echo "       Edite APP_URL e as credenciais do banco antes de enviar."
fi

step "Garantindo pastas graváveis (storage/ e bootstrap/cache/)"
mkdir -p \
    "$STAGE/storage/app/public" \
    "$STAGE/storage/app/private" \
    "$STAGE/storage/framework/cache/data" \
    "$STAGE/storage/framework/sessions" \
    "$STAGE/storage/framework/views" \
    "$STAGE/storage/logs" \
    "$STAGE/bootstrap/cache"
chmod -R 775 "$STAGE/storage" "$STAGE/bootstrap/cache"

step "Movendo o conteúdo de public/ para a raiz"
rsync -a --exclude='/index.php' --exclude='/.htaccess' "$STAGE/public/" "$STAGE/"
rm -rf "$STAGE/public"

cat > "$STAGE/index.php" <<'PHP'
<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/bootstrap/app.php';

// A pasta pública é a própria raiz (não há public/ no servidor).
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
PHP

cat > "$STAGE/.htaccess" <<'HTACCESS'
Options -Indexes

<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews
    </IfModule>

    RewriteEngine On

    # Bloqueia arquivos ocultos (.env, .git, .htaccess...), exceto .well-known
    RewriteRule (^|/)\.(?!well-known/) - [F,L]

    # Bloqueia código da aplicação e arquivos internos
    RewriteRule ^(app|bootstrap|config|database|lang|resources|routes|vendor)(/|$) - [F,L]
    RewriteRule ^(artisan|composer\.(json|lock))$ - [F,L]

    # storage/: só storage/app/public é acessível, via /storage/... (equivalente ao storage:link)
    RewriteRule ^storage/app/public/ - [L]
    RewriteRule ^storage/(.*)$ storage/app/public/$1 [L]

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Handle X-XSRF-Token Header
    RewriteCond %{HTTP:x-xsrf-token} .
    RewriteRule .* - [E=HTTP_X_XSRF_TOKEN:%{HTTP:X-XSRF-Token}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
HTACCESS

step "Compactando"
(cd "$STAGE" && zip -qry "$OUT/$APP_NAME.zip" .)

step "Pronto: $OUT/$APP_NAME.zip"
cat <<EOF

Próximos passos no servidor:
  1. Extraia o zip direto na pasta servida (ex.: public_html/$APP_NAME/).
     Confira se os arquivos ocultos .env e .htaccess foram extraídos.
  2. Confira o .env: APP_URL deve ser a URL exata da app (com /$APP_NAME no fim
     se ela for acessada como subpasta) e as credenciais do banco.
  3. Garanta permissão de escrita em storage/ e bootstrap/cache/ (775).
  4. Banco: sem artisan no servidor, rode as migrations localmente apontando para
     o banco de produção, ou exporte/importe via phpMyAdmin/phpPgAdmin.
  5. Teste se https://.../.env e https://.../vendor/autoload.php retornam 403.
  6. Scheduler/filas: Cron Job do painel com 'php artisan schedule:run' se o host
     permitir; caso contrário mantenha QUEUE_CONNECTION=sync.
EOF
