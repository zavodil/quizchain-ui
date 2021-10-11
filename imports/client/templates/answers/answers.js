import {app} from '/imports/client/app.js';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import './answers.css';
import './answers.html';

Template.answers.onCreated(function () {
  this.isLoading = new ReactiveVar(true);
  this.answers = new ReactiveVar(true);
  this.quizId = parseInt(this.data.params.quizId);
  let answers;

  (async () => {
    this.quiz = await app.contract.get_quiz({quiz_id: this.quizId});
    if (!this.quiz) {
      FlowRouter.go('home');
    }

    answers = await app.contract.get_answers({quiz_id: this.quizId, account_id: app._account.accountId});

    for (let i = 0; i < answers.length; i++) {
      if (this.quiz.questions[i].question) {
        let question = this.quiz.questions[i].question;
        let options = this.quiz.questions[i].question_options;
        answers[i].question = question;
        answers[i].index = answers[i].id + 1;
        answers[i].result = answers[i].is_corrent !== null ? answers[i].is_correct.toString() : '';
        if (question.kind === 'Text') {
          answers[i].answer = answers[i].selected_text;
        } else {
          answers[i].answer = answers[i].selected_option_ids.map(id => options[id].content).join(',');
        }
      }
    }

    if (!answers) {
      FlowRouter.go('home');
    } else {
      this.answers.set(answers);
    }

    this.isLoading.set(false);
  })();
});

Template.answers.onDestroyed(function () {
  if (this.timer) {
    clearInterval(this.timer);
  }
});

Template.answers.helpers({
  isLoading() {
    return Template.instance().isLoading.get();
  },
  quiz() {
    return Template.instance().quiz;
  },
  answers() {
    return Template.instance().answers.get();
  }
});

Template.answers.events({});
