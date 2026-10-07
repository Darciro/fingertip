# Fingertip

Controle financeiro pessoal: registre receitas e despesas, marque o que já foi pago ou recebido e acompanhe o mês num dashboard.

## Funcionalidades

- **Despesas** com descrição, valor, data, categoria (moradia, alimentação, transporte, saúde, lazer, outros) e status pago/pendente.
- **Receitas** com as mesmas informações e categorias próprias (salário, freelance, investimentos, outras).
- **Dashboard** com os lançamentos dos últimos 6 meses e o orçamento mensal de despesas (R$ 4.500, definido em `App\Http\Controllers\DashboardController::BUDGET`).

## Stack

| Camada    | Tecnologia                                                  |
| --------- | ----------------------------------------------------------- |
| Back-end  | PHP 8.3+, Laravel 13                                        |
| Front-end | React 19, TypeScript, Inertia.js 3, Tailwind CSS 4          |
| Build     | Vite 8 (via `vite-plus`), Laravel Wayfinder (rotas tipadas) |
| Banco     | PostgreSQL no [Neon](https://neon.com)                      |
| Testes    | Pest 4, PHPStan (Larastan), Pint                            |

### Estrutura principal

```
app/
├── Database/NeonPostgresConnector.php   # conexão com o Neon em servidores sem SNI (ver "Deploy")
├── Enums/                               # categorias de receitas e despesas
├── Http/Controllers/                    # Dashboard, Expense, Income
└── Models/                              # Expense, Income, User
resources/js/pages/dashboard.tsx         # tela principal (Inertia + React)
routes/web.php                           # rotas da aplicação
scripts/
├── deploy-package.sh                    # gera o pacote para hospedagem compartilhada
└── server-check.php                     # diagnóstico do servidor
```

## Executando localmente

### Pré-requisitos

- PHP 8.3+ com as extensões `pdo_pgsql`, `mbstring`, `openssl`, `intl`, `bcmath`
- Composer 2
- Node.js 22+ e npm
- Um banco PostgreSQL (um branch do Neon ou um Postgres local)

### Instalação

```bash
composer setup
```

Esse comando instala as dependências PHP e JS, cria o `.env` a partir do `.env.example`, gera a `APP_KEY`, roda as migrations e faz o build do front-end.

Antes das migrations, configure a conexão com o banco no `.env`:

```dotenv
DB_CONNECTION=pgsql
DATABASE_URL_UNPOOLED="postgresql://usuario:senha@ep-xxxx.region.aws.neon.tech/banco?sslmode=require"
```

Para um Postgres local, use `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` no lugar da URL.

Se o `composer setup` falhar nas migrations por falta de banco, ajuste o `.env` e rode:

```bash
php artisan migrate
```

### Ambiente de desenvolvimento

```bash
composer dev
```

Sobe o servidor PHP e o Vite com hot reload. A aplicação fica disponível na URL definida em `APP_URL`.

### Qualidade de código

| Comando               | O que faz                                          |
| --------------------- | -------------------------------------------------- |
| `composer test`       | Pint (checagem), PHPStan e testes Pest             |
| `composer lint`       | Formata o código PHP com Pint                      |
| `composer types:check`| Análise estática com PHPStan                       |
| `npm run check`       | Lint e formatação do front-end                     |
| `npm run types:check` | Checagem de tipos TypeScript                       |
| `composer ci:check`   | Tudo acima de uma vez                              |

## Deploy em hospedagem compartilhada

O projeto pode rodar em hospedagem compartilhada **sem SSH, sem `artisan` e sem `composer` no servidor**. Tudo é preparado localmente pelo comando:

```bash
composer deploy:package
```

O resultado é o arquivo `.deploy/fingertip.zip`, com a aplicação completa na raiz do zip, pronta para extrair na pasta servida pelo domínio (por exemplo, `public_html/fingertip/`).

### Antes de gerar: `.env.production`

Crie um arquivo `.env.production` na raiz do projeto com a configuração de produção. Ele já está no `.gitignore` e é copiado para o pacote como `.env`.

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...                 # gere com: php artisan key:generate --show
APP_URL=https://seu-dominio.com.br # URL exata pela qual a app é acessada
LOG_LEVEL=error
QUEUE_CONNECTION=sync              # sem worker de filas no servidor
DB_CONNECTION=pgsql
DATABASE_URL_UNPOOLED="postgresql://..."
```

Se o arquivo não existir, o script gera um `.env` a partir do `.env.example` com `APP_KEY` novo e valores de produção. Nesse caso, edite `.deploy/fingertip/.env` (URL e banco) e compacte de novo, ou crie o `.env.production` e rode o comando outra vez.

### O que o script faz

O comando chama `scripts/deploy-package.sh`, que trabalha numa cópia em `.deploy/` e **não altera** o `vendor/` nem o `node_modules/` do projeto.

1. **Limpa** a pasta `.deploy/`.
2. **Build do front-end**: `npm ci` e `npm run build`. Remove o `public/hot` para a app não procurar o servidor do Vite.
3. **Copia a aplicação** para `.deploy/fingertip/`, deixando de fora o que não vai para produção: `node_modules/`, `.git*`, `tests/`, `scripts/`, `.env*`, configurações de editor e de ferramentas (Pint, PHPStan, TypeScript, Vite), logs, sessões e views compiladas.
4. **Instala as dependências PHP de produção** na cópia: `composer install --no-dev --optimize-autoloader`.
5. **Prepara o `.env`** a partir do `.env.production`, ou gera um como descrito acima.
6. **Cria as pastas graváveis** de `storage/` e `bootstrap/cache/` com permissão 775.
7. **Move o conteúdo de `public/` para a raiz**, porque a hospedagem não permite apontar o domínio para `public/`:
   - `build/`, favicons e `robots.txt` vão para a raiz;
   - um `index.php` novo carrega `vendor/` e `bootstrap/` da mesma pasta e define a raiz como pasta pública (`usePublicPath`);
   - um `.htaccess` novo mantém as regras do Laravel e **bloqueia o acesso web** a arquivos ocultos (`.env`), às pastas `app/`, `bootstrap/`, `config/`, `database/`, `lang/`, `resources/`, `routes/` e `vendor/`, e a `artisan` e `composer.*`;
   - `storage/` só serve `storage/app/public`, pela URL `/storage/...`. Isso substitui o `php artisan storage:link`.
8. **Compacta** tudo em `.deploy/fingertip.zip`.

### Publicando manualmente

1. Envie o `fingertip.zip` pelo gerenciador de arquivos e extraia na pasta do domínio.
2. Confira se os arquivos ocultos `.env` e `.htaccess` foram extraídos.
3. No painel, selecione **PHP 8.3+** e ative as extensões **`pdo_pgsql`** e **`pgsql`**.
4. **Migrations**: como não há `artisan` no servidor, rode da sua máquina apontando para o banco de produção:
   ```bash
   php artisan migrate --force --env=production
   ```
   (O `--env=production` faz o Laravel ler o `.env.production`.)
5. Acesse o site e confirme que `https://seu-dominio/.env` e `https://seu-dominio/vendor/autoload.php` retornam **403**.
6. **Apague o `fingertip.zip` do servidor**, porque ele contém o `.env`.

Para atualizar a aplicação, gere o pacote de novo e extraia por cima. Se houver migrations novas, rode o passo 4.

### Deploy automático (GitHub Actions + SSH)

O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) publica a aplicação automaticamente a cada commit na `main`, **depois que o workflow `tests` passa**. Também pode ser disparado manualmente em *Actions → deploy → Run workflow*.

