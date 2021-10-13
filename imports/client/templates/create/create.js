import {app} from '/imports/client/app.js';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import {Template} from 'meteor/templating';
import {Contract} from 'near-api-js';
import {Meteor} from 'meteor/meteor';

import './create.css';
import './create.html';

const CryptoJS = require('crypto-js');

Template.create.onCreated(function () {
  if (!app._account) {
    FlowRouter.go('home');
  }
});

Template.create.events({
  'click [data-add-question]'(e) {
    e.preventDefault();
    let questions = document.getElementsByClassName('template');
    let template = questions[0];
    let question = template.cloneNode(true);

    let index = questions.length - 1;

    let inputs = question.getElementsByClassName('input-item');
    for (let i = 0; i < inputs.length; i++) {
      inputs[i].name = inputs[i].name.replace(/question\[\-\]/, 'question[' + index + ']');
    }
    question.classList.remove('visually-hidden');
    question.setAttribute('index', index);
    question.getElementsByClassName('question-index')[0].textContent = (index + 1).toString();

    document.getElementById('all-questions').appendChild(question);
    return false;
  },

  'click [data-add-option]'(e) {
    e.preventDefault();
    let parent = e.target.closest('.template');
    let options = parent.getElementsByClassName('option-template');
    let template = options[0];
    let option = template.cloneNode(true);

    let index = options.length - 1;

    let answerItems = option.getElementsByClassName('option-answer');
    // radio
    answerItems[0].value = index;
    answerItems[0].checked = !index;

    // checkbox
    answerItems[1].value = index;

    const questionIndex = parent.getAttribute('index');
    let selectedType = parent.querySelector('input[name="question[' + questionIndex + '].kind"]:checked').value;

    let optionItems = option.getElementsByClassName('option-item');

    optionItems[0].name = optionItems[0].name.replace(/option\[\-]/, 'option[' + index + ']');


    if (selectedType === 'OneChoice') {
      optionItems[0].classList.add(!index ? 'is-valid' : 'is-invalid');
    } else if (selectedType === 'MultipleChoice') {
      optionItems[0].classList.add('is-invalid');
    } else if (selectedType === 'Text') {
      parent.getElementsByClassName('btn-add-option ')[0].setAttribute('disabled', '');
    }

    option.classList.remove('visually-hidden');
    option.setAttribute('index', index);

    parent.getElementsByClassName('options')[0].appendChild(option);

    const block = option.closest('.form-group');
    setTextOrNonText(selectedType, block, parent.getElementsByClassName('btn-add-option ')[0]);
    return false;
  },
  'change [data-answer-type-change]'(e) {
    let type = e.target.value;
    let parent = e.target.closest('.template');
    let questionIndex = parent.getAttribute('index');
    let elements = document.getElementsByName(`question[${questionIndex}].answers`);

    for (let i = 0; i < elements.length; i++) {
      // eslint-disable-next-line default-case
      switch (type) {
      case 'OneChoice': {
        if (elements[i].classList.contains('option-answer-radio')) {
          elements[i].classList.remove('visually-hidden');
        } else {
          elements[i].classList.add('visually-hidden');
        }
        break;
      }
      case 'MultipleChoice': {
        if (elements[i].classList.contains('option-answer-checkbox')) {
          elements[i].classList.remove('visually-hidden');
        } else {
          elements[i].classList.add('visually-hidden');
        }
        break;
      }
      case 'Text': {
        elements[i].classList.add('visually-hidden');
      }
      }

      let firstOption = document.getElementsByName(`question[${questionIndex}].option[0]`)[0];
      if (firstOption) {
        const block = firstOption.closest('.form-group');
        setTextOrNonText(type, block, parent.getElementsByClassName('btn-add-option ')[0]);
      }

      let options = parent.getElementsByClassName('options')[0];
      let inputs = options.getElementsByClassName(type === 'OneChoice' ? 'option-answer-radio' : 'option-answer-checkbox');
      setInputValidity(inputs, questionIndex);
    }
  },
  'change [data-option-change]'(e) {
    let kind = e.target.getAttribute('data-kind');
    let parent = e.target.closest('.template');
    let questionIndex = parent.getAttribute('index');

    let options = parent.getElementsByClassName('options')[0];
    let inputs = options.getElementsByClassName(kind === 'OneChoice' ? 'option-answer-radio' : 'option-answer-checkbox');
    setInputValidity(inputs, questionIndex);
  },
  'keyup [data-add-reward-change]'(e) {
    let parent = e.target.closest('.form-group');
    recalculateTotalReward(parent);
  },
  'change [data-select-token-change]'(e) {
    let parent = e.target.closest('.form-group');
    recalculateTotalReward(parent);
  },
  'click [data-add-reward]'(e) {
    e.preventDefault();
    let parent = e.target.closest('.form-group');
    const allRewards = parent.getElementsByClassName('add-reward');
    const template = allRewards[0];
    let reward = template.cloneNode(true);

    reward.setAttribute('index', allRewards.length);
    reward.classList.remove('visually-hidden');
    reward.getElementsByClassName('reward-index')[0].textContent = allRewards.length + '.';
    parent.getElementsByClassName('rewards')[0].appendChild(reward);
    return false;
  },
  'click [data-remove-question]'(e) {
    e.preventDefault();
    let node = e.target.closest('.question-box');
    let parent = document.getElementById('all-questions');
    node.parentNode.removeChild(node);

    const questions = parent.getElementsByClassName('question-box');

    for (let i = 0; i < questions.length; i++) {
      questions[i].getElementsByClassName('question-index')[0].textContent = (i + 1).toString();
    }

    return false;
  },
  'click [data-remove-reward]'(e) {
    e.preventDefault();
    let node = e.target.closest('.add-reward');
    let parent = e.target.closest('.form-group');
    node.parentNode.removeChild(node);
    recalculateTotalReward(parent);
    return false;
  },
  async 'click [data-create-quiz]'(e) {
    e.preventDefault();
    return await createQuiz(true);
  },
  async 'click [data-preview-create-quiz]'(e) {
    e.preventDefault();
    if (await createQuiz(false)) {
      document.getElementById('preview-create').classList.add('visually-hidden');
      document.getElementById('create-quiz-block').classList.remove('visually-hidden');
      document.getElementById('main-fieldset').disabled = true;
    }
    ;
  },
});

