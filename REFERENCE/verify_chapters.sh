#!/bin/bash

echo "=== 課題分頁驗證 ==="
echo ""

for ch in 1 2 3 4 5 6 7 10; do
    file="S1Ch${ch}.html"
    echo "--- $file ---"
    
    # Check title
    title=$(grep -o "<title>[^<]*" "$file" | head -1)
    echo "Title: $title"
    
    # Check h1
    h1=$(grep -o "<h1>[^<]*" "$file" | head -1)
    echo "H1: $h1"
    
    # Check description
    desc=$(grep -A1 "<h1>" "$file" | grep -o "<p>[^<]*" | head -1)
    echo "Description: $desc"
    
    # Check game links
    games=$(grep -c "games/S1Ch" "$file")
    echo "Games: $games"
    
    echo ""
done

echo "=== 驗證完成 ==="
