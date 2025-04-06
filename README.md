# Memory Game

**Memory Game** – это веб-игра на запоминание, реализованная с использованием HTML, CSS и JavaScript. Игра предлагает выбрать тему карточек, установить уровень сложности и насладиться поиском пар.

## Оглавление

- [Особенности](#особенности)
- [Установка и запуск](#установка-и-запуск)
- [Структура проекта](#структура-проекта)
- [Настройка игры](#настройка-игры)
- [Использование модульных функций](#использование-модульных-функций)
- [Лицензия](#лицензия)

## Особенности

- Выбор тем карточек (животные, фрукты, цвета и пользовательские темы)
- Настройка уровня сложности (количество пар карточек)
- Режим разработчика для отладки и тестирования
- Подсчет времени и количества попыток
- Адаптивный дизайн игрового поля

## Установка и запуск

1. **Клонируйте репозиторий:**

   ```bash
   git clone https://github.com/your-username/your-repository.git
   ```

2. **Перейдите в папку проекта:**

   ```bash
   cd your-repository
   ```

3. **Откройте файл `index.html` в браузере:**

   Просто дважды кликните по файлу `index.html` или используйте локальный сервер (например, Live Server в VS Code).

## Структура проекта

```
your-repository/
├── index.html       # Главная страница
├── app.js           # Логика игры
├── app.css          # Стили
├── themes.json      # (опционально) дополнительные темы
└── README.md        # Документация проекта
```

## Настройка игры

Игра инициализируется вызовом функции `appMemoryGame`:

```html
<script>
  window.addEventListener("load", () => {
    const game = appMemoryGame("appMemoryGameContainer", {
      css: "app.css",
      fileWithThemes: "", // JSON файл с темами (если есть)
      developerMode: true,
      difficulty: 4,
      cardWidth: 80,
      cardHeight: 100,
      lineWidth: 2,
      fieldBackgroundColor: "#f0f0f0",
      cardBackColor: "#ccc",
      matchedBorderColor: "green",
      gridColor: "#666"
    });

    // Примеры использования:
    // game.setCardSize(90, 110);
    // game.setGridLineWidth(10);
    // game.setFieldAppearance("#ffffff", "#000");
  });
</script>
```

## Использование модульных функций

После инициализации возвращается объект с функциями:

- `setCardSize(width, height)` – изменить размеры карточек
- `setGridLineWidth(px)` – изменить толщину рамки
- `setFieldAppearance(bgColor, gridColor)` – изменить фон и цвет сетки
- `restartGame()` – перезапустить игру

## Лицензия

Этот проект распространяется под лицензией MIT.