async function createQuiz(sendTx) {
  let quiz = {};
  quiz.title = document.getElementById('quiz-title').value;
  quiz.description = document.getElementById('quiz-description').value;
  quiz.language = document.getElementById('quiz-language').value;
  quiz.finality_type = document.querySelector('input[name="quiz-finality-type"]:checked').value;
  quiz.restart_allowed = document.getElementById('restart-allowed').checked; // bool
  quiz.questions = [];
  quiz.all_question_options = [];
  quiz.rewards = [];

  let answers = {};
  answers.revealed_answers = [];
  const questions = document.getElementsByClassName('question-box');
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question.classList.contains('visually-hidden')) {
      const questionIndex = question.getAttribute('index');
      const content = question.querySelector('input[name="question[' + questionIndex + '].content"]').value;
      const kind = question.querySelector('input[name="question[' + questionIndex + '].kind"]:checked').value;
      if (!content) {
        return alert('Empty question #' + questionIndex);
      }
      quiz.questions.push({kind, content});

      const options = question.getElementsByClassName('option-template');
      const currentAnswer = {};
      let selectedOptionsIds = [];
      let questionOptions = [];
      for (let j = 0; j < options.length; j++) {
        const option = options[j];
        if (!option.classList.contains('visually-hidden')) {
          const optionIndex = option.getAttribute('index');
          const optionContent = question.querySelector('input[name="question[' + questionIndex + '].option[' + optionIndex + ']"]').value;
          questionOptions.push({kind: 'Text', content: optionContent});

          if (kind === 'Text') {
            let block = question.getElementsByClassName('type-text')[0];
            currentAnswer.selected_text = block.querySelector('input[name="question[' + questionIndex + '].option[-]"]').value.toLowerCase();
          } else {
            let answerElements = document.getElementsByName(`question[${questionIndex}].answers`);
            for (let a = 0; a < answerElements.length; a++) {
              const element = answerElements[a];
              if (!element.classList.contains('visually-hidden') && element.getAttribute('data-kind') === kind && element.value === optionIndex) {
                if (element.checked) {
                  selectedOptionsIds.push(parseInt(optionIndex));
                }
              }
            }
          }
        }
      }

      if (selectedOptionsIds.length) {
        currentAnswer.selected_option_ids = selectedOptionsIds;
      }

      answers.revealed_answers.push(currentAnswer);
      if (!questionOptions.length) {
        return alert('Empty question options for question #' + questionIndex);
      }
      quiz.all_question_options.push(questionOptions);
    }
  }

  let tokenAccountId = document.getElementsByClassName('add-reward-select-token')[0].value;
  let token = app.tokens_account_ids[tokenAccountId || ''];

  const rewards = document.getElementsByClassName('add-reward-amount');
  for (let i = 0; i < rewards.length; i++) {
    const reward = rewards[i];
    if (!reward.classList.contains('visually-hidden') && parseFloat(reward.value) > 0) {
      quiz.rewards.push({amount: token.convertToBlockchain(reward.value)});
    }
  }
  if (!quiz.rewards.length) {
    return alert('Empty rewards');
  }

  quiz.secret = getHash(quiz.title + quiz.description + app._account.accountId);
  let successHash = getHash(quiz.secret);
  let index = 0;
  quiz.questions.map(() => {
    let value = '';
    if (answers.revealed_answers[index].selected_text) {
      value = answers.revealed_answers[index].selected_text.toLowerCase();
    } else {
      answers.revealed_answers[index].selected_option_ids.map(answerIndex => {
        value += quiz.all_question_options[index][answerIndex].content.toLowerCase();
      });
    }
    index++;
    successHash = getHash(successHash + value);
  });

  if (quiz.finality_type === 'Direct') {
    quiz.success_hash = successHash;
  }

  if (answers.revealed_answers.length) {
    let outputAnswersReveal = answers.revealed_answers;
    document.getElementsByClassName('reveal-answers-block')[0].classList.remove('visually-hidden');
    document.getElementById('reveal-answers').textContent = JSON.stringify(outputAnswersReveal);
  }

  if (quiz.finality_type === 'DelayedReveal') {
    document.getElementById('reveal-secret-hash-block').classList.remove('visually-hidden');
    document.getElementById('reveal-secret-hash').value = successHash;
  }


  const totalAttachedTokens = document.getElementsByClassName('total-rewards-amount')[0].textContent;

  if (sendTx) {
    if (tokenAccountId) {
      quiz.operation = 'create_quiz';
      quiz.quiz_owner_id = app._account.accountId;

      const ftContract = await new Contract(app._account, tokenAccountId, {
        viewMethods: [],
        changeMethods: ['ft_transfer_call'],
        sender: app._account.accountId
      });

      let params = {
        receiver_id: Meteor.settings.public.nearConfig.contractName,
        amount: token.convertToBlockchain(totalAttachedTokens),
        memo: 'Create Quiz',
        msg: JSON.stringify(quiz),
      };
      ftContract.ft_transfer_call(params, app.maxGas, 1);
    } else {
      app.contract.create_quiz(quiz, app.maxGas, token.convertToBlockchain(totalAttachedTokens));
    }
  }

  return true;
}


