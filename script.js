document.addEventListener('DOMContentLoaded', () => {
    // 狀態變數
    let charactersArray = [];
    let currentCharacterIndex = 0;
    let currentWriter = null;
    
    // DOM 元素
    const hanziContainer = document.getElementById('hanziContainer');
    const promptTextElement = document.getElementById('promptText');
    const loadTextBtn = document.getElementById('loadTextBtn');
    const nextWordBtn = document.getElementById('nextWordBtn');
    const textInput = document.getElementById('textInput');
    const clearButton = document.getElementById('clearBtn');
    const animateButton = document.getElementById('animateBtn');
    const progressText = document.getElementById('progressText');
    const statusMessage = document.getElementById('statusMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // 設定參數：已將筆劃改為亮藍色 #36C1FF
    const COLORS = {
        outline: '#e2e8f0',   // 淺灰底稿
        stroke: '#36C1FF',    // 亮藍色筆觸 (已更新)
        highlight: '#10b981'  // 綠色完成
    };
    
    const WRITER_CONFIG = {
        width: 500,
        height: 500,
        padding: 0, 
        showCharacter: false,
        showOutline: true,
        outlineColor: COLORS.outline,
        strokeColor: COLORS.stroke,
        drawingColor: COLORS.stroke,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 200
    };

    function showLoading(show) {
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
            clearButton.disabled = true;
            animateButton.style.display = 'none';
        } else {
            clearButton.disabled = false;
            animateButton.style.display = 'inline-block';
            nextWordBtn.disabled = true; 
        }
    }

    async function loadCharacter(char) {
        showLoading(true);
        hanziContainer.innerHTML = '';
        hanziContainer.style.display = 'block';
        promptTextElement.style.display = 'none';
        statusMessage.textContent = '請跟著描寫...';
        statusMessage.className = 'text-sm font-bold text-blue-600 h-5';
        
        nextWordBtn.disabled = true;
        nextWordBtn.classList.remove('animate-pulse');

        try {
            currentWriter = HanziWriter.create('hanziContainer', char, WRITER_CONFIG);
            
            currentWriter.quiz({
                onMistake: function() {
                    statusMessage.textContent = '筆順錯誤，請重試！';
                    statusMessage.className = 'text-sm font-bold text-red-500 h-5 shake';
                    setTimeout(() => statusMessage.classList.remove('shake'), 500);
                },
                onCorrectStroke: function() {
                    statusMessage.textContent = '很好！繼續...';
                    statusMessage.className = 'text-sm font-bold text-blue-600 h-5';
                },
                onComplete: function() {
                    statusMessage.textContent = '太棒了！練習完成！';
                    statusMessage.className = 'text-sm font-bold text-emerald-600 h-5';
                    
                    setTimeout(() => {
                        // 更新顏色為完成綠色
                        currentWriter.updateColor('strokeColor', COLORS.highlight);
                        
                        if (currentCharacterIndex < charactersArray.length - 1) {
                            nextWordBtn.disabled = false;
                            nextWordBtn.classList.add('animate-pulse');
                        } else {
                            nextWordBtn.textContent = '全部完成';
                        }
                    }, 300);
                }
            });

        } catch (err) {
            console.error('載入失敗:', err);
            promptTextElement.textContent = `無法載入「${char}」`;
        } finally {
            showLoading(false);
        }
    }

    function startPractice() {
        const text = textInput.value.trim();
        if (!text) return;
        charactersArray = text.replace(/\s+/g, '').split('');
        if (charactersArray.length === 0) return;

        currentCharacterIndex = 0;
        nextWordBtn.textContent = '下一個字';
        updateUIState();
        loadCharacter(charactersArray[currentCharacterIndex]);
    }

    // 事件監聽
    loadTextBtn.addEventListener('click', startPractice);
    textInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') startPractice(); });
    nextWordBtn.addEventListener('click', () => {
        if (currentCharacterIndex < charactersArray.length - 1) {
            currentCharacterIndex++;
            updateUIState();
            loadCharacter(charactersArray[currentCharacterIndex]);
        }
    });
    clearButton.addEventListener('click', () => {
        if (currentWriter) loadCharacter(charactersArray[currentCharacterIndex]);
    });
    animateButton.addEventListener('click', () => {
        if (currentWriter) {
            statusMessage.textContent = '觀看示範中...';
            currentWriter.cancelQuiz();
            currentWriter.animateCharacter({
                onComplete: () => {
                    statusMessage.textContent = '現在換你試試看！';
                    loadCharacter(charactersArray[currentCharacterIndex]); // 動畫完重新開始測驗
                }
            });
        }
    });

    startPractice();
});