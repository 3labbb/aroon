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

// LIVE DISPLAY ELEMENTS
const liveTimerEl = document.getElementById("liveTimer");
const liveWPMEl = document.getElementById("liveWPM");

let currentIndex = 0;
let userInputLetters = [];
let wrongLetters = [];
let testTimer; // interval for live
let startTime; // precise start timestamp
let numberOfWords = 0;
let allowUserInput = true;
let testStarted = false;

startBtn.addEventListener("click", () => {
  if (!testStarted) typingTest.click();
  testStarted = true;
  allowUserInput = true;
});

typingTest.addEventListener("click", () => {
  resetLiveDisplays();
  initTest();
  setStartTime();

  testStarted = true;
  allowUserInput = true;
});

userInput.addEventListener("blur", () => allowUserInput && userInput.focus());
userInput.addEventListener("input", startTest);

function setStartTime() {
  startTime = Date.now();
  // start a 1Hz live update loop
  clearInterval(testTimer);
  testTimer = setInterval(updateLiveDisplays, 1000);
}

function updateLiveDisplays() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  liveTimerEl.innerText = formatElapsedTime(elapsed);
  updateLiveWPM(elapsed);
}

function startTest() {
  if (currentIndex < testLetters.length - 1) {
    handleUserInput(this);
    updateNumberOfWords();
    updateLiveWPM();
  } else {
    finishTest();
  }
  handleCursor();
}

function handleUserInput(input) {
  userInputLetters = input.value.split("");
  const userCurrent = userInputLetters[currentIndex];
  const testCurrent = testLetters[currentIndex].textContent;

  if (userCurrent !== undefined) {
    if (userCurrent === testCurrent) {
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
  testLetters.forEach((elm) => elm.classList.remove("cursor"));
  testLetters[currentIndex]?.classList.add("cursor");
}

function updateNumberOfWords() {
  const currentWordNumber = testLetters[currentIndex].parentNode.id;
  numberOfWords = parseInt(currentWordNumber) - 1;
}

// STOP and SHOW RESULTS
function finishTest() {
  clearInterval(testTimer);
  showResult();
}

function showResult() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const [WPM, accuracy] = calculateUserTestResult(elapsed);

  wordPerMinuteContainer.innerHTML = WPM;
  accContainer.innerHTML = `${accuracy}%`;
  timeInfoContainer.innerHTML = formatElapsedTime(elapsed);

  createTestTypeInfo();
  reInitTest();
  testResult.classList.add("show");
}

// STANDARD WPM calculation
function calculateUserTestResult(elapsedSecs) {
  let correctChars = 0;
  testLetters.forEach((elm) => {
    if (elm.classList.contains("correct")) correctChars++;
  });

  const minutes = elapsedSecs / 60;
  const wpm = minutes > 0 ? Math.floor((correctChars / 5) / minutes) : 0;

  const total = correctChars + wrongLetters.length;
  const accuracy = total > 0
    ? Math.floor((correctChars / total) * 100)
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
  let remain = seconds;
  testTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, seconds - elapsed);
    const [min, sec] = handleMinutesAndSeconds(remaining);
    testInfo.innerHTML = `${min}:${sec}`;
    liveTimerEl.innerText = `${min}:${sec}`;
    updateLiveWPM(elapsed);

    if (remaining <= 0) finishTest();
  }, 1000);
}

function updateLiveWPM(elapsed = null) {
  const elapsedSecs = elapsed !== null
    ? elapsed
    : Math.floor((Date.now() - startTime) / 1000);

  const [WPM] = calculateUserTestResult(elapsedSecs);
  liveWPMEl.innerText = `WPM: ${WPM}`;
}

function handleMinutesAndSeconds(numberOfSeconds) {
  let minutes = Math.floor(numberOfSeconds / 60);
  let seconds = numberOfSeconds % 60;
  seconds = seconds > 9 ? seconds : `0${seconds}`;
  return [minutes, seconds];
}

function formatElapsedTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
  userInput.value = "";
  allowUserInput = false;
  userInput.blur();
  testStarted = false;
}
