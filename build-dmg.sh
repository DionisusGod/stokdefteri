#!/bin/bash
# Stok Defteri - Apple Silicon (M1/M2/M3/M4) macOS DMG Üretim Scripti
set -e

echo "🚀 Stok Defteri macOS DMG derleme süreci başlatılıyor..."

# 1. Proje bağımlılıklarını yükle
echo "📥 1/3: Bağımlılıklar doğrulanıyor (npm install)..."
npm install

# 2. Web arayüzünü derle
echo "📦 2/3: Arayüz derleniyor (npm run build)..."
npm run build

# 3. Apple Silicon (arm64) için DMG paketle
echo "🍏 3/3: macOS DMG paketi oluşturuluyor..."
npx electron-builder --mac dmg --arm64

echo ""
echo "=========================================================="
echo "✅ BAŞARILI! Kurulum dosyanız hazır:"
echo "📂 Konum: $(pwd)/release/*.dmg"
echo "=========================================================="

