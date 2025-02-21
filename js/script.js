class CocaGame {
    constructor(container, config) {
        this.container = document.getElementById(container);
        
        if (!this.container) {
            console.error(`Element with id '${container}' not found.`);
            return;
        }

        this.config = config;
        this.containers = [];
        this.correctOrder = [];
        this.startTime = null;
        this.timerInterval = null;
        this.gameMode = config.gameMode || "free"; // تعیین حالت بازی
        this.attemptsLeft = config.challengeAttempts || 5; // برای حالت چالشی
        this.timeLimit = config.timeLimit || 30; // برای حالت زمانی
        this.loadLang(config.lang).then(langData => {
            this.lang = langData;
            this.init();
        });
    }

    async loadLang(lang) {
        const defaultLang = 'en';
        lang = lang || defaultLang;
    
        console.log(`Loading language file: ${lang}.json`); // بررسی مقدار lang
    
        try {
            const response = await fetch(`./lang/${lang}.json`);
            if (!response.ok) throw new Error(`Language file '${lang}.json' not found.`);
            
            const data = await response.json();
            console.log(`Language loaded successfully:`, data); // بررسی محتوای JSON
            return data;
        } catch (error) {
            console.warn(error.message);
    
            try {
                console.log(`Falling back to default language: ${defaultLang}.json`);
                const fallbackResponse = await fetch(`./lang/${defaultLang}.json`);
                if (!fallbackResponse.ok) throw new Error(`Default language file not found.`);
                
                return await fallbackResponse.json();
            } catch (fallbackError) {
                console.error(fallbackError.message);
                return {};
            }
        }
    }

    init() {
        this.createUI();
        this.setupEventListeners();
        // تنظیم direction بر اساس زبان
        if (this.lang.dir) {
            this.container.setAttribute("dir", this.lang.dir);
        }
    }

    createUI() {
        this.container.innerHTML = `
            <h1>${this.lang.title}</h1>
            <label for="container-count">${this.lang.selectLabel}</label>
            <select id="container-count">
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
            </select>
            <button id="start-btn">${this.lang.start}</button>
            <div id="containers"></div>
            ${this.gameMode === "challenging" ? `<div id="attempts">${this.lang.attemptsLeft}: ${this.attemptsLeft}</div>` : ""}
            <button id="check-btn">${this.lang.check}</button>
            <div id="result"></div>
            <div id="timer">${this.lang.time}</div>
            <button id="restart-btn" style="display:none;">${this.lang.restart}</button>
        `;
    }
    
    setupEventListeners() {
        this.container.querySelector('#start-btn').addEventListener('click', () => this.initializeGame());
        this.container.querySelector('#check-btn').addEventListener('click', () => this.checkOrder());
        this.container.querySelector('#restart-btn').addEventListener('click', () => this.initializeGame());
    }

    initializeGame() {
        const count = parseInt(this.container.querySelector('#container-count').value);
        this.containers = this.generateRandomColors(count);
        this.correctOrder = [...this.containers].sort();
        this.shuffle(this.containers);

        const containersDiv = this.container.querySelector('#containers');
        containersDiv.innerHTML = '';
        this.containers.forEach((color, index) => {
            const container = document.createElement('div');
            container.className = 'container';
            container.style.backgroundColor = color;
            container.draggable = true;
            container.dataset.index = index;
            container.addEventListener('dragstart', (e) => this.dragStart(e));
            container.addEventListener('dragover', (e) => this.dragOver(e));
            container.addEventListener('drop', (e) => this.drop(e));
            containersDiv.appendChild(container);
        });

        this.container.querySelector('#result').textContent = '';
        this.container.querySelector('#restart-btn').style.display = 'none';
        this.startTimer();
    }

    generateRandomColors(count) {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown'];
        return colors.slice(0, count);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
    }

    dragOver(e) {
        e.preventDefault();
    }

    drop(e) {
        e.preventDefault();
        const fromIndex = e.dataTransfer.getData('text/plain');
        const toIndex = e.target.dataset.index;

        if (fromIndex !== toIndex) {
            this.swapContainers(fromIndex, toIndex);
        }

        if (this.gameMode === "free") {
            this.updateCorrectCount();
        }
    }

    swapContainers(fromIndex, toIndex) {
        const containersDiv = this.container.querySelector('#containers');
        const container1 = containersDiv.children[fromIndex];
        const container2 = containersDiv.children[toIndex];

        [container1.style.backgroundColor, container2.style.backgroundColor] = [container2.style.backgroundColor, container1.style.backgroundColor];
        [this.containers[fromIndex], this.containers[toIndex]] = [this.containers[toIndex], this.containers[fromIndex]];

        if (this.gameMode === "free") {
            this.updateCorrectCount();
        }
    }

    updateCorrectCount() {
        let correctCount = 0;
        this.containers.forEach((color, index) => {
            if (color === this.correctOrder[index]) correctCount++;
        });

        this.container.querySelector('#result').textContent = `${this.lang.correctCountMessage.replace("{correct}", correctCount).replace("{total}", this.containers.length)}`;
    }

    checkOrder() {
        let correctCount = 0;
        this.containers.forEach((color, index) => {
            if (color === this.correctOrder[index]) correctCount++;
        });

        const resultDiv = this.container.querySelector('#result');
        if (correctCount === this.containers.length) {
            this.stopTimer();
            resultDiv.textContent = this.lang.winMessage;
            this.container.querySelector('#restart-btn').style.display = 'block';
        } else {
            resultDiv.textContent = `${this.lang.correctCountMessage.replace("{correct}", correctCount).replace("{total}", this.containers.length)}`;
        }

        if (this.gameMode === "challenging") {
            this.attemptsLeft--;
            this.container.querySelector('#attempts').textContent = `${this.lang.attemptsLeft}: ${this.attemptsLeft}`;
            if (this.attemptsLeft <= 0) {
                this.stopTimer();
                this.container.querySelector('#result').textContent = this.lang.gameOverMessage;
                this.container.querySelector('#restart-btn').style.display = 'block';
            }
        }
    }

    startTimer() {
        if (this.gameMode === "timed" && this.timeLimit > 0) {
            this.startTime = Date.now();
            this.timerInterval = setInterval(() => {
                const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
                const remainingTime = this.timeLimit - elapsedTime;

                this.container.querySelector('#timer').textContent = (this.lang.time).replace("{seconds}", remainingTime);;
                
                if (remainingTime <= 0) {
                    this.stopTimer();
                    this.container.querySelector('#result').textContent = this.lang.gameOverMessage;
                    this.container.querySelector('#restart-btn').style.display = 'block';
                }
            }, 1000);
        }
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    static make(container, config = {}) {
        return new CocaGame(container, config);
    }
}
