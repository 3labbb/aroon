import { resetTestWordsAndLetters, testLetters, testConfig } from "./test.js";

const typingTest = document.querySelector(".typing-test");
const testContainer = document.querySelector(".test");
const testText = document.querySelector(".test-text");
const userInput = document.getElementById("userInput");
const testInfo = document.querySelector(".time-word-info");
const testResult = document.querySelector(".test-results");
const testConfiguration = document.querySelector(".test-config");
const startingTextContainer = document.querySelector(".starting-text");
const textOverlay = document.querySelector(".overlay");
const wordPerMinuteContainer = document.querySelector(".wpm");
const accContainer = document.querySelector(".acc");
const testTypeResultInfo = document.querySelector(".test-type");
const timeInfoContainer = document.querySelector(".time");
const startBtn = document.getElementById("startBtn");

let currentIndex = 0;
let userInputLetters = [];
let wrongLetters = [];
let timer;
let startDuration, endDuration, duration;
let numberOfWords = 0;
let allowUserInput = true;
let testStarted = false;

// hold the paragraph from backend
let backendWords = [];

startBtn.addEventListener("click", () => {
  if (!testStarted) {
    textOverlay.click();
  }
  testStarted = true;
  allowUserInput = true;
});

// start test when clicking overlay or typing area
textOverlay.addEventListener("click", async () => {
  if (!testStarted) {
    await loadParagraphFromBackend();
    startTypingTest();
  }
});

typingTest.addEventListener("click", async () => {
  if (!testStarted) {
    await loadParagraphFromBackend();
    startTypingTest();
  }
});

function startTypingTest() {
  initTest();
  setUpUserInput();
  setDuration();
  testStarted = true;
  allowUserInput = true;
}

userInput.addEventListener("blur", () => allowUserInput && userInput.focus());
userInput.addEventListener("input", startTest);

function setUpUserInput() {
  userInput.focus();
  testLetters[currentIndex].classList.add("cursor");

  if (testConfig["test-by"] === "words") {
    updateNumberOfWords();
    testInfo.innerHTML = `${numberOfWords} / ${testConfig["time-word-config"]}`;
  } else {
    setTimer(testConfig["time-word-config"]);
  }
}

function startTest() {
  if (currentIndex < testLetters.length - 1) {
    handleUserInput(this);
    updateNumberOfWords();

    if (testConfig["test-by"] === "words") {
      testInfo.innerHTML = `${numberOfWords} / ${testConfig["time-word-config"]}`;
    }
  } else {
    clearInterval(timer);
    showResult();
  }
  handleCursor();
}

function handleUserInput(input) {
  userInputLetters = input.value.split("");
  const userCurrentLetter = userInputLetters[currentIndex];
  const testCurrentLetter = testLetters[currentIndex].textContent;

  if (userCurrentLetter !== undefined) {
    if (userCurrentLetter === testCurrentLetter) {
      correctLetter();
    } else {
      wrongLetter();
    }
    currentIndex++;
  } else {
    currentIndex--;
    testLetters[currentIndex].className = "letter";
  }
}

function correctLetter() {
  if (!wrongLetters.includes(testLetters[currentIndex].id)) {
    testLetters[currentIndex].classList.add("correct");
  } else {
    if (testLetters[currentIndex].textContent !== " ") {
      testLetters[currentIndex].classList.add("updated");
    } else {
      testLetters[currentIndex].classList.add("updated-space");
    }
  }
}

function wrongLetter() {
  if (testLetters[currentIndex].textContent !== " ") {
    if (!wrongLetters.includes(testLetters[currentIndex])) {
      testLetters[currentIndex].classList.add("wrong");
    } else {
      testLetters[currentIndex].classList.add("updated");
    }
  } else {
    testLetters[currentIndex].classList.add("wrong-space");
  }
  wrongLetters.push(testLetters[currentIndex].id);
}

function handleCursor() {
  testLetters.map((elm) => elm.classList.remove("cursor"));
  testLetters[currentIndex]?.classList.add("cursor");
}

function updateNumberOfWords() {
  const currentWordNumber = testLetters[currentIndex].parentNode.id;
  numberOfWords = parseInt(currentWordNumber) - 1;
}

function setDuration() {
  startDuration = Date.now();
}

function stopDuration() {
  endDuration = Date.now();
  duration = parseInt((endDuration - startDuration) / 1000);
}

function showResult() {
  stopDuration();

  const [WPM, accuracy] = calculateUserTestResult();
  const [minutes, seconds] = handleMinutesAndSeconds(duration);

  wordPerMinuteContainer.innerHTML = WPM;
  accContainer.innerHTML = `${accuracy}%`;
  timeInfoContainer.innerHTML = `${minutes}:${seconds}`;

  createTestTypeInfo();
  reInitTest();
  testResult.classList.add("show");
}

