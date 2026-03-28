#!/usr/bin/env python3
"""
HKDSE Math OCR Processor
Downloads exam images and extracts text using Tesseract OCR
"""

import os
import json
import subprocess
import urllib.request
from pathlib import Path

# Data from Google Sheets - P1 Probability questions
P1_PROBABILITY = [
    ("2012Q16", "2012", "B", "16", "高中概率", "4", "https://drive.google.com/uc?id=16cu2OcT44O3vC2fmgaPKUL0kkNCqp5vU"),
    ("2013Q10", "2013", "A2", "10", "初中概率", "6", "https://drive.google.com/uc?id=1cqs95MEMljk-CP9ECtk_lSTofH6kRdae"),
    ("2013Q16", "2013", "B", "16", "高中概率", "4", "https://drive.google.com/uc?id=1dFF1nNzYc4tOUJFaT43CCRW7AFyk1qPa"),
    ("2014Q19", "2014", "B", "19", "高中概率", "13", "https://drive.google.com/uc?id=17PBlT_mAM8qUg65Q2bgC9bKXPlU4BZRx"),
    ("2015Q03", "2015", "A1", "03", "初中概率", "3", "https://drive.google.com/uc?id=1QFOOGMmKeSWRLitc34YiwvwlRA2gq-dn"),
    ("2015Q16", "2015", "B", "16", "高中概率", "4", "https://drive.google.com/uc?id=1PSzGGnXjwuF_Xo1ok4jWB7s5jqSBp0Pz"),
    ("2016Q09", "2016", "A1", "09", "初中概率", "5", "https://drive.google.com/uc?id=1WztMk0eF9N5h5NbLkGAeaflqggmvjfvY"),
    ("2016Q15", "2016", "B", "15", "高中概率", "3", "https://drive.google.com/uc?id=1WalKntKeUcMw8MporgfFUDcd8ylkPpil"),
    ("2017Q07", "2017", "A1", "07", "初中概率", "4", "https://drive.google.com/uc?id=1bgYoAVPXVoRUy7oXYMHHsq8RXqiod0l2"),
    ("2017Q17", "2017", "B", "17", "高中概率", "6", "https://drive.google.com/uc?id=1cKMBfl7etbPRwMpY3xxJw8FTIajtnayE"),
    ("2018Q04", "2018", "A1", "04", "初中概率", "3", "https://drive.google.com/uc?id=1aSi63-IHWw_RC2VsoG2i92e-ZrLIF1_A"),
    ("2018Q15", "2018", "B", "15", "高中概率", "3", "https://drive.google.com/uc?id=1ayATu9DdAiAsKw_8FCtM-BWA0Uu3rxzu"),
    ("2019Q08", "2019", "A1", "08", "初中概率", "5", "https://drive.google.com/uc?id=1uiW2o5xH3iE-NnzFHrQp7ZCNQ2rcTEJz"),
    ("2019Q15", "2019", "B", "15", "高中概率", "3", "https://drive.google.com/uc?id=1u905fWz9o-EXhAewLyz5iHewjYJNKJCv"),
    ("2020Q15", "2020", "B", "15", "高中概率", "5", "https://drive.google.com/uc?id=166JW4LCr30or5VRekwSjswWe5aEhmVZA"),
    ("2021Q15", "2021", "B", "15", "高中概率", "4", "https://drive.google.com/uc?id=1q-AeFc6vmxniRVKrGG2psmd_6ET5Ouax"),
    ("2022Q09", "2022", "A1", "09", "初中概率", "5", "https://drive.google.com/uc?id=1_PewDfc_11fioL3agZzZLcZ_ZtmScO4-"),
    ("2022Q15", "2022", "B", "15", "高中概率", "4", "https://drive.google.com/uc?id=1_y1OMq64seG_vv5d_VXi_8eis0EA3KrW"),
    ("2023Q15", "2023", "B", "15", "高中概率", "4", "https://drive.google.com/uc?id=1cfHPPleV3u5eQPR_XwZpBim_IG8uTW5s"),
]