function getHash(text) {
  let hash = CryptoJS.SHA256(text);
  return hash.toString(CryptoJS.enc.Hex);
}

function recalculateTotalReward(parent) {
  const rewards = parent.getElementsByClassName('rewards')[0].getElementsByClassName('add-reward-amount');

  let total = 0;
  for (let i = 0; i < rewards.length; i++) {
    total += parseInt(rewards[i].value);
    rewards[i].closest('.add-reward').getElementsByClassName('reward-index')[0].textContent = (i + 1) + '.';
  }

  if (total > 0) {
    parent.getElementsByClassName('total-rewards')[0].classList.remove('visually-hidden');
    parent.getElementsByClassName('total-rewards-amount')[0].textContent = total + Math.min(total * 0.01, 10);
    let token = parent.getElementsByClassName('add-reward-select-token')[0].value;
    let tokenTicker = app.tokens_account_ids[token || ''].name;
    parent.getElementsByClassName('total-rewards-token-id')[0].textContent = tokenTicker;
    if (token === 'NEAR') {
      parent.getElementsByClassName('service-fee-hint')[0].classList.remove('visually-hidden');
    } else {
      parent.getElementsByClassName('service-fee-hint')[0].classList.add('visually-hidden');
    }
  } else {
    parent.getElementsByClassName('total-rewards')[0].classList.add('visually-hidden');
  }
}

function setTextOrNonText(type, block, addOptionButton) {
  // eslint-disable-next-line default-case
  switch (type) {
  case 'OneChoice':
  case 'MultipleChoice': {
    block.getElementsByClassName('type-non-text')[0].classList.remove('visually-hidden');
    block.getElementsByClassName('type-text')[0].classList.add('visually-hidden');
    addOptionButton.removeAttribute('disabled', '');
    break;
  }
  case 'Text': {
    block.getElementsByClassName('type-non-text')[0].classList.add('visually-hidden');
    block.getElementsByClassName('type-text')[0].classList.remove('visually-hidden');
    addOptionButton.setAttribute('disabled', '');
  }
  }
}

function setInputValidity(inputs, questionIndex) {
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i] && inputs[i].value !== null && !inputs[i].classList.contains('visually-hidden')) {
      let index = inputs[i].value;
      let elements = document.getElementsByName(`question[${questionIndex}].option[${index}]`);
      if (elements.length) {
        const element = elements[0];
        if (element && inputs[i].checked) {
          element.classList.add('is-valid');
          element.classList.remove('is-invalid');
        } else {
          element.classList.remove('is-valid');
          element.classList.add('is-invalid');
        }
      }
    }
  }
}

Template.create.helpers({
  tokens() {
    return Object.keys(app.tokens_account_ids).map(tokenAccountId => {
      return {
        name: app.tokens_account_ids[tokenAccountId].name,
        contract: tokenAccountId
      };
    });
  }
});
