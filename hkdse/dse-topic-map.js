// DSE 卷二題目課題分類
// 此檔案可以逐題更新以提供更準確的分類
const dseTopicMap = {
    "algebra": "代數與方程",
    "number": "數與數系",
    "geometry": "幾何",
    "coord": "坐標幾何",
    "trig": "三角學",
    "stats": "統計與概率",
    "mensuration": "求積法"
};

// 根據題號的預設課題分類（可按需更新）
function getQuestionTopic(questionId) {
    var qNum = parseInt(questionId.replace(/^\d{4}Q/, ''));
    if (qNum <= 8) return 'algebra';
    if (qNum <= 13) return 'number';
    if (qNum <= 20) return 'geometry';
    if (qNum <= 28) return 'coord';
    if (qNum <= 33) return 'trig';
    if (qNum <= 40) return 'stats';
    return 'mensuration';
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dseTopicMap, getQuestionTopic };
}
