const questions = [
  {
    qText: "What is the size of int in Java?",
    options: ["4 bytes", "2 bytes", "8 bytes", "Depends on system"],
    correct: 0
  },
  {
    qText: "Which keyword is used to inherit a class in Java?",
    options: ["implement", "inherits", "extends", "super"],
    correct: 2
  },
  {
    qText: "What is JVM?",
    options: ["Java Variable Method", "Java Virtual Machine", "Java Verified Mode", "Joint Virtual Machine"],
    correct: 1
  },
  {
    qText: "Which method is the entry point of a Java program?",
    options: ["start()", "main()", "run()", "execute()"],
    correct: 1
  },
  {
    qText: "Which of the following is not a feature of Java?",
    options: ["Object-oriented", "Platform independent", "Use of pointers", "Robust"],
    correct: 2
  },





    {
        qText: "What is the size of int in Java?",
        "options": ["4 bytes", "2 bytes", "8 bytes", "Depends on system"],
        "correct": 0
    },
    {
        qText: "Which keyword is used to inherit a class in Java?",
        options: ["implement", "inherits", "extends", "super"],
        correct: 2
    },
    {
        qText: "Which method is the entry point of a Java program?",
        "options": ["start()", "main()", "run()", "execute()"],
        "correct": 1
    },

    {
        qText: "What is the output of: print(type([]))",
        options: ["<class 'list'>", "<class 'tuple'>", "<class 'set'>", "<class 'dict'>"],
        "correct": 0
    },
    {
        qText: "Which of the following is used to define a function in Python?",
        options: ["function", "def", "func", "define"],
        correct: 1
    },
    {
        qText: "Which keyword is used to handle exceptions in Python?",
        options: ["try", "except", "catch", "handle"],
        "correct": 1
    },

    {
        qText: "Which HTML tag is used to create a hyperlink?",
        options: ["<a>", "<link>", "<href>", "<hyper>"],
        correct: 0
    },
    {
        qText: "What does HTML stand for?",
        options: ["Hyperlinks and Text Markup Language", "Home Tool Markup Language", "Hyper Text Markup Language", "Hyperlink Tool Mark Language"],
        correct: 2
    },

    {
        qText: "Which property is used to change the background color in CSS?",
        options: ["bg-color", "backgroundColor", "background", "color-bg"],
        correct: 2
    },
    {
        qText: "How do you apply an external CSS file to an HTML file?",
        options: ["<style src='style.css'>", "<link rel='stylesheet' href='style.css'>", "<css href='style.css'>", "<stylesheet link='style.css'>"],
        correct: 1
    },

    {
        qText: "Which symbol is used for single-line comments in JavaScript?",
        options: ["//", "/* */", "#", "<!-- -->"],
        correct: 0
    },


{
    qText: "What is the size of int in Java?",
    options: ["4 bytes", "2 bytes", "8 bytes", "Depends on system"],
    correct: 0
  },
  {
    qText: "Which keyword is used to inherit a class in Java?",
    options: ["implement", "inherits", "extends", "super"],
    correct: 2
  },
  {
    qText: "Which method is the entry point of a Java program?",
    options: ["start()", "main()", "run()", "execute()"],
    correct: 1
  },

  // Python
  {
    qText: "What is the output of: print(type([]))",
    options: ["<class 'list'>", "<class 'tuple'>", "<class 'set'>", "<class 'dict'>"],
    correct: 0
  },
  {
    qText: "Which of the following is used to define a function in Python?",
    options: ["function", "def", "func", "define"],
    correct: 1
  },
  {
    qText: "Which keyword is used to handle exceptions in Python?",
    options: ["try", "except", "catch", "handle"],
    correct: 1
  },

  // HTML
  {
    qText: "Which HTML tag is used to create a hyperlink?",
    options: ["<a>", "<link>", "<href>", "<hyper>"],
    correct: 0
  },
  {
    qText: "What does HTML stand for?",
    options: [
      "Hyperlinks and Text Markup Language",
      "Home Tool Markup Language",
      "Hyper Text Markup Language",
      "Hyperlink Tool Mark Language"
    ],
    correct: 2
  },

  // CSS
  {
    qText: "Which property is used to change the background color in CSS?",
    options: ["bg-color", "backgroundColor", "background", "color-bg"],
    correct: 2
  },
  {
    qText: "How do you apply an external CSS file to an HTML file?",
    options: [
      "<style src='style.css'>",
      "<link rel='stylesheet' href='style.css'>",
      "<css href='style.css'>",
      "<stylesheet link='style.css'>"
    ],
    correct: 1
  },

  // JavaScript
  {
    qText: "Which symbol is used for single-line comments in JavaScript?",
    options: ["//", "/* */", "#", "<!-- -->"],
    correct: 0
  },
  {
    qText: "What does DOM stand for in JavaScript?",
    options: [
      "Document Object Model",
      "Data Object Model",
      "Display Object Mode",
      "Document Order Model"
    ],
    correct: 0
  }



























];

let current = 0;
let answers = [];

const qBox = document.getElementById('question-box');
const resultBox = document.getElementById('result-box');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');

function loadQuestion(index) {
  if (index >= questions.length) return;

  const q = questions[index];
  qBox.innerHTML = `
    <div class="question"><strong>Q${index + 1}: ${q.qText}</strong></div>
    <div class="options">
      ${q.options.map((opt, i) => `
        <label><input type="radio" name="option" value="${i}"> ${opt}</label>
      `).join('')}
    </div>
  `;
}

nextBtn.onclick = () => {
  const selected = document.querySelector('input[name="option"]:checked');
  if (!selected) {
    alert("Please select an option.");
    return;
  }

  answers[current] = parseInt(selected.value);
  current++;

  if (current < questions.length) {
    loadQuestion(current);
    if (current === questions.length - 1) {
      nextBtn.style.display = "none";
      submitBtn.style.display = "inline-block";
    }
  }
};

submitBtn.onclick = () => {
  const selected = document.querySelector('input[name="option"]:checked');
  if (!selected) {
    alert("Please select an option.");
    return;
  }

  answers[current] = parseInt(selected.value);

  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correct) score++;
  });

  qBox.innerHTML = '';
  nextBtn.style.display = "none";
  submitBtn.style.display = "none";

  resultBox.innerHTML = `
    <h3>Exam Completed!</h3>
    <p>Score: ${score} / ${questions.length}</p>
    <p>Percentage: ${(score / questions.length * 100).toFixed(2)}%</p>
  `;
};

window.onload = () => {
  loadQuestion(current);
};