# P2 Probability questions (no part column - P2 is all MC)
P2_PROBABILITY = [
    ("2012Q27", "2012", "MC", "27", "初中概率", "3", "https://drive.google.com/uc?id=1dhgiv9WYmMHc_nZkE9Pk5qpVG1umKivZ"),
    ("2012Q28", "2012", "28", "初中概率", "3", "https://drive.google.com/uc?id=1dbTr6uz9VQ62SxfQt91hH4vhYXEQf96d"),
    ("2012Q43", "2012", "43", "高中概率", "5", "https://drive.google.com/uc?id=1eYd71NOs8ayjK5EEAOJyM-NPKdjyqk2A"),
    ("2012Q44", "2012", "44", "高中概率", "5", "https://drive.google.com/uc?id=1ebvKyQAKoE47hVOCw6JFS0jUeg-6inVv"),
    ("2013Q26", "2013", "26", "初中概率", "3", "https://drive.google.com/uc?id=1amMOcJsS-9Zv0NLxFrjFzaVWmiY5zzNg"),
    ("2013Q44", "2013", "44", "高中概率", "5", "https://drive.google.com/uc?id=1cImpfsynn9Mce54QK-PEvUpoOqMoxUd5"),
    ("2014Q27", "2014", "27", "初中概率", "3", "https://drive.google.com/uc?id=1YwQtydX7t5ega-eSl4uh-1fR5XCOAHWU"),
    ("2014Q43", "2014", "43", "高中概率", "5", "https://drive.google.com/uc?id=1ZoceRdIZLJRtzJF04myX8k6oNllo1lg9"),
    ("2015Q27", "2015", "27", "初中概率", "3", "https://drive.google.com/uc?id=1Vvb_JKKLmvJrNVWVdKoRhUkuYIXgaW1d"),
    ("2015Q28", "2015", "28", "初中概率", "3", "https://drive.google.com/uc?id=1VvuFHDzVEZg13RuOzyp31mj6QjyuxR2X"),
    ("2015Q43", "2015", "43", "高中概率", "5", "https://drive.google.com/uc?id=1WyvSUlh5ACotoHE0G6VQZh7srZOByg1s"),
    ("2015Q44", "2015", "44", "高中概率", "5", "https://drive.google.com/uc?id=1X09Pwi26GtclACSmHZm9AUaKAWsrdxdq"),
    ("2016Q28", "2016", "28", "初中概率", "3", "https://drive.google.com/uc?id=1SsCPcLaaIONwt55qYgt33_OVR4NosJ94"),
    ("2016Q29", "2016", "29", "初中概率", "3", "https://drive.google.com/uc?id=1SvKGeHUCx4A_cMHniLw-ektxW_CDFQxj"),
    ("2016Q42", "2016", "42", "高中概率", "5", "https://drive.google.com/uc?id=1TeobM6GEBE2UN9pqbw4-KBz2h8rF6Tj1"),
    ("2016Q43", "2016", "43", "高中概率", "5", "https://drive.google.com/uc?id=1Tnj9EkqcbDf-5FKKRn1GMiMt23HVh61n"),
    ("2017Q28", "2017", "28", "初中概率", "3", "https://drive.google.com/uc?id=14QY5coAoavqCA43JrmjQX_Gbr5OzD-hG"),
    ("2017Q42", "2017", "42", "高中概率", "5", "https://drive.google.com/uc?id=15Xb_a1XqEPd4GfEUAi7g-jgFZ3lc5kVl"),
    ("2017Q43", "2017", "43", "高中概率", "5", "https://drive.google.com/uc?id=15ZT41PT5ZUgmI-yOxEbfuiCO7_xTQekE"),
    ("2018Q28", "2018", "28", "初中概率", "3", "https://drive.google.com/uc?id=1BHxqwBv_Nwhu32wxC97fiAF7HyIfddC-"),
    ("2018Q42", "2018", "42", "高中概率", "5", "https://drive.google.com/uc?id=1C46odu-8LIDreFBXGeYq6jP6q5cPMdcb"),
    ("2018Q43", "2018", "43", "高中概率", "5", "https://drive.google.com/uc?id=1C4MGM0todJWjVLpbKWCCHEpocvkYzy4D"),
    ("2019Q28", "2019", "28", "初中概率", "3", "https://drive.google.com/uc?id=1Id-a7r37MiXYCTqYfLn5tL_e-945wLPD"),
    ("2019Q42", "2019", "42", "高中概率", "5", "https://drive.google.com/uc?id=1JNlshE-tsKpFNgx6g5yu8Nx1P01FXEdg"),
    ("2019Q43", "2019", "43", "高中概率", "5", "https://drive.google.com/uc?id=1JToob0wDgpO0T3PznwdbNCR-glEmucvn"),
    ("2020Q28", "2020", "28", "初中概率", "3", "https://drive.google.com/uc?id=1MVh_qQTipQMDEF4un60KIOMReIqYuKE8"),
    ("2020Q42", "2020", "42", "高中概率", "5", "https://drive.google.com/uc?id=1NgEBLmGwrpCXlyKe5yWSfWAONn3wM4Z0"),
    ("2020Q43", "2020", "43", "高中概率", "5", "https://drive.google.com/uc?id=1NhAFl43ay0GYyD9x1LN2u5D6xv2g3eMu"),
    ("2021Q28", "2021", "28", "高中概率", "5", "https://drive.google.com/uc?id=1QFRmsP1oIMQ4x4W0hLs8ajbZThkHLdW6"),
    ("2021Q42", "2021", "42", "高中概率", "5", "https://drive.google.com/uc?id=1Qkmq0WPD5ZTDOvx49jyHOeFBxwnt20IN"),
    ("2021Q43", "2021", "43", "高中概率", "5", "https://drive.google.com/uc?id=1QmkqYKRDuZd1KpRMg14v6GZI2sreP1Fz"),
    ("2022Q28", "2022", "28", "初中概率", "3", "https://drive.google.com/uc?id=1CnlT2bmZUzpyAqW8i6YOg6Eh64MM29Bf"),
    ("2022Q42", "2022", "42", "高中概率", "5", "https://drive.google.com/uc?id=1CiRz-DJ9FT2BZF5jaUN1s3-mNpgQfaDF"),
    ("2022Q43", "2022", "43", "高中概率", "5", "https://drive.google.com/uc?id=1FBGNtJZGsR8IbKWFVjqLryW_2bifEcd2"),
]

