import { initTest, resetTestWordsAndLetters, testLetters, testConfig } from "./test.js";

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

startBtn.addEventListener("click", () => {
  if (!testStarted) {
    typingTest.click();
  }
  testStarted = true;
  allowUserInput = true;
});

typingTest.addEventListener("click", () => {
  initTest();
  setUpUserInput();
  setDuration();
  testStarted = true;
  allowUserInput = true;
});

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
  // record start time
  startDuration = Date.now();
}

function stopDuration() {
  // calculate elapsed seconds
  endDuration = Date.now();
  duration = Math.floor((endDuration - startDuration) / 1000);
}

function showResult() {
  stopDuration();

  const [WPM, accuracy] = calculateUserTestResult();

  // format elapsed time mm:ss
  const formattedTime = formatElapsedTime(duration);

  wordPerMinuteContainer.innerHTML = WPM;
  accContainer.innerHTML = `${accuracy}%`;
  timeInfoContainer.innerHTML = formattedTime;

  createTestTypeInfo();
  reInitTest();
  testResult.classList.add("show");
}

// Updated WPM calculation
function calculateUserTestResult() {
  // count correct characters
  let correctChars = 0;
  testLetters.forEach((elm) => {
    if (elm.classList.contains("correct")) {
      correctChars++;
    }
  });

  const minutes = duration / 60;
  // standard WPM: (correct chars / 5) / minutes
  const wpm = minutes > 0 ? Math.floor((correctChars / 5) / minutes) : 0;

  // accuracy: correct chars / total typed chars
  const totalTyped = correctChars + wrongLetters.length;
  const accuracy = totalTyped > 0
    ? Math.floor((correctChars / totalTyped) * 100)
    : 0;

  return [wpm >= 0 ? wpm : 0, accuracy >= 0 ? accuracy : 0];
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

function formatElapsedTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${minutes}:${formattedSecs}`;
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
