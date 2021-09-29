import { app } from '/imports/client/app.js';

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import './home.css';
import './home.html';

const PAGINATE_BY = 3;

Template.home.onCreated(function () {
  this.selectedQuiz = new ReactiveVar(false);
  this.showLines = new ReactiveVar(PAGINATE_BY);

  this.autorun((comp) => {
    const user = app.user.get();
    if (user) {
      app.fetchQuizData();
      comp.stop();
    }
  });
});

Template.home.helpers({
  quizData() {
    const dataArr = app._quizData.get();
    return dataArr.slice(0, Template.instance().showLines.get());
  },
  haveNextPage() {
    return app._quizData.get().length > Template.instance().showLines.get();
  },
  selectedQuiz() {
    return Template.instance().selectedQuiz.get();
  }
});

Template.home.events({
  'click [data-show-more]'(e, template) {
    e.preventDefault();
    template.showLines.set(template.showLines.get() + PAGINATE_BY);
    return false;
  },
  'click [data-login]'(e) {
    e.preventDefault();

    app.loginNEARWallet();
    return false;
  },
  'click [data-select-quiz]'(e, template) {
    e.preventDefault();
    template.selectedQuiz.set(this);
    return false;
  },
  'click [data-deselect-quiz]'(e, template) {
    e.preventDefault();
    template.selectedQuiz.set(false);
    return false;
  },
  async 'click [data-start-quiz]'(e) {
    e.preventDefault();
    const game = await app.contract.get_game({ quiz_id: this.id, account_id: app._account.accountId });

    let questionNo = 0;
    if (!game) {
      await app.contract.start_game({ quiz_id: this.id });
    } else {
      questionNo = game.answers_quantity;

      if (questionNo >= this.total_questions) {
        FlowRouter.go('results', { quizId: `${this.id}` });
        return false;
      }
    }

    app.activeQuiz.set(this);
    app.activeQuizQuestion.set(questionNo);
    FlowRouter.go('game', { quizId: `${this.id}` });
    return false;
  }
});