def download_image(url, output_path):
    """Download image from URL"""
    try:
        urllib.request.urlretrieve(url, output_path)
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def ocr_image(image_path):
    """Extract text from image using Tesseract"""
    try:
        result = subprocess.run(
            ['tesseract', image_path, 'stdout', '-l', 'chi_tra'],
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.stdout.strip()
    except Exception as e:
        print(f"Error OCR on {image_path}: {e}")
        return ""

def process_questions(questions, paper_type, output_dir):
    """Process a list of questions"""
    results = []
    images_dir = Path(output_dir) / 'images' / paper_type.lower()
    images_dir.mkdir(parents=True, exist_ok=True)
    
    for q_id, year, part, q_num, topic, score, url in questions:
        if not url:
            print(f"Skipping {q_id} - no URL")
            continue
            
        print(f"Processing {q_id}...")
        
        # Download image
        img_path = images_dir / f"{q_id}.jpg"
        if not download_image(url, str(img_path)):
            continue
        
        # OCR
        text = ocr_image(str(img_path))
        
        # Clean up downloaded image to save space (optional)
        # os.remove(img_path)
        
        result = {
            "id": q_id,
            "year": year,
            "part": part,
            "question_num": q_num,
            "topic": topic,
            "score": score,
            "paper": paper_type,
            "image_url": url,
            "ocr_text": text,
            "verified": False,
            "verified_text": ""
        }
        results.append(result)
        print(f"  -> Done: {q_id}")
        
    return results

def main():
    base_dir = Path(__file__).parent
    output_dir = base_dir / 'ocr-output'
    output_dir.mkdir(exist_ok=True)
    
    # Process P1
    print("=" * 50)
    print("Processing P1 Probability Questions...")
    print("=" * 50)
    p1_results = process_questions(P1_PROBABILITY, "P1", str(output_dir))
    
    # Process P2
    print("=" * 50)
    print("Processing P2 Probability Questions...")
    print("=" * 50)
    p2_results = process_questions(P2_PROBABILITY, "P2", str(output_dir))
    
    # Save results
    all_results = {
        "p1_probability": p1_results,
        "p2_probability": p2_results,
        "total_p1": len(p1_results),
        "total_p2": len(p2_results),
        "total": len(p1_results) + len(p2_results)
    }
    
    output_file = output_dir / 'probability_ocr_results.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print("=" * 50)
    print(f"Total processed: {all_results['total']}")
    print(f"Results saved to: {output_file}")
    print("=" * 50)

if __name__ == "__main__":
    main()
