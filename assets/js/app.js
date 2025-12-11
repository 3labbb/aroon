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
const liveWpmContainer = document.createElement("span"); // live WPM UI
liveWpmContainer.className = "live-wpm";
testInfo.appendChild(liveWpmContainer);
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
    updateLiveWPM(); // live update

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
    testLetters[currentIndex].classList.add(testLetters[currentIndex].textContent !== " " ? "updated" : "updated-space");
  }
}

function wrongLetter() {
  testLetters[currentIndex].classList.add(testLetters[currentIndex].textContent !== " " ? "wrong" : "wrong-space");
  wrongLetters.push(testLetters[currentIndex].id);
}

// new live WPM update
function updateLiveWPM() {
  const [WPM] = calculateUserTestResult(true); // pass live flag
  liveWpmContainer.innerHTML = `Live WPM: ${WPM}`;
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

  liveWpmContainer.innerHTML = ""; // clear live WPM
  createTestTypeInfo();
  reInitTest();
  testResult.classList.add("show");
}

// updated to optionally calculate live (uses correct characters)
function calculateUserTestResult(isLive = false) {
  let correctChars = 0;
  for (let i = 0; i < testLetters.length; i++) {
    if (testLetters[i].classList.contains("correct")) {
      correctChars++;
    }
  }

  const elapsedSecs = isLive ? (Date.now() - startDuration) / 1000 : duration;
  const minutes = elapsedSecs / 60;
  const rawWPM = minutes > 0 ? (correctChars / 5) / minutes : 0;
  const WPM = Math.floor(rawWPM);

  const totalCharsTyped = correctChars + wrongLetters.length;
  const accuracy = totalCharsTyped > 0
    ? Math.floor((correctChars / totalCharsTyped) * 100)
    : 0;

  return [WPM >= 0 ? WPM : 0, accuracy >= 0 ? accuracy : 0];
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

    updateLiveWPM(); // live update during countdown

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
