document.addEventListener('DOMContentLoaded', () => {
    const containersDiv = document.getElementById('containers');
    const checkBtn = document.getElementById('check-btn');
    const resultDiv = document.getElementById('result');
    const timerDiv = document.getElementById('timer');
    const restartBtn = document.getElementById('restart-btn');
    const startBtn = document.getElementById('start-btn');
    const containerCountSelect = document.getElementById('container-count');

    let containers = [];
    let correctOrder = [];
    let startTime;
    let timerInterval;

    startBtn.addEventListener('click', initializeGame);

    function initializeGame() {
        const count = parseInt(containerCountSelect.value);
        containers = generateRandomColors(count);
        correctOrder = [...containers].sort();
        shuffle(containers);

        containersDiv.innerHTML = '';
        containers.forEach((color, index) => {
            const container = document.createElement('div');
            container.className = 'container';
            container.style.backgroundColor = color;
            container.draggable = true;
            container.dataset.index = index;
            container.addEventListener('dragstart', dragStart);
            container.addEventListener('dragover', dragOver);
            container.addEventListener('drop', drop);
            containersDiv.appendChild(container);
        });

        resultDiv.textContent = '';
        restartBtn.style.display = 'none';
        startTimer();
    }

    function generateRandomColors(count) {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown'];
        return colors.slice(0, count);
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function drop(e) {
        e.preventDefault();
        const fromIndex = e.dataTransfer.getData('text/plain');
        const toIndex = e.target.dataset.index;

        if (fromIndex !== toIndex) {
            swapContainers(fromIndex, toIndex);
        }
    }

    function swapContainers(fromIndex, toIndex) {
        const container1 = containersDiv.children[fromIndex];
        const container2 = containersDiv.children[toIndex];

        [container1.style.backgroundColor, container2.style.backgroundColor] = 
        [container2.style.backgroundColor, container1.style.backgroundColor];

        [containers[fromIndex], containers[toIndex]] = 
        [containers[toIndex], containers[fromIndex]];
    }

    function checkOrder() {
        let correctCount = 0;
        containers.forEach((color, index) => {
            if (color === correctOrder[index]) {
                correctCount++;
            }
        });

        if (correctCount === containers.length) {
            stopTimer();
            resultDiv.textContent = 'تبریک! شما برنده شدید!';
            restartBtn.style.display = 'block';
        } else {
            resultDiv.textContent = `تعداد ظروف در جای درست: ${correctCount} از ${containers.length}`;
        }
    }

    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            timerDiv.textContent = `زمان: ${elapsedTime} ثانیه`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    checkBtn.addEventListener('click', checkOrder);
    restartBtn.addEventListener('click', initializeGame);
});