"use strict";

/**
 * Главная функция инициализации приложения «MemoryGame».
 * @param {string} containerId – идентификатор контейнера для размещения приложения
 * @param {object} params – объект с настройками приложения
 */
function appMemoryGame(containerId, params = {}) {
  console.log(`appMemoryGame: Инициализация приложения в контейнере #${containerId}...`);

  // Параметры по умолчанию
  params.css ||= "app.css";
  params.fileWithThemes ||= "";
  params.developerMode ||= false;
  params.difficulty ||= 2;
  params.cardWidth ||= 80;
  params.cardHeight ||= 100;
  params.lineWidth ||= 1;
  params.fieldBackgroundColor ||= "#f0f0f0";
  params.cardBackColor ||= "#ccc";
  params.matchedBorderColor ||= "green";
  params.gridColor ||= "#666";

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`appMemoryGame: Элемент с id="${containerId}" не найден в DOM.`);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.classList.add("appMemoryGame");
  container.append(wrapper);

  // Темы по умолчанию (fallback)
  const defaultThemes = [
    {
      name: "Животные",
      items: ["🐶", "🐱", "🐭", "🐰", "🦊", "🐻", "🐼", "🐨", "🐔", "🐷"]
    },
    {
      name: "Фрукты",
      items: ["🍎", "🍊", "🍇", "🍓", "🍌", "🍒", "🍑", "🥭", "🍍", "🥝"]
    },
    {
      name: "Цвета",
      items: ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🟫"]
    }
  ];

  // Основные переменные игры
  let themeData = [];
  let currentThemeIndex = 0;
  let totalPairs = params.difficulty;
  let matchedPairs = 0;
  let attempts = 0;
  let startTime = 0;
  let timerId = null;
  let firstCard = null;
  let secondCard = null;
  let isBoardLocked = true;
  let isGameStarted = false;
  let cards = [];
  let fieldDiv = null;

  // Список сложностей (количество пар)
  const difficulties = [2, 4, 6, 8, 10];
  let difficultyIndex = 0;

  // Список названий тем
  let themeNameList = [];
  let themeIndex = 0;

  // LocalStorage ключи
  const LS_PREFIX = containerId + "_memoryGame_";
  const LS_THEME_INDEX = LS_PREFIX + "themeIndex";
  const LS_DIFFICULTY = LS_PREFIX + "difficulty";

  // Ссылки на элементы управления
  let playButton = null;
  let difficultyValueEl = null;
  let themeValueEl = null;
  let foundPairsValueEl = null;
  let timeValueEl = null;
  let attemptsValueEl = null;

  // ----------------------------------------------------------------------------
  // Утилита для выбора правильной формы слова "пара"
  // ----------------------------------------------------------------------------
  function getPairWord(num) {
    if (num % 100 >= 11 && num % 100 <= 14) return "пар";
    const lastDigit = num % 10;
    if (lastDigit === 1) return "пара";
    if (lastDigit >= 2 && lastDigit <= 4) return "пары";
    return "пар";
  }

  // ----------------------------------------------------------------------------
  // Функция подключения пользовательского CSS
  // ----------------------------------------------------------------------------
  function loadCustomStyles() {
    if (params.css) {
      const link = document.createElement("link");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("href", params.css);
      document.head.append(link);
    }
  }

  // ----------------------------------------------------------------------------
  // Функция включения режима разработчика
  // ----------------------------------------------------------------------------
  function enableDeveloperMode() {
    if (params.developerMode) {
      console.log(`Developer mode enabled: ${containerId}`);
    }
  }

  // ----------------------------------------------------------------------------
  // Функция загрузки тем (из внешнего JSON или fallback)
  // ----------------------------------------------------------------------------
  function loadThemes() {
    if (!params.fileWithThemes) {
      console.warn("appMemoryGame: fileWithThemes не указан, используем defaultThemes.");
      themeData = defaultThemes.slice();
      themeNameList = themeData.map(t => t.name);
      initThemeIndex();
      showCurrentTheme();
      setupNewGame();
      return;
    }
    console.log(`appMemoryGame: Пытаемся загрузить темы из: ${params.fileWithThemes}`);
    fetch(params.fileWithThemes)
        .then(resp => {
          if (!resp.ok) throw new Error(`Ошибка загрузки JSON: ${resp.status}`);
          return resp.json();
        })
        .then(data => {
          let loadedThemes = data.themes || [];
          themeData = defaultThemes.concat(loadedThemes);
          console.log(`appMemoryGame: Всего тем после объединения: ${themeData.length}`);
          themeNameList = themeData.map(t => t.name);
          initThemeIndex();
          showCurrentTheme();
          setupNewGame();
        })
        .catch(err => {
          console.error("appMemoryGame: Ошибка при загрузке JSON:", err);
          themeData = defaultThemes.slice();
          themeNameList = themeData.map(t => t.name);
          initThemeIndex();
          showCurrentTheme();
          setupNewGame();
        })
        .finally(() => {
          if (playButton) {
            playButton.disabled = false;
            playButton.textContent = "Играть";
          }
        });
  }

  // ----------------------------------------------------------------------------
  // Загрузка сохранённого состояния игры (темы, сложности)
  // ----------------------------------------------------------------------------
  function loadGameState() {
    const savedDiff = localStorage.getItem(LS_DIFFICULTY);
    if (savedDiff) totalPairs = +savedDiff;
    const savedThemeIndex = localStorage.getItem(LS_THEME_INDEX);
    if (savedThemeIndex !== null) currentThemeIndex = +savedThemeIndex;
  }

  // ----------------------------------------------------------------------------
  // Отрисовка интерфейса: игровое поле, блоки счётчиков, панель управления
  // ----------------------------------------------------------------------------
  function showGameField() {
    wrapper.innerHTML = "";
    // Контейнер игрового поля
    const fieldContainer = document.createElement("div");
    fieldContainer.classList.add("fieldContainer");
    wrapper.append(fieldContainer);

    // Игровое поле
    fieldDiv = document.createElement("div");
    fieldDiv.classList.add("fieldDiv");
    // Применяем настройки внешнего вида через setFieldAppearance
    setFieldAppearance(params.fieldBackgroundColor, params.gridColor);
    fieldContainer.append(fieldDiv);

    // Левый блок: счётчик найденных пар
    const leftSide = document.createElement("div");
    leftSide.classList.add("leftSide");
    fieldContainer.append(leftSide);

    const foundPairsBox = document.createElement("div");
    foundPairsBox.classList.add("foundPairsBox");
    leftSide.append(foundPairsBox);

    const foundPairsLabel = document.createElement("div");
    foundPairsLabel.classList.add("foundPairsLabel");
    foundPairsLabel.textContent = "Количество отгаданных пар:";
    foundPairsBox.append(foundPairsLabel);

    foundPairsValueEl = document.createElement("div");
    foundPairsValueEl.classList.add("foundPairsValue");
    foundPairsValueEl.textContent = `0/${totalPairs}`;
    foundPairsBox.append(foundPairsValueEl);

    // Правый блок: результаты (время, неудачные попытки)
    const rightSide = document.createElement("div");
    rightSide.classList.add("rightSide");
    fieldContainer.append(rightSide);

    const resultsBox = document.createElement("div");
    resultsBox.classList.add("resultsBox");
    rightSide.append(resultsBox);

    const resultsTitle = document.createElement("div");
    resultsTitle.classList.add("resultsTitle");
    resultsTitle.textContent = "Результаты:";
    resultsBox.append(resultsTitle);

    const resultsRowLabels = document.createElement("div");
    resultsRowLabels.classList.add("resultsRowLabels");
    resultsBox.append(resultsRowLabels);

    const timeLabelBox = document.createElement("div");
    timeLabelBox.classList.add("timeLabelBox");
    timeLabelBox.textContent = "Время";
    resultsRowLabels.append(timeLabelBox);

    const attemptsLabelBox = document.createElement("div");
    attemptsLabelBox.classList.add("attemptsLabelBox");
    attemptsLabelBox.textContent = "Неудачные попытки";
    resultsRowLabels.append(attemptsLabelBox);

    const resultsRowValues = document.createElement("div");
    resultsRowValues.classList.add("resultsRowValues");
    resultsBox.append(resultsRowValues);

    timeValueEl = document.createElement("div");
    timeValueEl.classList.add("timeValue");
    timeValueEl.textContent = "00:00:00";
    resultsRowValues.append(timeValueEl);

    attemptsValueEl = document.createElement("div");
    attemptsValueEl.classList.add("attemptsValue");
    attemptsValueEl.textContent = "0";
    resultsRowValues.append(attemptsValueEl);

    // Нижняя панель: кнопки и блоки выбора
    const bottomControls = document.createElement("div");
    bottomControls.classList.add("bottomControls");
    wrapper.append(bottomControls);

    // Блок с кнопками "Играть" и "Перезапустить"
    const leftButtonBlock = document.createElement("div");
    leftButtonBlock.classList.add("leftButtonBlock");
    bottomControls.append(leftButtonBlock);

    playButton = document.createElement("button");
    playButton.textContent = params.fileWithThemes ? "Загрузка тем..." : "Играть";
    playButton.disabled = params.fileWithThemes ? true : false;
    playButton.addEventListener("click", startGame);
    leftButtonBlock.append(playButton);

    const restartBtn = document.createElement("button");
    restartBtn.textContent = "Перезапустить";
    restartBtn.addEventListener("click", restartGame);
    leftButtonBlock.append(restartBtn);

    // Блок "Уровень сложности"
    const difficultyBox = document.createElement("div");
    difficultyBox.classList.add("difficultyBox");
    bottomControls.append(difficultyBox);

    const diffLabel = document.createElement("div");
    diffLabel.classList.add("boxLabel");
    diffLabel.textContent = "Уровень\nсложности:";
    difficultyBox.append(diffLabel);

    const diffLeftBtn = document.createElement("button");
    diffLeftBtn.classList.add("diffLeftBtn");
    diffLeftBtn.textContent = "◀";
    diffLeftBtn.addEventListener("click", () => changeDifficulty(-1));
    difficultyBox.append(diffLeftBtn);

    difficultyValueEl = document.createElement("div");
    difficultyValueEl.classList.add("boxValue");
    difficultyBox.append(difficultyValueEl);

    const diffRightBtn = document.createElement("button");
    diffRightBtn.classList.add("diffRightBtn");
    diffRightBtn.textContent = "▶";
    diffRightBtn.addEventListener("click", () => changeDifficulty(1));
    difficultyBox.append(diffRightBtn);

    // Блок "Тема карточек"
    const themeBox = document.createElement("div");
    themeBox.classList.add("themeBox");
    bottomControls.append(themeBox);

    const themeLabel = document.createElement("div");
    themeLabel.classList.add("boxLabel");
    themeLabel.textContent = "Тема\nкарточек:";
    themeBox.append(themeLabel);

    const themeLeftBtn = document.createElement("button");
    themeLeftBtn.classList.add("themeLeftBtn");
    themeLeftBtn.textContent = "◀";
    themeLeftBtn.addEventListener("click", () => changeTheme(-1));
    themeBox.append(themeLeftBtn);

    themeValueEl = document.createElement("div");
    themeValueEl.classList.add("boxValue");
    themeBox.append(themeValueEl);

    const themeRightBtn = document.createElement("button");
    themeRightBtn.classList.add("themeRightBtn");
    themeRightBtn.textContent = "▶";
    themeRightBtn.addEventListener("click", () => changeTheme(1));
    themeBox.append(themeRightBtn);

    initDifficultyIndex();
    showCurrentDifficulty();
    initThemeIndex();
    showCurrentTheme();
  }

  // ----------------------------------------------------------------------------
  // Функция отрисовки карточек (модульная функция showCards)
  // ----------------------------------------------------------------------------
  function showCards() {
    if (!fieldDiv) return;
    fieldDiv.innerHTML = "";
    cards = [];
    const cardItems = getCardItemsArray();
    const fullSet = [...cardItems, ...cardItems];
    shuffleArray(fullSet);
    fullSet.forEach(item => {
      const cardObj = createCard(item);
      fieldDiv.append(cardObj.cardElement);
      cards.push(cardObj);
    });
  }

  // ----------------------------------------------------------------------------
  // Функции работы с уровнем сложности и темами
  // ----------------------------------------------------------------------------
  function initDifficultyIndex() {
    const idx = difficulties.indexOf(totalPairs);
    difficultyIndex = (idx >= 0) ? idx : 0;
  }
  function showCurrentDifficulty() {
    if (!difficultyValueEl) return;
    const num = difficulties[difficultyIndex];
    const word = getPairWord(num);
    difficultyValueEl.textContent = num + " " + word;
  }
  function changeDifficulty(direction) {
    difficultyIndex += direction;
    if (difficultyIndex < 0) difficultyIndex = difficulties.length - 1;
    if (difficultyIndex >= difficulties.length) difficultyIndex = 0;
    setDifficulty(difficulties[difficultyIndex]);
    showCurrentDifficulty();
  }

  function initThemeIndex() {
    if (currentThemeIndex < 0 || currentThemeIndex >= themeNameList.length) {
      currentThemeIndex = 0;
    }
    themeIndex = currentThemeIndex;
  }
  function showCurrentTheme() {
    if (!themeValueEl || !themeNameList.length) return;
    themeValueEl.textContent = themeNameList[themeIndex] || "fallback";
  }
  function changeTheme(direction) {
    if (!themeNameList.length) return;
    themeIndex += direction;
    if (themeIndex < 0) themeIndex = themeNameList.length - 1;
    if (themeIndex >= themeNameList.length) themeIndex = 0;
    currentThemeIndex = themeIndex;
    localStorage.setItem(LS_THEME_INDEX, currentThemeIndex);
    showCurrentTheme();
    setupNewGame();
  }

  // ----------------------------------------------------------------------------
  // Функция подготовки новой игры
  // ----------------------------------------------------------------------------
  function setupNewGame() {
    stopGame();
    matchedPairs = 0;
    attempts = 0;
    firstCard = null;
    secondCard = null;
    updateResultsPanel();
    showCards();
  }

  // ----------------------------------------------------------------------------
  // Функция получения массива элементов карточек
  // ----------------------------------------------------------------------------
  function getCardItemsArray() {
    if (themeData[currentThemeIndex] && themeData[currentThemeIndex].items) {
      let arr = themeData[currentThemeIndex].items.slice();
      shuffleArray(arr);
      return arr.slice(0, totalPairs);
    }
    console.warn("Тема не найдена, fallback (A,B,C...)");
    let fallbackArr = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    shuffleArray(fallbackArr);
    return fallbackArr.slice(0, totalPairs);
  }

  // ----------------------------------------------------------------------------
  // Функции управления игровым процессом
  // ----------------------------------------------------------------------------
  function startGame() {
    if (isGameStarted) return;
    isGameStarted = true;
    isBoardLocked = false;
    startTime = Date.now();
    timerId = setInterval(() => updateResultsPanel(), 1000);
  }
  function stopGame() {
    isGameStarted = false;
    isBoardLocked = true;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
  function restartGame() {
    setupNewGame();
  }
  function createCard(item) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("memoryCard");
    // Применяем размеры карточки через параметры
    cardElement.style.width = params.cardWidth + "px";
    cardElement.style.height = params.cardHeight + "px";
    cardElement.style.lineHeight = params.cardHeight + "px";
    cardElement.style.borderWidth = params.lineWidth + "px";
    cardElement.style.borderStyle = "solid";
    cardElement.style.borderColor = "#000";
    cardElement.style.backgroundColor = params.cardBackColor;

    const front = document.createElement("div");
    front.classList.add("cardFront");
    front.textContent = item;
    front.style.display = "none";

    const back = document.createElement("div");
    back.classList.add("cardBack");
    back.style.display = "block";

    cardElement.append(front, back);

    let isFlipped = false;
    let isMatched = false;

    cardElement.addEventListener("click", () => flipCard(cardElement, item));
    return { cardElement, item, front, back, isFlipped, isMatched };
  }
  function flipCard(cardElement, item) {
    if (isBoardLocked || !isGameStarted) return;
    const cardObj = cards.find(c => c.cardElement === cardElement);
    if (!cardObj || cardObj.isMatched || cardObj.isFlipped) return;
    cardObj.isFlipped = true;
    cardObj.front.style.display = "block";
    cardObj.back.style.display = "none";
    cardObj.cardElement.style.backgroundColor = "#fff";
    if (!firstCard) {
      firstCard = cardObj;
    } else if (!secondCard) {
      secondCard = cardObj;
      compareCards();
    }
  }
  function compareCards() {
    if (!firstCard || !secondCard) return;
    if (firstCard.item === secondCard.item) {
      highlightMatchedCards(firstCard, secondCard);
      matchedPairs++;
      trackMatchedPairs();
      setTimeout(() => {
        firstCard = null;
        secondCard = null;
        if (matchedPairs === totalPairs) endGame();
      }, 300);
    } else {
      isBoardLocked = true;
      attempts++;
      updateResultsPanel();
      setTimeout(() => {
        flipBack(firstCard);
        flipBack(secondCard);
        firstCard = null;
        secondCard = null;
        isBoardLocked = false;
      }, 1000);
    }
  }
  function flipBack(cardObj) {
    cardObj.isFlipped = false;
    cardObj.front.style.display = "none";
    cardObj.back.style.display = "block";
    cardObj.cardElement.style.backgroundColor = params.cardBackColor;
    cardObj.cardElement.style.borderColor = "#000";
  }
  function highlightMatchedCards(c1, c2) {
    c1.isMatched = true;
    c2.isMatched = true;
    c1.cardElement.style.borderWidth = "3px";
    c1.cardElement.style.borderColor = params.matchedBorderColor;
    c2.cardElement.style.borderWidth = "3px";
    c2.cardElement.style.borderColor = params.matchedBorderColor;
  }
  function trackMatchedPairs() {
    updateResultsPanel();
  }
  function updateResultsPanel() {
    if (foundPairsValueEl) {
      foundPairsValueEl.textContent = `${matchedPairs}/${totalPairs}`;
    }
    if (timeValueEl && attemptsValueEl) {
      let elapsed = 0;
      if (isGameStarted) {
        elapsed = Math.floor((Date.now() - startTime) / 1000);
      }
      const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
      const s = String(elapsed % 60).padStart(2, "0");
      timeValueEl.textContent = `${h}:${m}:${s}`;
      attemptsValueEl.textContent = `${attempts}`;
    }
  }
  function endGame() {
    stopGame();
    console.log("Игра завершена! Все пары найдены.");
  }
  function setDifficulty(newDiff) {
    totalPairs = newDiff;
    localStorage.setItem(LS_DIFFICULTY, newDiff);
    setupNewGame();
  }
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // -------------------------------------------------------------------------
  // МОДУЛЬНЫЕ ФУНКЦИИ
  // -------------------------------------------------------------------------

  // Функция для изменения размеров карточек
  function setCardSize(newWidth, newHeight) {
    params.cardWidth = newWidth;
    params.cardHeight = newHeight;
    cards.forEach(cardObj => {
      cardObj.cardElement.style.width = newWidth + "px";
      cardObj.cardElement.style.height = newHeight + "px";
      cardObj.cardElement.style.lineHeight = newHeight + "px";
    });
  }

  // Функция для изменения толщины линий (границ) карточек
  function setGridLineWidth(newLineWidth) {
    params.lineWidth = newLineWidth;
    cards.forEach(cardObj => {
      cardObj.cardElement.style.borderWidth = newLineWidth + "px";
    });
  }

  // Функция для изменения внешнего вида игрового поля
  function setFieldAppearance(newFieldBackgroundColor, newGridColor) {
    params.fieldBackgroundColor = newFieldBackgroundColor;
    params.gridColor = newGridColor;
    if (fieldDiv) {
      fieldDiv.style.backgroundColor = newFieldBackgroundColor;
      const fieldContainer = fieldDiv.parentElement;
      if (fieldContainer) {
        fieldContainer.style.borderColor = newGridColor;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Инициализация
  // -------------------------------------------------------------------------
  loadCustomStyles();
  enableDeveloperMode();
  loadGameState();
  showGameField();
  loadThemes();

  // Возвращаем объект с модульными функциями для использования разработчиком
  return {
    setCardSize,
    setGridLineWidth,
    setFieldAppearance,
    restartGame
  };
}
