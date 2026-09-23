# DATA DIRECTORY

Os dados reais serão mantidos localmente pelo usuário.

```text
data/
├── bronze/
├── silver/
└── gold/
```

## Desenvolvimento

Codex/pipeline pode inspecionar as três camadas.

## Produto web

Pages e API Routes do produto devem consultar somente `data/gold/`.

O inventário dos arquivos Gold possíveis está em:

```text
docs/GOLD_DATA_DESIGN.md
```

Não copie os Parquets para `public/`.

Os `.gitkeep` existem apenas para preservar a estrutura deste handoff.
