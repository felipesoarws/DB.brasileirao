from __future__ import annotations

import gzip
import json
import math
import os
import shutil
import sys
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any

try:
    import pyarrow.parquet as parquet
except ImportError as error:
    raise SystemExit("PyArrow is required to convert Gold Parquet files. Install requirements-build.txt.") from error


def safe_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): safe_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [safe_value(item) for item in value]
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def logical_table(relative_path: Path) -> Path:
    parts = relative_path.parts
    if len(parts) == 1:
        return Path(relative_path.stem)
    if parts[0] == "analytics" and len(parts) > 1:
        return Path(parts[0], parts[1])
    return Path(parts[0])


def write_json(target: Path, value: Any) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(target.suffix + ".tmp")
    with gzip.open(temporary, "wt", encoding="utf-8", compresslevel=6) as output:
        if isinstance(value, list):
            output.write("[")
            for index, row in enumerate(value):
                if index:
                    output.write(",")
                json.dump(safe_value(row), output, ensure_ascii=False, separators=(",", ":"))
            output.write("]")
        else:
            json.dump(safe_value(value), output, ensure_ascii=False, separators=(",", ":"))
    os.replace(temporary, target)


def main() -> None:
    data_root = Path(os.environ.get("DATA_ROOT", "data"))
    if not data_root.is_absolute():
        data_root = Path.cwd() / data_root
    source_root = data_root / "gold"
    output_root = data_root / "gold-json"
    if not source_root.is_dir():
        raise SystemExit(f"Gold source directory does not exist: {source_root}")

    parquet_files = sorted(source_root.rglob("*.parquet"))
    if not parquet_files:
        raise SystemExit(f"No Parquet files found under {source_root}; refusing to build an empty site.")

    grouped: dict[Path, list[Path]] = defaultdict(list)
    for source in parquet_files:
        grouped[logical_table(source.relative_to(source_root))].append(source)

    required = {Path("matches"), Path("teams"), Path("season_standings"), Path("season_champions")}
    missing = sorted(str(table) for table in required - grouped.keys())
    if missing:
        raise SystemExit(f"Required Gold tables are missing: {', '.join(missing)}")

    previous_manifest = output_root / ".manifest.json"
    previous_files: set[str] = set()
    try:
        raw_manifest = previous_manifest.read_bytes()
        try:
            raw_manifest = gzip.decompress(raw_manifest)
        except OSError:
            pass
        previous_files = set(json.loads(raw_manifest.decode("utf-8")).get("files", []))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, AttributeError):
        pass

    generated_files: set[str] = set()
    for table_name, files in sorted(grouped.items(), key=lambda item: item[0].as_posix()):
        rows = []
        for source in files:
            rows.extend(parquet.ParquetFile(source).read().to_pylist())
        relative_output = table_name.with_suffix(".json.gz").as_posix()
        write_json(output_root / relative_output, rows)
        generated_files.add(relative_output)
        print(f"{relative_output}: {len(rows):,} rows from {len(files)} Parquet file(s)")

    for stale_name in previous_files - generated_files:
        stale = (output_root / stale_name).resolve()
        if stale.is_relative_to(output_root.resolve()) and stale.is_file():
            stale.unlink()

    metadata = source_root / "_metadata.json"
    if metadata.is_file():
        shutil.copy2(metadata, output_root / "_metadata.json")
    write_json(previous_manifest, {"files": sorted(generated_files)})
    print(f"Converted {len(parquet_files)} Parquet files into {len(generated_files)} Gold JSON tables.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Gold conversion failed: {error}", file=sys.stderr)
        raise
