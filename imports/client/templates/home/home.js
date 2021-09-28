import { app } from '/imports/client/app.js';

import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
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
  }

  // 'click .quiz-row'(event, instance) {
  //   if (!Meteor.user()) return;
  //   if (!this) throw new Meteor.Error('No context found.');
  //   instance.state.set('selectedQuiz', this);
  // },
  // 'click #join-button'(event, instance) {
  //   if (!Meteor.user()) return;

  //   import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

  //   FlowRouter.go('gameRoute', {
  //     quizId: 1,
  //   });
  // },
  // 'click #stats-button'(event, instance) {
  //   import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

  //   FlowRouter.go('leaderboardRoute', {
  //     quizId: 1,
  //   });
  // },
});
