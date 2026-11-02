const WATER_SOURCES = [
  {
    label: "Water from rinsing vegetables",
    image: "assets/images/rinsing-vegetables.jpg",
    imageAlt: "Fresh vegetables being rinsed with water",
    destination: "garden",
    explanation: "Vegetable rinse water can go on the garden, as it contains small amounts of nutrients."
  },
  {
    label: "Water from a quick shower",
    image: "assets/images/shower-water.jpg",
    imageAlt: "Water running from a shower head",
    destination: "toilet",
    explanation: "Shower water is useful for flushing toilets, do not use it if it contains harsh cleaners."
  },
  {
    label: "Water mixed with harsh bleach",
    image: "assets/images/water-mixed-with-bleach.jpg",
    imageAlt: "Water mixed with bleach in a cleaning container",
    destination: "trash",
    explanation: "Keep bleach water out of the garden and toilet; follow the product label for disposal."
  },
  {
    label: "Water from rinsing rice",
    image: "assets/images/rinsing-rice.jpg",
    imageAlt: "Rice being rinsed in a bowl of water",
    destination: "garden",
    explanation: "Rice-rinse water can go on the garden when it has no soap or salt."
  },
  {
    label: "Water used with a strong floor cleaner",
    image: "assets/images/water-floor-cleaning.webp",
    imageAlt: "Water prepared with floor cleaner for mopping",
    destination: "trash",
    explanation: "Do not reuse water with strong cleaners; follow the product label for disposal."
  }
];

export function initGreywaterGame() {
  const game = document.querySelector(".greywater-game");
  const round = document.querySelector(".greywater-round");
  const sourceLabel = document.querySelector("#greywater-source");
  const sourceImage = document.querySelector("#greywater-image");
  const progressLabel = document.querySelector("#greywater-progress");
  const feedback = document.querySelector("#greywater-feedback");
  const destinationGroup = document.querySelector(".greywater-destinations");
  const destinations = [...document.querySelectorAll(".greywater-destination")];
  const nextButton = document.querySelector(".greywater-next");
  const results = document.querySelector(".greywater-results");
  const resultsHeading = document.querySelector(".greywater-results-heading");
  const scoreLabel = document.querySelector(".greywater-score");
  const restartButton = document.querySelector(".greywater-restart");

  if (!game || !round || !sourceLabel || !sourceImage || !progressLabel || !feedback || !destinationGroup || destinations.length !== 3 || !nextButton || !results || !resultsHeading || !scoreLabel || !restartButton) return;

  let sourceIndex = 0;
  let score = 0;

  const setSource = () => {
    const source = WATER_SOURCES[sourceIndex];
    game.dataset.state = "ready";
    sourceLabel.textContent = source.label;
    sourceImage.src = source.image;
    sourceImage.alt = source.imageAlt;
    progressLabel.textContent = `Source ${sourceIndex + 1} of ${WATER_SOURCES.length}`;
    feedback.textContent = "Choose where this water can go.";
    destinations.forEach((button) => {
      button.disabled = false;
    });
    destinations[0].focus();
  };

  const finishGame = () => {
    game.dataset.state = "complete";
    round.hidden = true;
    results.hidden = false;
    scoreLabel.textContent = `You got ${score} out of ${WATER_SOURCES.length} correct!`;
    resultsHeading.focus();
  };

  destinations.forEach((button) => {
    button.addEventListener("click", () => {
      const source = WATER_SOURCES[sourceIndex];
      const isCorrect = button.dataset.destination === source.destination;

      if (!isCorrect) {
        const correctButton = destinations.find((destinationButton) => destinationButton.dataset.destination === source.destination);
        if (!correctButton) throw new Error(`No destination button matches ${source.destination}.`);

        game.dataset.state = "incorrect";
        void game.offsetWidth;
        feedback.textContent = `Wrong, but you can try again after answering all questions!\nCorrect Answer: ${correctButton.textContent.trim()}. ${source.explanation}`;
      } else {
        score += 1;
        game.dataset.state = "correct";
        feedback.textContent = `Correct! ${source.explanation}`;
      }

      destinations.forEach((destinationButton) => {
        destinationButton.disabled = true;
      });
      destinationGroup.hidden = true;
      nextButton.hidden = false;
      nextButton.focus();
    });
  });

  nextButton.addEventListener("click", () => {
    nextButton.hidden = true;
    sourceIndex += 1;
    if (sourceIndex === WATER_SOURCES.length) {
      finishGame();
      return;
    }

    destinationGroup.hidden = false;
    setSource();
  });

  restartButton.addEventListener("click", () => {
    sourceIndex = 0;
    score = 0;
    results.hidden = true;
    round.hidden = false;
    destinationGroup.hidden = false;
    nextButton.hidden = true;
    setSource();
  });
}