function calculateUserTestResult() {
  const avgEnglishWordLength = 5;
  const numberOfWrongWords = wrongLetters.length / avgEnglishWordLength;
  const numberOfCorrectWords = numberOfWords - Math.ceil(numberOfWrongWords);
  const acc = Math.floor((numberOfCorrectWords / numberOfWords) * 100);
  const wpm = Math.floor(numberOfCorrectWords / (duration / 60));

  const WPM = wpm >= 0 ? wpm : 0;
  const accuracy = acc >= 0 ? acc : 0;
  return [WPM, accuracy];
}

// fetch paragraphs from backend.json
async function loadParagraphFromBackend() {
  try {
    const res = await fetch("./assets/backend.json"); // adjust if path differs
    const data = await res.json();

    if (!data.paragraphs || !Array.isArray(data.paragraphs)) {
      console.error("No paragraphs found in backend.json");
      backendWords = [];
      return;
    }

    const randomIndex = Math.floor(Math.random() * data.paragraphs.length);
    const paragraph = data.paragraphs[randomIndex];

    backendWords = paragraph.split(" ");
  } catch (err) {
    console.error("Error loading paragraph:", err);
    backendWords = [];
  }
}

export async function initTest() {
  testConfiguration.classList.add("hide");
  testResult.classList.remove("show");

  testInfo.innerHTML = "";
  testInfo.classList.remove("hide");

  testContainer.classList.remove("shadow");
  textOverlay.classList.add("hide");
  startingTextContainer.classList.add("hide");

  typingTest.classList.add("no-click");

  testWords = backendWords;
  createWords();
}

function createLetter(letter, parentContainer, i, j) {
  const letterSpan = document.createElement("span");
  letterSpan.innerText = letter;
  letterSpan.className = "letter";
  letterSpan.id = `${i}:${j}`;
  parentContainer.appendChild(letterSpan);
  testLetters.push(letterSpan);
}

function createWords() {
  for (let i = 0; i < testWords.length; i++) {
    const wordDiv = document.createElement("div");
    wordDiv.id = i + 1;
    wordDiv.className = "word";

    [...testWords[i]].forEach((letter, j) => {
      createLetter(letter, wordDiv, i + 1, j + 1);
    });

    if (i < testWords.length - 1) {
      createLetter(" ", wordDiv, i + 1, testWords[i].length + 1);
    }

    testText.appendChild(wordDiv);
  }
}

function createTestTypeInfo() {
  testTypeResultInfo.innerHTML = "";

  const testBySpan = document.createElement("span");
  testBySpan.innerHTML = `test by ${testConfig["test-by"]}`;
  testTypeResultInfo.appendChild(testBySpan);

  testConfig["include-to-test"].map((elm) => {
    const span = document.createElement("span");
    span.innerHTML = `include ${elm}`;
    testTypeResultInfo.appendChild(span);
  });

  if (testConfig["test-by"] === "words") {
    const numberOfWordsSpan = document.createElement("span");
    numberOfWordsSpan.innerHTML = `test of ${testConfig["time-word-config"]} words`;
    testTypeResultInfo.appendChild(numberOfWordsSpan);
  } else {
    const testTime = document.createElement("span");
    testTime.innerHTML = `chosen time ${testConfig["time-word-config"]}s`;
    testTypeResultInfo.appendChild(testTime);
  }
}

function setTimer(seconds) {
  timer = setInterval(() => {
    let [numberOfMinutes, numberOfSeconds] = handleMinutesAndSeconds(seconds);
    testInfo.innerHTML = `${numberOfMinutes}:${numberOfSeconds}`;

    if (--seconds < 0) {
      clearInterval(timer);
      showResult();
    }
  }, 1000);
}

function handleMinutesAndSeconds(numberOfSeconds) {
  let minutes = parseInt(numberOfSeconds / 60);
  let seconds = numberOfSeconds % 60;
  seconds = seconds > 9 ? seconds : `0${seconds}`;
  return [minutes, seconds];
}

function reInitTest() {
  testText.innerHTML = "";
  testConfiguration.classList.remove("hide");
  testInfo.classList.add("hide");
  testContainer.classList.add("shadow");
  textOverlay.classList.remove("hide");
  startingTextContainer.classList.remove("hide");
  typingTest.classList.remove("no-click");
  currentIndex = 0;
  numberOfWords = 0;
  wrongLetters = [];
  resetTestWordsAndLetters();
  duration = 0;
  userInput.value = "";
  allowUserInput = false;
  userInputLetters = [];
  userInput.blur();
  testStarted = false;
}
