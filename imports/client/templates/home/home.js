import {app} from '/imports/client/app.js';

import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import {ReactiveVar} from 'meteor/reactive-var';
import {Template} from 'meteor/templating';
import './home.css';
import './home.html';

const PAGINATE_BY = 7;

Template.home.onCreated(function () {
  this.selectedQuiz = new ReactiveVar(false);
  this.noQuizzesAvailable = new ReactiveVar(false);
  this.showLines = new ReactiveVar(PAGINATE_BY);
  this.isJoining = new ReactiveVar(false);

  this.autorun(async (comp) => {
    const user = app.user.get();
    if (user) {
      // load quiz by id /quiz/#id
      if (this.data?.params?.quizId) {
        const quizId = parseInt(this.data.params.quizId);
        const quiz = await app.fetchQuizById(quizId);
        try {
          const game = await app.contract.get_game({quiz_id: quizId, account_id: app._account.accountId});
          let questionNo = 0;

          if (!game) {
            await app.fetchQuizData();
            const quizData = app.getQuizData();
            if (!quizData?.length) {
              this.noQuizzesAvailable.set(true);
            }
            this.selectedQuiz.set(quiz);
          } else {
            questionNo = game.answers_quantity;
            if (questionNo >= quiz.total_questions) {
              FlowRouter.go('results', {quizId: quizId.toString()});
              return false;
            }
            app.activeQuiz.set(quiz);
            app.activeQuizQuestion.set(questionNo);
            FlowRouter.go('game', {quizId: quizId});
          }
          return true;
        } catch (err) {
          alert(err?.toString?.() || 'Unexpected error occurred. Most probably your balance is too low for storage or transaction.');
        }
      } else {
        await app.fetchQuizData();
        const quizData = app.getQuizData();
        if (!quizData?.length) {
          this.noQuizzesAvailable.set(true);
        }
      }
      comp.stop();
    }

    return true;
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
  },
  noQuizzesAvailable() {
    return Template.instance().noQuizzesAvailable.get();
  },
  isJoining() {
    return Template.instance().isJoining.get();
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
  async 'click [data-start-quiz]'(e, template) {
    e.preventDefault();
    template.isJoining.set(true);
    try {
      const game = await app.contract.get_game({ quiz_id: this.id, account_id: app._account.accountId });
      let questionNo = 0;

      if (!game) {
        await app.contract.start_game({ quiz_id: this.id });
      } else {
        questionNo = game.answers_quantity;

        if (questionNo >= this.total_questions) {
          FlowRouter.go('results', { quizId: this._id });
          return false;
        }
      }

      app.activeQuiz.set(this);
      app.activeQuizQuestion.set(questionNo);
      FlowRouter.go('game', { quizId: this._id });
    } catch (err) {
      alert(err?.toString?.() || 'Unexpected error occurred. Most probably your balance is too low for storage or transaction.');
      template.isJoining.set(false);
    }
    return false;
  }
});
