import {ReactiveVar} from 'meteor/reactive-var';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import {Template} from 'meteor/templating';

import {app} from '/imports/client/app.js';

import './game.html';
import './game.css';

Template.game.onCreated(function () {
  this.isPageLoading = new ReactiveVar(false);
  this.isLoading = new ReactiveVar(false);
  this.isNextQuestionLoading = new ReactiveVar(false);
  this.quiz = app.activeQuiz.get();

  if (!this.quiz) {
    const quizId = parseInt(this.data.params.quizId);
    if (quizId) {
      FlowRouter.go('quiz', {quizId: quizId});
    } else {
      FlowRouter.go('home');
    }
  } else {
    this.quiz.descriptionHtml = app.urlify(this.quiz.description);
  }
});

Template.game.onRendered(function () {
  setTimeout(() => {
    try {
      this.isPageLoading.set(false);
    } catch (err) {
      //...
    }
  }, 1024);
});

Template.game.helpers({
  isLoading() {
    return Template.instance().isLoading.get();
  },
  isNextQuestionLoading() {
    return Template.instance().isNextQuestionLoading.get();
  },
  isSubmitButtonInactive() {
    return (Template.instance().isNextQuestionLoading.get() || Template.instance().isLoading.get());
  },
  isPageLoading() {
    return Template.instance().isPageLoading.get();
  },
  currentQuestionNum() {
    return `${app.activeQuizQuestion.get() + 1}`;
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

    if (quiz.questions.length === 1) {
      return 100;
    }

    const maxValue = quiz.questions.length;
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
      if (isNaN(answer?.[0])) {
        return false;
      }
    } else if (question.question.kind === 'MultipleChoice') {
      let qty = 0;
      template.$('input[name="manyfrom"]:checked').each(function () {
        answer.push(parseInt(this.value));
        qty++;
      });

      if (qty === 0) {
        return false;
      }
    } else if (question.question.kind === 'Text') {
      answer = void 0;
      textAnswer = template.$('input[name="textfield"]').val().trim().toLowerCase();

      if (!textAnswer.length) {
        return false;
      }
    } else {
      return false;
    }

    template.isLoading.set(true);

    try {
      const next = questionNum + 1;

      if (next < quiz.questions.length) {
        template.isNextQuestionLoading.set(true);

        app.contract.send_answer({
          quiz_id: quiz.id,
          question_id: question.id,
          question_option_ids: answer,
          question_option_text: textAnswer
        }).then(() => template.isNextQuestionLoading.set(false));

        template.isPageLoading.set(true);
        setTimeout(() => {
          try {
            app.activeQuizQuestion.set(next);
            template.isPageLoading.set(false);
          } catch (err) {
            //...
          }

          setTimeout(() => {
            document.getElementById('progressbar').scrollIntoView({
              behavior: 'smooth'
            });
          }, 256);
        }, 1024);
      } else {
        await app.contract.send_answer({
          quiz_id: quiz.id,
          question_id: question.id,
          question_option_ids: answer,
          question_option_text: textAnswer
        });

        window.localStorage.removeItem('referrer');

        FlowRouter.go('results', {quizId: quiz._id});
      }
    } catch (err) {
      console.error('[data-submit-answer] [send_answer] ERROR:', err);
    }
    template.isLoading.set(false);
    return false;
  }
});
