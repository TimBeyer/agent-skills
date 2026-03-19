#!/usr/bin/env bash
# Compile sixt-rental entry points into standalone binaries via bun build --compile
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$PROJECT_DIR/bin"

for src in "$BIN_DIR"/sixt-*.ts; do
  name="$(basename "$src" .ts)"
  echo "Building $name..."
  bun build --compile "$src" --outfile "$BIN_DIR/$name"
done

echo "Done. Compiled binaries in bin/"
