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
    const prevWordBtn = document.getElementById('prevWordBtn'); // 新增：上一個字按鈕
    const textInput = document.getElementById('textInput');
    const clearButton = document.getElementById('clearBtn');
    const animateButton = document.getElementById('animateBtn');
    const progressText = document.getElementById('progressText');
    const statusMessage = document.getElementById('statusMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // 新增：字典資訊元素 (請確保 HTML 有對應 ID)
    const radicalName = document.getElementById('radical-name');
    const strokeCount = document.getElementById('stroke-count');
    const charDefinition = document.getElementById('char-definition');
    
    // 設定參數
    const COLORS = {
        outline: '#e2e8f0',   
        stroke: '#36C1FF',    
        highlight: '#10b981'  
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

    // 新增：抓取萌典資料功能
    async function fetchCharInfo(char) {
        if (!radicalName) return; // 防止 HTML 沒寫標籤導致噴錯
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
            
            // 自由切換模式：不強制鎖定按鈕，由 index 判斷是否可按
            nextWordBtn.disabled = (currentCharacterIndex >= charactersArray.length - 1);
            if (prevWordBtn) prevWordBtn.disabled = (currentCharacterIndex === 0);
        }
    }

    async function loadCharacter(char) {
        showLoading(true);
        hanziContainer.innerHTML = '';
        hanziContainer.style.display = 'block';
        promptTextElement.style.display = 'none';
        statusMessage.textContent = '請跟著描寫...';
        statusMessage.className = 'text-sm font-bold text-blue-600 h-5';
        
        // 抓取字典資訊
        fetchCharInfo(char);

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
                        currentWriter.updateColor('strokeColor', COLORS.highlight);
                        // 寫完後可以讓下一個字按鈕閃爍，提示使用者可以跳下一個
                        if (currentCharacterIndex < charactersArray.length - 1) {
                            nextWordBtn.classList.add('animate-pulse');
                        }
                    }, 300);
                }
            });

        } catch (err) {
            console.error('載入失敗:', err);
            promptTextElement.textContent = `無法載入「${char}」`;
        } finally {
            showLoading(false);
            updateUIState(); // 每次載入完確保按鈕狀態正確
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

    // 事件監聽
    loadTextBtn.addEventListener('click', startPractice);
    textInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') startPractice(); });
    
    nextWordBtn.addEventListener('click', () => {
        if (currentCharacterIndex < charactersArray.length - 1) {
            currentCharacterIndex++;
            nextWordBtn.classList.remove('animate-pulse');
            loadCharacter(charactersArray[currentCharacterIndex]);
        }
    });
// 必須補上這兩行，關閉事件監聽與 startPractice 呼叫
    startPractice(); 
});