O que ele faz:

1. Instala PHP 8.3, Composer e Node 22 e roda `composer install`. O build do Vite precisa do `vendor/` completo para gerar as rotas do Wayfinder.
2. Grava o `.env.production` a partir do secret `ENV_PRODUCTION` e roda `composer deploy:package`.
3. Envia o `fingertip.zip` por `scp` para `~/.deploy/` no servidor.
4. No servidor, via SSH:
   - extrai o pacote numa pasta temporária;
   - atualiza a app com `rsync --delete`. Arquivos que saíram do pacote são removidos, e o `storage/` (logs, sessões, uploads) é preservado, só ganhando as pastas que faltarem;
   - roda `php artisan migrate --force` e `php artisan optimize`;
   - apaga o zip e a pasta temporária.

#### Configuração no GitHub

Em *Settings → Environments*, crie o ambiente **`production`** e cadastre:

| Tipo     | Nome              | Valor                                                                                   |
| -------- | ----------------- | --------------------------------------------------------------------------------------- |
| Secret   | `SSH_HOST`        | IP ou host SSH da Hostinger (hPanel → *Avançado → Acesso SSH*)                          |
| Secret   | `SSH_PORT`        | Porta SSH (padrão da Hostinger: `65002`)                                                |
| Secret   | `SSH_USER`        | Usuário SSH (ex.: `u134515347`)                                                         |
| Secret   | `SSH_KEY`         | Chave **privada** de deploy (veja abaixo)                                               |
| Secret   | `SSH_KNOWN_HOSTS` | Saída de `ssh-keyscan -p 65002 <host>`. Opcional, mas recomendado                       |
| Secret   | `ENV_PRODUCTION`  | Conteúdo completo do `.env.production`                                                  |
| Variable | `DEPLOY_PATH`     | Pasta da app relativa à home. Padrão: `domains/rickmanu.dev/public_html/fingertip`      |
| Variable | `PHP_BIN`         | PHP de linha de comando no servidor. Padrão: `php`                                      |

