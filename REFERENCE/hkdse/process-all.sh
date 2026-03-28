#!/bin/bash
# HKDSE Complete OCR Processor
# Processes ALL questions from P1 and P2 overnight

cd ~/ai-learning/hkdse

echo "=========================================="
echo "HKDSE Complete OCR Processor"
echo "Started at: $(date)"
echo "=========================================="

# P1 Sheet ID
P1_SHEET="1L5j_1vZxvC0yDRjrrzSdM34As5daFlaont6cZYWvMeM"
P2_SHEET="17YI7uXumJbzseJbHLZpI_orLo4j3X9crUz6PbDAGLVE"

# Get P1 data
echo "Fetching P1 data from Google Sheets..."
gog sheets get "$P1_SHEET" "HKDSE Paper1 總表!A1:O250" --plain 2>/dev/null > /tmp/p1_data.txt
echo "P1: $(wc -l < /tmp/p1_data.txt) rows"

# Get P2 data  
echo "Fetching P2 data from Google Sheets..."
gog sheets get "$P2_SHEET" "HKDSE P2 2012-22 總表!A1:M550" --plain 2>/dev/null > /tmp/p2_data.txt
echo "P2: $(wc -l < /tmp/p2_data.txt) rows"

echo ""
echo "Starting OCR processing..."
echo "This will run in background and process all questions."
echo "Check progress at: ~/ai-learning/hkdse/ocr-output/all_topics_ocr_results.json"
echo ""

# Run the Python processor
python3 complete-ocr.py 2>&1 | tee /tmp/ocr_log.txt

echo ""
echo "=========================================="
echo "OCR Processing Completed at: $(date)"
echo "=========================================="
