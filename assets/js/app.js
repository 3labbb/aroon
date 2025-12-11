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

// LIVE DISPLAY ELEMENTS
const liveTimerEl = document.getElementById("liveTimer");
const liveWPMEl = document.getElementById("liveWPM");

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

  resetLiveDisplays();

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
    updateLiveWPM();

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
      testLetters[currentIndex].classList.add("correct");
    } else {
      testLetters[currentIndex].classList.add("wrong");
      wrongLetters.push(testLetters[currentIndex].id);
    }
    currentIndex++;
  } else {
    currentIndex--;
    testLetters[currentIndex].className = "letter";
  }
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
  duration = Math.floor((endDuration - startDuration) / 1000);
}

function showResult() {
  stopDuration();

  const [WPM, accuracy] = calculateUserTestResult();
  const finishedTime = formatElapsedTime(duration);

  wordPerMinuteContainer.innerHTML = WPM;
  accContainer.innerHTML = `${accuracy}%`;
  timeInfoContainer.innerHTML = finishedTime;

  createTestTypeInfo();
  reInitTest();
  testResult.classList.add("show");
}

// UPDATED WPM CALCULATION (Correct chars ÷ 5 ÷ minutes)
function calculateUserTestResult() {
  let correctChars = 0;
  testLetters.forEach((elm) => {
    if (elm.classList.contains("correct")) {
      correctChars++;
    }
  });

  const minutes = duration / 60;
  const wpm = minutes > 0 ? Math.floor((correctChars / 5) / minutes) : 0;

  const totalCharsTyped = correctChars + wrongLetters.length;
  const accuracy = totalCharsTyped > 0
    ? Math.floor((correctChars / totalCharsTyped) * 100)
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

// Live Timer and WPM integration
function setTimer(seconds) {
  timer = setInterval(() => {
    let [min, sec] = handleMinutesAndSeconds(seconds);
    const timeStr = `${min}:${sec}`;

    testInfo.innerHTML = timeStr;
    liveTimerEl.innerText = timeStr;

    updateLiveWPM();

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

function updateLiveWPM() {
  const elapsed = Math.floor((Date.now() - startDuration) / 1000);
  const [WPM] = calculateUserTestResult(elapsed);
  liveWPMEl.innerText = `WPM: ${WPM}`;
}

function formatElapsedTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${formattedSecs}`;
}

function resetLiveDisplays() {
  liveTimerEl.innerText = "00:00";
  liveWPMEl.innerText = "WPM: 0";
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
