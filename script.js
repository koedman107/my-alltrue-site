// DOM 元素
const hanziContainer = document.getElementById('hanziContainer');
const promptTextElement = document.getElementById('promptText');
const loadTextBtn = document.getElementById('loadTextBtn');
const nextWordBtn = document.getElementById('nextWordBtn');
const prevWordBtn = document.getElementById('prevWordBtn');
const textInput = document.getElementById('textInput');
const clearButton = document.getElementById('clearBtn');
const animateButton = document.getElementById('animateBtn');
const progressText = document.getElementById('progressText');
const statusMessage = document.getElementById('statusMessage');
const loadingSpinner = document.getElementById('loadingSpinner');

// 字典資訊元素
const radicalName = document.getElementById('radical-name');
const strokeCount = document.getElementById('stroke-count');
const charDefinition = document.getElementById('char-definition');

// 顏色與基底設定（不包含寬高）
const COLORS = {
    outline: '#e2e8f0',
    stroke: '#36C1FF',
    highlight: '#10b981'
};

const WRITER_CONFIG_BASE = {
    padding: 0,
    showCharacter: false,
    showOutline: true,
    outlineColor: COLORS.outline,
    strokeColor: COLORS.stroke,
    drawingColor: COLORS.stroke,
    strokeAnimationSpeed: 1,
    delayBetweenStrokes: 200
};

// 根據容器計算實際 width/height 的 helper
function getWriterConfigForContainer(container) {
    const rect = container.getBoundingClientRect();
    // 使用容器的實際像素寬高（向下取整），並設置最小值避免太小
    const w = Math.max(80, Math.round(rect.width));
    const h = Math.max(80, Math.round(rect.height));
    return Object.assign({}, WRITER_CONFIG_BASE, { width: w, height: h });
}

async function fetchCharInfo(char) {
    if (!radicalName) return;
    try {
        const response = await fetch(`https://www.moedict.tw/uni/${char}`);
        const data = await response.json();

        radicalName.textContent = data.radical || "--";
        strokeCount.textContent = data.stroke_count || "--";
        charDefinition.textContent = data.heteronyms?.[0]?.definitions?.[0]?.def || "暫無解釋";
    } catch (err) {
        console.error('字典載入失敗:', err);
        charDefinition.textContent = "無法載入字典資訊";
    }
}

