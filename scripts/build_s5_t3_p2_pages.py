#!/usr/bin/env python3
"""Build static pages for 2025-26 S5 Term 3 Paper 2."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TERM_DIR = ROOT / "exam" / "2025-26-s5-term3"
P2_DIR = TERM_DIR / "p2"
SOLUTIONS_MD = TERM_DIR / "solutions.md"
ANSWERS_JSON = TERM_DIR / "solutions-answers.json"

FIGURE_BANNER = "⚠️ 答案 verified math, figure SVG 須手動校對"
GATED = {11, 19, 26, 37, 39, 40}


QUESTIONS = {
    1: {
        "text": r"化簡 $$\frac{8x^{-3}y^2}{(-2xy^{-1})^2}$$",
        "options": [
            r"\(-\frac{2y^4}{x^5}\)",
            r"\(\frac{2y^4}{x^5}\)",
            r"\(\frac{y^4}{-2x^5}\)",
            r"\(\frac{1}{-2x^6y}\)",
        ],
    },
    2: {
        "text": r"因式分解 \(x^2-y^2-2kx+2ky\)。",
        "options": [
            r"\((x-y)(x+y-2k)\)",
            r"\((x-y)(x+y+2k)\)",
            r"\((x+y)(x-y-2k)\)",
            r"\((x+y)(x-y+2k)\)",
        ],
    },
    3: {
        "text": r"已知 \(x^2+a(x-2)+b\equiv(x-5)(x+3)\)，求 \(b\) 的值。",
        "options": [r"\(b=-19\)", r"\(b=-15\)", r"\(b=-11\)", r"\(b=1\)"],
    },
    4: {
        "text": "下列哪一對／幾對三角形必為全等？",
        "figure": "三組三角形全等判斷圖：I 為兩邊及非夾角，II 為兩邊及夾角，III 為兩角及一邊。",
        "options": ["只有 III", "只有 I 及 II", "只有 I 及 III", "只有 II 及 III"],
    },
    5: {
        "text": r"若 \(\frac{ab}{a-b}=2\)，則 \(b=\)",
        "options": [r"\(\frac{2a}{a+2}\)", r"\(\frac{a}{a+1}\)", r"\(\frac{a+2}{2a}\)", r"\(\frac{2a+1}{a}\)"],
    },
    6: {
        "text": r"設 \(a\) 為一常數。若二次方程 \(x^2+ax=-1\) 有二重根，則 \(a=\)",
        "options": [r"\(-1\)", r"\(2\)", r"\(-2\) 或 \(2\)", r"\(0\) 或 \(4\)"],
    },
    7: {
        "text": r"若 \(2x-y=3x+y=-10\)，則 \(y=\)",
        "options": [r"\(4\)", r"\(2\)", r"\(-2\)", r"\(-4\)"],
    },
    8: {
        "text": "某人將 HK$20 000 存入銀行，年利率 5%，年期 3 年，複利息計算，每季一結。求利息準確至最接近的元。",
        "options": ["HK$759", "HK$3153", "HK$3208", "HK$3215"],
    },
    9: {
        "text": r"\(15-3x<3\) 或 \(5+2x\le 1\) 的解為",
        "options": [r"\(x\le -2\)", r"\(x<4\)", r"\(x\le -2\) 或 \(x>4\)", "沒有實根"],
    },
    10: {
        "text": "一艘貨船能載 500 kg 的物件（準確至最接近的 kg）。若一包白米重 200 g（準確至最接近的 10 g），貨船最多能載多少包米？",
        "options": ["2437", "2441", "2500", "2566"],
    },
    11: {
        "text": "求圖中扇形 AOB 的面積。（答案須準確至三位有效數字。）",
        "figure_key": "sector",
        "options": ["27.9 平方米", "23.0 平方米", "6.98 平方米", "3.49 平方米"],
    },
    12: {
        "text": r"圖中，\(\cos\theta+\frac{1}{\sin\theta}=\)",
        "figure": "直角三角形，角 theta 及三邊 x、y、z 的位置須按原卷核對。",
        "options": [r"\(\frac{x+y}{z}\)", r"\(\frac{x}{z}+\frac{z}{y}\)", r"\(\frac{y}{z}+\frac{z}{x}\)", r"\(\frac{z}{x}+\frac{z}{y}\)"],
    },
    13: {
        "text": r"設 \(g(x)=2x^3-x^2+k\)，其中 \(k\) 為一常數。若 \(g(2)=0\)，求 \(g(x)\) 除以 \(x+1\) 時的餘數。",
        "options": ["13", "9", r"\(-12\)", r"\(-15\)"],
    },
    14: {
        "text": r"若 \(z\) 隨 \(x\) 正變且隨 \(y\) 的平方根反變，其中 \(y>0\)。下列何者必為常數？",
        "options": [r"\(xz\sqrt{y}\)", r"\(\frac{z\sqrt{y}}{x}\)", r"\(\frac{xz}{\sqrt{y}}\)", r"\(\frac{1}{xz\sqrt{y}}\)"],
    },
    15: {
        "text": r"設 \(f(x)=x^2-16x+c\)，其中 \(c\) 為一常數。若 \(y=f(x)\) 的圖像與 \(x\) 軸只相交於一點，則 \(c=\)",
        "options": ["4", "8", "16", "64"],
    },
    16: {
        "text": r"設 \(k\) 為一常數。若 \(f(x)=3x^2-x-k\)，則 \(f(2)-f(-2)=\)",
        "options": [r"\(-4\)", r"\(-k\)", r"\(49-k\)", r"\(20-2k\)"],
    },
    17: {
        "text": r"圖中所示為 \(y=2(x+a)^2+b\) 的圖像。下列何者正確？<br>I. 圖像的 \(y\) 截距為 \(b\)。<br>II. \(ab>0\)<br>III. 圖像的頂點坐標為 \((a,b)\)。",
        "figure": r"二次函數 \(y=2(x+a)^2+b\) 的拋物線圖像。",
        "options": ["只有 I", "只有 II", "只有 I 及 II", "只有 II 及 III"],
    },
    18: {
        "text": r"圖中，\(O\) 為圓 \(ABC\) 的圓心。若 \(\angle ABO=56^\circ\) 及 \(\angle ACO=18^\circ\)，則 \(\angle BOC=\)",
        "figure": "圓 ABC，O 為圓心，標示角 ABO = 56° 及 ACO = 18°。",
        "options": [r"\(68^\circ\)", r"\(74^\circ\)", r"\(76^\circ\)", r"\(88^\circ\)"],
    },
    19: {
        "text": r"圖中，\(AB\) 為圓 \(ABCD\) 的一直徑。若 \(2\widehat{AD}=\widehat{BC}\) 及 \(\angle CAB=28^\circ\)，則 \(\angle CAD=\)",
        "figure_key": "circle_diameter",
        "options": [r"\(6^\circ\)", r"\(17^\circ\)", r"\(32^\circ\)", r"\(48^\circ\)"],
    },
    20: {
        "text": r"若 \(P\) 與固定點 \(A(-1,5)\) 保持 3 的固定距離，求 \(P\) 的軌跡的方程。",
        "options": [
            r"\(x^2+y^2+2x-10y+17=0\)",
            r"\(x^2+y^2+2x-10y+23=0\)",
            r"\(x+y-7=0\)",
            r"\(x+y-8=0\)",
        ],
    },
    21: {
        "text": r"若 \(P\) 為直角坐標平面上的一動點使得 \(P\) 與直線 \(y=-4\) 間之距離等於原點與點 \((0,1)\) 之距離，則 \(P\) 的軌跡為",
        "options": ["一個圓", "一條直線", "一條拋物線", "一對平行線"],
    },
    22: {
        "text": r"求由直線 \(x+3y-18=0\)、\(x\) 軸及 \(y\) 軸所圍成的區域的面積。",
        "options": ["18", "27", "36", "54"],
    },
    23: {
        "text": r"若直線 \(L_1:kx+7y=2\) 和 \(L_2:4x-2y=3\) 互相垂直，求 \(k\) 的值。",
        "options": [r"\(\frac{7}{2}\)", r"\(-\frac{7}{2}\)", "14", r"\(-14\)"],
    },
    24: {
        "text": r"若直線 \(x-y+1=0\) 將圓 \(x^2+y^2-kx+4y-6=0\) 分割為兩等分，則 \(k=\)",
        "options": [r"\(-6\)", r"\(-4\)", "2", "3"],
    },
    25: {
        "text": r"考慮圓的方程 \(x^2+y^2-6x+12y-4=0\)，下列哪些句子必為正確？<br>I. 該圓的圓心的坐標是 \((3,-6)\)。<br>II. 該圓的半徑是 49。<br>III. 原點位於該圓以內。",
        "options": ["只有 I", "只有 I 及 III", "只有 II 及 III", "I、II 及 III"],
    },
    26: {
        "text": "下面的框線圖顯示某些義工的年齡分佈。求義工年齡的四分位數間距。",
        "figure_key": "boxplot",
        "options": ["25", "35", "45", "55"],
    },
    27: {
        "text": r"若五個數 \(10,x,8,13\) 及 \(2x+1\) 的平均值為 10，則該五個數的分佈域為",
        "options": ["3", "5", "6", "7"],
    },
    28: {
        "text": "下表所示為 30 人所擁有智能電話的數目。求智能電話的數目的標準差。<table class=\"data-table\"><tr><th>智能電話的數目</th><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><th>人數</th><td>14</td><td>12</td><td>2</td><td>2</td></tr></table>",
        "options": ["0.998", "0.854", "0.729", "1.73"],
    },
    29: {
        "text": r"某盒巧克力內有 \(x\) 粒黑巧克力及 20 粒牛奶巧克力。若從該盒巧克力內隨機抽出一粒，則抽出牛奶巧克力的概率為 \(\frac{1}{5}\)。求 \(x\)。",
        "options": ["100", "80", "5", "4"],
    },
    30: {
        "text": "以下的幹葉圖所示為 16 位同學每日的零用錢（以 HK$ 為單位）的分佈。若從中抽出一位學生，求抽出該學生的零用錢大於 HK$65 的概率。<table class=\"stem-table\"><tr><th>幹（HK$10）</th><th>葉（HK$1）</th></tr><tr><td>4</td><td>0 5 6</td></tr><tr><td>5</td><td>2 5</td></tr><tr><td>6</td><td>1 5 9 9 9</td></tr><tr><td>7</td><td>5 8 9</td></tr><tr><td>8</td><td>1 2 3</td></tr></table>",
        "options": [r"\(\frac{3}{8}\)", r"\(\frac{1}{16}\)", r"\(\frac{9}{16}\)", r"\(\frac{5}{8}\)"],
    },
    31: {
        "text": r"化簡 $$\frac{32^{b/5}}{\sqrt[3]{8a^{-2}}}$$",
        "options": [r"\(2^{b-1}a^{2/3}\)", r"\(2^{b-1}a\)", r"\(2^{2b/5}a^{2/3}\)", r"\(2^{2b/5}a\)"],
    },
    32: {
        "text": "下列何者為最大？",
        "options": [r"\(2010^{500}\)", r"\(1500^{1020}\)", r"\(1020^{1500}\)", r"\(500^{2010}\)"],
    },
    33: {
        "text": r"若 \(a>1\) 及 \(b>1\)，則 \((\log_b a^3)(\log_a b)^2=\)",
        "options": [r"\(3\log_a b\)", r"\(2\log_b a\)", "6", "1"],
    },
    34: {
        "text": r"若 \(-2\) 為方程 \(x^2-3x+c=0\) 的根，解 \(x^2-3x+c<0\)。",
        "options": [r"\(-2<x<5\)", r"\(x<-2\) 或 \(x>5\)", r"\(-2<x<10\)", r"\(x<-2\) 或 \(x>10\)"],
    },
    35: {
        "text": r"已知 \(m\) 為一常數。若直線 \(L:y=mx\) 與圓 \(C:x^2+y^2-6x-8y=0\) 相切，下列哪一條直線平行於 \(L\) 且與 \(C\) 相切？",
        "options": [r"\(3x+4y-25=0\)", r"\(3x+4y-50=0\)", r"\(4x-3y-25=0\)", r"\(4x-3y-50=0\)"],
    },
    36: {
        "text": r"圖中，\(O\) 為圓心。\(A\) 為該圓上的一點。\(BC\) 為該圓在 \(X\) 的切線。\(AOX\) 為一直線。若該圓的半徑為 1 及 \(\angle XAC=\angle XCO\)，則 \(AC^2=\)",
        "figure": "圓心 O、半徑 1，BC 為 X 點切線，A、O、X 共線，C 在切線上。",
        "options": ["3", "5", "6", "8"],
    },
    37: {
        "text": r"圖中，\(PQ\) 及 \(PR\) 分別為圓 \(ABCD\) 在 \(A\) 及 \(D\) 的切線。若 \(PQ\parallel DC\) 及 \(\angle QPR=38^\circ\)，則 \(\angle ABC=\)",
        "figure_key": "tangent_circle",
        "options": [r"\(71^\circ\)", r"\(104^\circ\)", r"\(109^\circ\)", r"\(142^\circ\)"],
    },
    38: {
        "text": r"圖中，求 \(\theta\)（準確至最接近的度）。",
        "figure": "三角形，與 theta 相鄰兩邊為 9 及 12，對邊為 10。",
        "options": [r"\(35^\circ\)", r"\(47^\circ\)", r"\(55^\circ\)", r"\(78^\circ\)"],
    },
    39: {
        "text": r"圖中，\(\angle CAB\) 為一銳角。求 \(\angle ABC\) 準確至最接近的度。",
        "figure": r"三角形 ABC，\(AB=5\)、\(AC=8\)、\(\angle ACB=20^\circ\)。",
        "options": [r"\(13^\circ\)", r"\(33^\circ\)", r"\(127^\circ\)", r"\(147^\circ\)"],
    },
    40: {
        "text": r"圖中顯示一直立角柱體 \(ABCDEF\)，其均勻截面為一直角三角形。\(A,B,E,F\) 均在水平地面上。\(G\) 及 \(H\) 分別為 \(DC\) 及 \(EF\) 上的點使得 \(GH\perp EF\)。已知 \(AB=5\) cm 及 \(CG=4\) cm。若 \(\angle CBF=a\)、\(\angle GBH=b\) 及 \(\angle GAH=c\)，則下列何者必為正確？",
        "figure_key": "prism",
        "options": [r"\(a>b>c\)", r"\(a>c>b\)", r"\(b>c>a\)", r"\(c>b>a\)"],
    },
    41: {
        "text": "圖中所示為一以長方形 ABCD 為底的直立角錐體。求錐體的體積。（答案須準確至最接近整數。）",
        "figure_key": "pyramid",
        "options": ["56 立方厘米", "53 立方厘米", "18 立方厘米", "5 立方厘米"],
    },
    42: {
        "text": "筆盒內有 4 枝不同的原子筆及 5 枝不同的顏色筆。若將所有原子筆及顏色筆隨機排成一行，求原子筆與顏色筆交替而排的概率。",
        "options": [r"\(\frac{1}{2520}\)", r"\(\frac{1}{126}\)", r"\(\frac{1}{63}\)", r"\(\frac{62}{63}\)"],
    },
    43: {
        "text": "某畢業試共有三部分，最少兩部分取得及格才可獲得畢業證書。若某學生於三部分取得及格的概率分別為 0.5、0.6 及 0.7，求該學生能獲得畢業證書的概率。",
        "options": ["0.21", "0.44", "0.65", "0.94"],
    },
    44: {
        "text": "某個袋內有 2 個紅球、2 個綠球及 3 個藍球。某學生從該袋中隨機取球，每次只取出一個且不放回袋中，直至取到紅球為止。求該學生需取球最多五次的概率，準確至三位有效數字。",
        "options": ["0.0476", "0.857", "0.947", "0.952"],
    },
    45: {
        "text": r"設 \(X\) 為一組數 \(\{\alpha,\beta,\gamma,\delta,\lambda\}\) 而 \(Y\) 為另一組數 \(\{\alpha-2,\beta-2,\delta-2,\lambda-2\}\)，其中 \(\alpha<\beta<\gamma<\delta<\lambda\)。下列何者必為正確？<br>I. \(X\) 的中位數大於 \(Y\) 的中位數。<br>II. \(X\) 的四分位數間距與 \(Y\) 的四分位數間距相同。<br>III. \(X\) 的標準差小於 \(Y\) 的標準差。",
        "options": ["只有 I 及 II", "只有 I 及 III", "只有 II 及 III", "I、II 及 III"],
    },
}


def svg_wrap(inner: str, view_box: str = "0 0 360 220", label: str = "figure") -> str:
    return (
        f'<figure class="figure-svg" aria-label="{html.escape(label)}">'
        f'<svg viewBox="{view_box}" role="img" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'
        "</figure>"
    )


def placeholder_svg(description: str) -> str:
    inner = f"""
    <rect x="12" y="12" width="336" height="196" rx="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
    <path d="M72 158 L146 76 L202 128 L238 92 L296 158 Z" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>
    <circle cx="115" cy="70" r="15" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
    <text x="180" y="188" text-anchor="middle" font-size="13" fill="#334155">{html.escape(description)}</text>
    """
    return svg_wrap(inner, label=description)


def figure_svg(key: str, description: str | None = None) -> str:
    if key == "sector":
        inner = """
        <path d="M178 160 L250 160 A72 72 0 0 0 224.3 104.9 Z" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/>
        <line x1="178" y1="160" x2="250" y2="160" stroke="#1d4ed8" stroke-width="3"/>
        <line x1="178" y1="160" x2="224.3" y2="104.9" stroke="#1d4ed8" stroke-width="3"/>
        <path d="M198 160 A20 20 0 0 0 190.8 144.7" fill="none" stroke="#dc2626" stroke-width="2"/>
        <text x="172" y="178" font-size="16" fill="#0f172a">O</text>
        <text x="254" y="165" font-size="16" fill="#0f172a">A</text>
        <text x="226" y="99" font-size="16" fill="#0f172a">B</text>
        <text x="212" y="176" font-size="14" fill="#1d4ed8">8 m</text>
        <text x="190" y="122" font-size="14" fill="#1d4ed8">8 m</text>
        <text x="208" y="148" font-size="14" fill="#dc2626">50°</text>
        """
        return svg_wrap(inner, label="扇形 AOB，半徑 8 m，圓心角 50°")
    if key == "circle_diameter":
        inner = """
        <circle cx="180" cy="112" r="78" fill="#f8fafc" stroke="#0f172a" stroke-width="3"/>
        <line x1="102" y1="112" x2="258" y2="112" stroke="#2563eb" stroke-width="3"/>
        <polyline points="102,112 144,40 210,38 258,112" fill="none" stroke="#475569" stroke-width="3"/>
        <path d="M126 112 A24 24 0 0 1 123 101" fill="none" stroke="#dc2626" stroke-width="2"/>
        <text x="91" y="131" font-size="15">A</text>
        <text x="262" y="131" font-size="15">B</text>
        <text x="212" y="34" font-size="15">C</text>
        <text x="132" y="36" font-size="15">D</text>
        <text x="130" y="101" font-size="13" fill="#dc2626">28°</text>
        <text x="176" y="132" font-size="13" fill="#2563eb">diameter</text>
        <text x="180" y="190" text-anchor="middle" font-size="13" fill="#475569">2 arc AD = arc BC</text>
        """
        return svg_wrap(inner, label="圓 ABCD，AB 為直徑，2 arc AD = arc BC，角 CAB = 28°")
    if key == "boxplot":
        ticks = "".join(
            f'<line x1="{40+(v-10)*4}" y1="145" x2="{40+(v-10)*4}" y2="153" stroke="#475569"/><text x="{40+(v-10)*4}" y="170" text-anchor="middle" font-size="11">{v}</text>'
            for v in range(10, 75, 5)
        )
        inner = f"""
        <line x1="40" y1="145" x2="280" y2="145" stroke="#475569" stroke-width="2"/>
        {ticks}
        <line x1="60" y1="92" x2="100" y2="92" stroke="#0f172a" stroke-width="3"/>
        <rect x="100" y="66" width="140" height="52" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/>
        <line x1="180" y1="66" x2="180" y2="118" stroke="#1d4ed8" stroke-width="3"/>
        <line x1="240" y1="92" x2="280" y2="92" stroke="#0f172a" stroke-width="3"/>
        <line x1="60" y1="76" x2="60" y2="108" stroke="#0f172a" stroke-width="3"/>
        <line x1="280" y1="76" x2="280" y2="108" stroke="#0f172a" stroke-width="3"/>
        <text x="100" y="55" text-anchor="middle" font-size="13">Q1=25</text>
        <text x="240" y="55" text-anchor="middle" font-size="13">Q3=60</text>
        """
        return svg_wrap(inner, label="框線圖，Q1 = 25，Q3 = 60")
    if key == "tangent_circle":
        inner = """
        <circle cx="188" cy="105" r="62" fill="#f8fafc" stroke="#0f172a" stroke-width="3"/>
        <line x1="72" y1="158" x2="143" y2="62" stroke="#2563eb" stroke-width="3"/>
        <line x1="72" y1="158" x2="178" y2="166" stroke="#2563eb" stroke-width="3"/>
        <polyline points="143,62 205,52 238,112 178,166" fill="none" stroke="#475569" stroke-width="3"/>
        <line x1="238" y1="112" x2="178" y2="166" stroke="#16a34a" stroke-width="3"/>
        <line x1="143" y1="62" x2="205" y2="52" stroke="#16a34a" stroke-width="3"/>
        <path d="M93 158 A22 22 0 0 0 87 140" fill="none" stroke="#dc2626" stroke-width="2"/>
        <text x="65" y="176" font-size="15">P</text>
        <text x="126" y="57" font-size="15">A</text>
        <text x="209" y="49" font-size="15">B</text>
        <text x="244" y="115" font-size="15">C</text>
        <text x="174" y="187" font-size="15">D</text>
        <text x="104" y="143" font-size="13" fill="#dc2626">38°</text>
        <text x="165" y="35" font-size="13" fill="#16a34a">PQ ∥ DC</text>
        """
        return svg_wrap(inner, label="圓 ABCD，PQ/PR 為切線，PQ 平行 DC，角 QPR = 38°")
    if key == "prism":
        inner = """
        <polygon points="64,164 160,164 160,84 64,164" fill="#dbeafe" stroke="#0f172a" stroke-width="3"/>
        <polygon points="174,164 270,164 270,84 174,164" fill="#e0f2fe" stroke="#0f172a" stroke-width="3"/>
        <line x1="64" y1="164" x2="174" y2="164" stroke="#0f172a" stroke-width="3"/>
        <line x1="160" y1="164" x2="270" y2="164" stroke="#0f172a" stroke-width="3"/>
        <line x1="160" y1="84" x2="270" y2="84" stroke="#0f172a" stroke-width="3"/>
        <circle cx="206" cy="84" r="4" fill="#dc2626"/>
        <circle cx="206" cy="164" r="4" fill="#dc2626"/>
        <line x1="206" y1="84" x2="206" y2="164" stroke="#dc2626" stroke-width="3"/>
        <line x1="174" y1="164" x2="270" y2="84" stroke="#2563eb" stroke-width="2"/>
        <line x1="174" y1="164" x2="206" y2="84" stroke="#16a34a" stroke-width="2"/>
        <line x1="64" y1="164" x2="206" y2="84" stroke="#9333ea" stroke-width="2"/>
        <text x="54" y="181" font-size="14">A</text><text x="164" y="181" font-size="14">B</text>
        <text x="154" y="80" font-size="14">C</text><text x="58" y="181" font-size="14"></text>
        <text x="276" y="80" font-size="14">D</text><text x="278" y="181" font-size="14">F</text>
        <text x="207" y="78" font-size="14">G</text><text x="208" y="181" font-size="14">H</text>
        <text x="106" y="184" font-size="13">AB=5 cm</text><text x="220" y="80" font-size="13">CG=4 cm</text>
        """
        return svg_wrap(inner, label="直立角柱體 ABCDEF，G/H 標示，AB=5 cm，CG=4 cm")
    if key == "pyramid":
        inner = """
        <polygon points="95,160 235,160 275,112 135,112" fill="#f8fafc" stroke="#0f172a" stroke-width="3"/>
        <line x1="185" y1="44" x2="95" y2="160" stroke="#2563eb" stroke-width="3"/>
        <line x1="185" y1="44" x2="235" y2="160" stroke="#2563eb" stroke-width="3"/>
        <line x1="185" y1="44" x2="275" y2="112" stroke="#2563eb" stroke-width="3"/>
        <line x1="185" y1="44" x2="135" y2="112" stroke="#2563eb" stroke-width="3"/>
        <line x1="185" y1="44" x2="185" y2="136" stroke="#dc2626" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="184" y="35" font-size="15">V</text><text x="82" y="176" font-size="15">A</text>
        <text x="238" y="176" font-size="15">B</text><text x="280" y="110" font-size="15">C</text>
        <text x="122" y="108" font-size="15">D</text>
        <text x="255" y="145" font-size="13">BC=4</text><text x="148" y="108" font-size="13">CD=2</text>
        <text x="222" y="76" font-size="13">VD=7</text>
        """
        return svg_wrap(inner, label="直立角錐體，底為長方形 ABCD，VD=7，BC=4，CD=2")
    return placeholder_svg(description or "Figure placeholder: insert figure description")


def clean_answer_value(value: str) -> str:
    value = value.replace("$3 215", "HK$3 215")
    value = value.replace("m²", "平方米")
    value = value.replace(r"\text{ cm}^3", r"\text{ 立方厘米}")
    return math_to_html(value)


def math_to_html(text: str) -> str:
    text = text.replace("m²", "平方米").replace("cm³", "立方厘米")
    text = text.replace(r"\$", "HK$")
    text = text.replace("HK$", "HK_DOLLAR_")
    text = re.sub(r"\$(.+?)\$", lambda m: r"\(" + m.group(1) + r"\)", text)
    text = text.replace("HK_DOLLAR_", "HK$")
    text = text.replace("**", "")
    return text


def trusted_rich_text(text: str) -> str:
    return math_to_html(text)


def inline_markdown(text: str) -> str:
    text = math_to_html(text)
    text = html.escape(text, quote=False)
    text = text.replace("&lt;br&gt;", "<br>")
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    return text


def solution_to_html(markdown: str) -> str:
    lines = [line.rstrip() for line in markdown.splitlines()]
    out: list[str] = []
    in_list = False

    def close_list() -> None:
        nonlocal in_list
        if in_list:
            out.append("</ol>")
            in_list = False

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped == "---":
            close_list()
            continue
        if stripped.startswith("## 第"):
            close_list()
            continue
        heading = re.match(r"【(.+?)】(.*)", stripped)
        if heading:
            close_list()
            title, rest = heading.groups()
            out.append(f"<h3>{html.escape(title)}</h3>")
            if rest.strip():
                out.append(f"<p>{inline_markdown(rest.strip())}</p>")
            continue
        numbered = re.match(r"(\d+)\.\s+(.*)", stripped)
        if numbered:
            if not in_list:
                out.append("<ol>")
                in_list = True
            out.append(f"<li>{inline_markdown(numbered.group(2))}</li>")
            continue
        if stripped.startswith("- "):
            close_list()
            out.append(f"<p class=\"trap-item\">{inline_markdown(stripped[2:])}</p>")
            continue
        close_list()
        out.append(f"<p>{inline_markdown(stripped)}</p>")
    close_list()
    return "\n".join(out)


def parse_solutions() -> dict[int, str]:
    text = SOLUTIONS_MD.read_text(encoding="utf-8")
    matches = list(re.finditer(r"^## 第\s*(\d+)\s*題.*$", text, flags=re.M))
    sections: dict[int, str] = {}
    for i, match in enumerate(matches):
        qn = int(match.group(1))
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        sections[qn] = text[start:end]
    if len(sections) != 45:
        raise RuntimeError(f"Expected 45 solution sections, found {len(sections)}")
    return sections


def extract_topic(section: str) -> str:
    match = re.search(r"【考核重點】(.+)", section)
    return math_to_html(match.group(1).strip()) if match else "考核重點"


def options_html(options: list[str]) -> str:
    labels = ["A", "B", "C", "D"]
    return "\n".join(
        f'<li><span class="choice-label">{labels[i]}</span><span>{inline_markdown(option)}</span></li>'
        for i, option in enumerate(options)
    )


def question_figure(data: dict[str, object]) -> str:
    key = data.get("figure_key")
    if isinstance(key, str):
        return figure_svg(key)
    desc = data.get("figure")
    if isinstance(desc, str):
        return placeholder_svg(desc)
    return ""


CSS = """
* { box-sizing: border-box; }
body { margin: 0; font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif; background: #f5f6fa; color: #1f2937; line-height: 1.7; padding-bottom: 84px; }
.top-nav { position: sticky; top: 0; background: #2c3e50; color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 20; }
.menu-btn { cursor: pointer; font-size: 20px; background: none; border: 0; color: white; }
.back-btn { color: white; text-decoration: none; }
.sidebar { position: fixed; left: -260px; top: 0; bottom: 0; width: 260px; background: #34495e; color: white; transition: left 0.25s; z-index: 30; padding: 20px; overflow: auto; }
.sidebar.open { left: 0; }
.sidebar a { color: white; text-decoration: none; display: block; padding: 7px 0; }
.container { width: min(960px, calc(100% - 28px)); margin: 22px auto; }
.question { background: white; padding: 22px; border-radius: 8px; box-shadow: 0 2px 8px rgba(15,23,42,0.08); margin-bottom: 18px; }
h1, h2, h3 { color: #243447; line-height: 1.35; }
h1 { font-size: 1.7rem; margin: 0 0 18px; }
h2 { font-size: 1.35rem; margin: 0 0 10px; }
h3 { font-size: 1.1rem; margin: 18px 0 8px; }
.topic { color: #64748b; margin-bottom: 14px; }
.banner { background: #fff7ed; border: 1px solid #fdba74; color: #9a3412; padding: 10px 12px; border-radius: 6px; margin-bottom: 14px; font-weight: 700; }
.answer { margin-top: 15px; padding: 15px; background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; }
.choices { list-style: none; padding: 0; margin: 14px 0 0; display: grid; gap: 8px; }
.choices li { display: grid; grid-template-columns: 34px 1fr; gap: 8px; align-items: start; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
.choice-label { width: 28px; height: 28px; border-radius: 50%; background: #dbeafe; color: #1d4ed8; display: inline-grid; place-items: center; font-weight: 700; }
.figure-svg { margin: 16px 0; overflow-x: auto; }
.figure-svg svg { width: min(100%, 520px); height: auto; display: block; background: white; border: 1px solid #e2e8f0; border-radius: 8px; }
.solution p, .solution li { margin: 8px 0; }
.trap-item { padding-left: 12px; border-left: 3px solid #cbd5e1; }
.review-bar { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 12px; display: flex; gap: 12px; justify-content: center; box-shadow: 0 -2px 10px rgba(15,23,42,0.12); }
.review-btn { padding: 10px 22px; border: 0; border-radius: 8px; cursor: pointer; font-size: 15px; color: white; min-width: 110px; }
.correct { background: #16a34a; }
.wrong { background: #dc2626; }
.data-table, .stem-table { border-collapse: collapse; margin: 14px 0; width: auto; max-width: 100%; }
.data-table th, .data-table td, .stem-table th, .stem-table td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; }
@media (max-width: 560px) {
  .container { width: min(100% - 18px, 960px); margin-top: 12px; }
  .question { padding: 16px; }
  .choices li { grid-template-columns: 30px 1fr; }
  .review-btn { min-width: 92px; padding: 9px 14px; }
}
"""


def q_page(qn: int, section: str, answers: dict[str, object]) -> str:
    data = QUESTIONS[qn]
    answer_key = answers["answer_key"][str(qn)]
    raw_value = answers.get("answer_values", {}).get(str(qn), "")
    answer_value = clean_answer_value(raw_value) if isinstance(raw_value, str) and raw_value else ""
    topic = extract_topic(section)
    figure = question_figure(data)
    banner = f'<div class="banner">{FIGURE_BANNER}</div>' if qn in GATED else ""
    detail = solution_to_html(section)
    sidebar_links = "\n".join(f'<a href="q{i}.html">Q{i}</a>' for i in range(1, 46))
    answer_line = f"{answer_key}" + (f"（{answer_value}）" if answer_value else "")
    return f"""<!DOCTYPE html>
<html lang="zh-HK">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>卷二 Q{qn} - 2025-26 S5 Term3</title>
    <script>
        MathJax = {{
            tex: {{ inlineMath: [['\\\\(', '\\\\)']], displayMath: [['$$', '$$']], processEscapes: true }},
            svg: {{ fontCache: 'global' }}
        }};
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>{CSS}</style>
</head>
<body>
    <div class="top-nav">
        <button class="menu-btn" onclick="toggleSidebar()" aria-label="開啟題目選單">☰</button>
        <a href="../p2.html" class="back-btn">← 返回卷二</a>
        <span>Q{qn}</span>
    </div>
    <div class="sidebar" id="sidebar"><button class="menu-btn" onclick="toggleSidebar()" aria-label="關閉題目選單">×</button>{sidebar_links}</div>
    <main class="container">
        <section class="question">
            {banner}
            <h1>第 {qn} 題</h1>
            <div class="topic">考核重點：{inline_markdown(topic)}</div>
            <div class="question-text">{trusted_rich_text(str(data["text"]))}</div>
            {figure}
            <ol class="choices">{options_html(data["options"])}</ol>
            <div class="answer">
                <h2>答案</h2>
                <p>{answer_line}</p>
            </div>
        </section>
        <section class="question solution">
            <h2>詳解</h2>
            {detail}
        </section>
    </main>
    <div class="review-bar">
        <button class="review-btn correct">正確</button>
        <button class="review-btn wrong">錯誤</button>
    </div>
    <script>function toggleSidebar(){{document.getElementById("sidebar").classList.toggle("open");}}</script>
</body>
</html>
"""


def term_index() -> str:
    return """<!DOCTYPE html>
<html lang="zh-HK">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2025-26 中五 第三學期 數學科考試</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Noto Sans TC', sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .header h1 { color: #2c3e50; margin-bottom: 10px; }
        .header p { color: #666; }
        .back-btn { display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin-bottom: 20px; }
        .back-btn:hover { background: #2980b9; }
        .paper-cards { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
        .paper-card { flex: 1; min-width: 280px; max-width: 350px; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; text-decoration: none; color: inherit; }
        .paper-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        .paper-card-icon { font-size: 3em; margin-bottom: 15px; }
        .paper-card-title { font-size: 1.5em; color: #2c3e50; margin-bottom: 10px; font-weight: bold; }
        .paper-card-info { color: #666; margin-bottom: 15px; }
        .paper-card-btn { display: inline-block; padding: 12px 30px; background: #3498db; color: white; border-radius: 25px; font-weight: bold; }
        .hamburger { position: fixed; top: 15px; left: 15px; cursor: pointer; padding: 8px; z-index: 100; background: rgba(0,0,0,0.3); border-radius: 5px; }
        .hamburger span { display: block; width: 25px; height: 3px; background: white; margin: 5px 0; border-radius: 2px; }
        .menu-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 99; }
        .menu-overlay.open { display: block; }
        .side-menu { visibility: hidden; position: fixed; top: 0; right: -280px; width: 280px; height: 100%; background: white; z-index: 100; transition: right 0.3s; }
        .side-menu.open { visibility: visible; right: 0; }
        .side-menu-header { padding: 20px; background: #2c3e50; color: white; display: flex; justify-content: space-between; align-items: center; }
        .close-menu { cursor: pointer; font-size: 1.5rem; }
        .side-menu-content { padding: 10px; }
        .menu-btn { display: block; width: 100%; padding: 12px 15px; margin: 5px 0; border: none; border-radius: 8px; background: #f5f7fa; cursor: pointer; text-align: left; font-size: 1rem; }
    </style>
</head>
<body>
    <div class="hamburger" onclick="toggleMenu()"><span></span><span></span><span></span></div>
    <div class="menu-overlay" id="menuOverlay" onclick="closeMenu()"></div>
    <div class="side-menu" id="sideMenu">
        <div class="side-menu-header"><h2>選單</h2><span class="close-menu" onclick="closeMenu()">✕</span></div>
        <div class="side-menu-content"><button class="menu-btn" onclick="goToPage('index.html'); closeMenu();">首頁</button></div>
    </div>
    <div class="container">
        <a href="../../" class="back-btn">← 返回主頁</a>
        <div class="header">
            <h1>2025-26 中五 第三學期 數學科考試</h1>
            <p>卷二選擇題溫習</p>
        </div>
        <div class="paper-cards">
            <a href="p2.html" class="paper-card">
                <div class="paper-card-icon">📝</div>
                <div class="paper-card-title">卷二</div>
                <div class="paper-card-info">選擇題<br>共 45 題<br>總分：45分</div>
                <div class="paper-card-btn">開始溫習 →</div>
            </a>
        </div>
    </div>
    <script>
        function toggleMenu(){ document.getElementById('sideMenu').classList.toggle('open'); document.getElementById('menuOverlay').classList.toggle('open'); }
        function closeMenu(){ document.getElementById('sideMenu').classList.remove('open'); document.getElementById('menuOverlay').classList.remove('open'); }
        function goToPage(page){ window.location.href = page; }
    </script>
</body>
</html>
"""


def overview(answers: dict[str, object], sections: dict[int, str]) -> str:
    cards = []
    rows = []
    for qn in range(1, 46):
        key = answers["answer_key"][str(qn)]
        topic = extract_topic(sections[qn])
        cards.append(f'<a class="q-card" href="p2/q{qn}.html"><span>Q{qn}</span><strong>{key}</strong><small>{inline_markdown(topic)}</small></a>')
        rows.append(f'<tr><td><a href="p2/q{qn}.html">Q{qn}</a></td><td>{key}</td><td>{inline_markdown(topic)}</td></tr>')
    return f"""<!DOCTYPE html>
<html lang="zh-HK">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>卷二 - 2025-26 S5 Term3</title>
    <script>
        MathJax = {{ tex: {{ inlineMath: [['\\\\(', '\\\\)']], displayMath: [['$$', '$$']], processEscapes: true }}, svg: {{ fontCache: 'global' }} }};
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        * {{ box-sizing: border-box; }}
        body {{ margin: 0; font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif; background: #f5f6fa; color: #1f2937; line-height: 1.6; }}
        .top-nav {{ position: sticky; top: 0; background: #2c3e50; color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 20; }}
        .back-btn {{ color: white; text-decoration: none; }}
        .container {{ width: min(1080px, calc(100% - 28px)); margin: 24px auto; }}
        h1 {{ color: #243447; margin-bottom: 8px; }}
        .subtitle {{ color: #64748b; margin-bottom: 18px; }}
        .q-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin: 18px 0 28px; }}
        .q-card {{ min-height: 118px; text-decoration: none; color: #1f2937; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 13px; display: grid; gap: 4px; box-shadow: 0 2px 8px rgba(15,23,42,0.06); }}
        .q-card:hover {{ border-color: #3498db; }}
        .q-card span {{ color: #64748b; }}
        .q-card strong {{ color: #1d4ed8; font-size: 1.5rem; }}
        .q-card small {{ color: #475569; line-height: 1.35; }}
        table {{ width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(15,23,42,0.06); }}
        th, td {{ border-bottom: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; vertical-align: top; }}
        th {{ background: #eaf2f8; color: #243447; }}
        a {{ color: #1d4ed8; }}
    </style>
</head>
<body>
    <div class="top-nav"><a href="index.html" class="back-btn">← 主頁</a><span>卷二</span></div>
    <main class="container">
        <h1>2025-26 S5 Term3 卷二</h1>
        <p class="subtitle">45 條選擇題，題目已去除校名、教師名及學生資料；圖像以 inline SVG 顯示。</p>
        <section class="q-grid">{''.join(cards)}</section>
        <h2>答案一覽</h2>
        <table><thead><tr><th>題號</th><th>答案</th><th>考核重點</th></tr></thead><tbody>{''.join(rows)}</tbody></table>
    </main>
</body>
</html>
"""


def clean_file_text(text: str) -> str:
    return "\n".join(line.rstrip() for line in text.splitlines()) + "\n"


def main() -> None:
    P2_DIR.mkdir(parents=True, exist_ok=True)
    answers = json.loads(ANSWERS_JSON.read_text(encoding="utf-8"))
    sections = parse_solutions()
    for qn in range(1, 46):
        (P2_DIR / f"q{qn}.html").write_text(clean_file_text(q_page(qn, sections[qn], answers)), encoding="utf-8")
    (TERM_DIR / "index.html").write_text(clean_file_text(term_index()), encoding="utf-8")
    (TERM_DIR / "p2.html").write_text(clean_file_text(overview(answers, sections)), encoding="utf-8")


if __name__ == "__main__":
    main()
