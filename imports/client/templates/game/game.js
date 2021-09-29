import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Template } from 'meteor/templating';

import { app } from '/imports/client/app.js';

import './game.html';
import './game.css';

Template.game.onCreated(function () {
  this.isLoading = new ReactiveVar(false);
  this.quiz = app.activeQuiz.get();

  if (!this.quiz) {
    FlowRouter.go('home');
  }
});

Template.game.helpers({
  isLoading() {
    return Template.instance().isLoading.get();
  },
  currentQuestionNum() {
    return `${app.activeQuizQuestion.get()}`;
  },
  currentQuiz() {
    return Template.instance().quiz;
  },
  currentQuestion() {
    const quiz = Template.instance().quiz;

    if (!quiz?.questions?.length) {
      return false;
    }
    const question = quiz.questions[app.activeQuizQuestion.get()];

    if (question) {
      return question;
    }

    return false;
  },
  progressBarPercentage() {
    const quiz = Template.instance().quiz;
    const questionNumber = app.activeQuizQuestion.get();

    if (!quiz?.questions?.length || isNaN(questionNumber)) {
      return 0;
    }

    const maxValue = quiz.questions.length - 1;
    if (questionNumber > maxValue) {
      return 100;
    }

    return Math.floor((100 / maxValue) * questionNumber);
  }
});

Template.game.events({
  async 'click [data-submit-answer]'(e, template) {
    e.preventDefault();

    const quiz = Template.instance().quiz;
    if (!quiz?.questions?.length) {
      return false;
    }

    const questionNum = app.activeQuizQuestion.get();
    const question = quiz.questions[questionNum];

    if (!question) {
      return false;
    }

    let answer = [];
    let textAnswer;
    if (question.question.kind === 'OneChoice') {
      answer.push(parseInt(template.$('input[name="oneof"]:checked').val()));
      if (!answer?.[0]) {
        return false;
      }
    } else if (question.question.kind === 'MultipleChoice') {
      template.$('input[name="manyfrom"]:checked').each(function () {
        answer.push(parseInt(this.value));
      });
    } else if (question.question.kind === 'Text') {
      answer = void 0;
      textAnswer = template.$('input[name="textfield"]').val().trim().toLowerCase();
    } else {
      return false;
    }

    template.isLoading.set(true);
    try {
      await app.contract.send_answer({
        quiz_id: quiz.id,
        question_id: question.id,
        question_option_ids: answer,
        question_option_text: textAnswer
      });

      const next = questionNum + 1;

      if (next < quiz.questions.length) {
        app.activeQuizQuestion.set(next);
      } else {
        FlowRouter.go('results', { quizId: `${quiz.id}` });
      }
    } catch (err) {
      console.error('[data-submit-answer] [send_answer] ERROR:', err);
    }
    template.isLoading.set(false);
    return false;
  }
});
