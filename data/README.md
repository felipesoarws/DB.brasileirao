# DATA DIRECTORY

Os Parquet Gold são sincronizados do Google Drive no workflow de deploy e podem
ser mantidos localmente para desenvolvimento.

```text
data/
├── bronze/
├── silver/
└── gold/
```

## Desenvolvimento e deploy

`data/gold/` é a fonte canônica dos Parquet. Antes de iniciar o Next.js em
desenvolvimento ou produção, `scripts/convert_gold.py` converte as tabelas para
JSON gzipado em `data/gold-json/`. Esse diretório é derivado, ignorado pelo Git
e incluído no rastreamento de arquivos do Next.js para que as páginas do servidor
consigam ler os dados no deploy. A leitura usa `pyarrow`, fixado em
`requirements-build.txt`; no desenvolvimento, instale com
`python -m pip install -r requirements-build.txt`.

O workflow do GitHub Actions baixa `gdrive:brasileiraodb/gold` antes do build,
usando o secret `RCLONE_CONFIG_B64`. O remote no arquivo rclone deve se chamar
`gdrive`. A aplicação publicada não acessa o Drive em cada requisição: ela lê a
cópia JSON compactada incluída na build, evitando credenciais do Drive em funções
públicas. O workflow também precisa do secret `VERCEL_TOKEN` para publicar. O
deploy Git nativo do Vercel está desativado para evitar builds sem os dados; o
workflow é o responsável pelo deploy de produção.

## Produto web

Pages e API Routes do produto consultam as tabelas JSON de build por meio de
`lib/data/gold.ts`; o Parquet original continua sendo a fonte canônica em
`data/gold/`.

O inventário dos arquivos Gold possíveis está em:

```text
docs/GOLD_DATA_DESIGN.md
```

Não copie os Parquets para `public/`.

Os `.gitkeep` existem apenas para preservar a estrutura deste handoff.