function showLoading(show) {
    if (!loadingSpinner) return;
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

function updateUIState() {
    if (charactersArray.length > 0) {
        progressText.textContent = `進度：${currentCharacterIndex + 1} / ${charactersArray.length}`;
    } else {
        progressText.textContent = `進度：0 / 0`;
    }

    if (charactersArray.length === 0) {
        nextWordBtn.disabled = true;
        if (prevWordBtn) prevWordBtn.disabled = true;
        clearButton.disabled = true;
        animateButton.style.display = 'none';
    } else {
        clearButton.disabled = false;
        animateButton.style.display = 'inline-block';

        nextWordBtn.disabled = (currentCharacterIndex >= charactersArray.length - 1);
        if (prevWordBtn) prevWordBtn.disabled = (currentCharacterIndex === 0);
    }
}

function destroyCurrentWriter() {
    try {
        if (currentWriter && typeof currentWriter.cancelQuiz === 'function') {
            currentWriter.cancelQuiz();
        }
    } catch (e) {
        // 忽略可能的錯誤
        console.warn('取消目前 writer 時出現錯誤：', e);
    } finally {
        currentWriter = null;
    }
}

async function loadCharacter(char) {
    showLoading(true);
    // 先取消舊的 writer（避免同時存在）
    destroyCurrentWriter();

    // 清空容器並顯示必要 UI
    if (hanziContainer) {
        hanziContainer.innerHTML = '';
        hanziContainer.style.display = 'block';
    }
    if (promptTextElement) promptTextElement.style.display = 'none';
    statusMessage.textContent = '請跟著描寫...';
    statusMessage.className = 'text-sm font-bold text-blue-600 h-5';

    // 抓取字典資訊（非同步，不等待）
    fetchCharInfo(char);

    try {
        // 根據當前容器尺寸產生配置（確保在元素已渲染且有尺寸時呼叫）
        const cfg = getWriterConfigForContainer(hanziContainer);

        // 建立 HanziWriter（create 會覆蓋容器內容）
        currentWriter = HanziWriter.create('hanziContainer', char, cfg);

        // 啟動 quiz 模式並綁定 callback
        currentWriter.quiz({
            onMistake: function() {
                statusMessage.textContent = '筆順錯誤，請重試！';
                statusMessage.className = 'text-sm font-bold text-red-500 h-5 shake';
                setTimeout(() => {
                    statusMessage.classList.remove('shake');
                }, 500);
            },
            onCorrectStroke: function() {
                statusMessage.textContent = '很好！繼續...';
                statusMessage.className = 'text-sm font-bold text-blue-600 h-5';
            },
            onComplete: function() {
                statusMessage.textContent = '太棒了！練習完成！';
                statusMessage.className = 'text-sm font-bold text-emerald-600 h-5';

                setTimeout(() => {
                    try {
                        if (currentWriter && typeof currentWriter.updateColor === 'function') {
                            currentWriter.updateColor('strokeColor', COLORS.highlight);
                        }
                    } catch (e) {
                        console.warn('更新顏色失敗：', e);
                    }
                    if (currentCharacterIndex < charactersArray.length - 1) {
                        nextWordBtn.classList.add('animate-pulse');
                    }
                }, 300);
            }
        });
    } catch (err) {
        console.error('載入 HanziWriter 失敗:', err);
        if (promptTextElement) promptTextElement.textContent = `無法載入「${char}」`;
    } finally {
        showLoading(false);
        updateUIState();
    }
}

function startPractice() {
    const text = textInput.value.trim();
    if (!text) return;
    charactersArray = text.replace(/\s+/g, '').split('');
    if (charactersArray.length === 0) return;

    currentCharacterIndex = 0;
    nextWordBtn.textContent = '下一個字';
    loadCharacter(charactersArray[currentCharacterIndex]);
}

// 事件監聽綁定
if (loadTextBtn) loadTextBtn.addEventListener('click', startPractice);
if (textInput) textInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') startPractice(); });

if (nextWordBtn) {
    nextWordBtn.addEventListener('click', () => {
        if (currentCharacterIndex < charactersArray.length - 1) {
            currentCharacterIndex++;
            nextWordBtn.classList.remove('animate-pulse');
            loadCharacter(charactersArray[currentCharacterIndex]);
        }
    });
}

if (prevWordBtn) {
    prevWordBtn.addEventListener('click', () => {
        if (currentCharacterIndex > 0) {
            currentCharacterIndex--;
            nextWordBtn.classList.remove('animate-pulse');
            loadCharacter(charactersArray[currentCharacterIndex]);
        }
    });
}

if (clearButton) {
    clearButton.addEventListener('click', () => {
        if (currentWriter) loadCharacter(charactersArray[currentCharacterIndex]);
    });
}

if (animateButton) {
    animateButton.addEventListener('click', () => {
        if (currentWriter) {
            statusMessage.textContent = '觀看示範中...';
            try {
                currentWriter.cancelQuiz();
            } catch (e) { /* ignore */ }
            currentWriter.animateCharacter({
                onComplete: () => {
                    statusMessage.textContent = '現在換你試試看！';
                    // 重新啟動當前字的 quiz 模式
                    loadCharacter(charactersArray[currentCharacterIndex]);
                }
            });
        }
    });
}

// 當視窗大小改變（手機旋轉或調整寬度）時，重建當前字以匹配新的容器大小
window.addEventListener('resize', () => {
    if (!charactersArray || charactersArray.length === 0) return;
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // 重新載入目前字（會根據新的容器尺寸建立 writer）
        loadCharacter(charactersArray[currentCharacterIndex]);
    }, 200);
});

// 初始啟動（若 input 有預設值會自動開始）
startPractice();