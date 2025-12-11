const testConfiguration = document.querySelector(".test-config");

export let testConfig = {
  "include-to-test": [],
  "test-by": "time",
  "time-word-config": 60,
};

testConfiguration.addEventListener("change", handleTestConfigChange);
window.addEventListener("DOMContentLoaded", setUpTestConfigurationContainer);

function handleTestConfigChange(e) {
  const { name, value } = e.target;

  if (name === "test-by") {
    testConfig = { ...testConfig, [name]: value };
  }

  if (name === "time-word-config") {
    testConfig = { ...testConfig, [name]: parseInt(value) };
  }

  if (name === "include-to-test") {
    const checkBoxes = document.querySelectorAll(`input[name="${name}"]`);
    const checkedBoxesValue = [];

    for (let box of checkBoxes) {
      if (box.checked) {
        checkedBoxesValue.push(box.value);
      }
    }

    testConfig = { ...testConfig, [name]: checkedBoxesValue };
  }

  setUpTestConfigurationContainer();
}

function setUpTestConfigurationContainer() {
  const timeWordConfigs = document.querySelectorAll(".time-word-config");

  if (testConfig["test-by"] === "time") {
    timeWordConfigs.forEach((elm) => elm.classList.add("time"));
  } else {
    timeWordConfigs.forEach((elm) => elm.classList.remove("time"));
  }
}

const typingTest = document.querySelector(".typing-test");
const testContainer = document.querySelector(".test");
const testText = document.querySelector(".test-text");
const textOverlay = document.querySelector(".overlay");
const startingTextContainer = document.querySelector(".starting-text");
const testResult = document.querySelector(".test-results");
const testInfo = document.querySelector(".time-word-info");

export let testLetters = [];
let testWords = [];
let paragraphLoaded = false;

// 👇 Allow clicking the overlay to start the test
textOverlay.addEventListener("click", async () => {
  if (!paragraphLoaded) {
    await initParagraphTest();
  }
});

// Also ensure clicking anywhere in the typing area starts the test
typingTest.addEventListener("click", async () => {
  if (!paragraphLoaded) {
    await initParagraphTest();
  }
});

async function initParagraphTest() {
  // mark loaded so it doesn’t run multiple times
  paragraphLoaded = true;

  // hide overlay immediately on click
  textOverlay.classList.add("hide");

  // run the real initTest logic
  await initTest();
}

export async function initTest() {
  testConfiguration.classList.add("hide");
  testResult.classList.remove("show");

  testInfo.innerHTML = "";
  testInfo.classList.remove("hide");

  testContainer.classList.remove("shadow");
  startingTextContainer.classList.add("hide");
  typingTest.classList.add("no-click");

  // Load paragraph from backend
  testWords = await generateTestParagraph();
  createWords();
}

async function fetchParagraphs() {
  try {
    const res = await fetch("./assets/backend.json"); // adjust path if needed
    const data = await res.json();

    if (!data.paragraphs || !Array.isArray(data.paragraphs)) {
      console.error("No paragraphs found in backend.json");
      return [];
    }

    return data.paragraphs;
  } catch (err) {
    console.error("Error loading paragraphs:", err);
    return [];
  }
}

async function generateTestParagraph() {
  const includeToTest = testConfig["include-to-test"];
  const paragraphs = await fetchParagraphs();
  if (paragraphs.length === 0) return [];

  let text = paragraphs[Math.floor(Math.random() * paragraphs.length)];

  if (includeToTest.includes("numbers")) {
    text += " The year is 2025, and typing skills are essential.";
  }

  if (includeToTest.includes("punctuation")) {
    text += " Try handling commas, periods, and question marks correctly!";
  }

  return text.split(" ");
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

function decideNumberOfWords() {
  return testConfig["test-by"] === "words"
    ? testConfig["time-word-config"]
    : testWords.length;
}

export function resetTestWordsAndLetters() {
  testWords = [];
  testLetters = [];
}