Para criar a chave de deploy:

```bash
ssh-keygen -t ed25519 -C "github-deploy-fingertip" -f ~/.ssh/fingertip_deploy -N ""
```

- Cadastre o conteúdo de `~/.ssh/fingertip_deploy.pub` no hPanel, em *Acesso SSH → Chaves SSH*.
- Cole o conteúdo de `~/.ssh/fingertip_deploy` (chave privada) no secret `SSH_KEY`.

Se `php -v` via SSH mostrar uma versão abaixo de 8.3, defina `PHP_BIN` com o caminho do PHP 8.3 do servidor, por exemplo `/opt/alt/php83/usr/bin/php`. O workflow para com um erro claro se a versão for menor.

> O `.env` do servidor é sempre substituído pelo do secret `ENV_PRODUCTION`. Para mudar uma configuração de produção, atualize o secret e rode o deploy de novo.

### Diagnóstico de erros no servidor

Se o site retornar erro 500, envie `scripts/server-check.php` para a raiz da app no servidor e acesse `/server-check.php`. Ele mostra:

- a versão do PHP e as extensões necessárias;
- se `.env`, `vendor/` e `build/manifest.json` existem;
- se `storage/` e `bootstrap/cache/` são graváveis;
- se o servidor alcança o banco e consegue fazer login, e se as tabelas existem;
- o último erro registrado em `storage/logs/laravel.log`.

**Apague o arquivo depois de usar.**

### Neon em servidores com `libpq` antigo

Hospedagens compartilhadas costumam ter uma versão antiga da biblioteca `libpq`, que não envia SNI. Nesse caso o Neon recusa a conexão com `Endpoint ID is not specified`. O `App\Database\NeonPostgresConnector` resolve isso: para hosts `*.neon.tech`, ele envia o ID do endpoint (o primeiro trecho do host) no parâmetro `options=endpoint=<id>`, como o [Neon recomenda](https://neon.com/sni). Funciona com e sem SNI, então não exige configuração extra.
